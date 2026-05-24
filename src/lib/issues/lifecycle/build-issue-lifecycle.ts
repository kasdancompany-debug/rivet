import { ISSUE_REPEAT_FIX_THRESHOLD } from "@/lib/issues/fix-recommendation/analyze-issue-fix"
import type { IssueFixRecommendation } from "@/lib/issues/fix-recommendation/types"
import {
  ISSUE_LIFECYCLE_STAGE_ORDER,
  type IssueLifecycleStageId,
  type IssueLifecycleStep,
  type IssueLifecycleView,
} from "@/lib/issues/lifecycle/types"
import { countSimilarIssuesInWindow } from "@/lib/issues/pain-score/compute-pain-score"
import type { IssueLinkKind, IssueStatus, Tables } from "@/types/database"

export type IssueLifecycleBuildInput = {
  issue: Pick<Tables<"bottlenecks">, "id" | "title" | "status" | "created_at" | "resolved_at">
  history: Pick<Tables<"bottlenecks">, "title" | "created_at">[]
  fixRecommendation: Pick<IssueFixRecommendation, "isRepeated" | "repeatCount">
  linkKinds: IssueLinkKind[]
  linkedModuleIds: string[]
  trainingProgress: Pick<
    Tables<"training_progress">,
    "training_module_id" | "status" | "updated_at" | "completed_at"
  >[]
  lifecycleEvents: Pick<Tables<"issue_lifecycle_events">, "stage" | "detail" | "created_at">[]
  dependencySnapshots: Pick<
    Tables<"handoff_score_snapshots">,
    "snapshot_date" | "dependency_score" | "updated_at"
  >[]
  stageLabels: Record<IssueLifecycleStageId, string>
  stageDetails: {
    logged: string
    patternDetected: (count: number) => string
    fixSuggested: string
    trainingAssigned: (count: number) => string
    progressTracked: string
    dependencyUpdated: (score: number) => string
  }
}

type StageCompletion = { complete: boolean; at: string | null; detail: string | null }

function eventFor(
  events: IssueLifecycleBuildInput["lifecycleEvents"],
  stage: IssueLifecycleStageId
) {
  return events.find((e) => e.stage === stage) ?? null
}

function issueCreatedMs(issue: IssueLifecycleBuildInput["issue"]): number {
  return new Date(issue.created_at).getTime()
}

