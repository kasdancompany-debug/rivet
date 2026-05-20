import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"

/** Actionable next steps for the printable report. */
export function recommendedNextSteps(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): string[] {
  const steps: string[] = []

  if (answers.staffCanOpenWithoutOwner !== "yes" || answers.staffCanCloseWithoutOwner !== "yes") {
    steps.push(
      "Publish open and close as one-page standards with a named shift lead sign-off—your phone should not be step one."
    )
  }

  if (!answers.trainingProcessExists) {
    steps.push(
      "Stand up one training module tied to your highest-variance procedure—completion means demonstrated on shift, not a signature."
    )
  }

  if (answers.undocumentedProcedures !== "0") {
    steps.push(
      "Capture the next undocumented procedure on the floor (voice or bullets)—assign an owner and due date before it becomes another interrupt."
    )
  }

  if (result.severity === "HIGH" || result.severity === "CRITICAL") {
    steps.push(
      "Log every owner interrupt for 14 days with kind and minutes—Rivet turns that trail into a dependency score you can actually move."
    )
  }

  if (steps.length < 3) {
    steps.push(
      "Install Rivet to bind standards, training, and interrupt workflows—so the floor holds without you as the default router."
    )
  }

  return steps.slice(0, 4)
}
