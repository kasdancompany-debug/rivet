import { formatAbsenceDays } from "@/lib/escape-readiness/absence-capacity"
import { formatFewerInterruptionsOutcome } from "@/lib/escape-readiness/translate-score-gain-outcome"
import {
  clamp,
  formatCurrencyCad,
  formatSeverityLabel,
  weeklyCountMidpoint,
  type OperationalScanAnswers,
  type OperationalScanResult,
  type OwnerDependencySeverity,
} from "@/lib/operational-scan/score"

export type ScanDiagnosticSeverity = "critical" | "high" | "moderate" | "low"

export type ScanDiagnosticCardId =
  | "knowledge_trapped"
  | "training_detached"
  | "operations_stop"
  | "owner_interruptions"
  | "missing_procedures"

export type ScanDiagnosticCard = {
  id: ScanDiagnosticCardId
  title: string
  severity: ScanDiagnosticSeverity
  severityScore: number
  currentState: string
  likelyConsequence: string
  businessImpact: string
}

export type ScanRecommendation = {
  id: string
  priority: number
  title: string
  action: string
  estimatedEffort: string
  expectedReadinessGain: string
  expectedInterruptionReduction: string
}

export type ScanHoursLeakage = {
  interruptionsPerWeek: number
  minutesPerInterruption: number
  hoursPerYear: number
  estimatedDollarValue: number
}

export type ScanImpactProjection = {
  hoursTrappedAnnually: number
  interruptionsPerWeek: number
  interruptionsPreventedAnnually: number
  estimatedDollarValue: number
}

export type ScanDiagnosisView = {
  /** Internal model confidence — not shown as a headline % on the results page. */
  confidenceScore: number
  operationalRiskLabel: string
  ownerFreeCapacityLabel: string
  ownerDependencyNarrative: string
  biggestRisks: string[]
  whyRivetBelieves: string[]
  fastestPath: ScanRecommendation | null
  impact: ScanImpactProjection
  diagnosticCards: ScanDiagnosticCard[]
  recommendations: ScanRecommendation[]
  hoursLeakage: ScanHoursLeakage
}

function severityRank(severity: ScanDiagnosticSeverity): number {
  switch (severity) {
    case "critical":
      return 4
    case "high":
      return 3
    case "moderate":
      return 2
    default:
      return 1
  }
}

function severityFromRisk(risk: number): ScanDiagnosticSeverity {
  if (risk >= 75) return "critical"
  if (risk >= 55) return "high"
  if (risk >= 30) return "moderate"
  return "low"
}

function formatReadinessGain(points: number): string {
  const gain = Math.max(1, Math.round(points))
  return `+${gain} Escape Readiness`
}

function ownerHourlyRate(answers: OperationalScanAnswers): number {
  const q = weeklyCountMidpoint(answers.staffQuestionsPerWeek)
  const t = weeklyCountMidpoint(answers.ownerTextsCallsPerWeek)
  const peak = Math.max(q, t)
  if (peak >= 40) return 125
  if (peak >= 22) return 105
  if (peak >= 10) return 90
  return 75
}

function minutesPerInterruption(severity: OwnerDependencySeverity): number {
  switch (severity) {
    case "CRITICAL":
      return 22
    case "HIGH":
      return 18
    case "MODERATE":
      return 15
    default:
      return 12
  }
}

function yesPartialRisk(v: OperationalScanAnswers["staffCanOpenWithoutOwner"]): number {
  switch (v) {
    case "yes":
      return 12
    case "partial":
      return 52
    case "no":
      return 88
    default:
      return 45
  }
}

function undocumentedRisk(band: OperationalScanAnswers["undocumentedProcedures"]): number {
  switch (band) {
    case "0":
      return 8
    case "1-5":
      return 32
    case "6-15":
      return 55
    case "16-30":
      return 78
    case "31+":
      return 94
    default:
      return 45
  }
}

function trainingRisk(c: OperationalScanAnswers["trainingConsistency"]): number {
  switch (c) {
    case "consistent":
      return 10
    case "sometimes":
      return 42
    case "rarely":
      return 68
    case "none":
      return 90
    default:
      return 50
  }
}

