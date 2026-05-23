import { describe, expect, it } from "vitest"

import { answersToScanLeadRow, validateScanAnswersForLead } from "@/lib/operational-scan/scan-lead-payload"
import { computeOperationalScanScores, type OperationalScanAnswers } from "@/lib/operational-scan/score"

const baseAnswers: OperationalScanAnswers = {
  businessName: "Acme Cafe",
  website: "https://acme.test",
  industry: "Hospitality",
  email: "owner@test.co",
  staffQuestionsPerWeek: "6-15",
  ownerTextsCallsPerWeek: "16-30",
  staffCanOpenWithoutOwner: "partial",
  staffCanCloseWithoutOwner: "yes",
  undocumentedProcedures: "1-5",
  trainingConsistency: "consistent",
  canRunFiveDaysWithoutOwner: "partial",
  repeatedMistakesIssues: "monthly",
}

describe("scan-lead-payload v3", () => {
  it("validateScanAnswersForLead rejects bad email", () => {
    expect(validateScanAnswersForLead({ ...baseAnswers, email: "not-an-email" })?.field).toBe("email")
  })

  it("answersToScanLeadRow maps v3 scores", () => {
    const result = computeOperationalScanScores(baseAnswers)
    const row = answersToScanLeadRow(baseAnswers, result)
    expect(row.scan_version).toBe("v3")
    expect(row.owner_dependency_score).toBe(result.ownerDependencyScore)
    expect(row.severity).toBe(result.severity)
    expect(row.est_interruptions_month).toBe(result.estimatedInterruptionsPerMonth)
    expect(row.est_annual_cost).toBe(result.estimatedAnnualCost)
    expect(row.email).toBe("owner@test.co")
    expect(row.owner_interruptions).toBe("daily")
    expect(row.training_published).toBe(true)
    expect(row.recurring_issues_tracked).toBe(true)
    expect(row.scan_answers).toMatchObject({ businessName: "Acme Cafe" })
  })
})
