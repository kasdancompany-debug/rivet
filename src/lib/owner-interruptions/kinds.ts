import type { OwnerInterruptionKind } from "@/types/database"

export const OWNER_INTERRUPTION_KINDS: OwnerInterruptionKind[] = [
  "staff_ping",
  "approval_request",
  "judgment_call",
  "unresolved_issue",
  "owner_escalation",
]

export function isOwnerInterruptionKind(v: string): v is OwnerInterruptionKind {
  return (OWNER_INTERRUPTION_KINDS as string[]).includes(v)
}

export function labelForOwnerInterruptionKind(kind: OwnerInterruptionKind): string {
  switch (kind) {
    case "staff_ping":
      return "Staff ping"
    case "approval_request":
      return "Approval"
    case "judgment_call":
      return "Judgment call"
    case "unresolved_issue":
      return "Unresolved issue"
    case "owner_escalation":
      return "Owner escalation"
    default:
      return kind
  }
}
