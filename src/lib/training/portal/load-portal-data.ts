import {
  fetchBusinessForCurrentUser,
  fetchSopsWithStepsForIds,
  fetchTrainingModuleDeep,
  listEmployeeTrainingProgress,
  listTrainingSopCompletionsForEmployeeIds,
  listTrainingSopProgressForEmployee,
  listEmployeeStandardQuizCompletions,
} from "@/lib/db/queries"
import { buildPortalModuleView } from "@/lib/training/portal/build-portal-module"
import type { PortalModuleView } from "@/lib/training/portal/types"
import { createClient } from "@/lib/supabase/server"

export async function loadPortalModuleForEmployee(
  moduleId: string,
  employeeId: string,
  activeItemId?: string | null
): Promise<PortalModuleView | null> {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null

  const mod = await fetchTrainingModuleDeep(moduleId, supabase)
  if (!mod || mod.business_id !== business.id) return null

  const assignments = await listEmployeeTrainingProgress({ employeeId, moduleId }, supabase)
  const assignment = assignments[0] ?? null
  if (!assignment) return null

  const sopIds = (mod.training_items ?? []).map((i) => i.standard_id)
  const sops = await fetchSopsWithStepsForIds(sopIds, supabase)
  const sopsById = new Map(sops.map((s) => [s.id, s]))

  const [completions, progressRows, quizCompletions] = await Promise.all([
    listTrainingSopCompletionsForEmployeeIds([employeeId], supabase),
    listTrainingSopProgressForEmployee(employeeId, supabase),
    listEmployeeStandardQuizCompletions(employeeId, supabase),
  ])
  const completionIds = new Set(
    completions.filter((c) => c.employee_id === employeeId).map((c) => c.training_item_id)
  )
  const passedQuizStandardIds = new Set(
    quizCompletions.filter((q) => q.passed).map((q) => q.standard_id)
  )

  return buildPortalModuleView({
    module: mod,
    businessName: business.name,
    assignment,
    sopsById,
    progressRows,
    completionIds,
    passedQuizStandardIds,
    activeItemId,
  })
}

export async function loadPortalModulesForEmployee(employeeId: string) {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return []

  const assignments = await listEmployeeTrainingProgress({ employeeId }, supabase)
  const businessAssignments = assignments.filter((a) => a.business_id === business.id)
  if (businessAssignments.length === 0) return []

  const modules = await Promise.all(
    businessAssignments.map(async (row) => {
      const mod = await fetchTrainingModuleDeep(row.training_module_id, supabase)
      return {
        moduleId: row.training_module_id,
        title: mod?.title ?? "Training module",
        description: mod?.description ?? null,
        status: row.status,
        progressId: row.id,
      }
    })
  )

  return modules
}
