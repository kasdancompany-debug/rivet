import type {
  OwnerInterruptionKind,
  OwnerInterruptionSeverity,
  OwnerInterruptionSource,
  OwnerInterruptionUrgency,
} from "@/types/database"

import type { InterruptionFixSuggestion } from "@/lib/owner-interruptions/fix-suggestions/types"
import type { OwnerValueMetrics } from "@/lib/owner-interruptions/value-metrics/compute-value-metrics"

import type { TrendDayIntensity } from "@/lib/owner-interruptions/trend/compute-trend-day-intensity"

export type OwnerInterruptionTrendDay = {
  ymd: string
  dayLabel: string
  dayShort: string
  count: number
  minutes: number
  intensity: TrendDayIntensity
  mostCommonIssue: string | null
}

export type OwnerInterruptionKindSlice = {
  kind: OwnerInterruptionKind
  label: string
  count: number
  minutes: number
}

export type OwnerInterruptionRoleSlice = {
  role: string
  count: number
  minutes: number
}

export type OwnerInterruptionPersonSlice = {
  profileId: string
  name: string
  role: string
  count: number
  minutes: number
}

export type OwnerInterruptionRepeatCategory = {
  /** Normalized summary key for grouping. */
  key: string
  /** Representative display label (first seen casing). */
  label: string
  count: number
}

export type OwnerInterruptionSeveritySlice = {
  severity: OwnerInterruptionSeverity
  label: string
  count: number
  minutes: number
}

export type OwnerInterruptionSourceSlice = {
  source: OwnerInterruptionSource
  label: string
  count: number
  minutes: number
}

export type OwnerInterruptionRecentRow = {
  id: string
  kind: OwnerInterruptionKind
  kindLabel: string
  summary: string
  estimatedMinutes: number
  urgency: OwnerInterruptionUrgency
  source: OwnerInterruptionSource
  sourceLabel: string
  severity: OwnerInterruptionSeverity
  severityLabel: string
  impactScore: number
  occurredAt: string
  loggerName: string
  loggerRole: string
}

export type OwnerInterruptionTopLeak = {
  rank: number
  key: string
  name: string
  occurrences: number
  estimatedOwnerMinutes: number
  suggestedFix: string
  fixType: InterruptionFixSuggestion["fixType"]
  createHref: string
}

export type OwnerInterruptionsDashboardView = {
  businessId: string
  isOwner: boolean
  weekStartIso: string
  interruptionsThisWeek: number
  minutesThisWeek: number
  estimatedOwnerHoursThisWeek: number
  trend14Days: OwnerInterruptionTrendDay[]
  byKind: OwnerInterruptionKindSlice[]
  byRole: OwnerInterruptionRoleSlice[]
  topPeople: OwnerInterruptionPersonSlice[]
  topLeaks: OwnerInterruptionTopLeak[]
  bySeverity: OwnerInterruptionSeveritySlice[]
  bySource: OwnerInterruptionSourceSlice[]
  valueMetrics: OwnerValueMetrics
  recent: OwnerInterruptionRecentRow[]
}
