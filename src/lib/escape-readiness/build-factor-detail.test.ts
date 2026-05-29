import { describe, expect, it } from "vitest"

import { buildFactorDetail, enrichFactorsWithDetails } from "@/lib/escape-readiness/build-factor-detail"

describe("buildFactorDetail", () => {
  it("returns expandable detail with CTA per factor", () => {
    const detail = buildFactorDetail({
      id: "owner_interruptions",
      label: "Owner interruptions",
      percent: 32,
      hint: "12 pulls this week",
    })

    expect(detail.whatsMissing.length).toBeGreaterThan(0)
    expect(detail.suggestedAction.length).toBeGreaterThan(0)
    expect(detail.fixCta.href).toBe("/interruptions/log")
  })

  it("enriches all factors during finalization", () => {
    const enriched = enrichFactorsWithDetails([
      { id: "sop_coverage", label: "Play coverage", percent: 52, hint: "" },
    ])
    expect(enriched[0]!.detail.fixCta.href).toBe("/sops/new")
  })
})
