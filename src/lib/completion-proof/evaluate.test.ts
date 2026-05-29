import { describe, expect, it } from "vitest"

import { isStepProofComplete, getStepProofBlockers } from "@/lib/completion-proof/evaluate"
import { stepProofRequirementsFromRow } from "@/lib/completion-proof/requirements"
import type { StepProofState } from "@/lib/completion-proof/types"

describe("completion proof evaluate", () => {
  it("requires checklist, photo, and manager signoff when configured", () => {
    const req = stepProofRequirementsFromRow({
      requires_photo_confirmation: true,
      requires_video_proof: false,
      requires_manager_signoff: true,
      requires_checklist_completion: true,
    })

    const empty: StepProofState = {
      stepId: "s1",
      photo: null,
      video: null,
      managerSignoff: null,
    }

    expect(getStepProofBlockers(req, empty, false).map((b) => b.kind).sort()).toEqual(
      ["checklist", "manager_signoff", "photo"].sort()
    )

    const done: StepProofState = {
      stepId: "s1",
      photo: { mediaId: "m1", signedUrl: null },
      video: null,
      managerSignoff: {
        signedOffBy: "mgr",
        signedOffAt: new Date().toISOString(),
        signedOffName: "Alex",
      },
    }

    expect(isStepProofComplete(req, done, true)).toBe(true)
  })
})
