import { isIssueUnresolved } from "@/lib/issues/constants"
import { labelForChecklistType } from "@/lib/operations-coach/checklist-labels"
import { parseAssessmentJson } from "@/lib/operations-coach/parse-assessment-json"
import type { OperationsCoachSnapshot } from "@/lib/operations-coach/types"
import type { DailyChecklistType, Tables } from "@/types/database"

export type CoachSnapshotSource = {
  businessName: string
  generatedAt: Date
  assessment: Tables<"reality_checks"> | null
  standards: Tables<"standards">[]
  stepCountBySopId: Map<string, number>
  bottlenecks: Tables<"bottlenecks">[]
  modules: Tables<"training_modules">[]
  progressForBusiness: Tables<"training_progress">[]
  checklists: Tables<"daily_checklists">[]
  runs: Tables<"execution_records">[]
}

const WINDOW_DAYS = 14

function riskBandFromJson(json: Tables<"reality_checks">["assessment_json"]): string | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null
  const r = (json as Record<string, unknown>).riskBand
  return typeof r === "string" ? r : null
}

function utcYmdDaysAgo(days: number): string {
  const d = new Date()
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  u.setUTCDate(u.getUTCDate() - days)
  return u.toISOString().slice(0, 10)
}

export function buildOperationsCoachSnapshot(src: CoachSnapshotSource): OperationsCoachSnapshot {
  const windowStartDate = utcYmdDaysAgo(WINDOW_DAYS)

  const independenceRaw = src.assessment?.score != null ? Number(src.assessment.score) : null
  const independenceScore =
    independenceRaw != null && !Number.isNaN(independenceRaw)
      ? Math.min(100, Math.max(0, Math.round(independenceRaw)))
      : null
  const founderDependencyPercent =
    independenceScore != null ? Math.min(100, Math.max(0, 100 - independenceScore)) : null

  const parsed = src.assessment ? parseAssessmentJson(src.assessment.assessment_json) : null
  const sortedCats = parsed
    ? [...parsed.categoryBreakdown].sort((a, b) => b.score - a.score)
    : []
  const topCat = sortedCats[0]
  const sortedBottlenecks = parsed
    ? [...parsed.bottlenecks].sort((a, b) => b.score - a.score)
    : []
  const topB = sortedBottlenecks[0]

  const activeSops = src.standards.filter((s) => s.status === "active")
  const draftSops = src.standards.filter((s) => s.status === "draft")
  const thinDescriptionActiveCount = activeSops.filter(
    (s) => (s.description?.trim()?.length ?? 0) <= 40
  ).length
  const activeUnderTwoStepsCount = activeSops.filter((s) => {
    const n = src.stepCountBySopId.get(s.id) ?? 0
    return n < 2
  }).length

  const assignmentsTotal = src.progressForBusiness.length
  const assignmentsCompleted = src.progressForBusiness.filter(
    (p) => p.status === "completed"
  ).length
  const assignmentsInProgress = src.progressForBusiness.filter(
    (p) => p.status === "in_progress"
  ).length
  const assignmentsNotStarted = src.progressForBusiness.filter(
    (p) => p.status === "not_started"
  ).length

  const openModuleTitles: string[] = []
  for (const m of src.modules) {
    const rows = src.progressForBusiness.filter((p) => p.training_module_id === m.id)
    if (rows.length === 0) continue
    if (rows.some((p) => p.status !== "completed")) {
      openModuleTitles.push(m.title)
    }
    if (openModuleTitles.length >= 5) break
  }

  const unresolved = src.bottlenecks.filter((i) => isIssueUnresolved(i.status))
  const openOnly = src.bottlenecks.filter((i) => i.status === "not_started")
  const ownerUnres = unresolved.filter((i) => i.owner_required)
  const ownerRequiredByCategorySlug: Record<string, number> = {}
  for (const i of ownerUnres) {
    ownerRequiredByCategorySlug[i.category] = (ownerRequiredByCategorySlug[i.category] ?? 0) + 1
  }
  const ownerRequiredSampleTitles = ownerUnres.slice(0, 3).map((i) => i.title)

  const checklistTypeById = new Map(src.checklists.map((c) => [c.id, c.type]))
  const runsInWindow = src.runs.filter((r) => r.shift_date >= windowStartDate)

  type Agg = { completed: number; abandoned: number; inProgress: number; total: number }
  const byType = new Map<DailyChecklistType, Agg>()
  for (const run of runsInWindow) {
    const t = checklistTypeById.get(run.checklist_id)
    if (!t) continue
    const cur = byType.get(t) ?? {
      completed: 0,
      abandoned: 0,
      inProgress: 0,
      total: 0,
    }
    cur.total += 1
    if (run.status === "completed") cur.completed += 1
    else if (run.status === "abandoned") cur.abandoned += 1
    else cur.inProgress += 1
    byType.set(t, cur)
  }

  const byShiftType = [...byType.entries()].map(([type, a]) => {
    const completionRate = a.total === 0 ? null : Math.round((a.completed / a.total) * 100) / 100
    return {
      type,
      label: labelForChecklistType(type),
      completed: a.completed,
      total: a.total,
      completionRate,
    }
  })

  let weakestShiftType: string | null = null
  let weakestShiftTypeLabel: string | null = null
  let worstRate = 2
  for (const row of byShiftType) {
    if (row.total < 1) continue
    const rate = row.completionRate ?? 0
    if (rate < worstRate) {
      worstRate = rate
      weakestShiftType = row.type
      weakestShiftTypeLabel = row.label
    }
  }

  const completedRunsInWindow = runsInWindow.filter((r) => r.status === "completed").length
  const abandonedRunsInWindow = runsInWindow.filter((r) => r.status === "abandoned").length
  const inProgressRunsInWindow = runsInWindow.filter((r) => r.status === "in_progress").length
  const totalRunsInWindow = runsInWindow.length
  const runCompletionRate =
    totalRunsInWindow === 0
      ? null
      : Math.round((completedRunsInWindow / totalRunsInWindow) * 100) / 100

  return {
    schemaVersion: 1,
    generatedAt: src.generatedAt.toISOString(),
    businessName: src.businessName,
    assessment: {
      present: Boolean(src.assessment),
      assessedAt: src.assessment?.created_at ?? null,
      independenceScore,
      founderDependencyPercent,
      riskBand: src.assessment ? riskBandFromJson(src.assessment.assessment_json) : null,
      topSectionId: topCat?.sectionId ?? null,
      topSectionTitle: topCat?.title ?? null,
      topSectionScore: topCat?.score ?? null,
      topBottleneckPrompt: topB?.prompt ?? null,
      bottlenecks: sortedBottlenecks.slice(0, 5).map((b) => ({
        prompt: b.prompt,
        sectionTitle: b.sectionTitle,
        score: b.score,
      })),
    },
    sops: {
      activeCount: activeSops.length,
      draftCount: draftSops.length,
      thinDescriptionActiveCount,
      activeUnderTwoStepsCount,
    },
    training: {
      moduleCount: src.modules.length,
      assignmentsTotal,
      assignmentsCompleted,
      assignmentsInProgress,
      assignmentsNotStarted,
      modulesWithOpenAssignments: openModuleTitles,
    },
    issues: {
      unresolvedCount: unresolved.length,
      openCount: openOnly.length,
      ownerRequiredUnresolvedCount: ownerUnres.length,
      ownerRequiredByCategorySlug,
      ownerRequiredSampleTitles,
    },
    dailyChecklists: {
      windowDays: WINDOW_DAYS,
      windowStartDate,
      totalRunsInWindow,
      completedRunsInWindow,
      abandonedRunsInWindow,
      inProgressRunsInWindow,
      runCompletionRate,
      weakestShiftType,
      weakestShiftTypeLabel,
      byShiftType,
    },
  }
}
