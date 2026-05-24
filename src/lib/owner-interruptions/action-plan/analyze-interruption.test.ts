import { describe, expect, it } from "vitest"

import {
  analyzeInterruptionForActionPlan,
  detectInterruptionFix,
  findRelatedModule,
  findRelatedStandard,
  resolveAffectedPeople,
} from "@/lib/owner-interruptions/action-plan/analyze-interruption"

describe("detectInterruptionFix", () => {
  it("routes training signals to a training module", () => {
    const fix = detectInterruptionFix("New hire doesn't know closing", "staff_ping", [])
    expect(fix.fixType).toBe("training_module")
    expect(fix.rootCause).toMatch(/reference/)
  })

  it("routes approval requests to an SOP", () => {
    const fix = detectInterruptionFix("Approve comp for call-out", "approval_request", [])
    expect(fix.fixType).toBe("sop")
    expect(fix.suggestedTitle).toMatch(/comp/i)
  })
})

describe("findRelatedStandard", () => {
  it("matches when titles share enough tokens", () => {
    const match = findRelatedStandard(
      [{ id: "s1", title: "Closing checklist approval", status: "active" } as never],
      "Need closing checklist approval again"
    )
    expect(match?.id).toBe("s1")
  })
})

describe("findRelatedModule", () => {
  it("matches training modules by title overlap", () => {
    const match = findRelatedModule(
      [{ id: "m1", title: "Opening shift training", assigned_role: "shift_lead" } as never],
      "Opening shift training question"
    )
    expect(match?.id).toBe("m1")
  })
})

describe("resolveAffectedPeople", () => {
  it("includes the logger and role matches", () => {
    const people = resolveAffectedPeople({
      profiles: [
        { id: "logger", full_name: "Alex", role: "shift_lead" } as never,
        { id: "peer", full_name: "Sam", role: "shift_lead" } as never,
        { id: "other", full_name: "Pat", role: "barista" } as never,
      ],
      businessOwnerId: "owner",
      loggerId: "logger",
      loggerRole: "shift_lead",
      inferredRoles: ["shift_lead"],
    })

    expect(people.map((p) => p.profileId)).toEqual(expect.arrayContaining(["logger", "peer"]))
    expect(people.find((p) => p.profileId === "logger")?.reason).toBe("Logged this pull")
  })
})

describe("analyzeInterruptionForActionPlan", () => {
  it("combines repeat count, related refs, and inferred roles", () => {
    const row = {
      id: "i1",
      summary: "Comp approval for call-out",
      kind: "approval_request" as const,
      detail: null,
    }

    const analysis = analyzeInterruptionForActionPlan({
      interruption: row as never,
      historyRows: [row as never, { ...row, id: "i2" } as never],
      standards: [{ id: "s1", title: "Comp approval limits", status: "active" } as never],
      modules: [],
      loggerProfile: { id: "logger", role: "shift_lead" },
    })

    expect(analysis.repeatCount).toBe(2)
    expect(analysis.fixType).toBe("sop")
    expect(analysis.relatedStandard?.id).toBe("s1")
    expect(analysis.inferredRoles).toContain("shift_lead")
  })
})
