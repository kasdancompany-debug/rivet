import { describe, expect, it } from "vitest"

import {
  buildQuickCaptureDescription,
  ownerRequiredFromTimeLost,
  severityFromTimeLostMinutes,
  titleFromQuickCapture,
} from "@/lib/issues/quick-capture/helpers"

describe("quick capture helpers", () => {
  it("maps time lost to severity", () => {
    expect(severityFromTimeLostMinutes(5)).toBe("low")
    expect(severityFromTimeLostMinutes(30)).toBe("medium")
    expect(severityFromTimeLostMinutes(60)).toBe("high")
    expect(severityFromTimeLostMinutes(90)).toBe("critical")
  })

  it("flags owner required for longer pulls", () => {
    expect(ownerRequiredFromTimeLost(30)).toBe(false)
    expect(ownerRequiredFromTimeLost(45)).toBe(true)
  })

  it("builds title from first line", () => {
    expect(titleFromQuickCapture("Walk-in cooler alarm\nTeam reset temp")).toBe("Walk-in cooler alarm")
  })

  it("builds structured description", () => {
    const desc = buildQuickCaptureDescription({
      whatHappened: "Customer waited 20 min for remake",
      timeLostMinutes: 30,
      peopleLabels: ["Alex"],
      voiceNoteTranscript: "Barista called me twice",
    })
    expect(desc).toContain("Time lost: ~30 min")
    expect(desc).toContain("People involved: Alex")
    expect(desc).toContain("Voice note:")
  })
})
