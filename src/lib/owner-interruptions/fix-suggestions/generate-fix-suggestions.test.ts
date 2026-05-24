import { describe, expect, it } from "vitest"

import { generateInterruptionFixSuggestions } from "@/lib/owner-interruptions/fix-suggestions/generate-fix-suggestions"

describe("generateInterruptionFixSuggestions", () => {
  it("returns suggestions for repeat patterns", () => {
    const rows = [
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
        estimated_minutes: 12,
        urgency: "today" as const,
        source: "text_message" as const,
        related_bottleneck_id: null,
        occurred_at: "2026-05-12T12:00:00Z",
        created_at: "2026-05-12T12:00:00Z",
        updated_at: "2026-05-12T12:00:00Z",
      },
    ]

    const suggestions = generateInterruptionFixSuggestions({
      repeatCategories: [{ key: "approve comp for call-out", label: "Approve comp for call-out", count: 2 }],
      historyRows: rows,
    })

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]?.fixType).toBe("sop")
    expect(suggestions[0]?.estimatedInterruptionsPrevented).toBeGreaterThan(0)
    expect(suggestions[0]?.createHref).toContain("/sops/capture")
  })

  it("suggests training when knowledge gap signals appear", () => {
    const suggestions = generateInterruptionFixSuggestions({
      repeatCategories: [{ key: "new hire forgot opening safe", label: "New hire forgot opening safe", count: 3 }],
      historyRows: [
        {
          id: "1",
          business_id: "b1",
          logged_by: "u1",
          kind: "staff_ping" as const,
          summary: "New hire forgot opening safe",
          detail: "Never trained on safe code",
          estimated_minutes: 8,
          urgency: "today" as const,
          source: "slack" as const,
          related_bottleneck_id: null,
          occurred_at: "2026-05-10T12:00:00Z",
          created_at: "2026-05-10T12:00:00Z",
          updated_at: "2026-05-10T12:00:00Z",
        },
        {
          id: "2",
          business_id: "b1",
          logged_by: "u1",
          kind: "staff_ping" as const,
          summary: "New hire forgot opening safe",
          detail: null,
          estimated_minutes: 6,
          urgency: "today" as const,
          source: "in_person" as const,
          related_bottleneck_id: null,
          occurred_at: "2026-05-11T12:00:00Z",
          created_at: "2026-05-11T12:00:00Z",
          updated_at: "2026-05-11T12:00:00Z",
        },
      ],
    })

    expect(suggestions[0]?.fixType).toBe("training_module")
    expect(suggestions[0]?.createHref).toContain("/training/modules/new")
  })
})
