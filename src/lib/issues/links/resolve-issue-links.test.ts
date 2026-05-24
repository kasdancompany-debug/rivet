import { describe, expect, it } from "vitest"

import { resolveIssueLinks } from "@/lib/issues/links/resolve-issue-links"

describe("resolveIssueLinks", () => {
  it("resolves each link kind with href and labels", () => {
    const views = resolveIssueLinks(
      [
        { id: "l1", bottleneck_id: "b1", kind: "standard", target_id: "s1" },
        { id: "l2", bottleneck_id: "b1", kind: "training_module", target_id: "m1" },
        { id: "l3", bottleneck_id: "b1", kind: "owner_interruption", target_id: "i1" },
        { id: "l4", bottleneck_id: "b1", kind: "staff_member", target_id: "p1" },
      ],
      {
        standards: [{ id: "s1", title: "Closing checklist", status: "active" }],
        modules: [{ id: "m1", title: "Bar basics" }],
        interruptions: [
          {
            id: "i1",
            summary: "Approve refund",
            kind: "approval_request",
            occurred_at: "2026-05-18T10:00:00Z",
          },
        ],
        profiles: [{ id: "p1", full_name: "Alex Rivera", role: "barista" }],
      }
    )

    expect(views[0]).toMatchObject({
      title: "Closing checklist",
      href: "/sops/s1",
    })
    expect(views[1]).toMatchObject({
      title: "Bar basics",
      href: "/training/modules/m1",
    })
    expect(views[2]).toMatchObject({
      title: "Approve refund",
      subtitle: "Approval",
      href: "/interruptions",
    })
    expect(views[3]).toMatchObject({
      title: "Alex Rivera",
      href: "/training",
    })
  })

  it("handles missing targets gracefully", () => {
    const [view] = resolveIssueLinks(
      [{ id: "l1", bottleneck_id: "b1", kind: "standard", target_id: "gone" }],
      { standards: [], modules: [], interruptions: [], profiles: [] }
    )

    expect(view.title).toBe("Removed SOP")
    expect(view.href).toBeNull()
  })
})
