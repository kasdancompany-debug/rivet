import { describe, expect, it } from "vitest"

import { buildOperationalFixActions } from "@/lib/owner-interruptions/fix-suggestions/build-operational-fix-actions"

describe("buildOperationalFixActions", () => {
  it("bundles play, media, and training for repeat refund questions", () => {
    const actions = buildOperationalFixActions({
      label: "How do I process refunds?",
      repeatCount: 3,
      kind: "staff_ping",
      suggestedTitle: "Refund process",
      suggestedDescription: "Document refund steps and limits.",
      capturePrompt: "Staff keep asking how to process refunds.",
      relatedStandard: null,
      relatedModule: null,
      standardHasMedia: false,
      askMatchCount: 2,
    })

    const kinds = actions.map((a) => a.kind)
    expect(kinds).toContain("create_play")
    expect(kinds).toContain("assign_training")
    expect(kinds).toContain("wire_ask_rivet")
    expect(actions.find((a) => a.kind === "create_play")?.href).toContain("/sops/capture")
    expect(actions.find((a) => a.kind === "assign_training")?.href).toContain("/training/modules/new")
  })

  it("suggests media when a play exists but has no video", () => {
    const actions = buildOperationalFixActions({
      label: "Approve comp for call-out",
      repeatCount: 2,
      kind: "approval_request",
      suggestedTitle: "Comp approval",
      suggestedDescription: "Limits and who signs off.",
      capturePrompt: "Comp keeps routing to owner.",
      relatedStandard: { id: "std-1", title: "Comp policy", status: "active" },
      relatedModule: null,
      standardHasMedia: false,
      askMatchCount: 0,
    })

    expect(actions.map((a) => a.kind)).toContain("add_media")
    expect(actions.find((a) => a.kind === "add_media")?.href).toBe("/sops/std-1")
  })
})
