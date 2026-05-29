/**
 * Rivet Scan — weighted owner dependency risk model.
 * Higher `ownerDependencyScore` = more operational risk for the owner.
 */

import { estimatedDaysFromScore } from "@/lib/escape-readiness/absence-capacity"

export type WeeklyCountBand = "0-5" | "6-15" | "16-30" | "31-50" | "51+"
export type YesPartialNo = "yes" | "partial" | "no"
export type UndocumentedProceduresBand = "0" | "1-5" | "6-15" | "16-30" | "31+"
export type TrainingConsistency = "consistent" | "sometimes" | "rarely" | "none"
export type RepeatedMistakesBand = "rarely" | "monthly" | "weekly" | "daily"

/** @deprecated v3 uses WeeklyCountBand — kept for lead DB mapping */
export type OwnerInterruptionCadence = "rarely" | "weekly" | "daily" | "constantly"

export type OperationalScanAnswers = {
  firstName: string
  businessName: string
  website: string
  industry: string
  email: string
  phone: string
  staffQuestionsPerWeek: WeeklyCountBand
  ownerTextsCallsPerWeek: WeeklyCountBand
  staffCanOpenWithoutOwner: YesPartialNo
  staffCanCloseWithoutOwner: YesPartialNo
  undocumentedProcedures: UndocumentedProceduresBand
  trainingConsistency: TrainingConsistency
  canRunFiveDaysWithoutOwner: YesPartialNo
  repeatedMistakesIssues: RepeatedMistakesBand
}

export type OwnerDependencySeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL"

export type RiskScoreBreakdownItem = {
  key: string
  label: string
  points: number
}

export type OperationalScanResult = {
  /** 0–100 · higher = more owner dependency risk. */
  ownerDependencyScore: number
  severity: OwnerDependencySeverity
  /** Days the operation could likely run without the owner before breakdown. */
  estimatedOwnerFreeDays: number
  scoreBreakdown: RiskScoreBreakdownItem[]
  escalationBonus: number
  estimatedInterruptionsPerMonth: number
  estimatedOwnerHoursLostPerMonth: number
  estimatedAnnualCost: number
}

export const RISK_WEIGHTS = {
  openClose: 0.3,
  knowledge: 0.25,
  interruptions: 0.2,
  training: 0.1,
  sopCoverage: 0.1,
  unresolvedIssues: 0.05,
} as const

export const ESCALATION_BONUS = 15

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function weeklyCountRisk(band: WeeklyCountBand): number {
  switch (band) {
    case "0-5":
      return 12
    case "6-15":
      return 28
    case "16-30":
      return 48
    case "31-50":
      return 68
    case "51+":
      return 90
    default:
      return 40
  }
}

export function weeklyCountMidpoint(band: WeeklyCountBand): number {
  switch (band) {
    case "0-5":
      return 3
    case "6-15":
      return 10
    case "16-30":
      return 22
    case "31-50":
      return 40
    case "51+":
      return 60
    default:
      return 15
  }
}

function undocumentedMidpoint(band: UndocumentedProceduresBand): number {
  switch (band) {
    case "0":
      return 0
    case "1-5":
      return 3
    case "6-15":
      return 10
    case "16-30":
      return 22
    case "31+":
      return 40
    default:
      return 8
  }
}

function repeatedMistakesMonthlyBoost(b: RepeatedMistakesBand): number {
  switch (b) {
    case "rarely":
      return 2
    case "monthly":
      return 8
    case "weekly":
      return 18
    case "daily":
      return 32
    default:
      return 6
  }
}

function openingClosingRisk(open: YesPartialNo, close: YesPartialNo): number {
  const openR = open === "no" ? 94 : open === "partial" ? 55 : 15
  const closeR = close === "no" ? 90 : close === "partial" ? 50 : 12
  return Math.round(openR * 0.55 + closeR * 0.45)
}

function knowledgeTrappedRisk(band: UndocumentedProceduresBand): number {
  switch (band) {
    case "0":
      return 12
    case "1-5":
      return 35
    case "6-15":
      return 58
    case "16-30":
      return 78
    case "31+":
      return 96
    default:
      return 50
  }
}

