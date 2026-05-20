/**
 * JSON-serializable business facts the counsel layer (mock or LLM) reasons over.
 * Keep this stable when wiring OpenAI: serialize as the "user" context block.
 */
export type OperationsCoachSnapshot = {
  schemaVersion: 1
  generatedAt: string
  businessName: string
  assessment: {
    present: boolean
    assessedAt: string | null
    /** 0–100, higher = team more independent (matches DB `score`). */
    independenceScore: number | null
    /** 0–100, higher = more critical paths still route to the owner. */
    founderDependencyPercent: number | null
    riskBand: string | null
    topSectionId: string | null
    topSectionTitle: string | null
    topSectionScore: number | null
    topBottleneckPrompt: string | null
    bottlenecks: { prompt: string; sectionTitle: string; score: number }[]
  }
  sops: {
    activeCount: number
    draftCount: number
    /** Active SOPs with very short description (proxy for “not runnable yet”). */
    thinDescriptionActiveCount: number
    /** Active SOPs with fewer than two documented steps. */
    activeUnderTwoStepsCount: number
  }
  training: {
    moduleCount: number
    assignmentsTotal: number
    assignmentsCompleted: number
    assignmentsInProgress: number
    assignmentsNotStarted: number
    /** Modules that still have any non-completed assignment (max 5 titles). */
    modulesWithOpenAssignments: string[]
  }
  issues: {
    unresolvedCount: number
    openCount: number
    ownerRequiredUnresolvedCount: number
    ownerRequiredByCategorySlug: Record<string, number>
    ownerRequiredSampleTitles: string[]
  }
  dailyChecklists: {
    windowDays: number
    /** ISO date (UTC) start of window, inclusive. */
    windowStartDate: string
    totalRunsInWindow: number
    completedRunsInWindow: number
    abandonedRunsInWindow: number
    inProgressRunsInWindow: number
    /** completed / totalRuns, null if no runs. */
    runCompletionRate: number | null
    /** Daily checklist type with lowest completion among types with activity. */
    weakestShiftType: string | null
    weakestShiftTypeLabel: string | null
    byShiftType: {
      type: string
      label: string
      completed: number
      total: number
      completionRate: number | null
    }[]
  }
}

export type CoachRecommendation = {
  id: string
  /** Lower sorts first. */
  priority: number
  headline: string
  detail: string
  /** Short “why we surfaced this” in operator voice. */
  signal: string
  href?: string
}

export type CoachBrief = {
  /** One calm line; not a chatbot opener. */
  openingLine: string
  recommendations: CoachRecommendation[]
}

/** Future OpenAI call: system + user strings; snapshot embedded in `user`. */
export type OperationsCoachPromptPack = {
  system: string
  user: string
  snapshotJson: string
}
