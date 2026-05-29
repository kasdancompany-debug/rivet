import { describe, expect, it } from "vitest"

import type { OperationalUploadJob } from "./types"
import { isSlotUploading, uploadProgressForJobs } from "./upload-progress"

function job(partial: Partial<OperationalUploadJob> & Pick<OperationalUploadJob, "id">): OperationalUploadJob {
  return {
    fileName: "file.jpg",
    progress: 0,
    phase: "uploading",
    ...partial,
  }
}

describe("uploadProgressForJobs", () => {
  it("returns null when no active jobs match", () => {
    expect(uploadProgressForJobs([])).toBeNull()
    expect(uploadProgressForJobs([job({ id: "1", phase: "error" })])).toBeNull()
  })

  it("returns preparing and finalizing sentinel progress", () => {
    expect(uploadProgressForJobs([job({ id: "1", phase: "preparing" })])).toBe(8)
    expect(uploadProgressForJobs([job({ id: "1", phase: "finalizing" })])).toBe(96)
  })

  it("filters by slot", () => {
    const jobs = [
      job({ id: "1", slot: "walkthrough", progress: 40 }),
      job({ id: "2", slot: "reference-photo", progress: 70 }),
    ]
    expect(uploadProgressForJobs(jobs, { slot: "reference-photo" })).toBe(70)
  })
})

describe("isSlotUploading", () => {
  it("ignores errored jobs", () => {
    expect(isSlotUploading([job({ id: "1", slot: "walkthrough", phase: "error" })], "walkthrough")).toBe(
      false
    )
    expect(isSlotUploading([job({ id: "1", slot: "walkthrough" })], "walkthrough")).toBe(true)
  })
})
