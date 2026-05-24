export const PUBLISH_IMPACT_LINES = [
  "what routes back to you",
  "training time",
  "dependency risk",
] as const

export type PublishImpactInput = {
  title: string
  purpose: string
  stepCount: number
  assignedRoleCount: number
  ownerDependencyLevel: number
}

/** Whether publishing this play is likely to move the needle on floor metrics. */
export function shouldShowPublishImpact(input: PublishImpactInput): boolean {
  return input.title.trim().length >= 2 && input.stepCount >= 1
}

export function publishImpactStrength(input: PublishImpactInput): {
  ownerInterruptions: "high" | "medium" | "low"
  trainingTime: "high" | "medium" | "low"
  dependencyRisk: "high" | "medium" | "low"
} {
  const hasPurpose = input.purpose.trim().length >= 20
  const hasRoles = input.assignedRoleCount > 0
  const lowDependency = input.ownerDependencyLevel <= 2
  const richSteps = input.stepCount >= 3

  return {
    ownerInterruptions:
      hasPurpose && hasRoles && richSteps ? "high" : hasPurpose || hasRoles ? "medium" : "low",
    trainingTime: richSteps && hasPurpose ? "high" : input.stepCount >= 2 ? "medium" : "low",
    dependencyRisk: lowDependency && hasRoles ? "high" : input.ownerDependencyLevel <= 3 ? "medium" : "low",
  }
}
