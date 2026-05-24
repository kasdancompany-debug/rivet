import { describe, expect, it } from "vitest"

import { escapeMilestoneState } from "@/lib/escape-readiness/milestones"
import {
  escapeStatusFromScore,
  statusTierFromScore,
} from "@/lib/escape-readiness/presentation"

describe("escape status tiers", () => {
  it("maps score ranges to interpretation copy", () => {
    expect(statusTierFromScore(20)).toBe("owner_dependent")
    expect(escapeStatusFromScore(20).interpretation).toContain("Building the systems")

    expect(statusTierFromScore(45)).toBe("fragile_emerging")
    expect(escapeStatusFromScore(45).interpretation).toContain("still run the floor")

    expect(statusTierFromScore(73)).toBe("building_momentum")
    expect(escapeStatusFromScore(73).badge).toBe("Delegator")

    expect(statusTierFromScore(88)).toBe("strong_foundation")
    expect(escapeStatusFromScore(88).interpretation).toContain("Operations scale")

    expect(statusTierFromScore(97)).toBe("owner_optional")
    expect(escapeStatusFromScore(97).interpretation).toContain("step away")
  })
})

describe("escape milestones", () => {
  it("marks next milestone below score", () => {
    expect(escapeMilestoneState(73, { threshold: 80, label: "Survives long weekend" })).toBe("next")
    expect(escapeMilestoneState(73, { threshold: 90, label: "Survives one week" })).toBe("locked")
  })

  it("marks reached milestones at or above threshold", () => {
    expect(escapeMilestoneState(82, { threshold: 80, label: "Survives long weekend" })).toBe("reached")
  })
})
