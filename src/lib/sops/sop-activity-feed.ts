import type { DailyChecklistType, Tables } from "@/types/database"

import { daysSinceActivity, formatRelativeActivityTime } from "@/lib/format-relative-activity-time"

export type SopActivityEventKind = "edit" | "checklist" | "training"

export type SopActivityEvent = {
  kind: SopActivityEventKind
  label: string
  timeLabel: string
  at: string
}

export type SopActivityFeed = {
  events: SopActivityEvent[]
  idleLabel: string | null
}

export type SopActivityChecklistEvent = {
  employeeId: string
  completedAt: string
}

export type SopActivityPersonEvent = {
  employeeId: string
  completedAt: string
}

export type SopActivityContext = {
  profileFirstNameById: Map<string, string>
  checklistCompletionsByChecklistType: Map<DailyChecklistType, SopActivityChecklistEvent[]>
  trainingCompletionsBySopId: Map<string, SopActivityPersonEvent[]>
  trainingModuleCompletionsBySopId: Map<string, SopActivityPersonEvent[]>
}

const IDLE_THRESHOLD_DAYS = 9

const SOP_CATEGORY_TO_CHECKLIST: Partial<Record<string, DailyChecklistType>> = {
  opening: "opening",
  closing: "closing",
  cleaning: "cleaning",
  product_quality: "quality_check",
  quality: "quality_check",
}

export function profileFirstName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return "Someone"
  return trimmed.split(/\s+/)[0] ?? trimmed
}

function personName(ctx: SopActivityContext, employeeId: string): string {
  return ctx.profileFirstNameById.get(employeeId) ?? "Someone"
}

function latestEvent(
  kind: SopActivityEventKind,
  label: string,
  at: string
): SopActivityEvent {
  return {
    kind,
    label,
    at,
    timeLabel: formatRelativeActivityTime(at),
  }
}

function latestChecklistForSop(
  sop: Pick<Tables<"standards">, "category">,
  ctx: SopActivityContext
): SopActivityEvent | null {
  const checklistType = SOP_CATEGORY_TO_CHECKLIST[sop.category]
  if (!checklistType) return null

  const events = ctx.checklistCompletionsByChecklistType.get(checklistType) ?? []
  if (events.length === 0) return null

  const latest = events.reduce((best, row) =>
    row.completedAt > best.completedAt ? row : best
  )

  return latestEvent(
    "checklist",
    `${personName(ctx, latest.employeeId)} completed checklist`,
    latest.completedAt
  )
}

function latestTrainingForSop(sopId: string, ctx: SopActivityContext): SopActivityEvent | null {
  const sopCompletions = ctx.trainingCompletionsBySopId.get(sopId) ?? []
  const moduleCompletions = ctx.trainingModuleCompletionsBySopId.get(sopId) ?? []

  const latestSop = sopCompletions.reduce<SopActivityPersonEvent | null>(
    (best, row) => (!best || row.completedAt > best.completedAt ? row : best),
    null
  )
  const latestModule = moduleCompletions.reduce<SopActivityPersonEvent | null>(
    (best, row) => (!best || row.completedAt > best.completedAt ? row : best),
    null
  )

  if (!latestSop && !latestModule) return null

  const useSop =
    latestSop != null &&
    (latestModule == null || latestSop.completedAt >= latestModule.completedAt)
  const latest = useSop ? latestSop! : latestModule!

  return latestEvent(
    "training",
    useSop
      ? `${personName(ctx, latest.employeeId)} completed training`
      : `${personName(ctx, latest.employeeId)} finished training module`,
    latest.completedAt
  )
}

function latestEditForSop(
  sop: Pick<Tables<"standards">, "updated_at" | "created_at" | "created_by">,
  ctx: SopActivityContext
): SopActivityEvent | null {
  const at = sop.updated_at
  if (!at) return null

  const name = personName(ctx, sop.created_by)
  return latestEvent("edit", `${name} updated SOP`, at)
}

/** Latest edit, checklist completion, and training event for one SOP card. */
export function buildSopActivityFeed(
  sop: Pick<
    Tables<"standards">,
    "id" | "category" | "updated_at" | "created_at" | "created_by"
  >,
  ctx: SopActivityContext,
  now = Date.now()
): SopActivityFeed {
  const candidates = [
    latestEditForSop(sop, ctx),
    latestChecklistForSop(sop, ctx),
    latestTrainingForSop(sop.id, ctx),
  ].filter((event): event is SopActivityEvent => event != null)

  const lastAt =
    candidates.length > 0
      ? candidates.reduce((latest, event) => (event.at > latest ? event.at : latest), candidates[0]!.at)
      : sop.created_at

  const idleDays = daysSinceActivity(lastAt, now)
  if (candidates.length === 0 || idleDays >= IDLE_THRESHOLD_DAYS) {
    return {
      events: [],
      idleLabel: `No activity for ${Math.max(idleDays, IDLE_THRESHOLD_DAYS)} days`,
    }
  }

  const events = candidates
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 3)

  return { events, idleLabel: null }
}

export function buildSopActivityFeedMap(
  sops: Pick<
    Tables<"standards">,
    "id" | "category" | "updated_at" | "created_at" | "created_by"
  >[],
  ctx: SopActivityContext
): Map<string, SopActivityFeed> {
  const map = new Map<string, SopActivityFeed>()
  for (const sop of sops) {
    map.set(sop.id, buildSopActivityFeed(sop, ctx))
  }
  return map
}
