import { describe, expect, it } from "vitest"

import { analyzeIssueFixRecommendation } from "@/lib/issues/fix-recommendation/analyze-issue-fix"

describe("analyzeIssueFixRecommendation", () => {
  const profiles = [
    { id: "owner", full_name: "Jordan", role: "owner", business_id: "b1" },
    { id: "lead", full_name: "Sam", role: "shift_lead", business_id: "b1" },
    { id: "rep", full_name: "Alex", role: "barista", business_id: "b1" },
  ] as never[]

  it("returns empty recommendation for first-time issues", () => {
    const issue = {
      id: "i1",
      title: "Drink remakes",
      category: "product_quality",
      severity: "medium",
      description: null,
      owner_required: false,
      status: "not_started",
      created_at: "2026-05-17T12:00:00Z",
      reported_by: "rep",
    } as never

    const result = analyzeIssueFixRecommendation({
      issue,
      history: [issue],
      profiles,
      standards: [],
      modules: [],
      businessOwnerId: "owner",
    })

    expect(result.isRepeated).toBe(false)
    expect(result.suggestedPlay).toBeNull()
  })

  it("recommends play, training, owner, and reduction for repeats", () => {
    const issue = {
      id: "i2",
      title: "Drink remakes",
      category: "product_quality",
      severity: "high",
      description: "Wrong milk again",
      owner_required: true,
      status: "not_started",
      created_at: "2026-05-17T12:00:00Z",
      reported_by: "rep",
    } as never

    const history = [
      {
        id: "i1",
        title: "Drink remakes",
        category: "product_quality",
        severity: "high",
        description: null,
        owner_required: true,
        status: "not_started",
        created_at: "2026-05-05T12:00:00Z",
        reported_by: "rep",
      },
      issue,
    ] as never[]

    const result = analyzeIssueFixRecommendation({
      issue,
      history,
      profiles,
      standards: [{ id: "s1", title: "Drink remakes recovery", status: "active" } as never],
      modules: [],
      businessOwnerId: "owner",
    })

    expect(result.isRepeated).toBe(true)
    expect(result.repeatCount).toBe(2)
    expect(result.suggestedPlay?.title).toMatch(/drink/i)
    expect(result.suggestedOwner?.name).toBe("Jordan")
    expect(result.estimatedRepeatReductionPercent).toBeGreaterThanOrEqual(25)
    expect(result.relatedPlayTitle).toBe("Drink remakes recovery")
  })
})
