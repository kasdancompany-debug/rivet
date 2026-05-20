import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"
import type { TablesInsert } from "@/types/database"

export type ScanLeadInsertRow = TablesInsert<"scan_leads">

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ScanLeadValidationError = { field: string; message: string }

function staffBandToEmployees(band: OperationalScanAnswers["staffQuestionsPerWeek"]): number {
  switch (band) {
    case "0-5":
      return 3
    case "6-15":
      return 8
    case "16-30":
      return 20
    case "31-50":
      return 35
    case "51+":
      return 50
    default:
      return 8
  }
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

  return {
    business_name: answers.businessName.trim(),
    website: answers.website.trim(),
    industry: answers.industry.trim(),
    employees: staffBandToEmployees(answers.staffQuestionsPerWeek),
    locations: 1,
    owner_interruptions: answers.ownerInterruptions,
    procedures_documented: proceduresOk,
    training_published: answers.trainingProcessExists,
    recurring_issues_tracked: answers.canRunFiveDaysWithoutOwner === "yes",
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
    scan_version: "v2",
  }
}
