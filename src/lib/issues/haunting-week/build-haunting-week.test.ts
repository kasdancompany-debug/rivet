import { describe, expect, it } from "vitest"

import { buildHauntingWeek, sortHauntingWeekItems } from "@/lib/issues/haunting-week/build-haunting-week"

describe("buildHauntingWeek", () => {
  const now = new Date("2026-05-20T15:00:00Z")

  it("groups issues logged this UTC week by title", () => {
    const issues = [
      {
        id: "1",
        title: "Drink remakes",
        severity: "medium",
        owner_required: false,
        status: "not_started",
        created_at: "2026-05-18T12:00:00Z",
      },
      {
        id: "2",
        title: "Drink remakes",
        severity: "high",
        owner_required: true,
        status: "not_started",
        created_at: "2026-05-19T09:00:00Z",
      },
      {
        id: "3",
        title: "Scheduling confusion",
        severity: "low",
        owner_required: false,
        status: "not_started",
        created_at: "2026-05-18T16:00:00Z",
      },
      {
        id: "4",
        title: "Old issue",
        severity: "critical",
        owner_required: true,
        status: "not_started",
        created_at: "2026-05-01T12:00:00Z",
      },
    ] as never[]

    const result = buildHauntingWeek({ issues, now, sort: "frequency" })

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe("Drink remakes")
    expect(result[0].frequency).toBe(2)
    expect(result[0].rank).toBe(1)
  })
})

describe("sortHauntingWeekItems", () => {
  const items = [
    {
      key: "a",
      title: "A",
      issueId: "1",
      frequency: 2,
      estimatedImpact: 50,
      timeCostScore: 45,
      painLevel: "medium" as const,
      ownerRequired: false,
      status: "not_started",
    },
    {
      key: "b",
      title: "B",
      issueId: "2",
      frequency: 1,
      estimatedImpact: 80,
      timeCostScore: 70,
      painLevel: "high" as const,
      ownerRequired: true,
      status: "not_started",
    },
  ]

  it("sorts by estimated impact", () => {
    const sorted = sortHauntingWeekItems(items, "impact")
    expect(sorted[0].key).toBe("b")
  })

  it("sorts by time cost", () => {
    const sorted = sortHauntingWeekItems(items, "time_cost")
    expect(sorted[0].key).toBe("b")
  })
})