function interruptionRisk(owner: OperationalScanAnswers["ownerTextsCallsPerWeek"], staff: OperationalScanAnswers["staffQuestionsPerWeek"]): number {
  const ownerMid = weeklyCountMidpoint(owner)
  const staffMid = weeklyCountMidpoint(staff)
  const combined = ownerMid * 0.72 + staffMid * 0.28
  if (combined >= 40) return 92
  if (combined >= 22) return 74
  if (combined >= 10) return 52
  if (combined >= 4) return 32
  return 14
}

function sopGapRisk(answers: OperationalScanAnswers): number {
  const runRisk = yesPartialRisk(answers.canRunFiveDaysWithoutOwner)
  const openRisk = yesPartialRisk(answers.staffCanOpenWithoutOwner)
  const closeRisk = yesPartialRisk(answers.staffCanCloseWithoutOwner)
  return Math.round(runRisk * 0.5 + openRisk * 0.25 + closeRisk * 0.25)
}

function operationsStopRisk(answers: OperationalScanAnswers): number {
  const open = yesPartialRisk(answers.staffCanOpenWithoutOwner)
  const close = yesPartialRisk(answers.staffCanCloseWithoutOwner)
  const run = yesPartialRisk(answers.canRunFiveDaysWithoutOwner)
  return Math.round(open * 0.35 + close * 0.35 + run * 0.3)
}

function knowledgeBandLabel(band: OperationalScanAnswers["undocumentedProcedures"]): string {
  switch (band) {
    case "0":
      return "few"
    case "1-5":
      return "1–5"
    case "6-15":
      return "6–15"
    case "16-30":
      return "16–30"
    case "31+":
      return "31+"
    default:
      return "several"
  }
}

function buildKnowledgeCard(answers: OperationalScanAnswers): ScanDiagnosticCard {
  const risk = undocumentedRisk(answers.undocumentedProcedures)
  const band = knowledgeBandLabel(answers.undocumentedProcedures)
  const severity = severityFromRisk(risk)

  return {
    id: "knowledge_trapped",
    title: "Knowledge trapped in your head",
    severity,
    severityScore: risk,
    currentState:
      answers.undocumentedProcedures === "0"
        ? "You reported minimal tribal knowledge—but one undocumented decision can still route back to you."
        : `You named ${band} procedures that still live only with you.`,
    likelyConsequence:
      answers.undocumentedProcedures === "31+"
        ? "Staff pause mid-shift, text you, or guess—and quality varies by who is on."
        : "Judgment calls stack on your phone instead of a written standard.",
    businessImpact:
      risk >= 75
        ? "Vacations and sick days become revenue risks, not recovery time."
        : "Every undocumented step is an interrupt waiting to happen.",
  }
}

function buildTrainingCard(answers: OperationalScanAnswers): ScanDiagnosticCard {
  const risk = trainingRisk(answers.trainingConsistency)
  const severity = severityFromRisk(risk)

  const currentByTraining: Record<OperationalScanAnswers["trainingConsistency"], string> = {
    consistent: "Training is consistent on paper—verify it is tied to real procedures, not shadowing you.",
    sometimes: "Training depends on who is available that day—not a repeatable system.",
    rarely: "New hires mostly shadow you. Completion does not mean they can run without you.",
    none: "There is no real training process—every hire relearns from you directly.",
  }

  return {
    id: "training_detached",
    title: "Training not attached to work",
    severity,
    severityScore: risk,
    currentState: currentByTraining[answers.trainingConsistency],
    likelyConsequence:
      answers.trainingConsistency === "consistent"
        ? "Without procedure-linked modules, trained tasks still drift back to you."
        : "Staff ask you to re-teach the same tasks every few weeks.",
    businessImpact:
      risk >= 55
        ? "Turnover and call-outs cost you hours you already spent training."
        : "Training gaps show up as repeats, rework, and owner texts.",
  }
}

