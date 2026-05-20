/**
 * Rivet Scan v2 — owner dependency & cost of routing load.
 * Higher `ownerDependencyScore` = more pain (worse for the owner).
 */

export type StaffQuestionsBand = "0-5" | "6-15" | "16-30" | "31-50" | "51+"
export type YesPartialNo = "yes" | "partial" | "no"
export type UndocumentedProceduresBand = "0" | "1-5" | "6-15" | "16-30" | "31+"
export type OwnerInterruptionCadence = "rarely" | "weekly" | "daily" | "constantly"

export type OperationalScanAnswers = {
  businessName: string
  website: string
  industry: string
  email: string
  /** How often staff come to the owner with questions. */
  staffQuestionsPerWeek: StaffQuestionsBand
  staffCanOpenWithoutOwner: YesPartialNo
  staffCanCloseWithoutOwner: YesPartialNo
  undocumentedProcedures: UndocumentedProceduresBand
  canRunFiveDaysWithoutOwner: YesPartialNo
  trainingProcessExists: boolean
  ownerInterruptions: OwnerInterruptionCadence
}

export type OwnerDependencySeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL"

export type OperationalScanResult = {
  /** 0–100 · higher = more owner dependency. */
  ownerDependencyScore: number
  severity: OwnerDependencySeverity
  estimatedInterruptionsPerMonth: number
  estimatedOwnerHoursLostPerMonth: number
  estimatedAnnualCost: number
  /** Top pain drivers (3 lines). */
  painDrivers: [string, string, string]
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function staffQuestionsRisk(band: StaffQuestionsBand): number {
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

function staffQuestionsMidpointPerWeek(band: StaffQuestionsBand): number {
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

function interruptionRisk(c: OwnerInterruptionCadence): number {
  switch (c) {
    case "rarely":
      return 15
    case "weekly":
      return 38
    case "daily":
      return 62
    case "constantly":
      return 92
    default:
      return 45
  }
}

function interruptionBasePerMonth(c: OwnerInterruptionCadence): number {
  switch (c) {
    case "rarely":
      return 6
    case "weekly":
      return 18
    case "daily":
      return 55
    case "constantly":
      return 110
    default:
      return 25
  }
}

function severityFromScore(score: number): OwnerDependencySeverity {
  if (score < 25) return "LOW"
  if (score < 50) return "MODERATE"
  if (score < 75) return "HIGH"
  return "CRITICAL"
}

function ownerHourlyRate(a: OperationalScanAnswers): number {
  const q = staffQuestionsMidpointPerWeek(a.staffQuestionsPerWeek)
  if (q >= 40) return 125
  if (q >= 22) return 105
  if (q >= 10) return 90
  return 75
}

function buildPainDrivers(a: OperationalScanAnswers, score: number): [string, string, string] {
  type Driver = { weight: number; text: string }
  const drivers: Driver[] = []

  if (a.staffCanOpenWithoutOwner === "no" || a.staffCanCloseWithoutOwner === "no") {
    drivers.push({
      weight: 90,
      text:
        a.staffCanOpenWithoutOwner === "no" && a.staffCanCloseWithoutOwner === "no"
          ? "Open and close still need you—every day off is a bet, not a plan."
          : a.staffCanOpenWithoutOwner === "no"
            ? "The team cannot open without you—mornings route through your phone before revenue starts."
            : "Close still waits on you—nights and weekends stay yours only on paper.",
    })
  } else if (a.staffCanOpenWithoutOwner === "partial" || a.staffCanCloseWithoutOwner === "partial") {
    drivers.push({
      weight: 55,
      text: "Open or close is only partial without you—one call-out puts the day back on your calendar.",
    })
  }

  if (!a.trainingProcessExists) {
    drivers.push({
      weight: 72,
      text: "No real training process—every new face becomes your shadow shift until they “get it.”",
    })
  }

  if (a.canRunFiveDaysWithoutOwner === "no") {
    drivers.push({
      weight: 88,
      text: "Five days without you is not credible today—the business pauses when you step away.",
    })
  } else if (a.canRunFiveDaysWithoutOwner === "partial") {
    drivers.push({
      weight: 58,
      text: "Five days away might work once—until quality, cash, or a vendor issue proves otherwise.",
    })
  }

  drivers.push({
    weight: staffQuestionsRisk(a.staffQuestionsPerWeek),
    text: `Staff still bring you ~${staffQuestionsMidpointPerWeek(a.staffQuestionsPerWeek)}+ judgment calls a week—that is routing load, not “being helpful.”`,
  })

  drivers.push({
    weight: undocumentedRisk(a.undocumentedProcedures),
    text:
      a.undocumentedProcedures === "0"
        ? "Undocumented gaps are low on paper—watch for “we always do it this way” that never hit paper."
        : `An estimated ${undocumentedMidpoint(a.undocumentedProcedures)}+ procedures still live in your head—each one is a future interrupt.`,
  })

  drivers.push({
    weight: interruptionRisk(a.ownerInterruptions),
    text:
      a.ownerInterruptions === "constantly"
        ? "Owner interrupts read as constant—you are the live escalation path, not the exception."
        : a.ownerInterruptions === "daily"
          ? "Owner interrupts land most days—the floor has learned you are faster than the system."
          : a.ownerInterruptions === "weekly"
            ? "Repeating owner interrupts weekly mean the same decisions are not owned downstream yet."
            : "Interrupts are quieter—but staff questions may still recycle the same themes.",
  })

  drivers.sort((x, y) => y.weight - x.weight)
  const out: string[] = []
  const seen = new Set<string>()
  for (const d of drivers) {
    if (out.length >= 3) break
    if (seen.has(d.text)) continue
    seen.add(d.text)
    out.push(d.text)
  }

  const fallbacks = [
    "This scan is directional—Rivet replaces guesses with standards, training links, and logged interrupts in your workspace.",
    "The cost below is a conservative model from your answers; most owners feel the real drag at 2–3× once they track a week.",
    score >= 50
      ? "Until open, close, and judgment calls have named owners, you will keep paying in hours—not line items."
      : "You have headroom—tighten one load-bearing path (open, close, or quality) before complexity outruns you.",
  ]
  let i = 0
  while (out.length < 3) {
    const t = fallbacks[i % fallbacks.length]!
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
    i += 1
  }

  return [out[0]!, out[1]!, out[2]!]
}

export function computeOperationalScanScores(a: OperationalScanAnswers): OperationalScanResult {
  const trainingRisk = a.trainingProcessExists ? 12 : 58

  const raw =
    staffQuestionsRisk(a.staffQuestionsPerWeek) * 0.22 +
    yesPartialNoRisk(a.staffCanOpenWithoutOwner) * 0.14 +
    yesPartialNoRisk(a.staffCanCloseWithoutOwner) * 0.14 +
    undocumentedRisk(a.undocumentedProcedures) * 0.18 +
    yesPartialNoRisk(a.canRunFiveDaysWithoutOwner) * 0.16 +
    trainingRisk * 0.08 +
    interruptionRisk(a.ownerInterruptions) * 0.28

  const ownerDependencyScore = clamp(Math.round(raw), 0, 100)
  const severity = severityFromScore(ownerDependencyScore)

  const staffMonthly = staffQuestionsMidpointPerWeek(a.staffQuestionsPerWeek) * 4.33
  const interruptBase = interruptionBasePerMonth(a.ownerInterruptions)
  const docBoost = undocumentedMidpoint(a.undocumentedProcedures) * 0.85
  const openCloseBoost =
    (a.staffCanOpenWithoutOwner === "no" ? 12 : a.staffCanOpenWithoutOwner === "partial" ? 5 : 0) +
    (a.staffCanCloseWithoutOwner === "no" ? 12 : a.staffCanCloseWithoutOwner === "partial" ? 5 : 0)

  const estimatedInterruptionsPerMonth = Math.max(
    4,
    Math.round(staffMonthly * 0.55 + interruptBase + docBoost + openCloseBoost)
  )

  const minutesPerInterrupt =
    severity === "CRITICAL" ? 22 : severity === "HIGH" ? 18 : severity === "MODERATE" ? 15 : 12
  const reworkHoursFromUndocumented = undocumentedMidpoint(a.undocumentedProcedures) * 1.25
  const estimatedOwnerHoursLostPerMonth = Math.round(
    (estimatedInterruptionsPerMonth * minutesPerInterrupt) / 60 + reworkHoursFromUndocumented
  )

  const rate = ownerHourlyRate(a)
  const estimatedAnnualCost = Math.round(estimatedOwnerHoursLostPerMonth * 12 * rate)

  const painDrivers = buildPainDrivers(a, ownerDependencyScore)

  return {
    ownerDependencyScore,
    severity,
    estimatedInterruptionsPerMonth,
    estimatedOwnerHoursLostPerMonth,
    estimatedAnnualCost,
    painDrivers,
  }
}

export function formatCadenceLabel(c: OwnerInterruptionCadence): string {
  switch (c) {
    case "rarely":
      return "Rarely"
    case "weekly":
      return "Weekly or more"
    case "daily":
      return "Most days"
    case "constantly":
      return "Constantly"
    default:
      return c
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
} {
  switch (severity) {
    case "LOW":
      return {
        badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
        ring: "stroke-emerald-400",
        score: "text-emerald-50",
      }
    case "MODERATE":
      return {
        badge: "border-amber-500/30 bg-amber-500/10 text-amber-100",
        ring: "stroke-amber-400",
        score: "text-amber-50",
      }
    case "HIGH":
      return {
        badge: "border-orange-500/35 bg-orange-500/10 text-orange-100",
        ring: "stroke-orange-400",
        score: "text-orange-50",
      }
    case "CRITICAL":
      return {
        badge: "border-rose-500/40 bg-rose-500/15 text-rose-100",
        ring: "stroke-rose-400",
        score: "text-rose-50",
      }
    default:
      return {
        badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
        ring: "stroke-zinc-400",
        score: "text-white",
      }
  }
}
