import type { PortalTrainingItem } from "@/lib/training/portal/types"

export type PortalCompletionBlocker = {
  code: "video" | "quiz" | "steps" | "photos"
  message: string
}

export function getPortalCompletionBlockers(item: PortalTrainingItem): PortalCompletionBlocker[] {
  const blockers: PortalCompletionBlocker[] = []
  const { progress } = item

  if (item.videoUrl && !progress.videoWatched) {
    blockers.push({
      code: "video",
      message: "Watch the walkthrough video before marking complete.",
    })
  }

  if (item.quiz.length > 0 && !progress.quizPassed) {
    blockers.push({
      code: "quiz",
      message: "Pass the knowledge check with all answers correct.",
    })
  }

  if (item.steps.length > 0) {
    const unchecked = item.steps.filter((s) => !progress.stepChecklist.includes(s.id))
    if (unchecked.length > 0) {
      blockers.push({
        code: "steps",
        message: `Check off all ${item.steps.length} steps in the SOP checklist.`,
      })
    }
  }

  if (item.photoRequiredStepIds.length > 0) {
    const missing = item.photoRequiredStepIds.filter(
      (stepId) => !progress.photoProofs.some((p) => p.stepId === stepId)
    )
    if (missing.length > 0) {
      blockers.push({
        code: "photos",
        message: `Upload photo proof for ${missing.length} required step${missing.length === 1 ? "" : "s"}.`,
      })
    }
  }

  return blockers
}

export function canCompletePortalItem(item: PortalTrainingItem): boolean {
  return getPortalCompletionBlockers(item).length === 0
}
