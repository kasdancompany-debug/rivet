import type { OwnerInterruptionKind, Tables } from "@/types/database"

import type { InterruptionFixType } from "@/lib/owner-interruptions/fix-suggestions/types"
import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import type { AffectedPerson, InterruptionFixAnalysis, RelatedModuleRef, RelatedStandardRef } from "@/lib/owner-interruptions/action-plan/types"

export function titleFromLabel(label: string, fallback: string): string {
  const trimmed = label.trim()
  if (trimmed.length >= 4 && trimmed.length <= 72) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  }
  return fallback
}

export function detectInterruptionFix(
  label: string,
  kind: OwnerInterruptionKind | null,
  rows: Pick<Tables<"owner_interruptions">, "detail">[]
): Omit<InterruptionFixAnalysis, "repeatCount" | "inferredRoles"> {
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
    capturePrompt: `This pull landed on the owner: ${label}. Write a play the team can run without pulling the owner.`,
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3)
}

function scoreTextMatch(a: string, b: string): number {
  const tokensA = new Set(tokenize(a))
  let score = 0
  for (const t of tokenize(b)) {
    if (tokensA.has(t)) score += 1
  }
  return score
}

export function findRelatedStandard(
  standards: Tables<"standards">[],
  label: string
): RelatedStandardRef | null {
  let best: RelatedStandardRef | null = null
  let bestScore = 0
  for (const s of standards) {
    const score = scoreTextMatch(s.title, label)
    if (score > bestScore) {
      bestScore = score
      best = { id: s.id, title: s.title, status: s.status }
    }
  }
  return bestScore >= 2 ? best : null
}

export function findRelatedModule(
  modules: Tables<"training_modules">[],
  label: string
): RelatedModuleRef | null {
  let best: RelatedModuleRef | null = null
  let bestScore = 0
  for (const m of modules) {
    const score = scoreTextMatch(m.title, label)
    if (score > bestScore) {
      bestScore = score
      best = { id: m.id, title: m.title, assignedRole: m.assigned_role }
    }
  }
  return bestScore >= 2 ? best : null
}

function normalizeRole(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_")
}

export function inferRolesFromFix(
  fixType: InterruptionFixType,
  loggerRole: string | null,
  relatedModule: RelatedModuleRef | null
): string[] {
  const roles = new Set<string>()
  if (relatedModule?.assignedRole) roles.add(relatedModule.assignedRole)
  if (loggerRole?.trim()) roles.add(normalizeRole(loggerRole))
  if (fixType === "training_module" && roles.size === 0) roles.add("shift_lead")
  return [...roles]
}

export function resolveAffectedPeople(input: {
  profiles: Tables<"profiles">[]
  businessOwnerId: string
  loggerId: string
  loggerRole: string | null
  inferredRoles: string[]
}): AffectedPerson[] {
  const roleSet = new Set(input.inferredRoles.map(normalizeRole))
  const affected: AffectedPerson[] = []

  for (const p of input.profiles) {
    const role = p.role?.trim() || "member"
    const normalized = normalizeRole(role)
    const isLogger = p.id === input.loggerId
    const roleMatch = roleSet.size > 0 && roleSet.has(normalized)

    if (!isLogger && !roleMatch) continue

    affected.push({
      profileId: p.id,
      name: p.full_name?.trim() || "Team member",
      role,
      reason: isLogger
        ? "Logged this pull"
        : roleMatch
          ? "Role matches the fix"
          : "On the roster",
    })
  }

  if (affected.length === 0 && input.loggerId) {
    const logger = input.profiles.find((p) => p.id === input.loggerId)
    if (logger) {
      affected.push({
        profileId: logger.id,
        name: logger.full_name?.trim() || "Team member",
        role: logger.role?.trim() || "member",
        reason: "Logged this pull",
      })
    }
  }

  return affected.slice(0, 8)
}

export function analyzeInterruptionForActionPlan(input: {
  interruption: Tables<"owner_interruptions">
  historyRows: Tables<"owner_interruptions">[]
  standards: Tables<"standards">[]
  modules: Tables<"training_modules">[]
  loggerProfile: Pick<Tables<"profiles">, "id" | "role"> | null
}): InterruptionFixAnalysis & {
  relatedStandard: RelatedStandardRef | null
  relatedModule: RelatedModuleRef | null
} {
  const label = input.interruption.summary.trim()
  const key = normalizeSummaryKey(label)
  const matching = input.historyRows.filter((r) => normalizeSummaryKey(r.summary) === key)
  const repeatCount = Math.max(1, matching.length)
  const fix = detectInterruptionFix(label, input.interruption.kind, matching.length ? matching : [input.interruption])
  const relatedStandard = findRelatedStandard(input.standards, label)
  const relatedModule = findRelatedModule(input.modules, label)
  const inferredRoles = inferRolesFromFix(fix.fixType, input.loggerProfile?.role ?? null, relatedModule)

  return {
    ...fix,
    repeatCount,
    inferredRoles,
    relatedStandard,
    relatedModule,
  }
}
