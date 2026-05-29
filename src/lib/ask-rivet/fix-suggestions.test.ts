import { describe, expect, it } from "vitest"

import { suggestFixForRepeatedQuestion } from "@/lib/ask-rivet/fix-suggestions"

describe("suggestFixForRepeatedQuestion", () => {
  it("returns null for single asks", () => {
    expect(
      suggestFixForRepeatedQuestion({
        askCount: 1,
        standardId: null,
        lowConfidenceCount: 1,
        hasTrainingModule: false,
        hasMedia: false,
      })
    ).toBeNull()
  })

  it("suggests create play when no standard exists", () => {
    expect(
      suggestFixForRepeatedQuestion({
        askCount: 3,
        standardId: null,
        lowConfidenceCount: 3,
        hasTrainingModule: false,
        hasMedia: false,
      })
    ).toBe("create_play")
  })

  it("suggests add media when play exists without media", () => {
    expect(
      suggestFixForRepeatedQuestion({
        askCount: 2,
        standardId: "std-1",
        lowConfidenceCount: 0,
        hasTrainingModule: true,
        hasMedia: false,
      })
    ).toBe("add_media")
  })

  it("suggests add training when play has media but no module", () => {
    expect(
      suggestFixForRepeatedQuestion({
        askCount: 2,
        standardId: "std-1",
        lowConfidenceCount: 0,
        hasTrainingModule: false,
        hasMedia: true,
      })
    ).toBe("add_training")
  })
})
