import type { DashboardViewModel } from "@/lib/dashboard/types"
import { emptyEscapeReadiness } from "@/lib/escape-readiness/empty"
import { COPY } from "@/lib/interface-copy"
import {
  RIVET_INDEX_CATEGORIES,
  type RivetIndexView,
} from "@/lib/rivet-score/types"

function placeholderRivetIndex(): RivetIndexView {
  return {
    dependencyScore: null,
    autonomyLikelihood: null,
    overallBand: null,
    headlineQuestion: COPY.hero.verdictQuestion,
    headlineAnswer: COPY.dashboard.setupScoreMessage,
    categories: RIVET_INDEX_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      dependencyScore: null,
      band: null,
      hint: COPY.dashboard.setupCategoryHint,
    })),
    criticalWarnings: [],
    trend: [],
  }
}

export function buildSetupDashboardViewModel(): DashboardViewModel {
  return {
    source: "setup",
    businessName: null,
    founderDependencyPercent: null,
    founderDependencyLabel: COPY.dashboard.setupFounderLabel,
    standardsDepthPercent: null,
    staffReadinessPercent: null,
    openIssuesCount: 0,
    ownerTasksCount: 0,
    unresolvedIssuesCount: 0,
    ownerInterruptionsThisWeekCount: 0,
    ownerInterruptionsThisWeekMinutes: 0,
    proceduresMissingCount: 0,
    ownerRequiredOpenIssues: [],
    trainingProgressPercent: null,
    riskLevel: "low",
    riskLevelCaption: COPY.dashboard.setupRiskCaption,
    ownerRisks: [],
    biggestRisksThisWeek: [],
    nextBestMove: {
      title: COPY.dashboard.setupNextTitle,
      description: COPY.dashboard.setupNextDesc,
      href: "/settings",
      cta: COPY.dashboard.setupNextCta,
    },
    rivetIndex: placeholderRivetIndex(),
    escapeReadiness: emptyEscapeReadiness(),
    firstDayChecklist: null,
    executionProof: [],
  }
}

export function buildLoadErrorDashboardViewModel(): DashboardViewModel {
  return {
    ...buildSetupDashboardViewModel(),
    source: "error",
    nextBestMove: {
      title: COPY.dashboard.errorNextTitle,
      description: COPY.dashboard.errorNextDesc,
      href: "/dashboard",
      cta: COPY.dashboard.errorNextCta,
    },
  }
}
