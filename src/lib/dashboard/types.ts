import type { FirstDayChecklistView } from "@/lib/dashboard/first-day-checklist"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import type { RivetIndexView } from "@/lib/rivet-score/types"

export type BusinessRiskLevel = "low" | "moderate" | "elevated" | "high"

export type DashboardExecutionProofRow = {
  id: string
  completedAt: string | null
  shiftDate: string
  checklistTitle: string | null
  checklistType: string | null
  href: string
}

export type OwnerRiskCategory =
  | "procedure"
  | "training"
  | "issue"
  | "sop_critical"

export type OwnerRiskItem = {
  id: string
  category: OwnerRiskCategory
  title: string
  detail: string
}

export type NextBestMove = {
  title: string
  description: string
  href: string
  cta: string
}

/** Open issues flagged `owner_required` (for dashboard surfacing). */
export type DashboardOwnerIssueRow = {
  id: string
  title: string
  status: "open" | "in_progress" | "resolved"
  severity: string
}

export type DashboardViewModel = {
  source: "live" | "setup" | "error"
  businessName: string | null
  /** Owner concentration 0–100; null until enough signal (see Rivet Index). */
  founderDependencyPercent: number | null
  /** Higher = more still depends on founder (interpretation for display). */
  founderDependencyLabel: string
  /** Average documentation depth for active standards (0–100); null if none active. */
  standardsDepthPercent: number | null
  staffReadinessPercent: number | null
  openIssuesCount: number
  ownerTasksCount: number
  /** Issues with status open or in_progress (matches Issues → Unresolved). */
  unresolvedIssuesCount: number
  /** Logged owner interruptions since Monday 00:00 UTC this week (from Owner Interruptions). */
  ownerInterruptionsThisWeekCount: number
  /** Sum of estimated minutes for those interruptions. */
  ownerInterruptionsThisWeekMinutes: number
  /** Draft standards plus active standards with no documented steps. */
  proceduresMissingCount: number
  /** Up to five unresolved issues that still need the owner. */
  ownerRequiredOpenIssues: DashboardOwnerIssueRow[]
  trainingProgressPercent: number | null
  riskLevel: BusinessRiskLevel
  riskLevelCaption: string
  ownerRisks: OwnerRiskItem[]
  nextBestMove: NextBestMove
  rivetIndex: RivetIndexView
  escapeReadiness: EscapeReadinessView
  /** First-day onboarding checklist; null when workspace is not live. */
  firstDayChecklist: FirstDayChecklistView | null
  /** Recent completed checklist runs (execution proof). */
  executionProof: DashboardExecutionProofRow[]
  /**
   * When true, numbers are illustrative (e.g. logged-out marketing). Never set on authenticated live data.
   */
  demo?: boolean
  /**
   * Linked business with almost no tracked data yet — show onboarding-style guidance
   * instead of implying the scores are fully grounded.
   */
  coldStart?: boolean
  /** Reality check saved but no standards rows (e.g. seed skipped) — prompt capture. */
  needsFirstStandard?: boolean
}
