import type { OwnerInterruptionKind, OwnerInterruptionSeverity, OwnerInterruptionSource, Tables } from "@/types/database"

import { labelForOwnerInterruptionKind } from "@/lib/owner-interruptions/kinds"
import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import {
  computeInterruptionSeverity,
  countSimilarPullsInWindow,
} from "@/lib/owner-interruptions/severity/compute-severity"
import { labelForOwnerInterruptionSeverity, severityRank } from "@/lib/owner-interruptions/severity/severities"
import { labelForOwnerInterruptionSource, sourceRank } from "@/lib/owner-interruptions/sources"
import { generateInterruptionFixSuggestions } from "@/lib/owner-interruptions/fix-suggestions/generate-fix-suggestions"
import {
  buildSystemImprovements,
  improvementSummaryForOutcomes,
} from "@/lib/owner-interruptions/outcomes/build-system-improvements"
import { enrichInterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/enrich-action-plan-view"
import type { AskQueryRow } from "@/lib/owner-interruptions/outcomes/match-ask-rivet"
import { computeTrendDayIntensity } from "@/lib/owner-interruptions/trend/compute-trend-day-intensity"
import { buildTopLeaks } from "@/lib/owner-interruptions/top-leaks/build-top-leaks"
import { computeOwnerValueMetrics } from "@/lib/owner-interruptions/value-metrics/compute-value-metrics"
import type {
  OwnerInterruptionPersonSlice,
  OwnerInterruptionRecentRow,
  OwnerInterruptionRepeatCategory,
  OwnerInterruptionRoleSlice,
  OwnerInterruptionSeveritySlice,
  OwnerInterruptionSourceSlice,
  OwnerInterruptionTrendDay,
  OwnerInterruptionsDashboardView,
} from "@/lib/owner-interruptions/types"

type ProfileRow = Pick<Tables<"profiles">, "id" | "full_name" | "role">

function utcYmd(iso: string): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDaysUtcYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + delta))
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dt.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

function severityForRow(
  row: Tables<"owner_interruptions">,
  historyRows: Tables<"owner_interruptions">[]
) {
  const frequencyCount = countSimilarPullsInWindow(historyRows, {
    summary: row.summary,
    occurred_at: row.occurred_at,
  })
  return computeInterruptionSeverity({
    estimatedMinutes: row.estimated_minutes ?? 15,
    urgency: row.urgency ?? "today",
    frequencyCount,
  })
}

function formatTrendDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function formatTrendDayShort(ymd: string): string {
  const [, , d] = ymd.split("-")
  return String(Number(d))
}

function mostCommonIssueForDay(
  issueMap: Map<string, { label: string; count: number }> | undefined
): string | null {
  if (!issueMap || issueMap.size === 0) return null
  let best: string | null = null
  let bestN = 0
  for (const [, v] of issueMap) {
    if (v.count > bestN) {
      best = v.label
      bestN = v.count
    }
  }
  return best
}

