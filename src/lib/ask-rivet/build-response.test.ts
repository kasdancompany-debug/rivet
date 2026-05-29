import { describe, expect, it } from "vitest"

import { buildAskRivetResponse } from "@/lib/ask-rivet/build-response"
import { COPY } from "@/lib/interface-copy"
import type { SearchableStandard } from "@/lib/ask-rivet/search-knowledge"

const baseStandard: SearchableStandard = {
  id: "std-1",
  business_id: "biz-1",
  title: "Freezer load",
  category: "operations",
  description: "Load the walk-in freezer",
  importance_level: 3,
  owner_dependency_level: 2,
  estimated_time_minutes: 15,
  status: "active",
  standards_capture: {
    operationalMemory: {
      successLooksLike: "Every shelf labeled and temp logged.",
      failureLooksLike: "Mixed product with no dates.",
      newHireMistakes: ["Stacking hot product"],
      ifNobodyAsks: "Call the shift lead.",
      ownerNote: "Never block the fan.",
      goodExampleMediaId: null,
      badExampleMediaId: null,
      faqs: [],
    },
  },
  quiz_questions: null,
  created_by: "user-1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  standard_steps: [
    {
      id: "step-1",
      standard_id: "std-1",
      step_order: 1,
      title: "Check temp",
      instructions: "Verify walk-in is at 34°F before loading.",
      media_url: null,
      requires_photo_confirmation: false,
      requires_video_proof: false,
      requires_manager_signoff: false,
      requires_checklist_completion: true,
      estimated_time_minutes: 5,
      is_critical: true,
      verification: "Photo of thermometer reading.",
      notes: null,
      play_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}

describe("buildAskRivetResponse", () => {
  it("returns low confidence without inventing an answer when no match", () => {
    const res = buildAskRivetResponse({
      question: "How do I fix the espresso machine?",
      match: null,
      standard: null,
      signedMedia: [],
      relatedModules: [],
    })

    expect(res.confidence).toBe("low")
    expect(res.quickAnswer).toBe(COPY.askRivet.lowConfidenceAnswer)
    expect(res.suggestCreatePlay).toBe(true)
    expect(res.sourceLinks).toEqual([])
    expect(res.sourcePlay).toBeNull()
    expect(res.confidenceScore).toBe(0)
  })

  it("answers only from verified source material when matched", () => {
    const res = buildAskRivetResponse({
      question: "freezer temp before loading",
      match: {
        standardId: "std-1",
        standardTitle: "Freezer load",
        score: 8,
        topChunks: [
          {
            standardId: "std-1",
            standardTitle: "Freezer load",
            category: "operations",
            source: "step",
            text: "Verify walk-in is at 34°F before loading.",
            weight: 2,
          },
        ],
      },
      standard: baseStandard,
      signedMedia: [],
      relatedModules: [{ id: "mod-1", title: "Opening module" }],
    })

    expect(res.confidence).toBe("high")
    expect(res.quickAnswer).toContain("34°F")
    expect(res.playTitle).toBe("Freezer load")
    expect(res.sourceLinks.length).toBeGreaterThan(0)
    expect(res.sourcePlay?.title).toBe("Freezer load")
    expect(res.confidenceScore).toBeGreaterThanOrEqual(80)
    expect(res.suggestCreatePlay).toBe(false)
  })

  it("refuses weak title-only matches without substantive source text", () => {
    const res = buildAskRivetResponse({
      question: "random unrelated topic",
      match: {
        standardId: "std-1",
        standardTitle: "Freezer load",
        score: 2,
        topChunks: [
          {
            standardId: "std-1",
            standardTitle: "Freezer load",
            category: "operations",
            source: "play_title",
            text: "Freezer load",
            weight: 3,
          },
        ],
      },
      standard: baseStandard,
      signedMedia: [],
      relatedModules: [],
    })

    expect(res.confidence).toBe("low")
    expect(res.quickAnswer).toBe(COPY.askRivet.lowConfidenceAnswer)
  })
})
