import {
  READINESS_READY_THRESHOLD,
  type ReadinessCapabilityField,
} from "@/lib/training/compute-readiness"
import type { EmployeeTrainingViewModel } from "@/lib/training/build-views"
import { employeeSkillStatus } from "@/lib/succession/skill-readiness"
import type { SuccessionRiskLevel } from "@/lib/succession/types"

export const SUCCESSION_RISK_LABELS: Record<SuccessionRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export function successionRiskClass(level: SuccessionRiskLevel): string {
  switch (level) {
    case "low":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
    case "medium":
      return "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-200"
    case "high":
      return "border-orange-500/40 bg-orange-500/10 text-orange-950 dark:text-orange-200"
    case "critical":
      return "border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-200"
  }
}

function personOverallReady(vm: EmployeeTrainingViewModel | undefined): boolean {
  if (!vm) return false
  return vm.readiness.overallScore >= READINESS_READY_THRESHOLD
}

function personCapabilityReady(
  vm: EmployeeTrainingViewModel | undefined,
  field: ReadinessCapabilityField | null
): boolean {
  if (!vm) return false
  if (!field) return personOverallReady(vm)
  return employeeSkillStatus(vm, field) === "ready"
}

export function computeSuccessionRisk(input: {
  primaryProfileId: string | null
  backupProfileId: string | null
  capabilityField: ReadinessCapabilityField | null
  vmById: Map<string, EmployeeTrainingViewModel>
}): { level: SuccessionRiskLevel; reason: string } {
  const { primaryProfileId, backupProfileId, capabilityField, vmById } = input

  if (!primaryProfileId) {
    return { level: "critical", reason: "No primary owner assigned." }
  }

  const primaryVm = vmById.get(primaryProfileId)
  const primaryReady = personCapabilityReady(primaryVm, capabilityField)

  if (!backupProfileId) {
    return primaryReady
      ? { level: "high", reason: "Primary is ready but no backup is named." }
      : { level: "critical", reason: "No backup owner and primary is not floor-ready." }
  }

  if (primaryProfileId === backupProfileId) {
    return { level: "critical", reason: "Primary and backup cannot be the same person." }
  }

  const backupVm = vmById.get(backupProfileId)
  const backupReady = personCapabilityReady(backupVm, capabilityField)

  if (primaryReady && backupReady) {
    return { level: "low", reason: "Primary and backup are floor-ready." }
  }
  if (primaryReady && !backupReady) {
    return { level: "medium", reason: "Primary is ready; backup still needs training." }
  }
  if (!primaryReady && backupReady) {
    return { level: "medium", reason: "Backup is ready; primary still needs training." }
  }
  return { level: "high", reason: "Neither primary nor backup is floor-ready yet." }
}
