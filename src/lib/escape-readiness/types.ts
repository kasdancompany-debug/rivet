export type EscapeReadinessBand = "critical" | "fragile" | "building" | "ready"

export type EscapeReadinessStatusTier =
  | "owner_dependent"
  | "fragile_emerging"
  | "building_momentum"
  | "strong_foundation"
  | "owner_optional"

export type EscapeReadinessFactorId =
  | "sop_coverage"
  | "training_coverage"
  | "unresolved_issues"
  | "owner_interruptions"
  | "undocumented_procedures"

export type EscapeReadinessFactorDetail = {
  whatsComplete: string[]
  whatsMissing: string[]
  suggestedAction: string
  fixCta: {
    label: string
    href: string
  }
}

export type EscapeReadinessFactor = {
  id: EscapeReadinessFactorId
  label: string
  /** 0–100 · higher = healthier for five days away. */
  percent: number | null
  hint: string
  detail: EscapeReadinessFactorDetail
}

/** Factor row before detail enrichment in finalizeEscapeReadinessView. */
export type EscapeReadinessFactorInput = Omit<EscapeReadinessFactor, "detail">

export type EscapeReadinessBiggestRisk = {
  factorId: EscapeReadinessFactorId
  title: string
  detail: string
  /** Future-state predictions shown as bullet lines on the risk card. */
  futureStateLines: string[]
  estimatedInterruptions: {
    count: number
    low: number
    high: number
    label: string
    periodLabel: string
  }
  severity: EscapeRiskSeverity
  severityLabel: string
  /** 0–100 · visual severity fill. */
  severityPercent: number
}

export type EscapeRiskSeverity = "critical" | "high" | "elevated" | "moderate"

export type EscapeFreedomPathEffort = "low" | "medium" | "high"

export type EscapeFreedomPathItem = {
  factorId: EscapeReadinessFactorId | null
  title: string
  action: string
  estimatedScoreGain: number
  /** Human-readable impact paired with the score gain (e.g. owner-free days). */
  translatedOutcome: string
  effort: EscapeFreedomPathEffort
  timeRequired: string
  potentialResultingScore: number
}

export type EscapeReadinessProgressPoint = {
  /** ISO date YYYY-MM-DD */
  date: string
  score: number
}

export type EscapeWeeklyChangeDirection = "up" | "down" | "flat"

export type EscapeWeeklyChangeItem = {
  metric: string
  direction: EscapeWeeklyChangeDirection
  differenceLabel: string
  explanation: string
}

export type EscapeWeeklyChange = {
  periodLabel: string
  items: EscapeWeeklyChangeItem[]
}

export type EscapeScoreGain = {
  previousScore: number
  currentScore: number
  pointsGained: number
  gainLabel: string
  absenceDaysGained: number
  humanExplanation: string
  periodLabel: string
}

export type EscapeAbsenceSimulationEventSource =
  | "sops"
  | "training"
  | "issues"
  | "interruptions"
  | "staffing"

export type EscapeAbsenceSimulationContext = {
  activeSopCount: number
  thinSopCount: number
  thinSopTitles: string[]
  trainingCompletionPercent: number | null
  incompleteTrainingCount: number
  openIssueCount: number
  ownerRequiredIssueCount: number
  openIssueTitles: string[]
  weeklyInterruptCount: number
  interruptSummaries: string[]
  teamSize: number
  staffWithIncompleteTraining: number
}

export type EscapeAbsenceSimulationEvent = {
  source: EscapeAbsenceSimulationEventSource
  phase: string
  title: string
  detail: string
}

export type EscapeAbsenceSimulationDay = {
  day: number
  label: string
  status: "stable" | "strained" | "breakdown"
  stressPercent: number
  summary: string
  events: EscapeAbsenceSimulationEvent[]
  breakdownMoment?: {
    source: EscapeAbsenceSimulationEventSource
    title: string
    detail: string
  }
}

export type EscapeAbsenceSimulation = {
  capacityDays: number
  totalDays: number
  firstBreakdownDay: number
  headline: string
  days: EscapeAbsenceSimulationDay[]
  breakdownDays: number[]
}

export type EscapeProgressionStageId =
  | "builder"
  | "operator"
  | "delegator"
  | "scaler"
  | "owner_optional"

export type EscapeProgressionStageState = "completed" | "current" | "upcoming"

export type EscapeProgressionStageView = {
  id: EscapeProgressionStageId
  label: string
  minScore: number
  maxScore: number
  trackStartPercent: number
  tier: EscapeReadinessStatusTier
  summary: string
  state: EscapeProgressionStageState
  segmentFillPercent: number
}

export type EscapeProgression = {
  currentStageId: EscapeProgressionStageId
  currentStageLabel: string
  nextStageId: EscapeProgressionStageId | null
  nextStageLabel: string | null
  pointsToNextStage: number | null
  overallPercent: number
  stages: EscapeProgressionStageView[]
}

export type EscapeAbsenceCapacity = {
  /** Estimated days the business can tolerate owner absence. */
  estimatedDays: number
  estimatedLabel: string
  /** What typically breaks first during absence. */
  likelyFailurePoint: string
  /** When failure likely starts, in days from absence start. */
  failureAtDays: number
  failureAtLabel: string
  /** 0–100 · model confidence in the estimate. */
  confidencePercent: number
  timelineMaxDays: number
  timelineMarks: { days: number; label: string }[]
}

export type EscapeReadinessView = {
  tagline: string
  headlineQuestion: string
  /** 0–100 · Escape Readiness Score · higher = more likely five days away holds. */
  score: number | null
  band: EscapeReadinessBand | null
  statusTier: EscapeReadinessStatusTier | null
  statusBadge: string | null
  statusInterpretation: string | null
  progression: EscapeProgression | null
  scoreGain: EscapeScoreGain | null
  absenceCapacity: EscapeAbsenceCapacity | null
  verdict: string
  factors: EscapeReadinessFactor[]
  biggestRisk: EscapeReadinessBiggestRisk | null
  fastestPathToFreedom: [EscapeFreedomPathItem, EscapeFreedomPathItem, EscapeFreedomPathItem]
  weeklyChange: EscapeWeeklyChange | null
  simulationContext: EscapeAbsenceSimulationContext | null
  progress: EscapeReadinessProgressPoint[]
  /** When true, numbers are illustrative (marketing demo). */
  demo?: boolean
}
