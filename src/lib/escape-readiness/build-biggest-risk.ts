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

const RISK_TITLE: Record<EscapeReadinessFactorId, string> = {
  sop_coverage: "SOP coverage is thin",
  training_coverage: "Training coverage is incomplete",
  unresolved_issues: "Too many unresolved issues",
  owner_interruptions: "Too much still routes back to you",
  undocumented_procedures: "Too much still undocumented",
}

const DISAPPEARING_TOMORROW: Record<EscapeReadinessFactorId, string> = {
  sop_coverage:
    "If you disappeared tomorrow, opening and close would run on memory—one missed step becomes a customer-visible mistake before noon.",
  training_coverage:
    "If you disappeared tomorrow, trained tasks would stall on judgment calls—staff would hunt you instead of the checklist.",
  unresolved_issues:
    "If you disappeared tomorrow, open issues would stack with no owner—small fires become all-day escalations by day two.",
  owner_interruptions:
    "If you disappeared tomorrow, staff would flood your phone before close—every ambiguous call would pause the floor.",
  undocumented_procedures:
    "If you disappeared tomorrow, mid-shift gaps would surface fast—plays that live only in your head would not run without you.",
}

const BREAKDOWNS_BY_FACTOR: Record<EscapeReadinessFactorId, string[]> = {
  sop_coverage: [
    "Opening or closing runs without a written playbook",
    "Variance on your highest-repeat procedure",
    "New hire asks how it is really done",
  ],
  training_coverage: [
    "Judgment calls on tasks that were never assigned",
    "Same training questions repeated every shift",
    "Coverage gaps when the usual person is out",
  ],
  unresolved_issues: [
    "Open issues default to your inbox",
    "Repeat mistakes with no assigned fix",
    "Vendor or customer fires with no owner",
  ],
  owner_interruptions: [
    "Texts and walk-ups stack within the first shift",
    "Judgment calls pause until someone reaches you",
    "Repeat questions because answers live with you",
  ],
  undocumented_procedures: [
    "Procedure gap mid-shift with no written path",
    "Only you know the vendor or pricing exception",
    "Staff improvise when the playbook is missing",
  ],
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
    periodLabel: "first 48 hours",
    label: low === high ? `${low} pulls · first 48 hours` : `${low}–${high} pulls · first 48 hours`,
  }
}

function buildPredictedBreakdowns(
  primary: EscapeReadinessFactorInput & { percent: number },
  secondary: (EscapeReadinessFactorInput & { percent: number }) | null,
  ctx: EscapeBiggestRiskContext
): string[] {
  const out: string[] = []
  const primaryLines = BREAKDOWNS_BY_FACTOR[primary.id]
  out.push(primaryLines[0]!)
  out.push(primaryLines[1]!)

  if (primary.id === "unresolved_issues" && ctx.openIssuesCount != null && ctx.openIssuesCount > 0) {
    out.push(`${ctx.openIssuesCount} open issue(s) with no clear owner while you are out`)
  } else if (secondary) {
    out.push(BREAKDOWNS_BY_FACTOR[secondary.id][0]!)
  } else {
    out.push(primaryLines[2]!)
  }

  return out.slice(0, 3)
}

export function buildBiggestRisk(
  factors: EscapeReadinessFactorInput[],
  ctx: EscapeBiggestRiskContext = {}
): EscapeReadinessBiggestRisk | null {
  const scored = factors.filter((f) => f.percent != null) as (EscapeReadinessFactorInput & { percent: number })[]
  if (scored.length === 0) return null

  scored.sort((a, b) => a.percent - b.percent)
  const weakest = scored[0]!
  const secondary = scored[1] ?? null
  const interruptFactor = factors.find((f) => f.id === "owner_interruptions")
  const weeklyPulls = estimateWeeklyPulls(interruptFactor?.percent ?? null, ctx.ownerInterruptionsThisWeekCount)
  const severity = severityFromWeakestPercent(weakest.percent)

  return {
    factorId: weakest.id,
    title: RISK_TITLE[weakest.id],
    detail: weakest.hint,
    disappearingTomorrow: DISAPPEARING_TOMORROW[weakest.id],
    predictedBreakdowns: buildPredictedBreakdowns(weakest, secondary, ctx),
    estimatedInterruptions: estimateAbsenceInterruptions(weeklyPulls, interruptFactor?.percent ?? null),
    severity: severity.severity,
    severityLabel: severity.label,
    severityPercent: severity.indicatorPercent,
  }
}