function buildOperationsStopCard(answers: OperationalScanAnswers): ScanDiagnosticCard {
  const risk = operationsStopRisk(answers)
  const severity = severityFromRisk(risk)

  const open = answers.staffCanOpenWithoutOwner
  const close = answers.staffCanCloseWithoutOwner
  const run = answers.canRunFiveDaysWithoutOwner

  let currentState = "Day-to-day operations can run without you for stretches."
  if (open === "no" || close === "no") {
    currentState = "Opening or closing still needs you—or the day starts on your phone."
  } else if (run === "no") {
    currentState = "The business cannot reliably run a full work week without you in the loop."
  } else if (open === "partial" || close === "partial" || run === "partial") {
    currentState = "Operations work until something breaks—then they need you back in."
  }

  return {
    id: "operations_stop",
    title: "Operations stop without owner",
    severity,
    severityScore: risk,
    currentState,
    likelyConsequence:
      run === "no" || open === "no"
        ? "One absence, appointment, or travel day puts revenue and service at risk."
        : "Call-outs and surprises pull you back in—even when you planned to be off.",
    businessImpact:
      risk >= 75
        ? "You cannot take real time away without operational fallout."
        : "Your calendar owns the business—not the team.",
  }
}

function buildInterruptionsCard(answers: OperationalScanAnswers): ScanDiagnosticCard {
  const risk = interruptionRisk(answers.ownerTextsCallsPerWeek, answers.staffQuestionsPerWeek)
  const severity = severityFromRisk(risk)
  const ownerMid = weeklyCountMidpoint(answers.ownerTextsCallsPerWeek)
  const staffMid = weeklyCountMidpoint(answers.staffQuestionsPerWeek)
  const total = Math.round(ownerMid + staffMid)

  return {
    id: "owner_interruptions",
    title: "Owner interruptions",
    severity,
    severityScore: risk,
    currentState: `Roughly ${total} pulls per week—${ownerMid} texts/calls and ${staffMid} staff questions routed to you.`,
    likelyConsequence:
      total >= 30
        ? "Your week fragments into reactive blocks—deep work and leadership time disappear."
        : "Small questions compound into a constant background tax on your attention.",
    businessImpact:
      risk >= 55
        ? "Growth stalls because you are the default escalation path."
        : "Hours leak to interruptions that written procedures would eliminate.",
  }
}

function buildMissingProceduresCard(answers: OperationalScanAnswers): ScanDiagnosticCard {
  const risk = sopGapRisk(answers)
  const severity = severityFromRisk(risk)

  return {
    id: "missing_procedures",
    title: "Missing procedures",
    severity,
    severityScore: risk,
    currentState:
      answers.canRunFiveDaysWithoutOwner === "yes" && answers.undocumentedProcedures === "0"
        ? "Core workflows appear documented—gaps likely hide in edge cases and judgment calls."
        : "Critical workflows are not written down end-to-end—staff improvise or hunt you.",
    likelyConsequence:
      risk >= 55
        ? "The same questions and mistakes recycle because there is no single source of truth."
        : "New hires and float staff create variance you have to personally correct.",
    businessImpact:
      risk >= 75
        ? "Scaling headcount scales your interrupt load—not operational reliability."
        : "Without plays, quality depends on who is on shift—not the business.",
  }
}

function buildDiagnosticCards(answers: OperationalScanAnswers): ScanDiagnosticCard[] {
  const cards = [
    buildKnowledgeCard(answers),
    buildTrainingCard(answers),
    buildOperationsStopCard(answers),
    buildInterruptionsCard(answers),
    buildMissingProceduresCard(answers),
  ]

  return cards
    .filter((card) => card.severityScore >= 28)
    .sort((a, b) => {
      const rank = severityRank(b.severity) - severityRank(a.severity)
      if (rank !== 0) return rank
      return b.severityScore - a.severityScore
    })
    .slice(0, 5)
}

export function computeScanConfidence(result: OperationalScanResult): number {
  const significantFactors = result.scoreBreakdown.filter((item) => item.points >= 8).length
  const escalationSignal = result.escalationBonus > 0 ? 8 : 0
  const severitySignal =
    result.severity === "CRITICAL"
      ? 10
      : result.severity === "HIGH"
        ? 7
        : result.severity === "MODERATE"
          ? 4
          : 0
  const topFactor = Math.max(...result.scoreBreakdown.map((item) => item.points), 0)

  return clamp(
    Math.round(62 + significantFactors * 4 + escalationSignal + severitySignal + (topFactor >= 20 ? 5 : 0)),
    64,
    96
  )
}

