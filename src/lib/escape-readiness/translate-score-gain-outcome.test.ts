import { describe, expect, it } from "vitest"

import {
  formatFewerInterruptionsOutcome,
  formatOwnerFreeDayOutcome,
  translateScoreGainOutcome,
} from "@/lib/escape-readiness/translate-score-gain-outcome"

describe("translateScoreGainOutcome", () => {
  it("maps a solid documentation gain to owner-free days", () => {
    expect(translateScoreGainOutcome(13, 60, "sop_coverage")).toBe("≈ +1 owner-free day")
  })

  it("maps a smaller interrupt-logging gain to fewer weekly pulls", () => {
    expect(translateScoreGainOutcome(7, 73, "owner_interruptions")).toBe(
      "≈ 3 fewer interruptions/week"
    )
  })

  it("formats owner-free day outcomes", () => {
    expect(formatOwnerFreeDayOutcome(1)).toBe("≈ +1 owner-free day")
    expect(formatOwnerFreeDayOutcome(2.4)).toBe("≈ +2 owner-free days")
    expect(formatOwnerFreeDayOutcome(0.5)).toBe("≈ +½ owner-free day")
  })

  it("formats interruption reduction outcomes", () => {
    expect(formatFewerInterruptionsOutcome(7)).toBe("≈ 3 fewer interruptions/week")
    expect(formatFewerInterruptionsOutcome(2)).toBe("≈ 1 fewer interruption/week")
  })
})
