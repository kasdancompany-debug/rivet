import { describe, expect, it } from "vitest"

import { buildAbsenceSimulation } from "@/lib/escape-readiness/build-absence-simulation"
import { buildSimulationContextFromView } from "@/lib/escape-readiness/build-simulation-context"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"

describe("buildAbsenceSimulation", () => {
  it("generates a day-by-day scenario with breakdown moments", () => {
    const view = finalizeEscapeReadinessView({
      score: 73,
      riskContext: { ownerInterruptionsThisWeekCount: 12, openIssuesCount: 6 },
      progress: [
        { date: "2026-05-07", score: 65 },
        { date: "2026-05-16", score: 73 },
      ],
      factors: [
        { id: "sop_coverage", label: "SOP coverage", percent: 52, hint: "" },
        { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
        { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
        { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
        { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
      ],
    })

    const simulation = buildAbsenceSimulation(view, buildSimulationContextFromView(view))

    expect(simulation).not.toBeNull()
    expect(simulation!.days.length).toBeGreaterThanOrEqual(4)
    expect(simulation!.days[0]!.events.length).toBeGreaterThan(0)
    expect(simulation!.breakdownDays.length).toBeGreaterThan(0)
    expect(simulation!.days.some((d) => d.breakdownMoment)).toBe(true)
    expect(simulation!.days.some((d) => d.events.some((ev) => ev.source === "interruptions"))).toBe(
      true
    )
  })

  it("returns null without a score", () => {
    const view = finalizeEscapeReadinessView({
      score: null,
      factors: [{ id: "sop_coverage", label: "SOP coverage", percent: null, hint: "" }],
    })
    expect(buildAbsenceSimulation(view)).toBeNull()
  })
})
