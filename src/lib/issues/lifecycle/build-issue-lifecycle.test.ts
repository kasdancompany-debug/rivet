import { describe, expect, it } from "vitest"

import { buildIssueLifecycle } from "@/lib/issues/lifecycle/build-issue-lifecycle"

const labels = {
  logged: "Issue logged",
  pattern_detected: "Pattern detected",
  fix_suggested: "Suggested fix created",
  training_assigned: "Training assigned",
  progress_tracked: "Progress tracked",
  dependency_updated: "Dependency score updated",
} as const

const details = {
  logged: "Captured on the floor.",
  patternDetected: (count: number) => `${count} repeats in 30 days.`,
  fixSuggested: "Play or module drafted.",
  trainingAssigned: (count: number) => `${count} assignment(s).`,
  progressTracked: "Team is moving on it.",
  dependencyUpdated: (score: number) => `Dependency score ${score}.`,
}

describe("buildIssueLifecycle", () => {
  const baseIssue = {
    id: "i1",
    title: "Drink remakes",
    status: "not_started" as const,
    created_at: "2026-05-10T12:00:00Z",
    resolved_at: null,
  }

  it("starts at pattern_detected when only logged", () => {
    const view = buildIssueLifecycle({
      issue: baseIssue,
      history: [{ title: "Drink remakes", created_at: "2026-05-10T12:00:00Z" }],
      fixRecommendation: { isRepeated: false, repeatCount: 1 },
      linkKinds: [],
      linkedModuleIds: [],
      trainingProgress: [],
      lifecycleEvents: [{ stage: "logged", detail: null, created_at: "2026-05-10T12:00:00Z" }],
      dependencySnapshots: [],
      stageLabels: labels,
      stageDetails: details,
    })

    expect(view.steps[0]?.status).toBe("complete")
    expect(view.currentStage).toBe("pattern_detected")
  })

  it("marks fix suggested when linked to a module", () => {
    const view = buildIssueLifecycle({
      issue: baseIssue,
      history: [
        { title: "Drink remakes", created_at: "2026-05-01T12:00:00Z" },
        { title: "Drink remakes", created_at: "2026-05-10T12:00:00Z" },
      ],
      fixRecommendation: { isRepeated: true, repeatCount: 2 },
      linkKinds: ["training_module"],
      linkedModuleIds: ["m1"],
      trainingProgress: [
        {
          training_module_id: "m1",
          status: "not_started",
          updated_at: "2026-05-11T12:00:00Z",
          completed_at: null,
        },
      ],
      lifecycleEvents: [],
      dependencySnapshots: [],
      stageLabels: labels,
      stageDetails: details,
    })

    expect(view.steps.find((s) => s.id === "pattern_detected")?.status).toBe("complete")
    expect(view.steps.find((s) => s.id === "fix_suggested")?.status).toBe("complete")
    expect(view.steps.find((s) => s.id === "training_assigned")?.status).toBe("complete")
  })
})
