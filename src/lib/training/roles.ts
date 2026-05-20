/** Suggested roles for training modules (`training_modules.assigned_role`). */
export const TRAINING_ROLE_PRESETS = [
  { value: "barista", label: "Barista" },
  { value: "donut_production", label: "Donut Production" },
  { value: "shift_lead", label: "Shift Lead" },
  { value: "front_counter", label: "Front Counter" },
  { value: "cleaner", label: "Cleaner" },
  { value: "manager", label: "Manager" },
] as const

export type TrainingRolePresetValue = (typeof TRAINING_ROLE_PRESETS)[number]["value"]

const LABEL_BY_VALUE = Object.fromEntries(
  TRAINING_ROLE_PRESETS.map((r) => [r.value, r.label])
) as Record<string, string>

export function formatTrainingRole(value: string | null): string {
  if (!value) return "General"
  return LABEL_BY_VALUE[value] ?? value.replace(/_/g, " ")
}
