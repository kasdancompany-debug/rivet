import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"
import { textsCallsBandToLeadCadence, weeklyCountMidpoint } from "@/lib/operational-scan/score"
import type { TablesInsert } from "@/types/database"

export type ScanLeadInsertRow = TablesInsert<"scan_leads">

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ScanLeadValidationError = { field: string; message: string }

function staffBandToEmployees(band: OperationalScanAnswers["staffQuestionsPerWeek"]): number {
  const mid = weeklyCountMidpoint(band)
  if (mid >= 40) return 50
  if (mid >= 22) return 20
  if (mid >= 10) return 8
  return 3
}

export function validateScanAnswersForLead(answers: OperationalScanAnswers): ScanLeadValidationError | null {
  const business = answers.businessName.trim()
  if (business.length < 2) {
    return { field: "businessName", message: "Business name is required (at least 2 characters)." }
  }
  if (!answers.industry.trim()) {
    return { field: "industry", message: "Industry is required." }
  }
  const email = answers.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { field: "email", message: "A valid email is required." }
  }
  return null
}

export function answersToScanLeadRow(
  answers: OperationalScanAnswers,
  result: OperationalScanResult
): ScanLeadInsertRow {
  const proceduresOk =
    answers.undocumentedProcedures === "0" || answers.undocumentedProcedures === "1-5"

  const trainingOk =
    answers.trainingConsistency === "consistent" || answers.trainingConsistency === "sometimes"

  const issuesTracked =
    answers.repeatedMistakesIssues === "rarely" || answers.repeatedMistakesIssues === "monthly"

  return {
    business_name: answers.businessName.trim(),
    website: answers.website.trim(),
    industry: answers.industry.trim(),
    employees: staffBandToEmployees(answers.staffQuestionsPerWeek),
    locations: 1,
    owner_interruptions: textsCallsBandToLeadCadence(answers.ownerTextsCallsPerWeek),
    procedures_documented: proceduresOk,
    training_published: trainingOk,
    recurring_issues_tracked: issuesTracked,
    email: answers.email.trim().toLowerCase(),
    rivet_index: result.ownerDependencyScore,
    founder_dependency: result.severity,
    execution_drift: Math.min(100, result.estimatedInterruptionsPerMonth),
    training_fragility: Math.min(100, result.estimatedOwnerHoursLostPerMonth),
    owner_routing: Math.min(100, Math.round(result.estimatedAnnualCost / 1000)),
    owner_dependency_score: result.ownerDependencyScore,
    severity: result.severity,
    est_interruptions_month: result.estimatedInterruptionsPerMonth,
    est_hours_lost_month: result.estimatedOwnerHoursLostPerMonth,
    est_annual_cost: result.estimatedAnnualCost,
    scan_version: "v3",
    scan_answers: answers as unknown as TablesInsert<"scan_leads">["scan_answers"],
  }
}
