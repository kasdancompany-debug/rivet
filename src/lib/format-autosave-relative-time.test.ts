import { describe, expect, it } from "vitest"

import { formatAutosaveRelativeTime } from "./format-autosave-relative-time"

describe("formatAutosaveRelativeTime", () => {
  it('formats seconds as "Saved N seconds ago"', () => {
    const now = Date.parse("2026-05-18T12:00:10.000Z")
    const saved = Date.parse("2026-05-18T12:00:02.000Z")
    expect(formatAutosaveRelativeTime(saved, now)).toBe("Saved 8 seconds ago")
  })

  it("uses just now for very recent saves", () => {
    const now = Date.parse("2026-05-18T12:00:05.000Z")
    const saved = Date.parse("2026-05-18T12:00:00.000Z")
    expect(formatAutosaveRelativeTime(saved, now)).toBe("Saved just now")
  })
})
