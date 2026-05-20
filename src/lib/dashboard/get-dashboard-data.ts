import type { DashboardViewModel, OwnerRiskItem } from "@/lib/dashboard/types"
import { buildLoadErrorDashboardViewModel, buildSetupDashboardViewModel } from "@/lib/dashboard/setup-model"
import { COPY } from "@/lib/interface-copy"
import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchLatestDependencyAssessment,
  listEmployeeReadinessForBusiness,
  listTrainingProgressForBusinessModules,
  listIssuesForBusiness,
  listOwnerInterruptionsForBusinessSince,
  listRecentCompletedExecutionRecords,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
} from "@/lib/db/queries"
import { computeStandardsDepthPercent } from "@/lib/dashboard/standards-depth"
import { categoryScoresRecord, computeRivetIndex } from "@/lib/rivet-score/compute"
import {
  aggregateDailyRunCompletionLastDays,
  listRivetIndexSnapshotsLastDays,
  upsertRivetIndexSnapshotForUtcDate,
} from "@/lib/rivet-score/data"
import { RIVET_INDEX_CATEGORIES } from "@/lib/rivet-score/types"
import type { RivetIndexCategoryId } from "@/lib/rivet-score/types"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { utcDaysAgoMidnightIso, utcMondayStartIso } from "@/lib/time/utc-week"
import { shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import { getDevWorkspaceBusiness } from "@/lib/dev-workspace"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

function riskLevelFromDependency(percent: number): {
  level: DashboardViewModel["riskLevel"]
  caption: string
} {
  if (percent <= 25) {
    return {
      level: "low",
      caption: "Systems and people are carrying most of the day.",
    }
  }
  if (percent <= 45) {
    return {
      level: "moderate",
      caption: "A few focused fixes will noticeably lighten your load.",
    }
  }
  if (percent <= 65) {
    return {
      level: "elevated",
      caption: "Several areas still collapse to you when pressure hits.",
    }
  }
  return {
    level: "high",
    caption: "Operational load is still heavily concentrated on the owner.",
  }
}

function founderDependencyLabel(percent: number): string {
  if (percent <= 20) {
    return "Most of the day can run on systems and trained people—not on you."
  }
  if (percent <= 40) {
    return "About a third to half of critical moments still look to you first."
  }
  if (percent <= 60) {
    return "Roughly half of high-stakes decisions still route through the owner."
  }
  return "A majority of critical paths still depend on you being available."
}

function pickNextBestMove(risks: OwnerRiskItem[]): DashboardViewModel["nextBestMove"] {
  const first = risks[0]
  if (!first) {
    return {
      title: "Assign closing checklist ownership",
      description:
        "Pick one person to own end-of-day close this week. Clear ownership is the fastest way to prove the business can finish the day without you.",
      href: "/escape-plan",
      cta: "Open daily execution",
    }
  }
  if (first.category === "procedure" || first.category === "sop_critical") {
    const lower = first.title.toLowerCase()
    const subject =
      lower.includes("cash") || lower.includes("safe")
        ? "cash handling & safe"
        : first.title
    return {
      title: `Document ${subject}`,
      description: first.detail,
      href: "/sops",
      cta: "Open Standards",
    }
  }
  if (first.category === "training") {
    return {
      title: "Train one person on opening alone",
      description: first.detail,
      href: "/training",
      cta: "Go to training",
    }
  }
  if (first.category === "issue") {
    return {
      title: "Clear open quality bottleneck",
      description: first.detail,
      href: "/issues",
      cta: "Open bottlenecks",
    }
  }
  return {
    title: "Document espresso dialing",
    description:
      "Turn the most repeated question at the bar into a short SOP your leads can follow without texting you.",
    href: "/sops",
    cta: "Open Standards",
  }
}

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

function utcYesterdayYmd(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function parsePrevCategories(raw: unknown): Partial<Record<RivetIndexCategoryId, number>> | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const out: Partial<Record<RivetIndexCategoryId, number>> = {}
  for (const { id } of RIVET_INDEX_CATEGORIES) {
    const v = o[id]
    if (typeof v === "number" && !Number.isNaN(v)) {
      out[id] = Math.max(0, Math.min(100, Math.round(v)))
    } else if (typeof v === "string") {
      const n = Number(v)
      if (!Number.isNaN(n)) out[id] = Math.max(0, Math.min(100, Math.round(n)))
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

function computeProceduresMissingCount(
  standards: Tables<"standards">[],
  stepCountBySopId: Map<string, number>
): number {
  let count = 0
  for (const s of standards) {
    if (s.status === "draft") {
      count += 1
      continue
    }
    if (s.status === "active" && (stepCountBySopId.get(s.id) ?? 0) === 0) {
      count += 1
    }
  }
  return count
}

function buildOwnerRisksFromLive(
  standards: Tables<"standards">[],
  bottlenecks: Tables<"bottlenecks">[],
  trainingProgress: Tables<"training_progress">[],
  moduleIds: Set<string>,
  stepCountBySopId: Map<string, number>
): OwnerRiskItem[] {
  const risks: OwnerRiskItem[] = []
  let k = 0
  const nextId = () => `live-${++k}`

  const activeSops = standards.filter((s) => s.status === "active")
  for (const sop of activeSops) {
    const steps = stepCountBySopId.get(sop.id) ?? 0
    if (sop.owner_dependency_level >= 4 && steps < 2) {
      risks.push({
        id: nextId(),
        category: "sop_critical",
        title: sop.title,
        detail:
          steps === 0
            ? "Marked critical for owner involvement but has no documented steps yet."
            : "High owner-dependency with only a thin step list—expand before you delegate.",
      })
    }
  }

  const drafts = standards.filter((s) => s.status === "draft")
  if (drafts.length > 0) {
    risks.push({
      id: nextId(),
      category: "procedure",
      title: `${drafts.length} procedure${drafts.length > 1 ? "s" : ""} still in draft`,
      detail: "Draft SOPs are not yet trusted for floor use—tribal knowledge wins by default.",
    })
  }

  const inProgress = trainingProgress.filter(
    (p) =>
      moduleIds.has(p.training_module_id) &&
      (p.status === "not_started" || p.status === "in_progress")
  )
  if (inProgress.length > 0) {
    risks.push({
      id: nextId(),
      category: "training",
      title: "Incomplete training assignments",
      detail: `${inProgress.length} module assignment(s) still open for your team.`,
    })
  }

  const ownerIssues = bottlenecks.filter(
    (i) =>
      i.owner_required && (i.status === "open" || i.status === "in_progress")
  )
  for (const issue of ownerIssues.slice(0, 2)) {
    risks.push({
      id: nextId(),
      category: "issue",
      title: issue.title,
      detail: issue.description?.trim() || "Marked as requiring owner attention.",
    })
  }

  return risks.slice(0, 6)
}

export async function getDashboardData(): Promise<DashboardViewModel> {
  if (shouldSkipSupabaseNetwork()) {
    const devBusiness = await getDevWorkspaceBusiness()
    if (!devBusiness) return buildSetupDashboardViewModel()
    return { ...buildSetupDashboardViewModel(), businessName: devBusiness.name }
  }

  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) {
      return buildSetupDashboardViewModel()
    }

    const businessId = business.id
    const weekStartIso = utcMondayStartIso()
    const interruptionHistorySince = utcDaysAgoMidnightIso(13)
    const [profile, standards, bottlenecks, assessment, modules, ownerInterruptionsRaw, readinessRows] =
      await Promise.all([
        fetchCurrentProfile(supabase),
        listSopsForBusiness(businessId, undefined, supabase),
        listIssuesForBusiness(businessId, {}, supabase),
        fetchLatestDependencyAssessment(businessId, supabase),
        listTrainingModulesForBusiness(businessId, supabase),
        listOwnerInterruptionsForBusinessSince(businessId, interruptionHistorySince, supabase),
        listEmployeeReadinessForBusiness(businessId, supabase),
      ])

    const allProgress = await listTrainingProgressForBusinessModules(
      modules.map((m) => m.id),
      supabase
    )

    const weekStartMs = new Date(weekStartIso).getTime()
    let ownerInterruptionsThisWeekCount = 0
    let ownerInterruptionsThisWeekMinutes = 0
    for (const r of ownerInterruptionsRaw) {
      if (new Date(r.occurred_at).getTime() >= weekStartMs) {
        ownerInterruptionsThisWeekCount += 1
        ownerInterruptionsThisWeekMinutes += r.estimated_minutes ?? 0
      }
    }

    const activeSopIds = standards
      .filter((s) => s.status === "active")
      .map((s) => s.id)
    const stepCountBySopId = new Map<string, number>()
    const stepRollupBySopId = new Map<
      string,
      { stepCount: number; hasStepMediaOrEvidence: boolean }
    >()
    if (activeSopIds.length > 0) {
      const { data: stepRows } = await supabase
        .from("standard_steps")
        .select("standard_id, media_url, requires_photo_confirmation")
        .in("standard_id", activeSopIds)
      for (const row of stepRows ?? []) {
        const sid = row.standard_id as string
        stepCountBySopId.set(sid, (stepCountBySopId.get(sid) ?? 0) + 1)
        const prev = stepRollupBySopId.get(sid) ?? {
          stepCount: 0,
          hasStepMediaOrEvidence: false,
        }
        prev.stepCount += 1
        if (
          (row.media_url != null && String(row.media_url).trim().length > 0) ||
          row.requires_photo_confirmation === true
        ) {
          prev.hasStepMediaOrEvidence = true
        }
        stepRollupBySopId.set(sid, prev)
      }
    }

    const mediaCountBySopId = new Map<string, number>()
    if (activeSopIds.length > 0) {
      const { data: mediaRows } = await supabase
        .from("standard_media")
        .select("standard_id")
        .in("standard_id", activeSopIds)
      for (const row of mediaRows ?? []) {
        const sid = row.standard_id as string
        mediaCountBySopId.set(sid, (mediaCountBySopId.get(sid) ?? 0) + 1)
      }
    }

    const standardsDepthPercent = computeStandardsDepthPercent(
      standards,
      stepRollupBySopId,
      mediaCountBySopId
    )

    const moduleIds = new Set(modules.map((m) => m.id))
    const progressForBusiness = allProgress.filter((p) =>
      moduleIds.has(p.training_module_id)
    )

    const activeSops = standards.filter((s) => s.status === "active")
    const proceduresMissingCount = computeProceduresMissingCount(standards, stepCountBySopId)

    const totalAssignments = progressForBusiness.length
    const completedAssignments = progressForBusiness.filter(
      (p) => p.status === "completed"
    ).length
    const trainingProgressPercent =
      totalAssignments === 0
        ? null
        : Math.round((completedAssignments / totalAssignments) * 100)

    const openIssues = bottlenecks.filter((i) => i.status === "open")
    const unresolvedIssues = bottlenecks.filter(
      (i) => i.status === "open" || i.status === "in_progress"
    )
    const ownerTasks = bottlenecks.filter(
      (i) =>
        i.owner_required &&
        (i.status === "open" || i.status === "in_progress")
    )
    const ownerRequiredOpenIssues = ownerTasks.slice(0, 5).map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      severity: i.severity,
    }))

    const { data: teamProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("business_id", businessId)
    const teamIds = new Set((teamProfiles ?? []).map((t) => t.id))
    const teamProfileCount = teamIds.size

    let staffReadinessPercent: number | null = trainingProgressPercent
    if (modules.length > 0) {
      if (teamIds.size > 0 && totalAssignments > 0) {
        let sum = 0
        let n = 0
        for (const empId of teamIds) {
          const mine = progressForBusiness.filter((p) => p.employee_id === empId)
          if (mine.length === 0) continue
          const done = mine.filter((p) => p.status === "completed").length
          sum += done / mine.length
          n += 1
        }
        if (n > 0) staffReadinessPercent = Math.round((sum / n) * 100)
      }
    }

    const executionRows = await listRecentCompletedExecutionRecords(businessId, 8, supabase)
    const executionProof = executionRows.map((r) => ({
      id: r.id,
      completedAt: r.completed_at,
      shiftDate: r.shift_date,
      checklistTitle: r.checklist_title,
      checklistType: r.checklist_type,
      href: "/escape-plan",
    }))

    const scanDependencyPercent =
      assessment?.score != null && !Number.isNaN(Number(assessment.score))
        ? (() => {
            const raw = Number(assessment.score)
            const independence = Math.min(100, Math.max(0, Math.round(raw)))
            return 100 - independence
          })()
        : null

    const ownerRisks = buildOwnerRisksFromLive(
      standards,
      bottlenecks,
      progressForBusiness,
      moduleIds,
      stepCountBySopId
    )
    const risksDisplay = ownerRisks

    const trainingIncompleteCount = progressForBusiness.filter(
      (p) => p.status !== "completed"
    ).length

    const runStats = await aggregateDailyRunCompletionLastDays(businessId, 14, supabase)

    let snapshots: Awaited<ReturnType<typeof listRivetIndexSnapshotsLastDays>> = []
    try {
      snapshots = await listRivetIndexSnapshotsLastDays(businessId, 30, supabase)
    } catch {
      snapshots = []
    }

    const ymdYesterday = utcYesterdayYmd()
    const ySnap = snapshots.find((s) => s.snapshot_date === ymdYesterday)
    const previousCategoryDependency = ySnap ? parsePrevCategories(ySnap.category_scores) : null
    const previousOverallDependency =
      ySnap && ySnap.dependency_score != null ? Number(ySnap.dependency_score) : null

    const rivetBase = computeRivetIndex({
      standards,
      stepCountBySopId,
      bottlenecks,
      trainingProgressPercent,
      staffReadinessPercent,
      standardsDepthPercent,
      scanDependencyPercent,
      runStats,
      readinessRows,
      teamProfileCount,
      trainingIncompleteCount,
      totalAssignments,
      ownerInterruptionsThisWeekCount,
      previousOverallDependency,
      previousCategoryDependency,
    })

    let founderDependencyPercent: number | null = rivetBase.dependencyScore
    if (founderDependencyPercent == null && scanDependencyPercent != null) {
      founderDependencyPercent = scanDependencyPercent
    }

    const { level, caption } =
      founderDependencyPercent == null
        ? {
            level: "low" as const,
            caption: COPY.dashboard.scoreInsufficientRiskCaption,
          }
        : riskLevelFromDependency(founderDependencyPercent)

    const todayYmd = utcTodayYmd()
    const trendPoints = snapshots
      .map((s) => {
        const dependencyScore = Number(s.dependency_score)
        const autonomyScore = Number(s.autonomy_score)
        return { date: s.snapshot_date, dependencyScore, autonomyScore }
      })
      .filter(
        (p) =>
          Number.isFinite(p.dependencyScore) &&
          Number.isFinite(p.autonomyScore)
      )
    const withoutToday = trendPoints.filter((p) => p.date !== todayYmd)
    if (rivetBase.dependencyScore != null && rivetBase.autonomyLikelihood != null) {
      withoutToday.push({
        date: todayYmd,
        dependencyScore: rivetBase.dependencyScore,
        autonomyScore: rivetBase.autonomyLikelihood,
      })
    }
    withoutToday.sort((a, b) => a.date.localeCompare(b.date))
    const rivetIndex = { ...rivetBase, trend: withoutToday.slice(-30) }

    const {
      data: { user: dashUser },
    } = await supabase.auth.getUser()
    if (
      dashUser &&
      isWorkspaceOwner(dashUser.id, business, profile) &&
      rivetIndex.dependencyScore != null &&
      rivetIndex.autonomyLikelihood != null
    ) {
      try {
        await upsertRivetIndexSnapshotForUtcDate({
          businessId,
          snapshotDate: todayYmd,
          dependencyScore: rivetIndex.dependencyScore,
          autonomyScore: rivetIndex.autonomyLikelihood,
          categoryScores: categoryScoresRecord(rivetIndex.categories),
          warnings: rivetIndex.criticalWarnings,
          client: supabase,
        })
      } catch {
        /* migration not applied */
      }
    }

    const coldStart =
      standards.length === 0 &&
      bottlenecks.length === 0 &&
      modules.length === 0 &&
      assessment == null

    const needsFirstStandard = standards.length === 0 && assessment != null

    let nextBestMove = pickNextBestMove(risksDisplay)
    if (needsFirstStandard) {
      nextBestMove = {
        title: COPY.dashboard.firstStandardTitle,
        description: COPY.dashboard.firstStandardBody,
        href: "/sops/capture",
        cta: COPY.dashboard.firstStandardCta,
      }
    }

    return {
      source: "live",
      businessName: business.name,
      founderDependencyPercent,
      founderDependencyLabel:
        founderDependencyPercent == null
          ? COPY.dashboard.scoreInsufficientFounderLabel
          : founderDependencyLabel(founderDependencyPercent),
      standardsDepthPercent,
      staffReadinessPercent,
      openIssuesCount: openIssues.length,
      ownerTasksCount: ownerTasks.length,
      unresolvedIssuesCount: unresolvedIssues.length,
      ownerInterruptionsThisWeekCount,
      ownerInterruptionsThisWeekMinutes,
      proceduresMissingCount,
      ownerRequiredOpenIssues,
      trainingProgressPercent,
      riskLevel: level,
      riskLevelCaption: caption,
      ownerRisks: risksDisplay,
      nextBestMove,
      rivetIndex,
      executionProof,
      coldStart,
      needsFirstStandard,
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[getDashboardData]", e)
    }
    return buildLoadErrorDashboardViewModel()
  }
}
