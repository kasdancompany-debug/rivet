import { describe, expect, it } from "vitest"

import {
  computePainScore,
  countSimilarIssuesInWindow,
  scoreIssueFrequency,
  scoreIssueRecency,
  scoreIssueTimeCost,
  scoreOwnerInvolvement,
} from "@/lib/issues/pain-score/compute-pain-score"

describe("computePainScore", () => {
  const nowMs = new Date("2026-05-18T12:00:00Z").getTime()

  it("scores a low-severity team issue as low pain", () => {
    const result = computePainScore({
      issue: {
        title: "Minor label peel on syrup bottle",
        severity: "low",
        owner_required: false,
        status: "not_started",
        created_at: "2026-05-17T12:00:00Z",
      },
      nowMs,
    })

    expect(result.level).toBe("low")
    expect(result.painScore).toBeLessThan(40)
  })

  it("escalates repeat owner-required critical issues", () => {
    const history = [
      { title: "Walk-in cooler alarm", created_at: "2026-05-01T12:00:00Z" },
      { title: "Walk-in cooler alarm", created_at: "2026-05-10T12:00:00Z" },
      { title: "Walk-in cooler alarm", created_at: "2026-05-17T12:00:00Z" },
    ]

    const result = computePainScore({
      issue: {
        title: "Walk-in cooler alarm",
        severity: "critical",
        owner_required: true,
        status: "not_started",
        created_at: "2026-05-17T12:00:00Z",
      },
      history,
      nowMs,
    })

    expect(result.level).toBe("high")
    expect(result.painScore).toBeGreaterThanOrEqual(70)
    expect(result.drivers.frequency.count).toBe(3)
  })

  it("weights frequency, time cost, owner involvement, and recency", () => {
    const result = computePainScore({
      issue: {
        title: "Scheduling gap on Saturday",
        severity: "high",
        owner_required: true,
        status: "fix_in_progress",
        created_at: "2026-05-18T08:00:00Z",
      },
      nowMs,
    })

    expect(result.painScore).toBe(
      Math.round(
        scoreIssueFrequency(1) * 0.25 +
          scoreIssueTimeCost("high") * 0.3 +
          scoreOwnerInvolvement({ ownerRequired: true, status: "fix_in_progress" }) * 0.25 +
          scoreIssueRecency("2026-05-18T08:00:00Z", nowMs) * 0.2
      )
    )
  })

  it("dampens resolved issues", () => {
    const open = computePainScore({
      issue: {
        title: "Equipment failure",
        severity: "critical",
        owner_required: true,
        status: "not_started",
        created_at: "2026-05-17T12:00:00Z",
      },
      nowMs,
    })
    const resolved = computePainScore({
      issue: {
        title: "Equipment failure",
        severity: "critical",
        owner_required: true,
        status: "resolved",
        created_at: "2026-05-17T12:00:00Z",
      },
      nowMs,
    })

    expect(resolved.painScore).toBeLessThan(open.painScore)
  })
})

describe("countSimilarIssuesInWindow", () => {
  it("counts matching titles inside the 30-day window", () => {
    const rows = [
      { title: "Drink remakes", created_at: "2026-04-10T12:00:00Z" },
      { title: "Drink remakes", created_at: "2026-05-10T12:00:00Z" },
      { title: "Drink remakes", created_at: "2026-05-17T12:00:00Z" },
      { title: "Other issue", created_at: "2026-05-11T12:00:00Z" },
    ]

    const count = countSimilarIssuesInWindow(rows, {
      title: "Drink remakes",
      created_at: "2026-05-17T12:00:00Z",
    })

    expect(count).toBe(2)
  })
})
