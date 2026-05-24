import type { Tables } from "@/types/database"

import { formatIssueCategory } from "@/lib/issues/constants"
import {
  findRelatedModule,
  findRelatedStandard,
  titleFromLabel,
} from "@/lib/owner-interruptions/action-plan/analyze-interruption"
import {
  countSimilarIssuesInWindow,
  normalizeIssueTitle,
} from "@/lib/issues/pain-score/compute-pain-score"
import type { IssueFixRecommendation, IssueSuggestedOwner } from "@/lib/issues/fix-recommendation/types"

export const ISSUE_REPEAT_FIX_THRESHOLD = 2

function normalizeRole(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_")
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function estimateRepeatReduction(input: {
  repeatCount: number
  hasPlay: boolean
  hasTraining: boolean
  ownerRequired: boolean
}): number {
  let pct = 28 + (input.repeatCount - ISSUE_REPEAT_FIX_THRESHOLD) * 14
  if (input.hasPlay && input.hasTraining) pct += 16
  else if (input.hasPlay || input.hasTraining) pct += 8
  if (!input.ownerRequired) pct += 6
  return clamp(Math.round(pct), 25, 85)
}

function resolveSuggestedOwner(input: {
  matches: Pick<Tables<"bottlenecks">, "reported_by">[]
  profiles: Tables<"profiles">[]
  businessOwnerId: string
  ownerRequired: boolean
}): IssueSuggestedOwner | null {
  if (input.ownerRequired) {
    const owner = input.profiles.find((p) => p.id === input.businessOwnerId)
    if (owner) {
      return {
        profileId: owner.id,
        name: owner.full_name?.trim() || "Owner",
        role: owner.role?.trim() || "owner",
      }
    }
  }

  const counts = new Map<string, number>()
  for (const row of input.matches) {
    counts.set(row.reported_by, (counts.get(row.reported_by) ?? 0) + 1)
  }

  let bestId = ""
  let bestCount = 0
  for (const [id, count] of counts) {
    if (count > bestCount) {
      bestCount = count
      bestId = id
    }
  }

  const reporter = input.profiles.find((p) => p.id === bestId)
  if (reporter) {
    return {
      profileId: reporter.id,
      name: reporter.full_name?.trim() || "Team member",
      role: reporter.role?.trim() || "member",
    }
  }

  const shiftLead = input.profiles.find((p) => normalizeRole(p.role ?? "") === "shift_lead")
  if (shiftLead) {
    return {
      profileId: shiftLead.id,
      name: shiftLead.full_name?.trim() || "Shift lead",
      role: shiftLead.role?.trim() || "shift_lead",
    }
  }

  return null
}

function buildFixContent(input: {
  issue: Pick<Tables<"bottlenecks">, "title" | "category" | "description">
  repeatCount: number
}): Pick<
  IssueFixRecommendation,
  "suggestedPlay" | "suggestedTraining" | "primaryFixType" | "capturePrompt" | "rootCause"
> {
  const label = input.issue.title.trim()
  const categoryLabel = formatIssueCategory(input.issue.category)
  const detail = input.issue.description?.trim() ?? ""
  const lower = `${label} ${detail}`.toLowerCase()

  const trainingHeavy =
    input.issue.category === "staff_question" ||
    /\btrain(ing|ed)?\b|\bnew hire\b|\bdoesn'?t know\b|\bonboard/.test(lower)

  const playTitle = titleFromLabel(label, `${categoryLabel} play`)
  const trainingTitle = titleFromLabel(`Train: ${label}`, "Training module")

  const suggestedPlay = {
    title: playTitle,
    description: `Document how to handle “${label}” on the floor before it routes back to you.`,
  }

  const suggestedTraining = {
    title: trainingTitle,
    description: `Teach the team the standard response for “${label}” so repeats drop.`,
  }

  if (trainingHeavy) {
    return {
      rootCause: "Knowledge is still tribal—same issue keeps getting logged without a reference.",
      suggestedPlay,
      suggestedTraining,
      primaryFixType: "training_module",
      capturePrompt: `This issue repeated ${input.repeatCount} times: ${label}. Write a training module and quick reference play so the shift can handle it without escalation.`,
    }
  }

  if (input.issue.category === "customer_complaint") {
    return {
      rootCause: "Guest exceptions lack a written recovery path—every repeat lands on you.",
      suggestedPlay: {
        title: titleFromLabel(label, "Guest recovery play"),
        description: `Spell out triggers, comps, and escalation for “${label}”.`,
      },
      suggestedTraining,
      primaryFixType: "sop",
      capturePrompt: `Customer issue repeated ${input.repeatCount} times: ${label}. Write a recovery play with limits and when to escalate.`,
    }
  }

  if (input.issue.category === "equipment" || input.issue.category === "inventory") {
    return {
      rootCause: "No owned recovery steps—equipment or stock issues keep reopening.",
      suggestedPlay: {
        title: titleFromLabel(label, "Recovery play"),
        description: `Checklist for “${label}”: detect, fix, fallback, and when to ping the owner.`,
      },
      suggestedTraining: null,
      primaryFixType: "sop",
      capturePrompt: `Repeat ${input.issue.category} issue (${input.repeatCount}x): ${label}. Write a recovery play the shift can run without calling the owner.`,
    }
  }

  if (input.issue.category === "scheduling") {
    return {
      rootCause: "Schedule gaps are undocumented—confusion keeps cycling back.",
      suggestedPlay: {
        title: titleFromLabel(label, "Scheduling play"),
        description: `Who owns “${label}”, backup coverage, and when to escalate.`,
      },
      suggestedTraining: null,
      primaryFixType: "sop",
      capturePrompt: `Scheduling issue repeated ${input.repeatCount} times: ${label}. Write a scheduling play with owners and backup rules.`,
    }
  }

  return {
    rootCause: "The system is unfinished—this keeps getting logged because nothing is written down.",
    suggestedPlay,
    suggestedTraining: input.repeatCount >= 3 ? suggestedTraining : null,
    primaryFixType: "sop",
    capturePrompt: `This issue repeated ${input.repeatCount} times: ${label}. Write a play the team can follow without reopening it.`,
  }
}

export function analyzeIssueFixRecommendation(input: {
  issue: Tables<"bottlenecks">
  history: Tables<"bottlenecks">[]
  profiles: Tables<"profiles">[]
  standards: Tables<"standards">[]
  modules: Tables<"training_modules">[]
  businessOwnerId: string
}): IssueFixRecommendation {
  const repeatCount = countSimilarIssuesInWindow(input.history, input.issue)
  const isRepeated = repeatCount >= ISSUE_REPEAT_FIX_THRESHOLD

  if (!isRepeated) {
    return {
      isRepeated: false,
      repeatCount,
      rootCause: "",
      suggestedPlay: null,
      suggestedTraining: null,
      suggestedOwner: null,
      estimatedRepeatReductionPercent: 0,
      primaryFixType: "sop",
      capturePrompt: "",
      relatedPlayTitle: null,
      relatedTrainingTitle: null,
    }
  }

  const matches = input.history.filter(
    (row) =>
      normalizeIssueTitle(row.title) === normalizeIssueTitle(input.issue.title) &&
      new Date(row.created_at).getTime() >=
        new Date(input.issue.created_at).getTime() - 30 * 24 * 60 * 60 * 1000
  )

  const fix = buildFixContent({ issue: input.issue, repeatCount })
  const relatedStandard = findRelatedStandard(input.standards, input.issue.title)
  const relatedModule = findRelatedModule(input.modules, input.issue.title)
  const suggestedOwner = resolveSuggestedOwner({
    matches: matches.length > 0 ? matches : [input.issue],
    profiles: input.profiles,
    businessOwnerId: input.businessOwnerId,
    ownerRequired: input.issue.owner_required,
  })

  return {
    isRepeated: true,
    repeatCount,
    rootCause: fix.rootCause,
    suggestedPlay: fix.suggestedPlay,
    suggestedTraining: fix.suggestedTraining,
    suggestedOwner,
    estimatedRepeatReductionPercent: estimateRepeatReduction({
      repeatCount,
      hasPlay: fix.suggestedPlay != null,
      hasTraining: fix.suggestedTraining != null,
      ownerRequired: input.issue.owner_required,
    }),
    primaryFixType: fix.primaryFixType,
    capturePrompt: fix.capturePrompt,
    relatedPlayTitle: relatedStandard?.title ?? null,
    relatedTrainingTitle: relatedModule?.title ?? null,
  }
}
