import { describe, expect, it } from "vitest"

import {
    computeAbsenceCapacity,
  estimatedDaysFromScore,
  formatAbsenceDays,
} from "@/lib/escape-readiness/absence-capacity"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"

describe("estimatedDaysFromScore", () => {
  it("maps example score bands to day anchors", () => {
    expect(formatAbsenceDays(estimatedDaysFromScore(20))).toBe("0.5 days")
    expect(formatAbsenceDays(estimatedDaysFromScore(60))).toBe("2 days")
    expect(formatAbsenceDays(estimatedDaysFromScore(73))).toBe("3.6 days")
    expect(formatAbsenceDays(estimatedDaysFromScore(90))).toBe("7 days")
    expect(formatAbsenceDays(estimatedDaysFromScore(100))).toBe("14 days")
  })
})

describe("computeAbsenceCapacity", () => {
  it("derives failure point from weakest factor", () => {
    const view = finalizeEscapeReadinessView({
      score: 73,
      factors: [
        { id: "sop_coverage", label: "Play coverage", percent: 52, hint: "" },
        { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
        { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
        { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
        { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
      ],
    })

    expect(view.absenceCapacity).not.toBeNull()
    expect(view.absenceCapacity!.estimatedLabel).toBe("3.6 days")
    expect(view.absenceCapacity!.likelyFailurePoint).toBe("Texts and walk-ups routing to you")
    expect(view.absenceCapacity!.confidencePercent).toBeGreaterThanOrEqual(35)
    expect(view.absenceCapacity!.confidencePercent).toBeLessThanOrEqual(94)
    expect(view.absenceCapacity!.failureAtDays).toBeLessThan(view.absenceCapacity!.estimatedDays)
  })

  it("returns null when score is missing", () => {
    expect(computeAbsenceCapacity(null, [])).toBeNull()
  })
})
