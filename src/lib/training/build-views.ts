import type { TrainingModuleDeep } from "@/lib/db/queries"
import type {
  Tables,
  TrainingProgressStatus,
} from "@/types/database"

import type { DelegationReadinessStatus, ReadinessCapabilityField } from "@/lib/training/compute-readiness"
import {
  computeEmployeeReadiness,
  type CapabilityReadiness,
  type ComputedEmployeeReadiness,
  type ReadinessModuleInput,
} from "./compute-readiness"
import {
  buildCertificationViews,
  type CertificationBadge,
  type ModuleCertificationView,
} from "@/lib/training/certifications/build-views"

export type AssignedSopRow = {
  trainingItemId: string
  moduleId: string
  standardId: string
  title: string
  completed: boolean
  standardCategory: string | null
}

export type ModuleProgressView = {
  moduleId: string
  title: string
  assignedRole: string | null
  progressId: string
  status: TrainingProgressStatus
  requiredTotal: number
  requiredDone: number
  pct: number | null
  completedSopTitles: string[]
  remainingSopTitles: string[]
  sopRows: AssignedSopRow[]
}

export type ManagerObservationView = {
  id: string
  type: Tables<"employee_manager_observations">["observation_type"]
  notes: string
  observedAt: string
  observerName: string
}

export type EmployeeTrainingViewModel = {
  profile: Tables<"profiles">
  modules: ModuleProgressView[]
  aggregatePct: number | null
  readiness: ComputedEmployeeReadiness
  certifications: ModuleCertificationView[]
  certifiedBadges: CertificationBadge[]
  observations: ManagerObservationView[]
}

function sopTitle(item: TrainingModuleDeep["training_items"][0]): string {
  return item.standards?.title?.trim() || "Untitled standard"
}

function readinessOverridesFromRow(
  row: Tables<"employee_readiness"> | undefined
): Partial<Record<ReadinessCapabilityField, DelegationReadinessStatus | null>> {
  if (!row) return {}
  return {
    open_alone: row.open_alone_override,
    close_alone: row.close_alone_override,
    train_others: row.train_others_override,
    handle_complaints: row.handle_complaints_override,
  }
}

