import { describe, expect, it } from "vitest"

import { buildAbsenceSimulation } from "@/lib/escape-readiness/build-absence-simulation"
import { buildAbsenceSimulationFixes } from "@/lib/escape-readiness/build-absence-simulation-fixes"
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
        { id: "sop_coverage", label: "Play coverage", percent: 52, hint: "" },
        { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
        { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
        { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
        { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
      ],
    })

    const ctx = buildSimulationContextFromView(view)
    const simulation = buildAbsenceSimulation(view, {
      ...ctx,
      unverifiedAskCount: 2,
      unverifiedAskQuestions: ["Where is the closing checklist?", "Who approves vendor credits?"],
      teamReadinessPercent: 58,
    })

    expect(simulation).not.toBeNull()
    expect(simulation!.days.length).toBeGreaterThanOrEqual(4)
    expect(simulation!.days[0]!.headline).toBeTruthy()
    expect(simulation!.days[0]!.events.length).toBeGreaterThan(0)
    expect(simulation!.breakdownDays.length).toBeGreaterThan(0)
    expect(simulation!.days.some((d) => d.breakdownMoment)).toBe(true)
    expect(simulation!.days.some((d) => d.events.some((ev) => ev.source === "interruptions"))).toBe(
      true
    )
    expect(simulation!.days.some((d) => d.events.some((ev) => ev.source === "ask_rivet"))).toBe(true)
    expect(simulation!.days.some((d) => d.events.some((ev) => ev.source === "team_readiness"))).toBe(
      true
    )
    expect(simulation!.fixes.length).toBe(3)
    expect(simulation!.projectedDaysGain).toBeGreaterThan(0)
  })

  it("returns null without a score", () => {
    const view = finalizeEscapeReadinessView({
      score: null,
      factors: [{ id: "sop_coverage", label: "Play coverage", percent: null, hint: "" }],
    })
    expect(buildAbsenceSimulation(view)).toBeNull()
  })
})

describe("buildAbsenceSimulationFixes", () => {
  it("projects owner-free days from freedom path items", () => {
    const view = finalizeEscapeReadinessView({
      score: 73,
      factors: [
        { id: "sop_coverage", label: "Play coverage", percent: 52, hint: "" },
        { id: "training_coverage", label: "Training coverage", percent: 61, hint: "" },
        { id: "unresolved_issues", label: "Unresolved issues", percent: 38, hint: "" },
        { id: "owner_interruptions", label: "Owner interruptions", percent: 32, hint: "" },
        { id: "undocumented_procedures", label: "Undocumented procedures", percent: 44, hint: "" },
      ],
    })

    const { fixes, projectedDaysGain } = buildAbsenceSimulationFixes(view)
    expect(fixes).toHaveLength(3)
    expect(projectedDaysGain).toBeGreaterThan(0)
  })
})
