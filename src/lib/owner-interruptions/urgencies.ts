import type { OwnerInterruptionUrgency } from "@/types/database"

export const OWNER_INTERRUPTION_URGENCIES: OwnerInterruptionUrgency[] = [
  "can_wait",
  "today",
  "time_sensitive",
  "right_now",
]

export function isOwnerInterruptionUrgency(v: string): v is OwnerInterruptionUrgency {
  return (OWNER_INTERRUPTION_URGENCIES as string[]).includes(v)
}

export function labelForOwnerInterruptionUrgency(urgency: OwnerInterruptionUrgency): string {
  switch (urgency) {
    case "can_wait":
      return "Can wait"
    case "today":
      return "Today"
    case "time_sensitive":
      return "Time-sensitive"
    case "right_now":
      return "Right now"
    default:
      return urgency
  }
}

export function hintForOwnerInterruptionUrgency(urgency: OwnerInterruptionUrgency): string {
  switch (urgency) {
    case "can_wait":
      return "Can sit until you have a window"
    case "today":
      return "Needs an answer before close"
    case "time_sensitive":
      return "Blocks service or cash if you wait"
    case "right_now":
      return "Floor is stuck until you respond"
    default:
      return ""
  }
}
