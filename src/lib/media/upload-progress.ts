import type { OperationalUploadJob } from "@/lib/media/types"

export function uploadProgressForJobs(
  jobs: OperationalUploadJob[],
  match?: { fileName?: string; slot?: string }
): number | null {
  const active = jobs.filter(
    (j) =>
      j.phase !== "error" &&
      (!match?.fileName || j.fileName === match.fileName) &&
      (!match?.slot || j.slot === match.slot)
  )
  if (active.length === 0) return null
  const job = active[0]!
  if (job.phase === "preparing") return 8
  if (job.phase === "finalizing") return 96
  return job.progress
}

export function isSlotUploading(jobs: OperationalUploadJob[], slot: string): boolean {
  return jobs.some((j) => j.slot === slot && j.phase !== "error")
}
