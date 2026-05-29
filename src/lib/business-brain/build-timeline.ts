import { formatRelativeActivityTime } from "@/lib/format-relative-activity-time"
import { profileFirstName } from "@/lib/sops/sop-activity-feed"
import type { Tables } from "@/types/database"

import type { BusinessBrainEventKind, BusinessBrainTimelineItem, BusinessBrainTimelineView } from "./types"

const SOP_EDIT_MIN_MS = 60_000
const ESCAPE_SCORE_DELTA_THRESHOLD = 2
const INTERRUPTION_WEEK_MIN_BASELINE = 3
const INTERRUPTION_REDUCTION_RATIO = 0.85
const MAX_ITEMS = 120

export type BusinessBrainTimelineContext = {
  sinceIso: string
  standards: Pick<Tables<"standards">, "id" | "title" | "created_at" | "updated_at">[]
  modulesById: Map<string, Pick<Tables<"training_modules">, "id" | "title">>
  trainingItemTitleById: Map<string, string>
  profileNameById: Map<string, string>
  trainingProgress: Tables<"training_progress">[]
  certifications: Tables<"employee_module_certifications">[]
  playCompletions: Tables<"employee_training_sop_completions">[]
  askQueries: Pick<
    Tables<"rivet_ask_queries">,
    "id" | "question_text" | "standard_id" | "prevented_owner_interrupt" | "created_at"
  >[]
  interruptions: Pick<Tables<"owner_interruptions">, "id" | "occurred_at">[]
  snapshots: Tables<"handoff_score_snapshots">[]
}

function personName(ctx: BusinessBrainTimelineContext, profileId: string): string {
  return profileFirstName(ctx.profileNameById.get(profileId) ?? "Someone")
}

function truncate(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function atFromDateYmd(ymd: string): string {
  return `${ymd}T12:00:00.000Z`
}

function utcWeekStartKey(iso: string): string {
  const d = new Date(iso)
  const day = d.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - diff)
  return start.toISOString().slice(0, 10)
}

