import type { OperationalScanAnswers, YesPartialNo } from "@/lib/operational-scan/score"
import { weeklyCountRisk } from "@/lib/operational-scan/score"

import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessFactor, EscapeReadinessView } from "@/lib/escape-readiness/types"

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
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

function undocumentedRisk(band: OperationalScanAnswers["undocumentedProcedures"]): number {
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

function trainingRisk(c: OperationalScanAnswers["trainingConsistency"]): number {
  switch (c) {
    case "consistent":
      return 10
    case "sometimes":
      return 35
    case "rarely":
      return 62
    case "none":
      return 78
    default:
      return 50
  }
}

function invertRisk(risk: number): number {
  return clamp(100 - risk, 0, 100)
}

function issuesHealthFromScan(answers: OperationalScanAnswers): { percent: number; hint: string } {
  const mistake =
    answers.repeatedMistakesIssues === "daily"
      ? 28
      : answers.repeatedMistakesIssues === "weekly"
        ? 52
        : 82
  const staffLoad = clamp(100 - Math.round(weeklyCountRisk(answers.staffQuestionsPerWeek) * 0.35), 0, 100)
  const percent = Math.round(mistake * 0.55 + staffLoad * 0.45)
  const hint =
    answers.repeatedMistakesIssues === "daily" || answers.repeatedMistakesIssues === "weekly"
      ? "Repeated mistakes and staff questions suggest unresolved issues will stack up in five days."
      : "Fewer repeated mistakes on paper—still log issues so they do not become texts."
  return { percent, hint }
}

/** Directional escape readiness from scan answers (pre-install). */
export function computeEscapeReadinessFromScan(answers: OperationalScanAnswers): EscapeReadinessView {
  const sopRisk = undocumentedRisk(answers.undocumentedProcedures)
  const trainingRiskVal = trainingRisk(answers.trainingConsistency)
  const interruptRisk = clamp(
    Math.round(
      weeklyCountRisk(answers.ownerTextsCallsPerWeek) * 0.55 +
        weeklyCountRisk(answers.staffQuestionsPerWeek) * 0.25 +
        yesPartialNoRisk(answers.canRunFiveDaysWithoutOwner) * 0.2
    ),
    0,
    100
  )
  const undocumentedRiskVal = undocumentedRisk(answers.undocumentedProcedures)
  const issues = issuesHealthFromScan(answers)

  const sop = invertRisk(sopRisk)
  const training = invertRisk(trainingRiskVal)
  const interrupts = invertRisk(interruptRisk)
  const undocumented = invertRisk(undocumentedRiskVal)

  const factors: EscapeReadinessFactor[] = [
    {
      id: "sop_coverage",
      label: "SOP coverage",
      percent: sop,
      hint:
        answers.undocumentedProcedures === "0"
          ? "You reported few undocumented gaps—verify plays are written down in Rivet, not only in your head."
          : "Thin SOP coverage means staff still hunt you when something is not obvious.",
    },
    {
      id: "training_coverage",
      label: "Training coverage",
      percent: training,
      hint:
        answers.trainingConsistency === "consistent"
          ? "Training is consistent—tie modules to published procedures in Rivet."
          : "Inconsistent training means new hires will hunt you during five days away.",
    },
    {
      id: "unresolved_issues",
      label: "Unresolved issues",
      percent: issues.percent,
      hint: issues.hint,
    },
    {
      id: "owner_interruptions",
      label: "Owner interruptions",
      percent: interrupts,
      hint:
        answers.ownerTextsCallsPerWeek === "0-5" && answers.staffQuestionsPerWeek === "0-5"
          ? "Low interrupt volume on paper—stress-test before you trust five days away."
          : "Texts, calls, and walk-ups still route through you at this volume.",
    },
    {
      id: "undocumented_procedures",
      label: "Undocumented procedures",
      percent: undocumented,
      hint:
        answers.undocumentedProcedures === "0"
          ? "You named few undocumented procedures—capture the next one only you know."
          : "Undocumented procedures still drive interrupts when you are not there.",
    },
  ]

  return finalizeEscapeReadinessView({
    verdict: "",
    factors,
    progress: [],
  })
}
