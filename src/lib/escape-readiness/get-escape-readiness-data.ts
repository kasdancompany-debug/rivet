import { computeStandardsDepthPercent } from "@/lib/dashboard/standards-depth"
import { computeEscapeReadiness } from "@/lib/escape-readiness/compute"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import {
  fetchBusinessForCurrentUser,
  listEmployeeReadinessForBusiness,
  listTrainingProgressForBusinessModules,
  listIssuesForBusiness,
  listOwnerInterruptionsForBusinessSince,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
} from "@/lib/db/queries"
import { aggregateDailyRunCompletionLastDays } from "@/lib/rivet-score/data"
import type { RivetIndexComputeContext } from "@/lib/rivet-score/compute"
import { utcDaysAgoMidnightIso, utcMondayStartIso } from "@/lib/time/utc-week"
import { shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import { createClient } from "@/lib/supabase/server"

function emptyEscapeReadiness(): EscapeReadinessView {
  return {
    headlineQuestion: "Can your business survive if you disappear for a week?",
    score: null,
    band: null,
    verdict:
      "Link your business and add operating signal—standards, training, and readiness—so Rivet can score escape readiness.",
    factors: [
      {
        id: "procedures",
        label: "Procedures complete",
        percent: null,
        hint: "Waiting on workspace data.",
      },
      {
        id: "training",
        label: "Training coverage",
        percent: null,
        hint: "Waiting on workspace data.",
      },
      {
        id: "owner_dependencies",
        label: "Critical owner dependencies",
        percent: null,
        hint: "Waiting on workspace data.",
      },
      {
        id: "staffing",
        label: "Staffing risk",
        percent: null,
        hint: "Waiting on workspace data.",
      },
    ],
  }
}

export async function getEscapeReadinessData(): Promise<EscapeReadinessView> {
  if (shouldSkipSupabaseNetwork()) {
    return emptyEscapeReadiness()
  }

  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return emptyEscapeReadiness()

    const businessId = business.id
    const weekStartIso = utcMondayStartIso()
    const interruptionHistorySince = utcDaysAgoMidnightIso(13)

    const [standards, bottlenecks, modules, ownerInterruptionsRaw, readinessRows] = await Promise.all([
      listSopsForBusiness(businessId, undefined, supabase),
      listIssuesForBusiness(businessId, {}, supabase),
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
    for (const r of ownerInterruptionsRaw) {
      if (new Date(r.occurred_at).getTime() >= weekStartMs) {
        ownerInterruptionsThisWeekCount += 1
      }
    }

    const activeSopIds = standards.filter((s) => s.status === "active").map((s) => s.id)
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
    const progressForBusiness = allProgress.filter((p) => moduleIds.has(p.training_module_id))

    const totalAssignments = progressForBusiness.length
    const completedAssignments = progressForBusiness.filter((p) => p.status === "completed").length
    const trainingProgressPercent =
      totalAssignments === 0 ? null : Math.round((completedAssignments / totalAssignments) * 100)
    const trainingIncompleteCount = progressForBusiness.filter((p) => p.status !== "completed").length

    const { data: teamProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("business_id", businessId)
    const teamIds = new Set((teamProfiles ?? []).map((t) => t.id))
    const teamProfileCount = teamIds.size

    let staffReadinessPercent: number | null = trainingProgressPercent
    if (modules.length > 0 && teamIds.size > 0 && totalAssignments > 0) {
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

    const runStats = await aggregateDailyRunCompletionLastDays(businessId, 14, supabase)

    const ctx: RivetIndexComputeContext = {
      standards,
      stepCountBySopId,
      bottlenecks,
      trainingProgressPercent,
      staffReadinessPercent,
      standardsDepthPercent,
      scanDependencyPercent: null,
      runStats,
      readinessRows,
      teamProfileCount,
      trainingIncompleteCount,
      totalAssignments,
      ownerInterruptionsThisWeekCount,
    }

    return computeEscapeReadiness(ctx)
  } catch {
    return emptyEscapeReadiness()
  }
}