function weekEndIso(weekStartYmd: string): string {
  const end = new Date(`${weekStartYmd}T12:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() + 6)
  return end.toISOString()
}

function finalize(items: BusinessBrainTimelineItem[], now = Date.now()): BusinessBrainTimelineView {
  const sorted = [...items]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ITEMS)
    .map((item) => ({
      ...item,
      timeLabel: formatRelativeActivityTime(item.at, now),
    }))

  const countsByKind: Record<BusinessBrainEventKind, number> = {
    sop_change: 0,
    training_completion: 0,
    certification: 0,
    question_prevented: 0,
    interruptions_reduced: 0,
    escape_readiness_change: 0,
  }
  for (const item of sorted) {
    countsByKind[item.kind] += 1
  }

  return { items: sorted, countsByKind }
}

export function buildSopChangeEvents(ctx: BusinessBrainTimelineContext): BusinessBrainTimelineItem[] {
  const sinceMs = new Date(ctx.sinceIso).getTime()
  const out: BusinessBrainTimelineItem[] = []

  for (const sop of ctx.standards) {
    const updatedMs = new Date(sop.updated_at).getTime()
    const createdMs = new Date(sop.created_at).getTime()
    if (Number.isNaN(updatedMs) || updatedMs < sinceMs) continue
    if (updatedMs - createdMs < SOP_EDIT_MIN_MS) continue

    out.push({
      id: `sop:${sop.id}:${sop.updated_at}`,
      kind: "sop_change",
      at: sop.updated_at,
      timeLabel: "",
      title: `Play updated: ${sop.title}`,
      detail: "Steps, media, or proof requirements changed on the record.",
      href: `/sops/${sop.id}`,
    })
  }

  return out
}

export function buildTrainingCompletionEvents(ctx: BusinessBrainTimelineContext): BusinessBrainTimelineItem[] {
  const sinceMs = new Date(ctx.sinceIso).getTime()
  const out: BusinessBrainTimelineItem[] = []

  for (const row of ctx.trainingProgress) {
    if (row.status !== "completed" || !row.completed_at) continue
    const atMs = new Date(row.completed_at).getTime()
    if (Number.isNaN(atMs) || atMs < sinceMs) continue

    const module = ctx.modulesById.get(row.training_module_id)
    const moduleTitle = module?.title ?? "Training module"

    out.push({
      id: `training-module:${row.id}:${row.completed_at}`,
      kind: "training_completion",
      at: row.completed_at,
      timeLabel: "",
      title: `${personName(ctx, row.employee_id)} completed ${moduleTitle}`,
      detail: "Module marked complete in Training Center.",
      href: "/training",
    })
  }

  for (const row of ctx.playCompletions) {
    const atMs = new Date(row.completed_at).getTime()
    if (Number.isNaN(atMs) || atMs < sinceMs) continue

    const playTitle = ctx.trainingItemTitleById.get(row.training_item_id) ?? "a play"

    out.push({
      id: `training-play:${row.id}:${row.completed_at}`,
      kind: "training_completion",
      at: row.completed_at,
      timeLabel: "",
      title: `${personName(ctx, row.employee_id)} finished ${playTitle}`,
      detail: "Play checked off in assigned training.",
      href: "/training",
    })
  }

  return out
}

export function buildCertificationEvents(ctx: BusinessBrainTimelineContext): BusinessBrainTimelineItem[] {
  const sinceMs = new Date(ctx.sinceIso).getTime()
  const out: BusinessBrainTimelineItem[] = []

  for (const row of ctx.certifications) {
    if (!row.certified_at) continue
    const atMs = new Date(row.certified_at).getTime()
    if (Number.isNaN(atMs) || atMs < sinceMs) continue

    const module = ctx.modulesById.get(row.training_module_id)
    const moduleTitle = module?.title ?? "module"

    out.push({
      id: `cert:${row.id}:${row.certified_at}`,
      kind: "certification",
      at: row.certified_at,
      timeLabel: "",
      title: `${personName(ctx, row.employee_id)} certified on ${moduleTitle}`,
      detail: "Quizzes, proof, and manager sign-off recorded.",
      href: "/training",
    })
  }

  return out
}

export function buildQuestionPreventedEvents(ctx: BusinessBrainTimelineContext): BusinessBrainTimelineItem[] {
  const sinceMs = new Date(ctx.sinceIso).getTime()
  const out: BusinessBrainTimelineItem[] = []

  for (const row of ctx.askQueries) {
    if (!row.prevented_owner_interrupt) continue
    const atMs = new Date(row.created_at).getTime()
    if (Number.isNaN(atMs) || atMs < sinceMs) continue

    out.push({
      id: `ask:${row.id}`,
      kind: "question_prevented",
      at: row.created_at,
      timeLabel: "",
      title: "Question answered on the floor",
      detail: truncate(row.question_text, 96),
      href: row.standard_id ? `/sops/${row.standard_id}` : "/ask",
    })
  }

  return out
}

export function buildInterruptionsReducedEvents(ctx: BusinessBrainTimelineContext): BusinessBrainTimelineItem[] {
  const counts = new Map<string, number>()
  for (const row of ctx.interruptions) {
    const key = utcWeekStartKey(row.occurred_at)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const weeks = [...counts.keys()].sort()
  const out: BusinessBrainTimelineItem[] = []

  for (let i = 1; i < weeks.length; i++) {
    const prevKey = weeks[i - 1]!
    const key = weeks[i]!
    const prev = counts.get(prevKey) ?? 0
    const current = counts.get(key) ?? 0
    if (prev < INTERRUPTION_WEEK_MIN_BASELINE) continue
    if (current > prev * INTERRUPTION_REDUCTION_RATIO) continue

    const reduced = prev - current
    const at = weekEndIso(key)

    out.push({
      id: `interrupt-week:${key}`,
      kind: "interruptions_reduced",
      at,
      timeLabel: "",
      title: `Owner pulls down ${reduced} vs prior week`,
      detail: `${current} logged this week vs ${prev} the week before—fewer routes back to you.`,
      href: "/interruptions",
    })
  }

  return out
}

export function buildEscapeReadinessEvents(ctx: BusinessBrainTimelineContext): BusinessBrainTimelineItem[] {
  const sorted = [...ctx.snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
  const out: BusinessBrainTimelineItem[] = []

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!
    const curr = sorted[i]!
    const baseline = Number(prev.autonomy_score)
    const currentScore = Number(curr.autonomy_score)
    if (!Number.isFinite(baseline) || !Number.isFinite(currentScore)) continue

    const delta = Math.round(currentScore - baseline)
    if (Math.abs(delta) < ESCAPE_SCORE_DELTA_THRESHOLD) continue

    const at = atFromDateYmd(curr.snapshot_date)
    const direction = delta > 0 ? "rose" : "slipped"

    out.push({
      id: `escape:${curr.snapshot_date}:${delta}`,
      kind: "escape_readiness_change",
      at,
      timeLabel: "",
      title: `Escape readiness ${direction} ${Math.abs(delta)} pts`,
      detail:
        delta > 0
          ? `Score moved to ${Math.round(currentScore)}—more Owner-free capacity on the record.`
          : `Score moved to ${Math.round(currentScore)}—pulls or gaps likely climbed faster than fixes.`,
      href: "/escape-plan",
    })
  }

  return out
}

export function buildBusinessBrainTimeline(
  ctx: BusinessBrainTimelineContext,
  now = Date.now()
): BusinessBrainTimelineView {
  const items = [
    ...buildSopChangeEvents(ctx),
    ...buildTrainingCompletionEvents(ctx),
    ...buildCertificationEvents(ctx),
    ...buildQuestionPreventedEvents(ctx),
    ...buildInterruptionsReducedEvents(ctx),
    ...buildEscapeReadinessEvents(ctx),
  ]

  return finalize(items, now)
}
