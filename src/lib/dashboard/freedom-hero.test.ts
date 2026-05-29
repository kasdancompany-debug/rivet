import { describe, expect, it } from "vitest"

import { buildFreedomHeroMetrics } from "@/lib/dashboard/freedom-hero"
import type { DashboardViewModel } from "@/lib/dashboard/types"

function minimalModel(overrides: Partial<DashboardViewModel> = {}): DashboardViewModel {
  return {
    source: "live",
    businessName: "Test Cafe",
    founderDependencyPercent: 60,
    founderDependencyLabel: "High",
    standardsDepthPercent: 50,
    staffReadinessPercent: 72,
    openIssuesCount: 0,
    ownerTasksCount: 0,
    unresolvedIssuesCount: 0,
    ownerInterruptionsThisWeekCount: 0,
    ownerInterruptionsThisWeekMinutes: 0,
    proceduresMissingCount: 0,
    ownerRequiredOpenIssues: [],
    trainingProgressPercent: 80,
    riskLevel: "moderate",
    riskLevelCaption: "",
    ownerRisks: [],
    biggestRisksThisWeek: [{ rank: 1, label: "Closing cash procedure", href: "/sops/1", kind: "documentation" }],
    nextBestMove: { title: "Doc", description: "", href: "/sops", cta: "Go" },
    rivetIndex: {
      dependencyScore: 60,
      autonomyLikelihood: 40,
      overallBand: "fragile",
      headlineQuestion: "",
      headlineAnswer: "",
      categories: [],
      criticalWarnings: [],
      trend: [],
    },
    escapeReadiness: {
      tagline: "",
      headlineQuestion: "",
      score: 73,
      band: "building",
      statusTier: null,
      statusBadge: "Building momentum",
      statusInterpretation: null,
      progression: null,
      scoreGain: null,
      absenceCapacity: {
        estimatedDays: 3.6,
        estimatedLabel: "3.6 days",
        likelyFailurePoint: "Closing cash procedure",
        failureAtDays: 2,
        failureAtLabel: "Day 2",
        confidencePercent: 70,
        timelineMaxDays: 14,
        timelineMarks: [],
      },
      verdict: "",
      factors: [],
      biggestRisk: null,
      fastestPathToFreedom: [{ title: "a", action: "b", estimatedScoreGain: 1, translatedOutcome: "", effort: "low", timeRequired: "", potentialResultingScore: 80, factorId: null }, { title: "a", action: "b", estimatedScoreGain: 1, translatedOutcome: "", effort: "low", timeRequired: "", potentialResultingScore: 80, factorId: null }, { title: "a", action: "b", estimatedScoreGain: 1, translatedOutcome: "", effort: "low", timeRequired: "", potentialResultingScore: 80, factorId: null }],
      weeklyChange: null,
      simulationContext: null,
      progress: [],
    },
    firstDayChecklist: null,
    executionProof: [],
    ...overrides,
  }
}

describe("buildFreedomHeroMetrics", () => {
  it("maps top dashboard metrics", () => {
    const metrics = buildFreedomHeroMetrics(minimalModel(), {
      questionsPreventedThisMonth: 74,
      questionsAnsweredThisWeek: 10,
      questionsAnsweredThisMonth: 74,
      interruptionsAvoidedThisMonth: 74,
      ownerHoursReturnedThisMonth: 15.3,
      mostAsked: null,
      topStaffQuestions: [],
      confusionAreas: [],
      unverifiedQuestions: [],
      repeatedWithFixes: [],
    })

    expect(metrics.ownerFreeCapacityLabel).toBe("3.6 days")
    expect(metrics.escapeReadinessScore).toBe(73)
    expect(metrics.questionsPreventedThisMonth).toBe(74)
    expect(metrics.ownerHoursReturned).toBe(15.3)
    expect(metrics.teamReadinessPercent).toBe(72)
    expect(metrics.highestRisk.label).toBe("Closing cash procedure")
  })
})