function buildRecommendations(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): ScanRecommendation[] {
  type Candidate = ScanRecommendation & { weight: number }
  const candidates: Candidate[] = []

  if (answers.staffCanOpenWithoutOwner === "no" || answers.staffCanCloseWithoutOwner === "no") {
    candidates.push({
      id: "open_close_sop",
      priority: 0,
      weight: 92,
      title: "Publish open and close procedures",
      action:
        "Write one-page open and close plays with a named team lead—your phone should not be step one.",
      estimatedEffort: "2–4 hours",
      expectedReadinessGain: formatReadinessGain(18),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(8),
    })
  } else if (answers.staffCanOpenWithoutOwner === "partial" || answers.staffCanCloseWithoutOwner === "partial") {
    candidates.push({
      id: "open_close_sop",
      priority: 0,
      weight: 58,
      title: "Finish open and close procedures",
      action: "Close the gaps so a call-out does not put the day back on your calendar.",
      estimatedEffort: "1–2 hours",
      expectedReadinessGain: formatReadinessGain(10),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(5),
    })
  }

  if (answers.undocumentedProcedures !== "0") {
    const gain = answers.undocumentedProcedures === "31+" ? 16 : answers.undocumentedProcedures === "16-30" ? 12 : 8
    candidates.push({
      id: "document_tribal_knowledge",
      priority: 0,
      weight: answers.undocumentedProcedures === "31+" ? 88 : 70,
      title: "Document the next tribal-knowledge procedure",
      action: "Capture one load-bearing workflow only you know—assign an owner before it becomes another interrupt.",
      estimatedEffort: answers.undocumentedProcedures === "31+" ? "Half day" : "1–2 hours",
      expectedReadinessGain: formatReadinessGain(gain),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(Math.round(gain * 0.6)),
    })
  }

  if (answers.trainingConsistency === "none" || answers.trainingConsistency === "rarely") {
    candidates.push({
      id: "attach_training",
      priority: 0,
      weight: 78,
      title: "Attach training to one high-variance procedure",
      action: "Tie a module to the task that generates the most questions—completion means they run it without re-teaching.",
      estimatedEffort: "Half day",
      expectedReadinessGain: formatReadinessGain(14),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(6),
    })
  } else if (answers.trainingConsistency === "sometimes") {
    candidates.push({
      id: "attach_training",
      priority: 0,
      weight: 52,
      title: "Standardize training sign-off",
      action: "Same module, same completion criteria, every hire—not whoever is available that day.",
      estimatedEffort: "2–3 hours",
      expectedReadinessGain: formatReadinessGain(9),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(4),
    })
  }

  const textsMid = weeklyCountMidpoint(answers.ownerTextsCallsPerWeek)
  if (textsMid >= 16) {
    candidates.push({
      id: "interrupt_log",
      priority: 0,
      weight: 85,
      title: "Log and kill repeat owner interrupts",
      action: `Track ~${textsMid}+ texts/calls for 14 days—each repeat becomes a written owner and procedure.`,
      estimatedEffort: "1 week (15 min/day)",
      expectedReadinessGain: formatReadinessGain(12),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(10),
    })
  }

  const staffMid = weeklyCountMidpoint(answers.staffQuestionsPerWeek)
  if (staffMid >= 16) {
    candidates.push({
      id: "staff_questions",
      priority: 0,
      weight: 80,
      title: "Turn staff questions into written answers",
      action: `Staff bring ~${staffMid}+ questions a week—each one is a procedure you have not published yet.`,
      estimatedEffort: "2–4 hours",
      expectedReadinessGain: formatReadinessGain(11),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(7),
    })
  }

  if (answers.canRunFiveDaysWithoutOwner === "no") {
    candidates.push({
      id: "five_day_proof",
      priority: 0,
      weight: 88,
      title: "Prove five days away is possible",
      action: "Backup coverage, written judgment calls, and named owners for vendor and quality fires.",
      estimatedEffort: "1–2 weeks",
      expectedReadinessGain: formatReadinessGain(20),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(6),
    })
  } else if (answers.canRunFiveDaysWithoutOwner === "partial") {
    candidates.push({
      id: "five_day_proof",
      priority: 0,
      weight: 56,
      title: "Stress-test a week away",
      action: "Run one planned absence—quality, cash, and vendor issues expose gaps faster than optimism.",
      estimatedEffort: "Half day planning",
      expectedReadinessGain: formatReadinessGain(10),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(3),
    })
  }

  if (answers.repeatedMistakesIssues === "weekly" || answers.repeatedMistakesIssues === "daily") {
    candidates.push({
      id: "repeat_issues",
      priority: 0,
      weight: 74,
      title: "Close the loop on repeating mistakes",
      action: "Open a bottleneck for the top repeat and link it to the procedure that should prevent it.",
      estimatedEffort: "2–3 hours",
      expectedReadinessGain: formatReadinessGain(9),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(5),
    })
  }

  if (result.severity === "HIGH" || result.severity === "CRITICAL") {
    candidates.push({
      id: "install_rivet",
      priority: 0,
      weight: 65,
      title: "Install Rivet as your operating system",
      action: "Document procedures, track training, and log what still routes back to you—so the business is not stuck in your head.",
      estimatedEffort: "1–2 days setup",
      expectedReadinessGain: formatReadinessGain(22),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(12),
    })
  }

  candidates.sort((a, b) => b.weight - a.weight)

  const seen = new Set<string>()
  const out: ScanRecommendation[] = []
  for (const candidate of candidates) {
    if (out.length >= 3) break
    if (seen.has(candidate.id)) continue
    seen.add(candidate.id)
    out.push({
      id: candidate.id,
      priority: out.length + 1,
      title: candidate.title,
      action: candidate.action,
      estimatedEffort: candidate.estimatedEffort,
      expectedReadinessGain: candidate.expectedReadinessGain,
      expectedInterruptionReduction: candidate.expectedInterruptionReduction,
    })
  }

  const fallbacks: Omit<ScanRecommendation, "priority">[] = [
    {
      id: "interrupt_log_fallback",
      title: "Log every owner pull for one week",
      action: "Patterns show what to document first—before you guess wrong.",
      estimatedEffort: "15 min/day",
      expectedReadinessGain: formatReadinessGain(6),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(4),
    },
    {
      id: "assign_owner_fallback",
      title: "Assign one judgment call you still own",
      action: "Pick the decision only you make today and give it a written owner by Friday.",
      estimatedEffort: "1 hour",
      expectedReadinessGain: formatReadinessGain(5),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(2),
    },
    {
      id: "document_one_fallback",
      title: "Document one load-bearing procedure",
      action: "Capture the workflow that generates the most questions—before complexity outruns you.",
      estimatedEffort: "1–2 hours",
      expectedReadinessGain: formatReadinessGain(7),
      expectedInterruptionReduction: formatFewerInterruptionsOutcome(3),
    },
  ]

  let fallbackIndex = 0
  while (out.length < 3 && fallbackIndex < fallbacks.length) {
    const fb = fallbacks[fallbackIndex]!
    fallbackIndex += 1
    if (seen.has(fb.id)) continue
    seen.add(fb.id)
    out.push({ ...fb, priority: out.length + 1 })
  }

  return out
}

