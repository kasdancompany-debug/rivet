import { describe, expect, it } from "vitest"

import { COPY } from "@/lib/interface-copy"

import {
  coalesceAskRivetResponse,
  gateAskRivetResponseForStaff,
} from "./coalesce-response"
import type { AskRivetResponse } from "./types"

const baseResponse: AskRivetResponse = {
  title: "Freezer load",
  quickAnswer: "Verify walk-in is at 34°F before loading.",
  visualExample: null,
  videoUrl: null,
  mediaAttachments: [],
  commonMistakes: [],
  ownerNote: null,
  relatedModules: [{ id: "mod-1", title: "Opening", href: "/learn/mod-1" }],
  relatedCertifications: [],
  estimatedMinutes: 15,
  standardId: "std-1",
  standardHref: "/learn/plays/std-1",
  playTitle: "Freezer load",
  matchedSource: "step",
  confidence: "medium",
  matchScore: 5,
  confidenceScore: 52,
  sourcePlay: {
    id: "std-1",
    title: "Freezer load",
    href: "/learn/plays/std-1",
    excerpt: "Verify walk-in is at 34°F before loading.",
    sourceType: "step",
  },
  sourceTraining: null,
  sourceLinks: [],
  sourcesSearched: ["Plays"],
  suggestCreatePlay: false,
}

describe("gateAskRivetResponseForStaff", () => {
  it("returns medium answers on owner ask page", () => {
    const gated = gateAskRivetResponseForStaff(baseResponse, { portal: false, isOwner: true })
    expect(gated.quickAnswer).toBe(baseResponse.quickAnswer)
    expect(gated.confidence).toBe("medium")
  })

  it("refuses medium answers for staff on portal", () => {
    const gated = gateAskRivetResponseForStaff(baseResponse, { portal: true, isOwner: false })
    expect(gated.quickAnswer).toBe(COPY.askRivet.lowConfidenceAnswer)
    expect(gated.confidence).toBe("low")
    expect(gated.sourcePlay).toBeNull()
    expect(gated.confidenceScore).toBe(52)
  })

  it("allows high confidence answers for staff", () => {
    const high = { ...baseResponse, confidence: "high" as const, confidenceScore: 90 }
    const gated = gateAskRivetResponseForStaff(high, { portal: true, isOwner: false })
    expect(gated.quickAnswer).toBe(high.quickAnswer)
    expect(gated.sourcePlay).not.toBeNull()
  })
})

describe("coalesceAskRivetResponse", () => {
  it("merges partial stored responses safely", () => {
    const merged = coalesceAskRivetResponse(
      { title: "Play", quickAnswer: "Old", confidence: "medium", matchScore: 5, confidenceScore: 50 },
      { quickAnswer: "Improved answer text here.", confidence: "high", confidenceScore: 85 }
    )
    expect(merged?.quickAnswer).toBe("Improved answer text here.")
    expect(merged?.confidence).toBe("high")
  })

  it("returns null when required fields are missing", () => {
    expect(coalesceAskRivetResponse({ quickAnswer: "only answer" })).toBeNull()
  })
})
