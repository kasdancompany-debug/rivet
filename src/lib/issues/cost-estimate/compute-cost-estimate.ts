import type { IssueStatus, Tables } from "@/types/database"

import { costLevelFromMonthlyUsd, type IssueCostLevel } from "@/lib/issues/cost-estimate/cost-levels"
import { countSimilarIssuesInWindow } from "@/lib/issues/pain-score/compute-pain-score"

export type IssueCostEstimateDrivers = {
  incidentsPerMonth: number
  laborMinutesPerIncident: number
  ownerMinutesPerIncident: number
  teamHourlyUsd: number
  ownerHourlyUsd: number
}

export type IssueCostEstimate = {
  laborImpactUsd: number
  lostSalesUsd: number
  ownerTimeUsd: number
  monthlyProjectionUsd: number
  level: IssueCostLevel
  drivers: IssueCostEstimateDrivers
}

export const DEFAULT_TEAM_HOURLY_USD = 22
export const DEFAULT_OWNER_HOURLY_USD = 85

const LOST_SALES_BASE_USD: Record<string, number> = {
  customer_complaint: 48,
  product_quality: 38,
  inventory: 35,
  equipment: 28,
  scheduling: 18,
  cleaning: 8,
  staff_question: 0,
  other: 12,
  shift: 10,
  general: 12,
}

const CATEGORY_LABOR_FACTOR: Record<string, number> = {
  customer_complaint: 1.15,
  product_quality: 1.1,
  inventory: 1.05,
  equipment: 1.2,
  scheduling: 1,
  cleaning: 0.85,
  staff_question: 0.75,
  other: 1,
  shift: 1,
  general: 1,
}

function severityMultiplier(severity: string): number {
  switch (severity) {
    case "low":
      return 0.55
    case "medium":
      return 1
    case "high":
      return 1.75
    case "critical":
      return 2.75
    default:
      return 1
  }
}

function laborMinutesForSeverity(severity: string): number {
  switch (severity) {
    case "low":
      return 15
    case "medium":
      return 35
    case "high":
      return 65
    case "critical":
      return 95
    default:
      return 35
  }
}

function ownerMinutesForSeverity(severity: string, ownerRequired: boolean): number {
  if (!ownerRequired) {
    switch (severity) {
      case "low":
        return 5
      case "medium":
        return 10
      case "high":
        return 18
      case "critical":
        return 25
      default:
        return 10
    }
  }
  switch (severity) {
    case "low":
      return 12
    case "medium":
      return 25
    case "high":
      return 50
    case "critical":
      return 75
    default:
      return 25
  }
}

function statusLaborFactor(status: IssueStatus): number {
  switch (status) {
    case "investigating":
      return 1.15
    case "fix_in_progress":
      return 1.25
    case "resolved":
      return 0.35
    default:
      return 1
  }
}

function statusOwnerFactor(status: IssueStatus): number {
  switch (status) {
    case "investigating":
      return 1.2
    case "fix_in_progress":
      return 1.1
    case "resolved":
      return 0
    default:
      return 1
  }
}

function lostSalesPerIncident(category: string, severity: string): number {
  const base = LOST_SALES_BASE_USD[category] ?? LOST_SALES_BASE_USD.other
  return Math.round(base * severityMultiplier(severity))
}

export function computeCostEstimate(input: {
  issue: Pick<
    Tables<"bottlenecks">,
    "title" | "category" | "severity" | "owner_required" | "status" | "created_at"
  >
  history?: Pick<Tables<"bottlenecks">, "title" | "created_at">[]
  teamHourlyUsd?: number
  ownerHourlyUsd?: number
}): IssueCostEstimate {
  const teamHourlyUsd = input.teamHourlyUsd ?? DEFAULT_TEAM_HOURLY_USD
  const ownerHourlyUsd = input.ownerHourlyUsd ?? DEFAULT_OWNER_HOURLY_USD

  const incidentsPerMonth = countSimilarIssuesInWindow(input.history ?? [input.issue], input.issue)
  const categoryFactor = CATEGORY_LABOR_FACTOR[input.issue.category] ?? 1

  const laborMinutesPerIncident = Math.round(
    laborMinutesForSeverity(input.issue.severity) *
      categoryFactor *
      statusLaborFactor(input.issue.status)
  )
  const ownerMinutesPerIncident = Math.round(
    ownerMinutesForSeverity(input.issue.severity, input.issue.owner_required) *
      statusOwnerFactor(input.issue.status)
  )

  const laborPerIncident = (laborMinutesPerIncident / 60) * teamHourlyUsd
  const ownerPerIncident = (ownerMinutesPerIncident / 60) * ownerHourlyUsd
  const lostSalesPer = lostSalesPerIncident(input.issue.category, input.issue.severity)

  const laborImpactUsd = Math.round(laborPerIncident * incidentsPerMonth)
  const lostSalesUsd = Math.round(lostSalesPer * incidentsPerMonth)
  const ownerTimeUsd = Math.round(ownerPerIncident * incidentsPerMonth)

  const monthlyProjectionUsd =
    input.issue.status === "resolved"
      ? Math.round((laborImpactUsd + lostSalesUsd + ownerTimeUsd) * 0.1)
      : laborImpactUsd + lostSalesUsd + ownerTimeUsd

  return {
    laborImpactUsd,
    lostSalesUsd,
    ownerTimeUsd,
    monthlyProjectionUsd,
    level: costLevelFromMonthlyUsd(monthlyProjectionUsd),
    drivers: {
      incidentsPerMonth,
      laborMinutesPerIncident,
      ownerMinutesPerIncident,
      teamHourlyUsd,
      ownerHourlyUsd,
    },
  }
}
