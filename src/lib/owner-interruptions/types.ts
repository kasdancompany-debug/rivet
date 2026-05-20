import type { OwnerInterruptionKind } from "@/types/database"

export type OwnerInterruptionTrendDay = {
  ymd: string
  count: number
  minutes: number
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

export type OwnerInterruptionRecentRow = {
  id: string
  kind: OwnerInterruptionKind
  kindLabel: string
  summary: string
  estimatedMinutes: number
  occurredAt: string
  loggerName: string
  loggerRole: string
}

export type OwnerInterruptionsDashboardView = {
  weekStartIso: string
  interruptionsThisWeek: number
  minutesThisWeek: number
  estimatedOwnerHoursThisWeek: number
  trend14Days: OwnerInterruptionTrendDay[]
  byKind: OwnerInterruptionKindSlice[]
  byRole: OwnerInterruptionRoleSlice[]
  topPeople: OwnerInterruptionPersonSlice[]
  repeatCategories: OwnerInterruptionRepeatCategory[]
  recent: OwnerInterruptionRecentRow[]
}