function evaluateStages(input: IssueLifecycleBuildInput): Record<IssueLifecycleStageId, StageCompletion> {
  const repeatCount = countSimilarIssuesInWindow(input.history, input.issue)
  const loggedEvent = eventFor(input.lifecycleEvents, "logged")
  const patternEvent = eventFor(input.lifecycleEvents, "pattern_detected")
  const fixEvent = eventFor(input.lifecycleEvents, "fix_suggested")
  const trainingEvent = eventFor(input.lifecycleEvents, "training_assigned")
  const progressEvent = eventFor(input.lifecycleEvents, "progress_tracked")
  const dependencyEvent = eventFor(input.lifecycleEvents, "dependency_updated")

  const hasPlayLink = input.linkKinds.includes("standard")
  const hasModuleLink = input.linkKinds.includes("training_module")
  const linkedProgress = input.trainingProgress.filter((p) =>
    input.linkedModuleIds.includes(p.training_module_id)
  )

  const patternComplete =
    Boolean(patternEvent) ||
    input.fixRecommendation.isRepeated ||
    repeatCount >= ISSUE_REPEAT_FIX_THRESHOLD

  const fixComplete = Boolean(fixEvent) || hasPlayLink || hasModuleLink

  const trainingComplete =
    Boolean(trainingEvent) ||
    (hasModuleLink && linkedProgress.length > 0) ||
    (input.linkedModuleIds.length > 0 && input.trainingProgress.some((p) => input.linkedModuleIds.includes(p.training_module_id)))

  const progressComplete =
    Boolean(progressEvent) ||
    input.issue.status !== "not_started" ||
    linkedProgress.some((p) => p.status === "in_progress" || p.status === "completed") ||
    input.trainingProgress.some(
      (p) =>
        input.linkedModuleIds.includes(p.training_module_id) &&
        (p.status === "in_progress" || p.status === "completed")
    )

  const issueDay = input.issue.created_at.slice(0, 10)
  const snapshotAfterIssue = input.dependencySnapshots.find(
    (s) => s.snapshot_date >= issueDay || new Date(s.updated_at).getTime() >= issueCreatedMs(input.issue)
  )
  const dependencyComplete =
    Boolean(dependencyEvent) ||
    input.issue.status === "resolved" ||
    Boolean(snapshotAfterIssue)

  return {
    logged: {
      complete: true,
      at: loggedEvent?.created_at ?? input.issue.created_at,
      detail: input.stageDetails.logged,
    },
    pattern_detected: {
      complete: patternComplete,
      at:
        patternEvent?.created_at ??
        (patternComplete ? input.issue.created_at : null),
      detail: patternComplete
        ? patternEvent?.detail ?? input.stageDetails.patternDetected(repeatCount)
        : null,
    },
    fix_suggested: {
      complete: fixComplete,
      at: fixEvent?.created_at ?? null,
      detail: fixComplete
        ? fixEvent?.detail ??
          (hasModuleLink
            ? input.stageDetails.fixSuggested
            : hasPlayLink
              ? input.stageDetails.fixSuggested
              : input.stageDetails.fixSuggested)
        : null,
    },
    training_assigned: {
      complete: trainingComplete,
      at:
        trainingEvent?.created_at ??
        linkedProgress[0]?.updated_at ??
        null,
      detail: trainingComplete
        ? trainingEvent?.detail ??
          input.stageDetails.trainingAssigned(
            linkedProgress.length ||
              input.trainingProgress.filter((p) => input.linkedModuleIds.includes(p.training_module_id))
                .length
          )
        : null,
    },
    progress_tracked: {
      complete: progressComplete,
      at:
        progressEvent?.created_at ??
        linkedProgress.find((p) => p.status !== "not_started")?.updated_at ??
        input.issue.resolved_at ??
        null,
      detail: progressComplete ? progressEvent?.detail ?? input.stageDetails.progressTracked : null,
    },
    dependency_updated: {
      complete: dependencyComplete,
      at:
        dependencyEvent?.created_at ??
        snapshotAfterIssue?.updated_at ??
        input.issue.resolved_at ??
        null,
      detail: dependencyComplete
        ? dependencyEvent?.detail ??
          (snapshotAfterIssue
            ? input.stageDetails.dependencyUpdated(Number(snapshotAfterIssue.dependency_score))
            : input.issue.status === "resolved"
              ? input.stageDetails.progressTracked
              : null)
        : null,
    },
  }
}

export function buildIssueLifecycle(input: IssueLifecycleBuildInput): IssueLifecycleView {
  const completions = evaluateStages(input)

  let currentStage: IssueLifecycleStageId = "logged"
  for (const stageId of ISSUE_LIFECYCLE_STAGE_ORDER) {
    if (!completions[stageId].complete) {
      currentStage = stageId
      break
    }
    currentStage = stageId
  }

  const completedCount = ISSUE_LIFECYCLE_STAGE_ORDER.filter((id) => completions[id].complete).length
  const allComplete = completedCount === ISSUE_LIFECYCLE_STAGE_ORDER.length

  const steps: IssueLifecycleStep[] = ISSUE_LIFECYCLE_STAGE_ORDER.map((id) => {
    const completion = completions[id]
    let status: IssueLifecycleStep["status"] = "pending"
    if (completion.complete) {
      status = "complete"
    } else if (id === currentStage && !allComplete) {
      status = "current"
    } else if (!allComplete && ISSUE_LIFECYCLE_STAGE_ORDER.indexOf(id) < ISSUE_LIFECYCLE_STAGE_ORDER.indexOf(currentStage)) {
      status = "complete"
    }

    return {
      id,
      label: input.stageLabels[id],
      status,
      detail: completion.detail,
      completedAt: completion.at,
    }
  })

  return {
    steps,
    currentStage,
    progressPercent: Math.round((completedCount / ISSUE_LIFECYCLE_STAGE_ORDER.length) * 100),
  }
}

export function issueStatusImplyingProgress(status: IssueStatus): boolean {
  return status !== "not_started"
}
