export type IssueLifecycleStageId =
  | "logged"
  | "pattern_detected"
  | "fix_suggested"
  | "training_assigned"
  | "progress_tracked"
  | "dependency_updated"

export type IssueLifecycleStepStatus = "complete" | "current" | "pending"

export type IssueLifecycleStep = {
  id: IssueLifecycleStageId
  label: string
  status: IssueLifecycleStepStatus
  detail: string | null
  completedAt: string | null
}

export type IssueLifecycleView = {
  steps: IssueLifecycleStep[]
  currentStage: IssueLifecycleStageId
  progressPercent: number
}

export const ISSUE_LIFECYCLE_STAGE_ORDER: IssueLifecycleStageId[] = [
  "logged",
  "pattern_detected",
  "fix_suggested",
  "training_assigned",
  "progress_tracked",
  "dependency_updated",
]
