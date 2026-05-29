import type { EmployeeTrainingViewModel } from "@/lib/training/build-views"
import {
  skillCellStatus,
  type MatrixCellStatus,
} from "@/lib/training/readiness-matrix/build-matrix"
import { moduleMatchesField } from "@/lib/training/training-center-summary"
import type { ReadinessCapabilityField } from "@/lib/training/compute-readiness"

export function relevantModulesForField(
  vm: EmployeeTrainingViewModel,
  field: ReadinessCapabilityField
) {
  return vm.modules.filter((m) =>
    moduleMatchesField(
      {
        title: m.title,
        assignedRole: m.assignedRole,
        sopRows: m.sopRows.map((r) => ({
          title: r.title,
          completed: r.completed,
          standardCategory: r.standardCategory,
          standardId: r.standardId,
        })),
      },
      field
    )
  )
}

export function employeeSkillStatus(
  vm: EmployeeTrainingViewModel | undefined,
  field: ReadinessCapabilityField
): MatrixCellStatus {
  if (!vm) return "not_assigned"
  const relevant = relevantModulesForField(vm, field)
  const cap = vm.readiness.capabilities.find((c) => c.field === field)
  const certifiedOnRelevant = relevant.some((m) =>
    vm.certifications.find((c) => c.moduleId === m.moduleId)?.certified
  )
  return skillCellStatus(
    relevant,
    cap?.score ?? 0,
    cap?.effective === "ready",
    certifiedOnRelevant
  )
}
