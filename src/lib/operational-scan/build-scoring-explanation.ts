import { formatAbsenceDays } from "@/lib/escape-readiness/absence-capacity"

import {
  RISK_WEIGHTS,
  formatSeverityLabel,
  type OperationalScanResult,
  type RiskScoreBreakdownItem,
} from "./score"

export type ScanFactorExplanation = {
  key: string
  label: string
  weightPercent: number
  points: number
  why: string
}

export type ScanDerivedMetricExplanation = {
  label: string
  value: string
  explanation: string
}

export type ScanScoringExplanation = {
  ownerDependencyScore: number
  severityLabel: string
  methodology: string
  formula: string
  factors: ScanFactorExplanation[]
  derivedMetrics: ScanDerivedMetricExplanation[]
  caveats: readonly string[]
}

const FACTOR_WEIGHT_PERCENT: Record<string, number> = {
  open_close: Math.round(RISK_WEIGHTS.openClose * 100),
  knowledge: Math.round(RISK_WEIGHTS.knowledge * 100),
  interruptions: Math.round(RISK_WEIGHTS.interruptions * 100),
  training: Math.round(RISK_WEIGHTS.training * 100),
  sop_coverage: Math.round(RISK_WEIGHTS.sopCoverage * 100),
  unresolved_issues: Math.round(RISK_WEIGHTS.unresolvedIssues * 100),
}

function factorWhy(item: RiskScoreBreakdownItem): string {
  switch (item.key) {
    case "open_close":
      return "Opening and closing without you is the highest-weight signal — if the business stops when you are absent, dependency is structural."
    case "knowledge":
      return "Each undocumented procedure is tribal knowledge that routes judgment calls back to you."
    case "interruptions":
      return "Weekly texts, calls, and staff questions are a proxy for how often the operation hunts you mid-shift."
    case "training":
      return "Inconsistent training means new hires and floaters still default to you under pressure."
    case "sop_coverage":
      return "Five-day survivability captures whether plays and coverage exist beyond day-to-day habit."
    case "unresolved_issues":
      return "Repeating mistakes usually mean nothing owns the fix yet — you become the patch."
    case "escalation":
      return "Cannot open without you plus 31+ trapped decisions is treated as a compounding risk (+15 points)."
    default:
      return "Weighted from your answer band."
  }
}

function mapFactor(item: RiskScoreBreakdownItem): ScanFactorExplanation {
  return {
    key: item.key,
    label: item.label,
    weightPercent: FACTOR_WEIGHT_PERCENT[item.key] ?? 0,
    points: item.points,
    why: factorWhy(item),
  }
}

/** Transparent scoring breakdown for Rivet Scan results. */
export function buildScanScoringExplanation(result: OperationalScanResult): ScanScoringExplanation {
  const factors = result.scoreBreakdown.map(mapFactor)
  const daysLabel = formatAbsenceDays(result.estimatedOwnerFreeDays)

  return {
    ownerDependencyScore: result.ownerDependencyScore,
    severityLabel: formatSeverityLabel(result.severity),
    methodology:
      "Rivet Scan scores owner dependency from eight self-reported answers. Each factor is mapped to a 0–100 risk band, multiplied by a fixed weight, and summed. Higher score = more fused to the operation.",
    formula:
      "Owner dependency = (open/close × 30%) + (undocumented knowledge × 25%) + (interruptions × 20%) + (training × 10%) + (5-day coverage × 10%) + (repeating issues × 5%) + escalation bonus if applicable.",
    factors,
    derivedMetrics: [
      {
        label: "Operational risk",
        value: formatSeverityLabel(result.severity),
        explanation: "Low 0–24 · Moderate 25–49 · High 50–74 · Critical 75–100",
      },
      {
        label: "Owner-free capacity",
        value: daysLabel,
        explanation: `Derived by inverting your ${result.ownerDependencyScore}/100 score and mapping through a day anchor curve (0.5d at low readiness → 14d at high). Directional, not a guarantee.`,
      },
      {
        label: "Owner hours trapped / year",
        value: `~${result.estimatedOwnerHoursLostPerMonth * 12}h`,
        explanation:
          "Estimated from interrupt volume bands, minutes per interrupt (12–22 by severity), undocumented rework, and training gaps. Assumes your reported weekly bands.",
      },
      {
        label: "Estimated annual cost",
        value: new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: "CAD",
          maximumFractionDigits: 0,
        }).format(result.estimatedAnnualCost),
        explanation:
          "Hours trapped × assumed owner hourly rate ($75–125 CAD based on interrupt volume). Illustrative — not tax or payroll advice.",
      },
    ],
    caveats: [
      "All inputs are self-reported bands, not verified against your Rivet workspace.",
      "Diagnostic cards below use related but separate risk tables tuned for narrative clarity.",
      "“+N Escape Readiness” on recommendations is a directional estimate, not a live score delta.",
      "Owner-free days and dollar cost are models for prioritization — track one real week to calibrate.",
    ],
  }
}
