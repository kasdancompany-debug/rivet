import { getStepProofBlockers } from "@/lib/completion-proof/evaluate"
import { stepProofRequirementsFromRow } from "@/lib/completion-proof/requirements"
import type { PortalTrainingItem } from "@/lib/training/portal/types"

export type PortalCompletionBlocker = {
  code: "video" | "quiz" | "steps" | "proof"
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

  for (const step of item.steps) {
    const requirements = stepProofRequirementsFromRow(step)
    const checklistDone = progress.stepChecklist.includes(step.id)
    const proofState = progress.stepProofByStepId[step.id]
    const stepBlockers = getStepProofBlockers(requirements, proofState, checklistDone)
    for (const b of stepBlockers) {
      blockers.push({
        code: "proof",
        message: `${step.title}: ${b.message}`,
      })
    }
  }

  return blockers
}

export function canCompletePortalItem(item: PortalTrainingItem): boolean {
  return getPortalCompletionBlockers(item).length === 0
}
