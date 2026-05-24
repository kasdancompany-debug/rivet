import type { OwnerInterruptionSource } from "@/types/database"

export const OWNER_INTERRUPTION_SOURCES: OwnerInterruptionSource[] = [
  "text_message",
  "phone_call",
  "in_person",
  "slack",
  "email",
  "other",
]

export function isOwnerInterruptionSource(v: string): v is OwnerInterruptionSource {
  return (OWNER_INTERRUPTION_SOURCES as string[]).includes(v)
}

export function labelForOwnerInterruptionSource(source: OwnerInterruptionSource): string {
  switch (source) {
    case "text_message":
      return "Text message"
    case "phone_call":
      return "Phone call"
    case "in_person":
      return "In person"
    case "slack":
      return "Slack"
    case "email":
      return "Email"
    case "other":
      return "Other"
    default:
      return source
  }
}

export function sourceRank(source: OwnerInterruptionSource): number {
  return OWNER_INTERRUPTION_SOURCES.indexOf(source)
}
