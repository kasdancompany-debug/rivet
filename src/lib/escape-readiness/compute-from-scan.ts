import type { OperationalScanAnswers, YesPartialNo } from "@/lib/operational-scan/score"

import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { bandFromScoreForEscape, verdictForEscapeScore } from "@/lib/escape-readiness/presentation"

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

function staffQuestionsRisk(band: OperationalScanAnswers["staffQuestionsPerWeek"]): number {
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

function interruptionRisk(c: OperationalScanAnswers["ownerInterruptions"]): number {
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

function invertRisk(risk: number): number {
  return clamp(100 - risk, 0, 100)
}

/** Directional escape readiness from scan answers (pre-install). */
export function computeEscapeReadinessFromScan(answers: OperationalScanAnswers): EscapeReadinessView {
  const proceduresRisk = undocumentedRisk(answers.undocumentedProcedures)
  const trainingRisk = answers.trainingProcessExists ? 10 : 72
  const ownerDepsRisk = clamp(
    Math.round(
      staffQuestionsRisk(answers.staffQuestionsPerWeek) * 0.35 +
        yesPartialNoRisk(answers.canRunFiveDaysWithoutOwner) * 0.35 +
        interruptionRisk(answers.ownerInterruptions) * 0.3
    ),
    0,
    100
  )
  const openRisk = yesPartialNoRisk(answers.staffCanOpenWithoutOwner)
  const closeRisk = yesPartialNoRisk(answers.staffCanCloseWithoutOwner)
  const staffingRisk = clamp(Math.round(openRisk * 0.5 + closeRisk * 0.5), 0, 100)

  const procedures = invertRisk(proceduresRisk)
  const training = invertRisk(trainingRisk)
  const ownerMitigation = invertRisk(ownerDepsRisk)
  const staffingCoverage = invertRisk(staffingRisk)

  const score = Math.round((procedures + training + ownerMitigation + staffingCoverage) / 4)

  return {
    headlineQuestion: "Can your business survive if you disappear for a week?",
    score,
    band: bandFromScoreForEscape(score),
    verdict: verdictForEscapeScore(score),
    factors: [
      {
        id: "procedures",
        label: "Procedures complete",
        percent: procedures,
        hint:
          answers.undocumentedProcedures === "0"
            ? "You reported few undocumented gaps—verify plays are on the floor, not only in your head."
            : "Undocumented procedures still drive interrupts when you are not there.",
      },
      {
        id: "training",
        label: "Training coverage",
        percent: training,
        hint: answers.trainingProcessExists
          ? "A training process exists—tie modules to published plays in Rivet."
          : "No structured training process—new hires will hunt you during a week away.",
      },
      {
        id: "owner_dependencies",
        label: "Critical owner dependencies",
        percent: ownerMitigation,
        hint:
          answers.canRunFiveDaysWithoutOwner === "yes"
            ? "You believe five days away is possible—track interrupts to prove it."
            : "Five days without you is not credible from your answers today.",
      },
      {
        id: "staffing",
        label: "Staffing risk",
        percent: staffingCoverage,
        hint:
          answers.staffCanOpenWithoutOwner === "yes" && answers.staffCanCloseWithoutOwner === "yes"
            ? "Open and close can run without you on paper—stress-test before you leave."
            : "Open or close still needs you—staffing risk spikes on the first call-out.",
      },
    ],
  }
}
