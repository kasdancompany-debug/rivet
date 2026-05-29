import {
  countCompletedExecutionRecordsByEmployee,
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchTrainingModuleDeep,
  listEmployeeModuleCertificationsForEmployeeIds,
  listEmployeeReadinessForBusiness,
  listEmployeeStandardQuizCompletionsForEmployeeIds,
  listEmployeeTrainingProgress,
  listManagerObservationsForEmployeeIds,
  listTrainingSopCompletionsForEmployeeIds,
} from "@/lib/db/queries"
import { buildEmployeeTrainingViewModel } from "@/lib/training/build-views"
import type { CertificationBadge, ModuleCertificationView } from "@/lib/training/certifications/build-views"
import type { ComputedEmployeeReadiness } from "@/lib/training/compute-readiness"
import { createClient } from "@/lib/supabase/server"
import type { TrainingModuleDeep } from "@/lib/db/queries"

export type PortalReadinessView = {
  businessName: string
  readiness: ComputedEmployeeReadiness
  certifications: ModuleCertificationView[]
  certifiedBadges: CertificationBadge[]
}

export async function loadPortalReadinessForEmployee(
  employeeId: string
): Promise<PortalReadinessView | null> {
  const supabase = await createClient()
  const [business, profile] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    fetchCurrentProfile(supabase),
  ])
  if (!business || !profile || profile.id !== employeeId) return null

  const assignments = await listEmployeeTrainingProgress({ employeeId }, supabase)
  const businessAssignments = assignments.filter((a) => a.business_id === business.id)

  const modulesById = new Map<string, TrainingModuleDeep>()
  for (const row of businessAssignments) {
    const mod = await fetchTrainingModuleDeep(row.training_module_id, supabase)
    if (mod) modulesById.set(mod.id, mod)
  }

  const progressRows = businessAssignments

  const [completions, quizCompletions, certificationRows, observationRows, readinessRows, executionCounts] =
    await Promise.all([
      listTrainingSopCompletionsForEmployeeIds([employeeId], supabase),
      listEmployeeStandardQuizCompletionsForEmployeeIds([employeeId], supabase),
      listEmployeeModuleCertificationsForEmployeeIds([employeeId], supabase),
      listManagerObservationsForEmployeeIds([employeeId], supabase),
      listEmployeeReadinessForBusiness(business.id, supabase),
      countCompletedExecutionRecordsByEmployee(business.id, supabase),
    ])

  const vm = buildEmployeeTrainingViewModel(
    profile,
    progressRows,
    modulesById,
    completions,
    readinessRows.find((r) => r.employee_id === employeeId),
    executionCounts.get(employeeId) ?? 0,
    quizCompletions,
    certificationRows,
    observationRows
  )

  return {
    businessName: business.name,
    readiness: vm.readiness,
    certifications: vm.certifications,
    certifiedBadges: vm.certifiedBadges,
  }
}