export function computeHoursLeakage(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): ScanHoursLeakage {
  const staffWeekly = weeklyCountMidpoint(answers.staffQuestionsPerWeek)
  const ownerWeekly = weeklyCountMidpoint(answers.ownerTextsCallsPerWeek)
  const interruptionsPerWeek = Math.round(staffWeekly + ownerWeekly)
  const minutes = minutesPerInterruption(result.severity)
  const hoursPerYear = Math.round(((interruptionsPerWeek * minutes) / 60) * 52)
  const rate = ownerHourlyRate(answers)
  const estimatedDollarValue = Math.round(hoursPerYear * rate)

  return {
    interruptionsPerWeek,
    minutesPerInterruption: minutes,
    hoursPerYear,
    estimatedDollarValue,
  }
}

function parseFewerInterruptionsPerWeek(text: string): number {
  const match = text.match(/(\d+)\s+fewer interruption/i)
  return match ? Number(match[1]) : 0
}

export function computeInterruptionsPreventedAnnually(
  recommendations: ScanRecommendation[]
): number {
  const perWeek = recommendations.reduce(
    (sum, rec) => sum + parseFewerInterruptionsPerWeek(rec.expectedInterruptionReduction),
    0
  )
  return Math.round(perWeek * 52 * 0.6)
}

