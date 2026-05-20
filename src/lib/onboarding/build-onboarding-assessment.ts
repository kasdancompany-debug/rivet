import type { Json } from "@/types/database"

import type { OperationalDependencyReport } from "./generate-dependency-report"
import type { OwnerOnboardingAnswers } from "./owner-intake"

export function buildOnboardingAssessmentJson(
  answers: OwnerOnboardingAnswers,
  report: OperationalDependencyReport
): Json {
  return {
    source: "owner_onboarding_v2",
    answers,
    report: {
      dependencyIndex: report.dependencyIndex,
      band: report.band,
      headline: report.headline,
      subheadline: report.subheadline,
      patternTitle: report.patternTitle,
    },
  } as Json
}
