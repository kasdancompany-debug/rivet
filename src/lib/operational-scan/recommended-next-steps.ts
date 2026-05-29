import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"
import { buildScanDiagnosis } from "@/lib/operational-scan/build-scan-diagnosis"

/** Exactly three urgent, actionable first fixes for print/email artifacts. */
export function recommendedFirstFixes(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): [string, string, string] {
  const recs = buildScanDiagnosis(result, answers).recommendations
  return [recs[0]!.action, recs[1]!.action, recs[2]!.action]
}

/** Printable report may include a fourth install line. */
export function recommendedNextSteps(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): string[] {
  const [a, b, c] = recommendedFirstFixes(result, answers)
  return [a, b, c]
}
