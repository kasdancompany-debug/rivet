import { describe, expect, it } from "vitest"

import { getPortalCompletionBlockers } from "@/lib/training/portal/completion-rules"
import type { PortalTrainingItem } from "@/lib/training/portal/types"

function baseItem(overrides: Partial<PortalTrainingItem> = {}): PortalTrainingItem {
  return {
    trainingItemId: "item-1",
    standardId: "sop-1",
    title: "Open",
    description: null,
    required: true,
    estimatedMinutes: 15,
    steps: [
      {
        id: "s1",
        title: "Unlock",
        instructions: "",
        step_order: 1,
        standard_id: "sop-1",
        media_url: null,
        requires_photo_confirmation: true,
        requires_video_proof: false,
        requires_manager_signoff: false,
        requires_checklist_completion: true,
        estimated_time_minutes: null,
        is_critical: false,
        verification: null,
        notes: null,
        play_metadata: {},
        created_at: "",
        updated_at: "",
      },
    ],
    capture: null,
    videoUrl: null,
    walkthroughMedia: null,
    quiz: [],
    progress: {
      stepChecklist: [],
      videoWatched: false,
      quizPassed: false,
      quizAnswers: {},
      photoProofs: [],
      stepProofByStepId: {},
      completed: false,
    },
    ...overrides,
  }
}

describe("getPortalCompletionBlockers", () => {
  it("requires video when present", () => {
    const blockers = getPortalCompletionBlockers(
      baseItem({ videoUrl: "https://example.com/v.mp4" })
    )
    expect(blockers.some((b) => b.code === "video")).toBe(true)
  })

  it("requires checklist and photo proof on steps", () => {
    const blockers = getPortalCompletionBlockers(baseItem())
    expect(blockers.some((b) => b.code === "proof" && b.message.includes("Check off"))).toBe(true)
    expect(blockers.some((b) => b.code === "proof" && b.message.includes("photo"))).toBe(true)
  })
})
