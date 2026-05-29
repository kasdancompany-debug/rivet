import { describe, expect, it } from "vitest"

import {
  buildBusinessBrainTimeline,
  buildEscapeReadinessEvents,
  buildInterruptionsReducedEvents,
  buildQuestionPreventedEvents,
  type BusinessBrainTimelineContext,
} from "./build-timeline"

function emptyCtx(overrides: Partial<BusinessBrainTimelineContext> = {}): BusinessBrainTimelineContext {
  return {
    sinceIso: "2026-01-01T00:00:00.000Z",
    standards: [],
    modulesById: new Map(),
    trainingItemTitleById: new Map(),
    profileNameById: new Map([["e1", "Alex Rivera"]]),
    trainingProgress: [],
    certifications: [],
    playCompletions: [],
    askQueries: [],
    interruptions: [],
    snapshots: [],
    ...overrides,
  }
}

describe("buildBusinessBrainTimeline", () => {
  it("sorts mixed events newest first", () => {
    const view = buildBusinessBrainTimeline(
      emptyCtx({
        askQueries: [
          {
            id: "a1",
            question_text: "How do we void?",
            standard_id: null,
            prevented_owner_interrupt: true,
            created_at: "2026-05-10T10:00:00.000Z",
          },
        ],
        standards: [
          {
            id: "s1",
            title: "Opening",
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-05-16T08:00:00.000Z",
          },
        ],
      }),
      new Date("2026-05-18T12:00:00.000Z").getTime()
    )

    expect(view.items.length).toBe(2)
    expect(view.items[0]?.kind).toBe("sop_change")
    expect(view.countsByKind.question_prevented).toBe(1)
  })
})

describe("buildQuestionPreventedEvents", () => {
  it("skips queries that did not prevent an owner pull", () => {
    const items = buildQuestionPreventedEvents(
      emptyCtx({
        askQueries: [
          {
            id: "a1",
            question_text: "Low confidence",
            standard_id: null,
            prevented_owner_interrupt: false,
            created_at: "2026-05-10T10:00:00.000Z",
          },
        ],
      })
    )
    expect(items).toHaveLength(0)
  })
})

describe("buildInterruptionsReducedEvents", () => {
  it("emits when a week drops meaningfully vs the prior week", () => {
    const items = buildInterruptionsReducedEvents(
      emptyCtx({
        interruptions: [
          { id: "1", occurred_at: "2026-05-05T10:00:00.000Z" },
          { id: "2", occurred_at: "2026-05-06T10:00:00.000Z" },
          { id: "3", occurred_at: "2026-05-07T10:00:00.000Z" },
          { id: "4", occurred_at: "2026-05-07T11:00:00.000Z" },
          { id: "5", occurred_at: "2026-05-12T10:00:00.000Z" },
        ],
      })
    )
    expect(items).toHaveLength(1)
    expect(items[0]?.kind).toBe("interruptions_reduced")
  })
})

describe("buildEscapeReadinessEvents", () => {
  it("emits when autonomy score moves at least 2 points", () => {
    const items = buildEscapeReadinessEvents(
      emptyCtx({
        snapshots: [
          {
            id: "1",
            business_id: "b",
            snapshot_date: "2026-05-10",
            dependency_score: 40,
            autonomy_score: 60,
            category_scores: {},
            critical_warnings: [],
            created_at: "",
            updated_at: "",
          },
          {
            id: "2",
            business_id: "b",
            snapshot_date: "2026-05-11",
            dependency_score: 38,
            autonomy_score: 65,
            category_scores: {},
            critical_warnings: [],
            created_at: "",
            updated_at: "",
          },
        ],
      })
    )
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toContain("rose")
  })
})
