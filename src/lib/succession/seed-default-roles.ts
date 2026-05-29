import { TRAINING_ROLE_PRESETS } from "@/lib/training/roles"
import type { TrainingModuleDeep } from "@/lib/db/queries"
import type { ReadinessCapabilityField } from "@/lib/training/compute-readiness"

const CAPABILITY_BY_ROLE_KEY: Record<string, ReadinessCapabilityField> = {
  shift_lead: "open_alone",
  barista: "open_alone",
  front_counter: "handle_complaints",
  manager: "train_others",
}

export type SuccessionRoleSeed = {
  roleLabel: string
  capabilityField: ReadinessCapabilityField | null
  sortOrder: number
}

function labelFromAssignedRole(value: string | null): string | null {
  if (!value?.trim()) return null
  const preset = TRAINING_ROLE_PRESETS.find((p) => p.value === value)
  return preset?.label ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function buildDefaultSuccessionRoleSeeds(modules: TrainingModuleDeep[]): SuccessionRoleSeed[] {
  const seen = new Set<string>()
  const seeds: SuccessionRoleSeed[] = []
  let order = 0

  const add = (label: string, capabilityField: ReadinessCapabilityField | null) => {
    const key = label.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    seeds.push({ roleLabel: label.trim(), capabilityField, sortOrder: order++ })
  }

  add("Opening", "open_alone")
  add("Closing", "close_alone")
  add("Shift lead", "train_others")
  add("Customer recovery", "handle_complaints")

  for (const preset of TRAINING_ROLE_PRESETS) {
    add(preset.label, CAPABILITY_BY_ROLE_KEY[preset.value] ?? null)
  }

  for (const mod of modules) {
    const label = labelFromAssignedRole(mod.assigned_role)
    if (label) {
      add(label, mod.assigned_role ? CAPABILITY_BY_ROLE_KEY[mod.assigned_role] ?? null : null)
    }
  }

  return seeds
}