function interruptionBandRisk(band: WeeklyCountBand): number {
  switch (band) {
    case "0-5":
      return 18
    case "6-15":
      return 42
    case "16-30":
      return 70
    case "31-50":
      return 86
    case "51+":
      return 95
    default:
      return 50
  }
}

function interruptionsRoutedRisk(owner: WeeklyCountBand, staff: WeeklyCountBand): number {
  const ownerR = interruptionBandRisk(owner)
  const staffR = interruptionBandRisk(staff)
  return Math.round(ownerR * 0.82 + staffR * 0.18)
}

function trainingCompletionRisk(c: TrainingConsistency): number {
  switch (c) {
    case "consistent":
      return 12
    case "sometimes":
      return 38
    case "rarely":
      return 60
    case "none":
      return 85
    default:
      return 50
  }
}

function sopCoverageRisk(v: YesPartialNo): number {
  switch (v) {
    case "yes":
      return 12
    case "partial":
      return 50
    case "no":
      return 88
    default:
      return 45
  }
}

function unresolvedIssuesRisk(b: RepeatedMistakesBand): number {
  switch (b) {
    case "rarely":
      return 15
    case "monthly":
      return 40
    case "weekly":
      return 68
    case "daily":
      return 90
    default:
      return 45
  }
}

function severityFromScore(score: number): OwnerDependencySeverity {
  if (score < 25) return "LOW"
  if (score < 50) return "MODERATE"
  if (score < 75) return "HIGH"
  return "CRITICAL"
}

export function formatSeverityLabel(severity: OwnerDependencySeverity): string {
  switch (severity) {
    case "LOW":
      return "Low"
    case "MODERATE":
      return "Moderate"
    case "HIGH":
      return "High"
    case "CRITICAL":
      return "Critical"
    default:
      return severity
  }
}

export function estimatedOwnerFreeDaysFromRisk(riskScore: number): number {
  return estimatedDaysFromScore(clamp(100 - riskScore, 0, 100))
}

export function knowledgeItemsExceedThreshold(band: UndocumentedProceduresBand): boolean {
  return band === "31+"
}

export function cannotOpenWithoutOwner(open: YesPartialNo): boolean {
  return open === "no"
}

function openCloseBreakdownLabel(open: YesPartialNo, close: YesPartialNo): string {
  if (open === "no") return "Business cannot open without owner"
  if (close === "no") return "Business cannot close without owner"
  if (open === "partial" || close === "partial") return "Opening/closing still routes through you"
  return "Open/close runs without you"
}

function knowledgeBreakdownLabel(band: UndocumentedProceduresBand): string {
  switch (band) {
    case "0":
      return "Few undocumented decisions"
    case "1-5":
      return "1–5 undocumented decisions"
    case "6-15":
      return "6–15 undocumented decisions"
    case "16-30":
      return "16–30 undocumented decisions"
    case "31+":
      return "31+ undocumented decisions"
    default:
      return "Undocumented decisions"
  }
}

function trainingBreakdownLabel(c: TrainingConsistency): string {
  switch (c) {
    case "consistent":
      return "Training is consistent"
    case "sometimes":
      return "Inconsistent training"
    case "rarely":
    case "none":
      return "Training gaps"
    default:
      return "Training gaps"
  }
}

function sopBreakdownLabel(v: YesPartialNo): string {
  switch (v) {
    case "yes":
      return "Play coverage is solid"
    case "partial":
    case "no":
      return "Play gaps"
    default:
      return "Play gaps"
  }
}

function unresolvedBreakdownLabel(b: RepeatedMistakesBand): string {
  switch (b) {
    case "rarely":
      return "Few repeating issues"
    case "monthly":
      return "Repeating issues monthly"
    case "weekly":
      return "Weekly repeating issues"
    case "daily":
      return "Daily repeating issues"
    default:
      return "Unresolved issue patterns"
  }
}

function weightedPoints(risk: number, weight: number): number {
  return Math.round(risk * weight)
}

