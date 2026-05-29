import { describe, expect, it } from "vitest"

import { computeSuccessionRisk } from "@/lib/succession/compute-risk"

describe("computeSuccessionRisk", () => {
  it("flags missing primary as critical", () => {
    const r = computeSuccessionRisk({
      primaryProfileId: null,
      backupProfileId: "b1",
      capabilityField: null,
      vmById: new Map(),
    })
    expect(r.level).toBe("critical")
  })

  it("flags missing backup as high when primary exists", () => {
    const r = computeSuccessionRisk({
      primaryProfileId: "p1",
      backupProfileId: null,
      capabilityField: null,
      vmById: new Map([
        [
          "p1",
          {
            profile: { id: "p1", full_name: "Alex", role: "", is_owner: false },
            readiness: { overallScore: 80, capabilities: [], signals: {} as never },
            modules: [],
            certifications: [],
            certifiedBadges: [],
            observations: [],
          } as never,
        ],
      ]),
    })
    expect(r.level).toBe("high")
  })
})
