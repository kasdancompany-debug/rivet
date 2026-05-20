import { buildOperationsCoachSnapshot } from "@/lib/operations-coach/build-snapshot"
import type { CoachBrief } from "@/lib/operations-coach/types"
import { generateCoachBrief } from "@/lib/operations-coach/mock-engine"
import { buildOperationsCoachPromptPack } from "@/lib/operations-coach/serialize-prompt"
import { buildUnlinkedCoachSnapshot } from "@/lib/operations-coach/unlinked-snapshot"
import type { OperationsCoachPromptPack, OperationsCoachSnapshot } from "@/lib/operations-coach/types"
import {
  fetchBusinessForCurrentUser,
  fetchLatestDependencyAssessment,
  listDailyChecklistsForBusiness,
  listDailyRunsForBusiness,
  listIssuesForBusiness,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
  listTrainingProgressForBusinessModules,
} from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { createClient } from "@/lib/supabase/server"

export type OperationsCoachPageModel = {
  source: "live" | "unlinked" | "error"
  snapshot: OperationsCoachSnapshot
  brief: CoachBrief
  promptPack: OperationsCoachPromptPack
}

const UNLINKED_BRIEF: CoachBrief = {
  openingLine: COPY.coach.unlinkedLead,
  recommendations: [],
}

export async function getOperationsCoachPageModel(): Promise<OperationsCoachPageModel> {
  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) {
      const snapshot = buildUnlinkedCoachSnapshot()
      return {
        source: "unlinked",
        snapshot,
        brief: UNLINKED_BRIEF,
        promptPack: buildOperationsCoachPromptPack(snapshot),
      }
    }

    const businessId = business.id
    const [assessment, standards, bottlenecks, modules, checklists, runs] = await Promise.all([
      fetchLatestDependencyAssessment(businessId, supabase),
      listSopsForBusiness(businessId, undefined, supabase),
      listIssuesForBusiness(businessId, {}, supabase),
      listTrainingModulesForBusiness(businessId, supabase),
      listDailyChecklistsForBusiness(businessId, undefined, supabase),
      listDailyRunsForBusiness(businessId, { limit: 400 }, supabase),
    ])

    const moduleIdsArr = modules.map((m) => m.id)
    const progressForBusiness =
      moduleIdsArr.length === 0
        ? []
        : await listTrainingProgressForBusinessModules(moduleIdsArr, supabase)

    const activeSopIds = standards
      .filter((s) => s.status === "active")
      .map((s) => s.id)
    const stepCountBySopId = new Map<string, number>()
    if (activeSopIds.length > 0) {
      const { data: stepRows } = await supabase
        .from("standard_steps")
        .select("standard_id")
        .in("standard_id", activeSopIds)
      for (const row of stepRows ?? []) {
        const sid = (row as { standard_id: string }).standard_id
        stepCountBySopId.set(sid, (stepCountBySopId.get(sid) ?? 0) + 1)
      }
    }

    const snapshot = buildOperationsCoachSnapshot({
      businessName: business.name,
      generatedAt: new Date(),
      assessment,
      standards,
      stepCountBySopId,
      bottlenecks,
      modules,
      progressForBusiness,
      checklists,
      runs,
    })

    return {
      source: "live",
      snapshot,
      brief: generateCoachBrief(snapshot),
      promptPack: buildOperationsCoachPromptPack(snapshot),
    }
  } catch {
    const snapshot = buildUnlinkedCoachSnapshot()
    return {
      source: "error",
      snapshot,
      brief: {
        openingLine: COPY.coach.errorTitle,
        recommendations: [],
      },
      promptPack: buildOperationsCoachPromptPack(snapshot),
    }
  }
}
