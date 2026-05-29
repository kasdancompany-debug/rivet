import { describe, expect, it } from "vitest"

import {
  askRivetConfidenceScorePercent,
  askRivetConfidenceTier,
  askRivetReviewStatusForConfidence,
  ASK_RIVET_LOW_SCORE_THRESHOLD,
} from "@/lib/ask-rivet/confidence"

describe("askRivetConfidenceTier", () => {
  it("refuses below low score threshold", () => {
    expect(askRivetConfidenceTier(ASK_RIVET_LOW_SCORE_THRESHOLD - 0.1)).toBe("low")
  })

  it("marks high scores as high confidence", () => {
    expect(askRivetConfidenceTier(8)).toBe("high")
  })

  it("marks mid scores as medium", () => {
    expect(askRivetConfidenceTier(5)).toBe("medium")
  })
})

describe("askRivetConfidenceScorePercent", () => {
  it("returns 0 for no match", () => {
    expect(askRivetConfidenceScorePercent(0)).toBe(0)
  })

  it("returns higher percent for stronger matches", () => {
    expect(askRivetConfidenceScorePercent(8)).toBeGreaterThan(
      askRivetConfidenceScorePercent(4)
    )
  })
})

describe("askRivetReviewStatusForConfidence", () => {
  it("auto-approves high confidence answers", () => {
    expect(askRivetReviewStatusForConfidence("high")).toBe("auto_approved")
  })

  it("queues medium confidence for owner review", () => {
    expect(askRivetReviewStatusForConfidence("medium")).toBe("pending")
  })
})