function buildScoreBreakdown(
  answers: OperationalScanAnswers,
  factorRisks: {
    openClose: number
    knowledge: number
    interruptions: number
    training: number
    sopCoverage: number
    unresolvedIssues: number
  },
  escalationBonus: number
): RiskScoreBreakdownItem[] {
  const items: RiskScoreBreakdownItem[] = [
    {
      key: "open_close",
      label: openCloseBreakdownLabel(answers.staffCanOpenWithoutOwner, answers.staffCanCloseWithoutOwner),
      points: weightedPoints(factorRisks.openClose, RISK_WEIGHTS.openClose),
    },
    {
      key: "knowledge",
      label: knowledgeBreakdownLabel(answers.undocumentedProcedures),
      points: weightedPoints(factorRisks.knowledge, RISK_WEIGHTS.knowledge),
    },
    {
      key: "interruptions",
      label: `${weeklyCountMidpoint(answers.ownerTextsCallsPerWeek)} interruptions/week`,
      points: weightedPoints(factorRisks.interruptions, RISK_WEIGHTS.interruptions),
    },
    {
      key: "training",
      label: trainingBreakdownLabel(answers.trainingConsistency),
      points: weightedPoints(factorRisks.training, RISK_WEIGHTS.training),
    },
    {
      key: "sop_coverage",
      label: sopBreakdownLabel(answers.canRunFiveDaysWithoutOwner),
      points: weightedPoints(factorRisks.sopCoverage, RISK_WEIGHTS.sopCoverage),
    },
    {
      key: "unresolved_issues",
      label: unresolvedBreakdownLabel(answers.repeatedMistakesIssues),
      points: weightedPoints(factorRisks.unresolvedIssues, RISK_WEIGHTS.unresolvedIssues),
    },
  ]

  if (escalationBonus > 0) {
    items.push({
      key: "escalation",
      label: "Cannot open + 31+ knowledge items trapped",
      points: escalationBonus,
    })
  }

  return items.filter((item) => item.points > 0).sort((a, b) => b.points - a.points)
}

function ownerHourlyRate(a: OperationalScanAnswers): number {
  const q = weeklyCountMidpoint(a.staffQuestionsPerWeek)
  const t = weeklyCountMidpoint(a.ownerTextsCallsPerWeek)
  const peak = Math.max(q, t)
  if (peak >= 40) return 125
  if (peak >= 22) return 105
  if (peak >= 10) return 90
  return 75
}

/** Maps v3 texts/calls band to legacy `scan_leads.owner_interruptions` enum. */
export function textsCallsBandToLeadCadence(band: WeeklyCountBand): OwnerInterruptionCadence {
  switch (band) {
    case "0-5":
      return "rarely"
    case "6-15":
      return "weekly"
    case "16-30":
      return "daily"
    case "31-50":
    case "51+":
      return "constantly"
    default:
      return "weekly"
  }
}

