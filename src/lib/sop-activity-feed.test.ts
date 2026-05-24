import { describe, expect, it } from "vitest"

import { formatRelativeActivityTime } from "./format-relative-activity-time"
import { buildSopActivityFeed } from "./sops/sop-activity-feed"
import type { SopActivityContext } from "./sops/sop-activity-feed"

describe("formatRelativeActivityTime", () => {
  const now = new Date("2026-05-18T14:00:00.000Z").getTime()

  it("formats hours and yesterday", () => {
    expect(formatRelativeActivityTime("2026-05-18T12:00:00.000Z", now)).toBe("2h ago")
    expect(formatRelativeActivityTime("2026-05-17T10:00:00.000Z", now)).toBe("yesterday")
  })
})

describe("buildSopActivityFeed", () => {
  const now = new Date("2026-05-18T14:00:00.000Z").getTime()

  it("shows latest edit, checklist, and training events", () => {
    const ctx: SopActivityContext = {
      profileFirstNameById: new Map([
        ["ashley-id", "Ashley"],
        ["jordan-id", "Jordan"],
      ]),
      checklistCompletionsByChecklistType: new Map([
        [
          "opening",
          [{ employeeId: "jordan-id", completedAt: "2026-05-18T12:00:00.000Z" }],
        ],
      ]),
      trainingCompletionsBySopId: new Map([
        ["sop-1", [{ employeeId: "jordan-id", completedAt: "2026-05-16T12:00:00.000Z" }]],
      ]),
      trainingModuleCompletionsBySopId: new Map(),
    }

    const feed = buildSopActivityFeed(
      {
        id: "sop-1",
        category: "opening",
        updated_at: "2026-05-17T09:00:00.000Z",
        created_at: "2026-05-01T09:00:00.000Z",
        created_by: "ashley-id",
      },
      ctx,
      now
    )

    expect(feed.idleLabel).toBeNull()
    expect(feed.events.some((event) => event.label.includes("Jordan completed checklist"))).toBe(true)
    expect(feed.events.some((event) => event.label.includes("Ashley updated SOP"))).toBe(true)
  })

  it("shows idle copy when nothing recent", () => {
    const feed = buildSopActivityFeed(
      {
        id: "sop-2",
        category: "other",
        updated_at: "2026-05-01T09:00:00.000Z",
        created_at: "2026-05-01T09:00:00.000Z",
        created_by: "ashley-id",
      },
      {
        profileFirstNameById: new Map([["ashley-id", "Ashley"]]),
        checklistCompletionsByChecklistType: new Map(),
        trainingCompletionsBySopId: new Map(),
        trainingModuleCompletionsBySopId: new Map(),
      },
      now
    )

    expect(feed.events).toHaveLength(0)
    expect(feed.idleLabel).toBe("No activity for 17 days")
  })
})
