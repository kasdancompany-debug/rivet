import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  CircleHelp,
  MessageCircle,
  PhoneForwarded,
  Stamp,
} from "lucide-react"

import type {
  OwnerInterruptionKind,
  OwnerInterruptionSeverity,
  OwnerInterruptionSource,
  OwnerInterruptionUrgency,
} from "@/types/database"
import { labelForOwnerInterruptionKind } from "@/lib/owner-interruptions/kinds"
import { computeInterruptionSeverity } from "@/lib/owner-interruptions/severity/compute-severity"
import { labelForOwnerInterruptionSeverity } from "@/lib/owner-interruptions/severity/severities"
import { labelForOwnerInterruptionSource } from "@/lib/owner-interruptions/sources"

export type InterruptionStarterExample = {
  kind: OwnerInterruptionKind
  kindLabel: string
  summary: string
  estimatedMinutes: number
  urgency: OwnerInterruptionUrgency
  source: OwnerInterruptionSource
  sourceLabel: string
  severity: OwnerInterruptionSeverity
  severityLabel: string
  icon: LucideIcon
}

const ICONS: Record<OwnerInterruptionKind, LucideIcon> = {
  staff_ping: MessageCircle,
  approval_request: Stamp,
  judgment_call: CircleHelp,
  unresolved_issue: AlertTriangle,
  owner_escalation: PhoneForwarded,
}

function example(input: {
  kind: OwnerInterruptionKind
  summary: string
  estimatedMinutes: number
  urgency: OwnerInterruptionUrgency
  source: OwnerInterruptionSource
}): InterruptionStarterExample {
  const severity = computeInterruptionSeverity({
    estimatedMinutes: input.estimatedMinutes,
    urgency: input.urgency,
    frequencyCount: 1,
  })
  return {
    kind: input.kind,
    kindLabel: labelForOwnerInterruptionKind(input.kind),
    summary: input.summary,
    estimatedMinutes: input.estimatedMinutes,
    urgency: input.urgency,
    source: input.source,
    sourceLabel: labelForOwnerInterruptionSource(input.source),
    severity: severity.severity,
    severityLabel: labelForOwnerInterruptionSeverity(severity.severity),
    icon: ICONS[input.kind],
  }
}

export const INTERRUPTION_STARTER_EXAMPLES: InterruptionStarterExample[] = [
  example({
    kind: "approval_request",
    summary: "Approve comp for call-out",
    estimatedMinutes: 8,
    urgency: "can_wait",
    source: "text_message",
  }),
  example({
    kind: "staff_ping",
    summary: "Where is the opening checklist?",
    estimatedMinutes: 4,
    urgency: "today",
    source: "slack",
  }),
  example({
    kind: "judgment_call",
    summary: "Guest wants exception to refund policy",
    estimatedMinutes: 12,
    urgency: "time_sensitive",
    source: "in_person",
  }),
  example({
    kind: "unresolved_issue",
    summary: "Walk-in cooler alarm—no one knows the code",
    estimatedMinutes: 15,
    urgency: "right_now",
    source: "phone_call",
  }),
  example({
    kind: "owner_escalation",
    summary: "Vendor invoice dispute needs your sign-off",
    estimatedMinutes: 10,
    urgency: "today",
    source: "email",
  }),
]

export function iconForInterruptionKind(kind: OwnerInterruptionKind): LucideIcon {
  return ICONS[kind]
}
