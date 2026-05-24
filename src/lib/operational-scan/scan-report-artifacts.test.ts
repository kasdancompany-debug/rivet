import { describe, expect, it } from "vitest"

import { buildStoredScanReportPayload } from "@/lib/operational-scan/scan-report-types"
import { scanReportPublicUrl } from "@/lib/operational-scan/scan-report-url"
import { computeOperationalScanScores, type OperationalScanAnswers } from "@/lib/operational-scan/score"
import { recommendedFirstFixes } from "@/lib/operational-scan/recommended-next-steps"
import { buildScanReportPdf } from "@/lib/operational-scan/build-scan-report-pdf"

const baseAnswers: OperationalScanAnswers = {
  firstName: "Alex",
  businessName: "Acme Cafe",
  website: "",
  industry: "Hospitality",
  email: "alex@test.co",
  phone: "",
  staffQuestionsPerWeek: "16-30",
  ownerTextsCallsPerWeek: "16-30",
  staffCanOpenWithoutOwner: "partial",
  staffCanCloseWithoutOwner: "partial",
  undocumentedProcedures: "6-15",
  trainingConsistency: "sometimes",
  canRunFiveDaysWithoutOwner: "partial",
  repeatedMistakesIssues: "weekly",
}

describe("scan report artifacts", () => {
  it("builds public report URL", () => {
    expect(scanReportPublicUrl("abc-123", "https://rivet.app")).toBe("https://rivet.app/report/abc-123")
  })

  it("builds stored payload with fixes", () => {
    const result = computeOperationalScanScores(baseAnswers)
    const fixes = recommendedFirstFixes(result, baseAnswers)
    const payload = buildStoredScanReportPayload(baseAnswers, result, fixes)
    expect(payload.version).toBe("v3")
    expect(payload.fixes).toHaveLength(3)
  })

  it("generates a non-empty PDF", async () => {
    const result = computeOperationalScanScores(baseAnswers)
    const fixes = recommendedFirstFixes(result, baseAnswers)
    const payload = buildStoredScanReportPayload(baseAnswers, result, fixes)
    const pdf = await buildScanReportPdf(payload)
    expect(pdf.byteLength).toBeGreaterThan(500)
    expect(String.fromCharCode(pdf[0]!, pdf[1]!, pdf[2]!, pdf[3]!)).toBe("%PDF")
  })
})
