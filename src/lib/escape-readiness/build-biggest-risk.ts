import type {
  EscapeReadinessBiggestRisk,
  EscapeReadinessFactorInput,
  EscapeReadinessFactorId,
  EscapeRiskSeverity,
} from "@/lib/escape-readiness/types"

export type EscapeBiggestRiskContext = {
  ownerInterruptionsThisWeekCount?: number
  openIssuesCount?: number
}

export const BIGGEST_RISK_TITLE = "Tomorrow without you"

const FUTURE_STATE_BY_FACTOR: Record<
  EscapeReadinessFactorId,
  { lead: [string, string]; consequence: string }
> = {
  sop_coverage: {
    lead: ["Opening runs from memory", "Questions route back to staff phones"],
    consequence: "Customer-facing mistakes become likely",
  },
  training_coverage: {
    lead: ["Trained tasks stall on judgment calls", "New hires hunt the floor instead of the checklist"],
    consequence: "Quality slips show up before you return",
  },
  unresolved_issues: {
    lead: ["Open issues stack with no owner", "Repeat mistakes recycle without a fix"],
    consequence: "Small fires become all-day escalations",
  },
  owner_interruptions: {
    lead: ["Texts and walk-ups stack within the first shift", "Questions route back to staff phones"],
    consequence: "The floor stalls until you answer",
  },
  undocumented_procedures: {
    lead: ["Mid-shift gaps surface with no written path", "Staff improvise when the playbook is missing"],
    consequence: "Customer-facing mistakes become likely",
  },
}

function severityFromWeakestPercent(percent: number): {
  severity: EscapeRiskSeverity
  label: string
  indicatorPercent: number
} {
  if (percent <= 25) {
    return { severity: "critical", label: "Critical", indicatorPercent: 94 }
  }
  if (percent <= 40) {
    return { severity: "high", label: "High", indicatorPercent: 78 }
  }
  if (percent <= 55) {
    return { severity: "elevated", label: "Elevated", indicatorPercent: 62 }
  }
  return { severity: "moderate", label: "Moderate", indicatorPercent: 46 }
}

function estimateWeeklyPulls(interruptFactorPercent: number | null, knownCount?: number): number {
  if (knownCount != null && knownCount > 0) return knownCount
  if (interruptFactorPercent == null) return 8
  const risk = 100 - interruptFactorPercent
  if (risk >= 70) return 18
  if (risk >= 55) return 14
  if (risk >= 40) return 10
  if (risk >= 25) return 6
  return 3
}

export function formatInterruptionFutureLine(low: number, high: number): string {
  if (low === high) return `${low} interruptions expected within 48 hours`
  return `${low}–${high} interruptions expected within 48 hours`
}

export function estimateAbsenceInterruptions(
  weeklyPulls: number,
  interruptFactorPercent: number | null
): EscapeReadinessBiggestRisk["estimatedInterruptions"] {
  const health = interruptFactorPercent ?? 50
  const stress = 1 + (100 - health) / 180
  const first48h = weeklyPulls * (2 / 7) * stress * 2.1
  const low = Math.max(1, Math.round(first48h * 0.85))
  const high = Math.max(low + 1, Math.round(first48h * 1.15))
  const count = Math.round((low + high) / 2)

  return {
    count,
    low,
    high,
    periodLabel: "within 48 hours",
    label: formatInterruptionFutureLine(low, high),
  }
}

function buildFutureStateLines(
  primary: EscapeReadinessFactorInput & { percent: number },
  interruptions: EscapeReadinessBiggestRisk["estimatedInterruptions"],
  ctx: EscapeBiggestRiskContext
): string[] {
  const copy = FUTURE_STATE_BY_FACTOR[primary.id]
  const firstLine =
    primary.id === "unresolved_issues" && ctx.openIssuesCount != null && ctx.openIssuesCount > 0
      ? `${ctx.openIssuesCount} open issue(s) wait with no owner`
      : copy.lead[0]

  return [firstLine, copy.lead[1], interruptions.label, copy.consequence]
}

export function buildBiggestRisk(
  factors: EscapeReadinessFactorInput[],
  ctx: EscapeBiggestRiskContext = {}
): EscapeReadinessBiggestRisk | null {
  const scored = factors.filter((f) => f.percent != null) as (EscapeReadinessFactorInput & { percent: number })[]
  if (scored.length === 0) return null

  scored.sort((a, b) => a.percent - b.percent)
  const weakest = scored[0]!
  const interruptFactor = factors.find((f) => f.id === "owner_interruptions")
  const weeklyPulls = estimateWeeklyPulls(interruptFactor?.percent ?? null, ctx.ownerInterruptionsThisWeekCount)
  const severity = severityFromWeakestPercent(weakest.percent)
  const estimatedInterruptions = estimateAbsenceInterruptions(weeklyPulls, interruptFactor?.percent ?? null)

  return {
    factorId: weakest.id,
    title: BIGGEST_RISK_TITLE,
    detail: weakest.hint,
    futureStateLines: buildFutureStateLines(weakest, estimatedInterruptions, ctx),
    estimatedInterruptions,
    severity: severity.severity,
    severityLabel: severity.label,
    severityPercent: severity.indicatorPercent,
  }
}
