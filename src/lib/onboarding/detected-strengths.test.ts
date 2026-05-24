import { describe, expect, it } from "vitest"

import { detectOperationalStrengths } from "./detected-strengths"
import { defaultOwnerOnboardingAnswers } from "./owner-intake"

describe("detectOperationalStrengths", () => {
  it("returns 3–4 specific strengths for a mixed profile", () => {
    const strengths = detectOperationalStrengths({
      ...defaultOwnerOnboardingAnswers(),
      standardsMode: "mixed",
      openWithoutYou: "sometimes",
      closeWithoutYou: "no",
      staffInterrupts: "weekly",
      qualityOnOnePerson: "unsure",
      daysPerWeek: "3-4",
      avoidedTimeOff: "prefer_not",
      breaksWhenYouLeave: "Inventory counts drift when I travel",
    })

    expect(strengths.length).toBeGreaterThanOrEqual(3)
    expect(strengths.length).toBeLessThanOrEqual(4)
    expect(strengths.some((s) => s.includes("documented") || s.includes("partially"))).toBe(true)
    expect(strengths.join(" ")).not.toMatch(/amazing|great job|keep it up/i)
  })

  it("surfaces written standards and bookends when present", () => {
    const strengths = detectOperationalStrengths({
      ...defaultOwnerOnboardingAnswers(),
      standardsMode: "documented",
      openWithoutYou: "yes",
      closeWithoutYou: "yes",
      staffInterrupts: "rarely",
      qualityOnOnePerson: "no",
      daysPerWeek: "0-2",
      avoidedTimeOff: "no",
      breaksWhenYouLeave: "",
    })

    expect(strengths).toContain("Quality standards exist in writing")
    expect(strengths.some((s) => s.toLowerCase().includes("open and close"))).toBe(true)
  })
})
