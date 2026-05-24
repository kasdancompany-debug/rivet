import type { OwnerInterruptionSeverity } from "@/types/database"

export const OWNER_INTERRUPTION_SEVERITIES: OwnerInterruptionSeverity[] = [
  "small_pull",
  "medium_pull",
  "heavy_pull",
  "emergency",
]

export function labelForOwnerInterruptionSeverity(severity: OwnerInterruptionSeverity): string {
  switch (severity) {
    case "small_pull":
      return "Small pull"
    case "medium_pull":
      return "Medium pull"
    case "heavy_pull":
      return "Heavy pull"
    case "emergency":
      return "Emergency"
    default:
      return severity
  }
}

export function severityRank(severity: OwnerInterruptionSeverity): number {
  switch (severity) {
    case "small_pull":
      return 1
    case "medium_pull":
      return 2
    case "heavy_pull":
      return 3
    case "emergency":
      return 4
    default:
      return 0
  }
}

export function maxSeverity(
  a: OwnerInterruptionSeverity,
  b: OwnerInterruptionSeverity
): OwnerInterruptionSeverity {
  return severityRank(a) >= severityRank(b) ? a : b
}
