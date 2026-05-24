import { COPY } from "@/lib/interface-copy"
import type { IssueLifecycleStageId } from "@/lib/issues/lifecycle/types"

export function issueLifecycleCopy() {
  return {
    stageLabels: {
      logged: COPY.issues.lifecycleStageLogged,
      pattern_detected: COPY.issues.lifecycleStagePattern,
      fix_suggested: COPY.issues.lifecycleStageFix,
      training_assigned: COPY.issues.lifecycleStageTraining,
      progress_tracked: COPY.issues.lifecycleStageProgress,
      dependency_updated: COPY.issues.lifecycleStageDependency,
    } satisfies Record<IssueLifecycleStageId, string>,
    stageDetails: {
      logged: COPY.issues.lifecycleDetailLogged,
      patternDetected: COPY.issues.lifecycleDetailPattern,
      fixSuggested: COPY.issues.lifecycleDetailFix,
      trainingAssigned: COPY.issues.lifecycleDetailTraining,
      progressTracked: COPY.issues.lifecycleDetailProgress,
      dependencyUpdated: COPY.issues.lifecycleDetailDependency,
    },
  }
}
