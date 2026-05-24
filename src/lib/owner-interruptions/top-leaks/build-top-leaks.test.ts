import { describe, expect, it } from "vitest"

import { buildTopLeaks } from "@/lib/owner-interruptions/top-leaks/build-top-leaks"

describe("buildTopLeaks", () => {
  it("ranks leaks by estimated owner time and attaches suggested fixes", () => {
    const historyRows = [
      {
        id: "1",
        business_id: "b1",
        logged_by: "u1",
        kind: "approval_request" as const,
        summary: "Approve comp for call-out",
        detail: null,
        estimated_minutes: 10,
        urgency: "today" as const,
        source: "text_message" as const,
        related_bottleneck_id: null,
        occurred_at: "2026-05-10T12:00:00Z",
        created_at: "2026-05-10T12:00:00Z",
        updated_at: "2026-05-10T12:00:00Z",
      },
      {
        id: "2",
        business_id: "b1",
        logged_by: "u1",
        kind: "approval_request" as const,
        summary: "Approve comp for call-out",
        detail: null,
        estimated_minutes: 20,
        urgency: "today" as const,
        source: "text_message" as const,
        related_bottleneck_id: null,
        occurred_at: "2026-05-12T12:00:00Z",
        created_at: "2026-05-12T12:00:00Z",
        updated_at: "2026-05-12T12:00:00Z",
      },
      {
        id: "3",
        business_id: "b1",
        logged_by: "u1",
        kind: "staff_ping" as const,
        summary: "Where is the checklist?",
        detail: null,
        estimated_minutes: 5,
        urgency: "today" as const,
        source: "slack" as const,
        related_bottleneck_id: null,
        occurred_at: "2026-05-11T12:00:00Z",
        created_at: "2026-05-11T12:00:00Z",
        updated_at: "2026-05-11T12:00:00Z",
      },
      {
        id: "4",
        business_id: "b1",
        logged_by: "u1",
        kind: "staff_ping" as const,
        summary: "Where is the checklist?",
        detail: null,
        estimated_minutes: 5,
        urgency: "today" as const,
        source: "slack" as const,
        related_bottleneck_id: null,
        occurred_at: "2026-05-13T12:00:00Z",
        created_at: "2026-05-13T12:00:00Z",
        updated_at: "2026-05-13T12:00:00Z",
      },
    ]

    const leaks = buildTopLeaks({
      repeatCategories: [
        { key: "approve comp for call-out", label: "Approve comp for call-out", count: 2 },
        { key: "where is the checklist?", label: "Where is the checklist?", count: 2 },
      ],
      historyRows,
    })

    expect(leaks).toHaveLength(2)
    expect(leaks[0]?.rank).toBe(1)
    expect(leaks[0]?.name).toBe("Approve comp for call-out")
    expect(leaks[0]?.estimatedOwnerMinutes).toBe(30)
    expect(leaks[0]?.occurrences).toBe(2)
    expect(leaks[0]?.suggestedFix).toContain("SOP")
    expect(leaks[0]?.createHref).toContain("/sops/capture")
  })
})
