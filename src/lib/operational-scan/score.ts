/**
 * Rivet Scan v3 — owner dependency, urgency, and cost of routing load.
 * Higher `ownerDependencyScore` = more pain (worse for the owner).
 */

export type WeeklyCountBand = "0-5" | "6-15" | "16-30" | "31-50" | "51+"
export type YesPartialNo = "yes" | "partial" | "no"
export type UndocumentedProceduresBand = "0" | "1-5" | "6-15" | "16-30" | "31+"
export type TrainingConsistency = "consistent" | "sometimes" | "rarely" | "none"
export type RepeatedMistakesBand = "rarely" | "monthly" | "weekly" | "daily"

/** @deprecated v3 uses WeeklyCountBand — kept for lead DB mapping */
export type OwnerInterruptionCadence = "rarely" | "weekly" | "daily" | "constantly"

export type OperationalScanAnswers = {
  businessName: string
  website: string
  industry: string
  email: string
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

export type OperationalScanResult = {
  /** 0–100 · higher = more owner dependency. */
  ownerDependencyScore: number
  severity: OwnerDependencySeverity
  estimatedInterruptionsPerMonth: number
  estimatedOwnerHoursLostPerMonth: number
  estimatedAnnualCost: number
}

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

function yesPartialNoRisk(v: YesPartialNo): number {
  switch (v) {
    case "yes":
      return 8
    case "partial":
      return 42
    case "no":
      return 82
    default:
      return 45
  }
}

function undocumentedRisk(band: UndocumentedProceduresBand): number {
  switch (band) {
    case "0":
      return 10
    case "1-5":
      return 28
    case "6-15":
      return 48
    case "16-30":
      return 68
    case "31+":
      return 88
    default:
      return 45
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

function trainingConsistencyRisk(c: TrainingConsistency): number {
  switch (c) {
    case "consistent":
      return 10
    case "sometimes":
      return 38
    case "rarely":
      return 62
    case "none":
      return 88
    default:
      return 50
  }
}

function repeatedMistakesRisk(b: RepeatedMistakesBand): number {
  switch (b) {
    case "rarely":
      return 12
    case "monthly":
      return 38
    case "weekly":
      return 68
    case "daily":
      return 90
    default:
      return 45
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
  const raw =
    weeklyCountRisk(a.staffQuestionsPerWeek) * 0.16 +
    weeklyCountRisk(a.ownerTextsCallsPerWeek) * 0.18 +
    yesPartialNoRisk(a.staffCanOpenWithoutOwner) * 0.12 +
    yesPartialNoRisk(a.staffCanCloseWithoutOwner) * 0.12 +
    undocumentedRisk(a.undocumentedProcedures) * 0.14 +
    trainingConsistencyRisk(a.trainingConsistency) * 0.1 +
    yesPartialNoRisk(a.canRunFiveDaysWithoutOwner) * 0.12 +
    repeatedMistakesRisk(a.repeatedMistakesIssues) * 0.16

  const ownerDependencyScore = clamp(Math.round(raw), 0, 100)
  const severity = severityFromScore(ownerDependencyScore)

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