export function buildWhyRivetBelieves(
  answers: OperationalScanAnswers,
  cards: ScanDiagnosticCard[],
  result: OperationalScanResult
): string[] {
  const lines: string[] = []

  for (const card of cards.slice(0, 3)) {
    lines.push(card.currentState)
  }

  if (answers.canRunFiveDaysWithoutOwner === "no") {
    lines.push("You said the business cannot reliably run a full week without you in the loop.")
  }

  if (answers.repeatedMistakesIssues === "weekly" || answers.repeatedMistakesIssues === "daily") {
    lines.push("The same mistakes and issues repeat often—usually a sign nothing owns the fix yet.")
  }

  if (result.severity === "CRITICAL" || result.severity === "HIGH") {
    lines.push(
      "Several load-bearing workflows still default to you—opening, judgment calls, or tribal knowledge."
    )
  }

  const unique = [...new Set(lines.map((l) => l.trim()).filter(Boolean))]
  return unique.slice(0, 5)
}

export function buildBiggestRisks(cards: ScanDiagnosticCard[]): string[] {
  return cards.slice(0, 3).map((c) => c.title)
}

export function buildOwnerDependencyNarrative(result: OperationalScanResult): string {
  switch (result.severity) {
    case "LOW":
      return "You have runway—but one undocumented procedure or training gap can put you back on the phone."
    case "MODERATE":
      return "The business runs day to day, but too many decisions and exceptions still route through you."
    case "HIGH":
      return "You are the operational backstop. When something breaks, the team waits for you."
    case "CRITICAL":
      return "The operation is fused to you. Time away is a risk event—not a recovery plan."
    default:
      return "Owner dependency is shaping how reliably this business can run without you."
  }
}

function buildImpactProjection(
  recommendations: ScanRecommendation[],
  leakage: ScanHoursLeakage
): ScanImpactProjection {
  return {
    hoursTrappedAnnually: leakage.hoursPerYear,
    interruptionsPerWeek: leakage.interruptionsPerWeek,
    interruptionsPreventedAnnually: computeInterruptionsPreventedAnnually(recommendations),
    estimatedDollarValue: leakage.estimatedDollarValue,
  }
}

/** Full diagnosis view for the scan results page. */
export function buildScanDiagnosis(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): ScanDiagnosisView {
  const diagnosticCards = buildDiagnosticCards(answers)
  const recommendations = buildRecommendations(result, answers)
  const hoursLeakage = computeHoursLeakage(result, answers)

  return {
    confidenceScore: computeScanConfidence(result),
    operationalRiskLabel: formatSeverityLabel(result.severity),
    ownerFreeCapacityLabel: formatAbsenceDays(result.estimatedOwnerFreeDays),
    ownerDependencyNarrative: buildOwnerDependencyNarrative(result),
    biggestRisks: buildBiggestRisks(diagnosticCards),
    whyRivetBelieves: buildWhyRivetBelieves(answers, diagnosticCards, result),
    fastestPath: recommendations[0] ?? null,
    impact: buildImpactProjection(recommendations, hoursLeakage),
    diagnosticCards,
    recommendations,
    hoursLeakage,
  }
}

export function formatScanDiagnosisHeadline(result: OperationalScanResult): string {
  if (result.severity === "LOW") {
    return "Rivet sees headroom—but dependency can creep in fast"
  }
  return "Rivet understood how fused you are to this operation"
}

export function formatScanDiagnosisSummary(result: OperationalScanResult): string {
  const days = formatAbsenceDays(result.estimatedOwnerFreeDays)
  return `Estimated owner-free capacity: ${days} before operational strain`
}