export function buildEmployeeTrainingViewModel(
  profile: Tables<"profiles">,
  progressRows: Tables<"training_progress">[],
  modulesById: Map<string, TrainingModuleDeep>,
  completions: Tables<"employee_training_sop_completions">[],
  readinessRow: Tables<"employee_readiness"> | undefined,
  completedShiftRuns = 0,
  quizCompletions: Tables<"employee_standard_quiz_completions">[] = [],
  certificationRows: Tables<"employee_module_certifications">[] = [],
  observationRows: Tables<"employee_manager_observations">[] = [],
  profileNameById: Map<string, string> = new Map()
): EmployeeTrainingViewModel {
  const myCompletionSet = new Set(
    completions.filter((c) => c.employee_id === profile.id).map((c) => c.training_item_id)
  )
  const passedQuizStandardIds = new Set(
    quizCompletions.filter((q) => q.employee_id === profile.id && q.passed).map((q) => q.standard_id)
  )
  const certifiedModuleIds = new Set(
    certificationRows
      .filter((c) => c.employee_id === profile.id && c.certified_at)
      .map((c) => c.training_module_id)
  )
  const managerSignedOffModuleIds = new Set(
    certificationRows
      .filter((c) => c.employee_id === profile.id && c.manager_signed_off_at)
      .map((c) => c.training_module_id)
  )

  const modules: ModuleProgressView[] = []

  for (const pr of progressRows) {
    if (pr.employee_id !== profile.id) continue
    const mod = modulesById.get(pr.training_module_id)
    if (!mod) continue

    const required = (mod.training_items ?? []).filter((t) => t.required)
    const requiredIds = required.map((t) => t.id)
    const doneCount = requiredIds.filter((id) => myCompletionSet.has(id)).length
    const total = required.length
    const pct =
      total === 0 ? (pr.status === "completed" ? 100 : null) : Math.round((doneCount / total) * 100)

    const completedSopTitles: string[] = []
    const remainingSopTitles: string[] = []
    const sopRows: AssignedSopRow[] = []
    for (const item of required) {
      const title = sopTitle(item)
      const completed = myCompletionSet.has(item.id)
      sopRows.push({
        trainingItemId: item.id,
        moduleId: mod.id,
        standardId: item.standard_id,
        title,
        completed,
        standardCategory: item.standards?.category ?? null,
      })
      if (completed) completedSopTitles.push(title)
      else remainingSopTitles.push(title)
    }

    modules.push({
      moduleId: mod.id,
      title: mod.title,
      assignedRole: mod.assigned_role,
      progressId: pr.id,
      status: pr.status,
      requiredTotal: total,
      requiredDone: doneCount,
      pct,
      completedSopTitles,
      remainingSopTitles,
      sopRows,
    })
  }

  let sum = 0
  let n = 0
  for (const m of modules) {
    if (m.pct === null) continue
    sum += m.pct
    n += 1
  }
  const aggregatePct = n === 0 ? null : Math.round(sum / n)

  const readinessModules: ReadinessModuleInput[] = modules.map((m) => ({
    moduleId: m.moduleId,
    title: m.title,
    assignedRole: m.assignedRole,
    status: m.status,
    pct: m.pct,
    sopRows: m.sopRows.map((r) => ({
      title: r.title,
      completed: r.completed,
      standardCategory: r.standardCategory,
      standardId: r.standardId,
    })),
  }))

  const myObservations = observationRows
    .filter((o) => o.employee_id === profile.id)
    .sort((a, b) => b.observed_at.localeCompare(a.observed_at))

  const readiness = computeEmployeeReadiness({
    modules: readinessModules,
    completedShiftRuns,
    managerObservations: myObservations.map((o) => ({
      observation_type: o.observation_type,
      observed_at: o.observed_at,
    })),
    passedQuizStandardIds,
    certifiedModuleIds,
    managerSignedOffModuleIds,
    overrides: readinessOverridesFromRow(readinessRow),
  })

  const { certifications: certRows, certifiedBadges } = buildCertificationViews(
    profile.id,
    modulesById,
    certificationRows
  )

  const certByModule = new Map(certRows.map((c) => [c.moduleId, c]))
  const certifications: ModuleCertificationView[] = modules.map((mod) => {
    const existing = certByModule.get(mod.moduleId)
    if (existing) return existing
    return {
      moduleId: mod.moduleId,
      moduleTitle: mod.title,
      moduleCompleted: mod.status === "completed",
      quizzesPassed: false,
      managerSignedOff: false,
      certified: false,
      certifiedAt: null,
    }
  })

  return {
    profile,
    modules,
    aggregatePct,
    readiness,
    certifications,
    certifiedBadges,
    observations: myObservations.map((o) => ({
      id: o.id,
      type: o.observation_type,
      notes: o.notes,
      observedAt: o.observed_at,
      observerName: profileNameById.get(o.observed_by) ?? "Manager",
    })),
  }
}

export type { CapabilityReadiness, ComputedEmployeeReadiness }

export function countEmployeesEffectiveReady(
  profiles: { id: string }[],
  progressRows: Tables<"training_progress">[],
  modulesById: Map<string, TrainingModuleDeep>,
  completions: Tables<"employee_training_sop_completions">[],
  readinessRows: Tables<"employee_readiness">[],
  executionCounts: Map<string, number>,
  quizCompletions: Tables<"employee_standard_quiz_completions">[],
  certificationRows: Tables<"employee_module_certifications">[],
  observationRows: Tables<"employee_manager_observations">[] = [],
  profileNameById: Map<string, string> = new Map(),
  field: ReadinessCapabilityField = "train_others"
): number {
  let count = 0
  for (const profile of profiles) {
    const vm = buildEmployeeTrainingViewModel(
      profile as Tables<"profiles">,
      progressRows,
      modulesById,
      completions,
      readinessRows.find((r) => r.employee_id === profile.id),
      executionCounts.get(profile.id) ?? 0,
      quizCompletions,
      certificationRows,
      observationRows,
      profileNameById,
    )
    const cap = vm.readiness.capabilities.find((c) => c.field === field)
    if (cap?.effective === "ready") count += 1
  }
  return count
}
