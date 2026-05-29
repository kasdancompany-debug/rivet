import { isIssueUnresolved } from "@/lib/issues/constants"
import type { RivetIndexComputeContext } from "@/lib/rivet-score/compute"
import type { Tables } from "@/types/database"

import type {
  EscapeAbsenceSimulationContext,
  EscapeReadinessFactorInput,
  EscapeReadinessView,
} from "@/lib/escape-readiness/types"

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

export function buildSimulationContextFromCompute(
  ctx: RivetIndexComputeContext,
  options?: {
    openIssueTitles?: string[]
    thinSopTitles?: string[]
    interruptSummaries?: string[]
  }
): EscapeAbsenceSimulationContext {
  const activeSops = ctx.standards.filter((s) => s.status === "active")
  const thinSops = activeSops.filter((s) => (ctx.stepCountBySopId.get(s.id) ?? 0) < 1)
  const openIssues = ctx.bottlenecks.filter((i) => isIssueUnresolved(i.status))
  const ownerIssues = openIssues.filter((i) => i.owner_required)

  return {
    activeSopCount: activeSops.length,
    thinSopCount: thinSops.length,
    thinSopTitles: options?.thinSopTitles ?? thinSops.slice(0, 3).map((s) => s.title),
    trainingCompletionPercent: ctx.staffReadinessPercent ?? ctx.trainingProgressPercent,
    incompleteTrainingCount: ctx.trainingIncompleteCount,
    openIssueCount: openIssues.length,
    ownerRequiredIssueCount: ownerIssues.length,
    openIssueTitles:
      options?.openIssueTitles ?? openIssues.slice(0, 3).map((i) => i.title),
    weeklyInterruptCount: ctx.ownerInterruptionsThisWeekCount,
    interruptSummaries: options?.interruptSummaries ?? [],
    teamSize: ctx.teamProfileCount,
    staffWithIncompleteTraining: Math.max(0, ctx.trainingIncompleteCount),
    unverifiedAskCount: 0,
    unverifiedAskQuestions: [],
    teamReadinessPercent: ctx.staffReadinessPercent ?? ctx.trainingProgressPercent,
  }
}

export function buildSimulationContextFromView(
  view: Pick<EscapeReadinessView, "score" | "factors" | "biggestRisk"> & {
    riskContext?: { ownerInterruptionsThisWeekCount?: number; openIssuesCount?: number }
  }
): EscapeAbsenceSimulationContext {
  const score = view.score ?? 50
  const interruptFactor = view.factors.find((f) => f.id === "owner_interruptions")
  const sopFactor = view.factors.find((f) => f.id === "sop_coverage")
  const trainingFactor = view.factors.find((f) => f.id === "training_coverage")
  const issueFactor = view.factors.find((f) => f.id === "unresolved_issues")

  const weeklyInterrupts =
    view.riskContext?.ownerInterruptionsThisWeekCount ??
    estimateWeeklyInterrupts(interruptFactor?.percent ?? null)
  const openIssues =
    view.riskContext?.openIssuesCount ?? estimateOpenIssues(issueFactor?.percent ?? null)

  return {
    activeSopCount: estimateSopCount(sopFactor?.percent ?? null),
    thinSopCount: estimateThinSops(sopFactor?.percent ?? null),
    thinSopTitles: thinSopTitlesFromHealth(sopFactor?.percent ?? null),
    trainingCompletionPercent: trainingFactor?.percent ?? null,
    incompleteTrainingCount: estimateIncompleteTraining(trainingFactor?.percent ?? null),
    openIssueCount: openIssues,
    ownerRequiredIssueCount: Math.max(1, Math.round(openIssues * 0.4)),
    openIssueTitles: openIssueTitlesFromHealth(issueFactor?.percent ?? null, openIssues),
    weeklyInterruptCount: weeklyInterrupts,
    interruptSummaries: interruptSummariesFromHealth(interruptFactor?.percent ?? null),
    teamSize: estimateTeamSize(score),
    staffWithIncompleteTraining: estimateIncompleteTraining(trainingFactor?.percent ?? null),
    unverifiedAskCount: 0,
    unverifiedAskQuestions: [],
    teamReadinessPercent: trainingFactor?.percent ?? null,
  }
}

function estimateWeeklyInterrupts(percent: number | null): number {
  if (percent == null) return 8
  const risk = 100 - percent
  if (risk >= 70) return 18
  if (risk >= 55) return 12
  if (risk >= 40) return 8
  return 4
}

function estimateOpenIssues(percent: number | null): number {
  if (percent == null) return 3
  if (percent <= 25) return 10
  if (percent <= 40) return 6
  if (percent <= 60) return 3
  return 1
}