export function computeOperationalScanScores(a: OperationalScanAnswers): OperationalScanResult {
  const factorRisks = {
    openClose: openingClosingRisk(a.staffCanOpenWithoutOwner, a.staffCanCloseWithoutOwner),
    knowledge: knowledgeTrappedRisk(a.undocumentedProcedures),
    interruptions: interruptionsRoutedRisk(a.ownerTextsCallsPerWeek, a.staffQuestionsPerWeek),
    training: trainingCompletionRisk(a.trainingConsistency),
    sopCoverage: sopCoverageRisk(a.canRunFiveDaysWithoutOwner),
    unresolvedIssues: unresolvedIssuesRisk(a.repeatedMistakesIssues),
  }

  const baseScore =
    factorRisks.openClose * RISK_WEIGHTS.openClose +
    factorRisks.knowledge * RISK_WEIGHTS.knowledge +
    factorRisks.interruptions * RISK_WEIGHTS.interruptions +
    factorRisks.training * RISK_WEIGHTS.training +
    factorRisks.sopCoverage * RISK_WEIGHTS.sopCoverage +
    factorRisks.unresolvedIssues * RISK_WEIGHTS.unresolvedIssues

  const escalationBonus =
    cannotOpenWithoutOwner(a.staffCanOpenWithoutOwner) && knowledgeItemsExceedThreshold(a.undocumentedProcedures)
      ? ESCALATION_BONUS
      : 0

  const ownerDependencyScore = clamp(Math.round(baseScore + escalationBonus), 0, 100)
  const severity = severityFromScore(ownerDependencyScore)
  const estimatedOwnerFreeDays = estimatedOwnerFreeDaysFromRisk(ownerDependencyScore)
  const scoreBreakdown = buildScoreBreakdown(a, factorRisks, escalationBonus)

  const staffWeekly = weeklyCountMidpoint(a.staffQuestionsPerWeek)
  const textsWeekly = weeklyCountMidpoint(a.ownerTextsCallsPerWeek)
  const staffMonthly = staffWeekly * 4.33
  const textsMonthly = textsWeekly * 4.33
  const docBoost = undocumentedMidpoint(a.undocumentedProcedures) * 0.85
  const openCloseBoost =
    (a.staffCanOpenWithoutOwner === "no" ? 12 : a.staffCanOpenWithoutOwner === "partial" ? 5 : 0) +
    (a.staffCanCloseWithoutOwner === "no" ? 12 : a.staffCanCloseWithoutOwner === "partial" ? 5 : 0)
  const mistakesBoost = repeatedMistakesMonthlyBoost(a.repeatedMistakesIssues)

  const estimatedInterruptionsPerMonth = Math.max(
    4,
    Math.round(staffMonthly * 0.48 + textsMonthly * 0.52 + docBoost + openCloseBoost + mistakesBoost)
  )

  const minutesPerInterrupt =
    severity === "CRITICAL" ? 22 : severity === "HIGH" ? 18 : severity === "MODERATE" ? 15 : 12
  const reworkHoursFromUndocumented = undocumentedMidpoint(a.undocumentedProcedures) * 1.25
  const trainingRework =
    a.trainingConsistency === "none" ? 6 : a.trainingConsistency === "rarely" ? 3 : 0
  const estimatedOwnerHoursLostPerMonth = Math.round(
    (estimatedInterruptionsPerMonth * minutesPerInterrupt) / 60 +
      reworkHoursFromUndocumented +
      trainingRework
  )

  const rate = ownerHourlyRate(a)
  const estimatedAnnualCost = Math.round(estimatedOwnerHoursLostPerMonth * 12 * rate)

  return {
    ownerDependencyScore,
    severity,
    estimatedOwnerFreeDays,
    scoreBreakdown,
    escalationBonus,
    estimatedInterruptionsPerMonth,
    estimatedOwnerHoursLostPerMonth,
    estimatedAnnualCost,
  }
}

export function formatCurrencyCad(n: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n)
}

export function severityStyles(severity: OwnerDependencySeverity): {
  badge: string
  ring: string
  score: string
  glow: string
} {
  switch (severity) {
    case "LOW":
      return {
        badge: "border-emerald-500/35 bg-emerald-500/10 text-emerald-100",
        ring: "stroke-emerald-400",
        score: "text-emerald-50",
        glow: "from-emerald-500/10",
      }
    case "MODERATE":
      return {
        badge: "border-amber-500/35 bg-amber-500/10 text-amber-100",
        ring: "stroke-amber-400",
        score: "text-amber-50",
        glow: "from-amber-500/10",
      }
    case "HIGH":
      return {
        badge: "border-orange-500/40 bg-orange-500/10 text-orange-100",
        ring: "stroke-orange-400",
        score: "text-orange-50",
        glow: "from-orange-500/10",
      }
    case "CRITICAL":
      return {
        badge: "border-rose-500/45 bg-rose-500/15 text-rose-100",
        ring: "stroke-rose-400",
        score: "text-rose-50",
        glow: "from-rose-500/15",
      }
    default:
      return {
        badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
        ring: "stroke-zinc-400",
        score: "text-white",
        glow: "from-zinc-500/10",
      }
  }
}