export function buildOwnerInterruptionsDashboardView(input: {
  weekStartIso: string
  /** Inclusive lower bound for trend + repeats (e.g. 14 or 30 days). */
  historySinceIso: string
  rowsSinceHistory: Tables<"owner_interruptions">[]
  profiles: ProfileRow[]
  ownerHourlyValueCad?: number | null
  businessId: string
  isOwner: boolean
  actionPlans?: Tables<"interruption_action_plans">[]
  standards?: Tables<"standards">[]
  modules?: Tables<"training_modules">[]
  trainingProgress?: Pick<Tables<"training_progress">, "training_module_id">[]
  askQueries?: AskQueryRow[]
  standardIdsWithMedia?: Set<string>
}): OwnerInterruptionsDashboardView {
  const {
    weekStartIso,
    historySinceIso,
    rowsSinceHistory,
    profiles,
    ownerHourlyValueCad = null,
    businessId,
    isOwner,
  } = input
  const profileById = new Map(profiles.map((p) => [p.id, p]))

  const weekMs = new Date(weekStartIso).getTime()
  const priorWeekMs = weekMs - 7 * 24 * 60 * 60 * 1000
  const thisWeekRows = rowsSinceHistory.filter((r) => new Date(r.occurred_at).getTime() >= weekMs)
  const priorWeekRows = rowsSinceHistory.filter((r) => {
    const t = new Date(r.occurred_at).getTime()
    return t >= priorWeekMs && t < weekMs
  })
  const minutesThisWeek = thisWeekRows.reduce((s, r) => s + (r.estimated_minutes ?? 0), 0)
  const minutesPriorWeek = priorWeekRows.reduce((s, r) => s + (r.estimated_minutes ?? 0), 0)

  const historyMs = new Date(historySinceIso).getTime()
  const historyRows = rowsSinceHistory.filter((r) => new Date(r.occurred_at).getTime() >= historyMs)

  const endYmd = utcYmd(new Date().toISOString())
  const startYmd = utcYmd(historySinceIso)
  const trendMap = new Map<string, { count: number; minutes: number }>()
  const dayIssueMap = new Map<string, Map<string, { label: string; count: number }>>()
  for (let ymd = startYmd; ymd <= endYmd; ymd = addDaysUtcYmd(ymd, 1)) {
    trendMap.set(ymd, { count: 0, minutes: 0 })
  }
  for (const r of historyRows) {
    const ymd = utcYmd(r.occurred_at)
    const cur = trendMap.get(ymd)
    if (!cur) continue
    cur.count += 1
    cur.minutes += r.estimated_minutes ?? 0

    const issueKey = normalizeSummaryKey(r.summary)
    if (issueKey) {
      const issues = dayIssueMap.get(ymd) ?? new Map<string, { label: string; count: number }>()
      const issue = issues.get(issueKey) ?? { label: r.summary.trim().slice(0, 120), count: 0 }
      issue.count += 1
      issues.set(issueKey, issue)
      dayIssueMap.set(ymd, issues)
    }
  }

  const maxTrendCount = Math.max(0, ...[...trendMap.values()].map((v) => v.count))
  const maxTrendMinutes = Math.max(0, ...[...trendMap.values()].map((v) => v.minutes))

  const trend14Days: OwnerInterruptionTrendDay[] = [...trendMap.entries()].map(([ymd, v]) => ({
    ymd,
    dayLabel: formatTrendDayLabel(ymd),
    dayShort: formatTrendDayShort(ymd),
    count: v.count,
    minutes: v.minutes,
    intensity: computeTrendDayIntensity({
      count: v.count,
      minutes: v.minutes,
      maxCount: maxTrendCount,
      maxMinutes: maxTrendMinutes,
    }),
    mostCommonIssue: mostCommonIssueForDay(dayIssueMap.get(ymd)),
  }))

  const kindMap = new Map<string, { count: number; minutes: number }>()
  for (const r of historyRows) {
    const k = r.kind
    const cur = kindMap.get(k) ?? { count: 0, minutes: 0 }
    cur.count += 1
    cur.minutes += r.estimated_minutes ?? 0
    kindMap.set(k, cur)
  }
  const byKind = [...kindMap.entries()]
    .map(([kind, v]) => ({
      kind: kind as OwnerInterruptionKind,
      label: labelForOwnerInterruptionKind(kind as OwnerInterruptionKind),
      count: v.count,
      minutes: v.minutes,
    }))
    .sort((a, b) => b.count - a.count)

  const roleMap = new Map<string, { count: number; minutes: number }>()
  const personMap = new Map<string, { count: number; minutes: number }>()
  for (const r of historyRows) {
    const p = profileById.get(r.logged_by)
    const roleLabel = (p?.role?.trim() || "Unknown role").slice(0, 80)
    const rcur = roleMap.get(roleLabel) ?? { count: 0, minutes: 0 }
    rcur.count += 1
    rcur.minutes += r.estimated_minutes ?? 0
    roleMap.set(roleLabel, rcur)

    const pcur = personMap.get(r.logged_by) ?? { count: 0, minutes: 0 }
    pcur.count += 1
    pcur.minutes += r.estimated_minutes ?? 0
    personMap.set(r.logged_by, pcur)
  }

  const byRole: OwnerInterruptionRoleSlice[] = [...roleMap.entries()]
    .map(([role, v]) => ({ role, count: v.count, minutes: v.minutes }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const topPeople: OwnerInterruptionPersonSlice[] = [...personMap.entries()]
    .map(([id, v]) => {
      const prof = profileById.get(id)
      return {
        profileId: id,
        name: prof?.full_name?.trim() || "Someone on the team",
        role: prof?.role?.trim() || "Unknown role",
        count: v.count,
        minutes: v.minutes,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const summaryKeyToLabel = new Map<string, string>()
  const summaryCounts = new Map<string, number>()
  for (const r of historyRows) {
    const key = normalizeSummaryKey(r.summary)
    if (!key) continue
    if (!summaryKeyToLabel.has(key)) summaryKeyToLabel.set(key, r.summary.trim().slice(0, 120))
    summaryCounts.set(key, (summaryCounts.get(key) ?? 0) + 1)
  }
  const repeatCategories: OwnerInterruptionRepeatCategory[] = [...summaryCounts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([key, count]) => ({ key, label: summaryKeyToLabel.get(key) ?? key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const severityMap = new Map<OwnerInterruptionSeverity, { count: number; minutes: number }>()
  for (const r of historyRows) {
    const { severity } = severityForRow(r, historyRows)
    const cur = severityMap.get(severity) ?? { count: 0, minutes: 0 }
    cur.count += 1
    cur.minutes += r.estimated_minutes ?? 0
    severityMap.set(severity, cur)
  }
  const bySeverity: OwnerInterruptionSeveritySlice[] = [...severityMap.entries()]
    .map(([severity, v]) => ({
      severity,
      label: labelForOwnerInterruptionSeverity(severity),
      count: v.count,
      minutes: v.minutes,
    }))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))

  const sourceMap = new Map<OwnerInterruptionSource, { count: number; minutes: number }>()
  for (const r of historyRows) {
    const source = r.source ?? "other"
    const cur = sourceMap.get(source) ?? { count: 0, minutes: 0 }
    cur.count += 1
    cur.minutes += r.estimated_minutes ?? 0
    sourceMap.set(source, cur)
  }
  const bySource: OwnerInterruptionSourceSlice[] = [...sourceMap.entries()]
    .map(([source, v]) => ({
      source,
      label: labelForOwnerInterruptionSource(source),
      count: v.count,
      minutes: v.minutes,
    }))
    .sort((a, b) => b.count - a.count || sourceRank(a.source) - sourceRank(b.source))

  const actionPlans = input.actionPlans ?? []
  const standards = input.standards ?? []
  const modules = input.modules ?? []
  const trainingProgress = input.trainingProgress ?? []
  const askQueries = input.askQueries ?? []
  const standardIdsWithMedia = input.standardIdsWithMedia ?? new Set<string>()
  const standardsForOutcomes = standards.map((s) => ({ id: s.id, title: s.title, status: s.status }))
  const interruptionsById = new Map(historyRows.map((r) => [r.id, r]))
  const planByInterruptionId = new Map(actionPlans.map((p) => [p.interruption_id, p]))

  const fixSuggestions = generateInterruptionFixSuggestions({
    repeatCategories,
    historyRows,
    standards,
    modules,
    standardIdsWithMedia,
    askQueries,
  })
  const topLeaks = buildTopLeaks({ repeatCategories, historyRows, standards, modules, standardIdsWithMedia, askQueries })

  const systemImprovements = buildSystemImprovements({
    plans: actionPlans,
    interruptionsById,
    historyRows,
    standards: standardsForOutcomes,
    modules: modules.map((m) => ({ id: m.id, title: m.title })),
    trainingProgress,
    askQueries,
    standardIdsWithMedia,
    isOwner,
  })

  const recent: OwnerInterruptionRecentRow[] = [...historyRows]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 20)
    .map((r) => {
      const prof = profileById.get(r.logged_by)
      const severityResult = severityForRow(r, historyRows)
      const plan = planByInterruptionId.get(r.id)
      let improvementSummary: string | null = null
      if (plan) {
        const enriched = enrichInterruptionActionPlanView({
          plan,
          interruption: r,
          historyRows,
          standards: standardsForOutcomes,
          modules: modules.map((m) => ({ id: m.id, title: m.title })),
          trainingProgress,
          askQueries,
          standardIdsWithMedia,
          isOwner,
        })
        improvementSummary = improvementSummaryForOutcomes(enriched.outcomes)
      }
      return {
        id: r.id,
        kind: r.kind,
        kindLabel: labelForOwnerInterruptionKind(r.kind),
        summary: r.summary,
        estimatedMinutes: r.estimated_minutes ?? 0,
        urgency: r.urgency ?? "today",
        source: r.source ?? "other",
        sourceLabel: labelForOwnerInterruptionSource(r.source ?? "other"),
        severity: severityResult.severity,
        severityLabel: labelForOwnerInterruptionSeverity(severityResult.severity),
        impactScore: severityResult.impactScore,
        occurredAt: r.occurred_at,
        loggerName: prof?.full_name?.trim() || "Team member",
        loggerRole: prof?.role?.trim() || "",
        improvementSummary,
      }
    })

  const parsedHourly =
    ownerHourlyValueCad != null && Number.isFinite(Number(ownerHourlyValueCad))
      ? Number(ownerHourlyValueCad)
      : null

  const valueMetrics = computeOwnerValueMetrics({
    minutesThisWeek,
    minutesPriorWeek,
    fixSuggestions,
    ownerHourlyValueCad: parsedHourly,
  })

  return {
    businessId,
    isOwner,
    weekStartIso,
    interruptionsThisWeek: thisWeekRows.length,
    minutesThisWeek,
    estimatedOwnerHoursThisWeek: Math.round((minutesThisWeek / 60) * 10) / 10,
    trend14Days,
    byKind,
    byRole,
    topPeople,
    topLeaks,
    bySeverity,
    bySource,
    valueMetrics,
    fixSuggestions,
    systemImprovements,
    recent,
  }
}