function estimateSopCount(percent: number | null): number {
  if (percent == null) return 4
  return clamp(Math.round(4 + (percent / 100) * 12), 2, 20)
}

function estimateThinSops(percent: number | null): number {
  if (percent == null) return 3
  return clamp(Math.round((100 - percent) / 12), 1, 8)
}

function estimateIncompleteTraining(percent: number | null): number {
  if (percent == null) return 4
  return clamp(Math.round((100 - percent) / 8), 1, 12)
}

function estimateTeamSize(score: number): number {
  return clamp(Math.round(6 + score / 15), 4, 24)
}

function thinSopTitlesFromHealth(percent: number | null): string[] {
  if (percent == null || percent >= 75) return ["Opening checklist"]
  if (percent >= 50) return ["Opening checklist", "Vendor exception handling"]
  return ["Opening checklist", "Closing cash-out", "Rush-week handoff"]
}

function openIssueTitlesFromHealth(percent: number | null, count: number): string[] {
  const templates = [
    "Repeat mistake on line setup",
    "Vendor callback unresolved",
    "Customer complaint still open",
  ]
  return templates.slice(0, Math.min(count, 3))
}

function interruptSummariesFromHealth(percent: number | null): string[] {
  if (percent == null || percent >= 70) return ["Pricing exception"]
  if (percent >= 45) return ["Pricing exception", "Staff escalation texts"]
  return ["Pricing exception", "Staff escalation texts", "Vendor approval walk-up"]
}

export function mergeSimulationContext(
  primary: EscapeAbsenceSimulationContext | null | undefined,
  fallback: EscapeAbsenceSimulationContext
): EscapeAbsenceSimulationContext {
  if (!primary) return fallback
  return {
    ...fallback,
    ...primary,
    thinSopTitles: primary.thinSopTitles.length > 0 ? primary.thinSopTitles : fallback.thinSopTitles,
    openIssueTitles:
      primary.openIssueTitles.length > 0 ? primary.openIssueTitles : fallback.openIssueTitles,
    interruptSummaries:
      primary.interruptSummaries.length > 0
        ? primary.interruptSummaries
        : fallback.interruptSummaries,
    unverifiedAskQuestions:
      primary.unverifiedAskQuestions.length > 0
        ? primary.unverifiedAskQuestions
        : fallback.unverifiedAskQuestions,
  }
}

export function enrichSimulationContext(
  ctx: EscapeAbsenceSimulationContext,
  options?: {
    unverifiedAskQuestions?: { question: string; count: number }[]
    teamReadinessPercent?: number | null
  }
): EscapeAbsenceSimulationContext {
  const askRows = options?.unverifiedAskQuestions ?? []
  const teamReadiness =
    options?.teamReadinessPercent !== undefined
      ? options.teamReadinessPercent
      : ctx.teamReadinessPercent

  return {
    ...ctx,
    unverifiedAskCount: askRows.length > 0 ? askRows.length : ctx.unverifiedAskCount,
    unverifiedAskQuestions:
      askRows.length > 0
        ? askRows.map((row) => row.question).slice(0, 5)
        : ctx.unverifiedAskQuestions,
    teamReadinessPercent: teamReadiness,
  }
}

export function extractSimulationContextFromIssues(
  bottlenecks: Tables<"bottlenecks">[]
): Pick<EscapeAbsenceSimulationContext, "openIssueTitles"> {
  return {
    openIssueTitles: bottlenecks
      .filter((i) => isIssueUnresolved(i.status))
      .slice(0, 3)
      .map((i) => i.title),
  }
}

export function extractSimulationContextFromInterruptions(
  rows: { summary: string | null }[]
): Pick<EscapeAbsenceSimulationContext, "interruptSummaries"> {
  return {
    interruptSummaries: rows
      .map((r) => r.summary?.trim())
      .filter((s): s is string => Boolean(s))
      .slice(0, 3),
  }
}

export function extractSimulationContextFromSops(
  standards: Tables<"standards">[],
  stepCountBySopId: Map<string, number>
): Pick<EscapeAbsenceSimulationContext, "thinSopTitles"> {
  return {
    thinSopTitles: standards
      .filter((s) => s.status === "active" && (stepCountBySopId.get(s.id) ?? 0) < 1)
      .slice(0, 3)
      .map((s) => s.title),
  }
}

export function simulationContextFromFactors(
  factors: EscapeReadinessFactorInput[],
  score: number | null,
  riskContext?: { ownerInterruptionsThisWeekCount?: number; openIssuesCount?: number }
): EscapeAbsenceSimulationContext {
  return buildSimulationContextFromView({
    score,
    factors: factors as EscapeReadinessView["factors"],
    biggestRisk: null,
    riskContext,
  })
}
