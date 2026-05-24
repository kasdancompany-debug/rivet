import type { OwnerInterruptionKind, Tables } from "@/types/database"

import type { OwnerInterruptionRepeatCategory } from "@/lib/owner-interruptions/types"
import type { InterruptionFixSuggestion, InterruptionFixType } from "./types"

const HISTORY_WINDOW_DAYS = 14
const MONTHLY_MULTIPLIER = 30 / HISTORY_WINDOW_DAYS
const PREVENTION_RATE = 0.7

function normalizeSummaryKey(summary: string): string {
  return summary.trim().toLowerCase().replace(/\s+/g, " ")
}

function dominantKind(
  rows: Tables<"owner_interruptions">[]
): OwnerInterruptionKind | null {
  const counts = new Map<OwnerInterruptionKind, number>()
  for (const r of rows) {
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)
  }
  let best: OwnerInterruptionKind | null = null
  let bestN = 0
  for (const [kind, n] of counts) {
    if (n > bestN) {
      best = kind
      bestN = n
    }
  }
  return best
}

type RootCauseResult = {
  rootCause: string
  fixType: InterruptionFixType
  suggestedTitle: string
  suggestedDescription: string
  capturePrompt: string
}

function detectRootCause(
  label: string,
  kind: OwnerInterruptionKind | null,
  rows: Tables<"owner_interruptions">[]
): RootCauseResult {
  const lower = label.toLowerCase()
  const detailText = rows
    .map((r) => r.detail?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const trainingSignals =
    /\btrain(ing|ed)?\b|\bnew hire\b|\bdoesn'?t know\b|\bforgot\b|\bnever (learned|shown)\b|\bonboard/.test(
      `${lower} ${detailText}`
    )
  const approvalSignals = kind === "approval_request" || /\bapprov|\bcomp\b|\bdiscount|\brefund|\bexception/.test(lower)
  const judgmentSignals =
    kind === "judgment_call" || /\bjudgment|\bdecide|\bwhat should|\bhow (much|many)|\bpolicy/.test(lower)
  const issueSignals = kind === "unresolved_issue" || /\bbroken|\bout of|\bdown|\bcan'?t find/.test(lower)

  if (trainingSignals) {
    return {
      rootCause: "The team lacks a repeatable reference—knowledge still lives with you.",
      fixType: "training_module",
      suggestedTitle: titleFromLabel(label, "Training"),
      suggestedDescription: `Teach the floor how to handle “${label}” without routing back to the owner.`,
      capturePrompt: `Team keeps asking about: ${label}. Write a short training module so they can run this without calling the owner.`,
    }
  }

  if (approvalSignals) {
    return {
      rootCause: "No written approval threshold—every exception routes to the owner.",
      fixType: "sop",
      suggestedTitle: titleFromLabel(label, "Approval play"),
      suggestedDescription: `Document who can approve “${label}”, dollar limits, and when to escalate.`,
      capturePrompt: `This keeps routing to the owner: ${label}. Write an approval play with limits, who can sign off, and when to escalate.`,
    }
  }

  if (judgmentSignals) {
    return {
      rootCause: "Judgment calls are undocumented—the team waits for your answer.",
      fixType: "sop",
      suggestedTitle: titleFromLabel(label, "Decision play"),
      suggestedDescription: `Turn “${label}” into a decision tree the shift can run alone.`,
      capturePrompt: `Staff keeps asking the owner: ${label}. Write a decision play with triggers, options, and who owns the call.`,
    }
  }

  if (issueSignals) {
    return {
      rootCause: "A recurring floor issue has no owned fix—the team escalates instead of resolving.",
      fixType: "sop",
      suggestedTitle: titleFromLabel(label, "Recovery play"),
      suggestedDescription: `Document how to handle “${label}” on the floor before it reaches you.`,
      capturePrompt: `This issue keeps pulling the owner in: ${label}. Write a recovery play with steps, owner, and escalation only when needed.`,
    }
  }

  if (kind === "staff_ping") {
    return {
      rootCause: "Answers are not findable—staff ping you because nothing is written down.",
      fixType: "sop",
      suggestedTitle: titleFromLabel(label, "Standard"),
      suggestedDescription: `Capture how “${label}” should run so the team stops texting you.`,
      capturePrompt: `Same question keeps coming to the owner: ${label}. Write a playable standard the shift can follow without asking.`,
    }
  }

  return {
    rootCause: "The system is unfinished—this decision or procedure still defaults to you.",
    fixType: "sop",
    suggestedTitle: titleFromLabel(label, "Play"),
    suggestedDescription: `Document “${label}” so the business stops routing it back to you.`,
    capturePrompt: `This pattern keeps repeating: ${label}. Write a play the team can run without pulling the owner.`,
  }
}

function titleFromLabel(label: string, fallback: string): string {
  const trimmed = label.trim()
  if (trimmed.length >= 4 && trimmed.length <= 72) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  }
  return fallback
}

function buildCreateHref(
  fixType: InterruptionFixType,
  suggestedTitle: string,
  suggestedDescription: string,
  capturePrompt: string
): string {
  const params = new URLSearchParams()
  if (fixType === "training_module") {
    params.set("title", suggestedTitle)
    if (suggestedDescription) params.set("description", suggestedDescription)
    return `/training/modules/new?${params.toString()}`
  }
  params.set("title", suggestedTitle)
  params.set("prompt", capturePrompt)
  return `/sops/capture?${params.toString()}`
}

function estimateImpact(count: number, totalMinutes: number): {
  estimatedInterruptionsPrevented: number
  estimatedOwnerMinutesRecovered: number
} {
  const monthlyOccurrences = count * MONTHLY_MULTIPLIER
  const estimatedInterruptionsPrevented = Math.max(1, Math.round(monthlyOccurrences * PREVENTION_RATE))
  const avgMinutes = count > 0 ? totalMinutes / count : 8
  const estimatedOwnerMinutesRecovered = Math.round(estimatedInterruptionsPrevented * avgMinutes)
  return { estimatedInterruptionsPrevented, estimatedOwnerMinutesRecovered }
}

export function generateInterruptionFixSuggestions(input: {
  repeatCategories: OwnerInterruptionRepeatCategory[]
  historyRows: Tables<"owner_interruptions">[]
  maxSuggestions?: number
}): InterruptionFixSuggestion[] {
  const max = input.maxSuggestions ?? 3
  const suggestions: InterruptionFixSuggestion[] = []

  for (const pattern of input.repeatCategories) {
    const matching = input.historyRows.filter(
      (r) => normalizeSummaryKey(r.summary) === pattern.key
    )
    if (matching.length < 2) continue

    const kind = dominantKind(matching)
    const totalMinutes = matching.reduce((s, r) => s + (r.estimated_minutes ?? 0), 0)
    const analysis = detectRootCause(pattern.label, kind, matching)
    const impact = estimateImpact(pattern.count, totalMinutes)

    suggestions.push({
      patternKey: pattern.key,
      problemTitle: pattern.label,
      rootCause: analysis.rootCause,
      fixType: analysis.fixType,
      suggestedTitle: analysis.suggestedTitle,
      suggestedDescription: analysis.suggestedDescription,
      capturePrompt: analysis.capturePrompt,
      repeatCount: pattern.count,
      ...impact,
      createHref: buildCreateHref(
        analysis.fixType,
        analysis.suggestedTitle,
        analysis.suggestedDescription,
        analysis.capturePrompt
      ),
    })
  }

  return suggestions
    .sort((a, b) => b.repeatCount - a.repeatCount || b.estimatedOwnerMinutesRecovered - a.estimatedOwnerMinutesRecovered)
    .slice(0, max)
}
