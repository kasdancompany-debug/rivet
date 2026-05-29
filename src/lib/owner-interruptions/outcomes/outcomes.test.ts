import { describe, expect, it } from "vitest"

import { computeFixImpact } from "@/lib/owner-interruptions/outcomes/compute-fix-impact"
import {
  countMatchingAskQueries,
  hasVerifiedAskAnswer,
} from "@/lib/owner-interruptions/outcomes/match-ask-rivet"
import { resolveInterruptionOutcomes } from "@/lib/owner-interruptions/outcomes/resolve-outcomes"
import type { Tables } from "@/types/database"

describe("interruption outcomes", () => {
  it("detects matching Ask Rivet questions", () => {
    const rows = [
      {
        normalized_question: "where is the closing checklist",
        standard_id: "std-1",
        response: { confidence: "high" },
      },
    ]
    expect(countMatchingAskQueries("Closing checklist location", rows)).toBe(1)
    expect(hasVerifiedAskAnswer("Closing checklist location", rows)).toBe(true)
  })

  it("resolves sop, training, and ask rivet outcomes", () => {
    const plan = {
      fix_type: "sop",
      draft_standard_id: "std-1",
      draft_module_id: "mod-1",
      related_standard_id: null,
      related_module_id: null,
    } as Tables<"interruption_action_plans">

    const outcomes = resolveInterruptionOutcomes({
      plan,
      interruptionSummary: "Closing checklist question",
      standards: [{ id: "std-1", title: "Closing checklist", status: "active" }],
      modules: [{ id: "mod-1", title: "Close training" }],
      trainingProgress: [{ training_module_id: "mod-1" }],
      askStandardId: "std-1",
      askVerified: true,
    })

    expect(outcomes.filter((o) => o.kind !== "media_added").every((o) => o.complete)).toBe(true)
    expect(outcomes.find((o) => o.kind === "sop_created")?.label).toBe("Play published")
    expect(outcomes.some((o) => o.kind === "media_added")).toBe(true)
  })

  it("tracks repeat pulls after publish", () => {
    const plan = {
      status: "published",
      published_at: "2026-05-10T12:00:00.000Z",
      ai_payload: { patternKey: "approve comp", baselineRepeatCount: 4 },
    } as unknown as Tables<"interruption_action_plans">

    const historyRows = [
      {
        summary: "Approve comp",
        occurred_at: "2026-05-01T10:00:00.000Z",
      },
      {
        summary: "Approve comp",
        occurred_at: "2026-05-08T10:00:00.000Z",
      },
      {
        summary: "Approve comp",
        occurred_at: "2026-05-12T10:00:00.000Z",
      },
    ] as Tables<"owner_interruptions">[]

    const impact = computeFixImpact({
      plan,
      interruptionSummary: "Approve comp",
      historyRows,
    })

    expect(impact).not.toBeNull()
    expect(impact!.beforeCount).toBe(4)
    expect(impact!.afterCount).toBe(1)
  })
})
