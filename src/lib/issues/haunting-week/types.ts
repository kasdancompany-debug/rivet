import type { IssuePainLevel } from "@/lib/issues/pain-score/pain-levels"

export type HauntingWeekSort = "frequency" | "impact" | "time_cost"

export type HauntingWeekItem = {
  key: string
  title: string
  issueId: string
  rank: number
  frequency: number
  estimatedImpact: number
  timeCostScore: number
  painLevel: IssuePainLevel
  ownerRequired: boolean
  status: string
}

export type HauntingWeekItemInput = Omit<HauntingWeekItem, "rank">
