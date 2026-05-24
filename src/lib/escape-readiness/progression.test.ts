import { describe, expect, it } from "vitest"

import { buildProgression, progressionStageFromScore } from "@/lib/escape-readiness/progression"

describe("escape progression", () => {
  it("maps score 73 to Delegator with progress toward Scaler", () => {
    const progression = buildProgression(73)

    expect(progression).not.toBeNull()
    expect(progression!.currentStageLabel).toBe("Delegator")
    expect(progression!.nextStageLabel).toBe("Scaler")
    expect(progression!.pointsToNextStage).toBe(8)
    expect(progression!.stages.find((s) => s.id === "builder")?.state).toBe("completed")
    expect(progression!.stages.find((s) => s.id === "delegator")?.state).toBe("current")
    expect(progression!.stages.find((s) => s.id === "owner_optional")?.state).toBe("upcoming")
  })

  it("marks Owner Optional at 97 with no next stage", () => {
    const progression = buildProgression(97)

    expect(progression!.currentStageLabel).toBe("Owner Optional")
    expect(progression!.nextStageLabel).toBeNull()
    expect(progression!.pointsToNextStage).toBeNull()
  })

  it("returns null without a score", () => {
    expect(buildProgression(null)).toBeNull()
  })

  it("resolves stage boundaries", () => {
    expect(progressionStageFromScore(30).label).toBe("Builder")
    expect(progressionStageFromScore(31).label).toBe("Operator")
    expect(progressionStageFromScore(95).label).toBe("Owner Optional")
  })
})
