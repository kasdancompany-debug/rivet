import type { InterruptionFixSuggestion } from "@/lib/owner-interruptions/fix-suggestions/types"

export type OwnerValueMetricsSource = "actual_improvement" | "projected_fixes" | "none"

export type OwnerValueMetrics = {
  hoursReturnedThisWeek: number
  estimatedMinutesRecovered: number
  estimatedBusinessValueCad: number | null
  ownerHourlyValueCad: number | null
  source: OwnerValueMetricsSource
}

const WEEKLY_FROM_MONTHLY = 7 / 30

export function computeOwnerValueMetrics(input: {
  minutesThisWeek: number
  minutesPriorWeek: number
  fixSuggestions: InterruptionFixSuggestion[]
  ownerHourlyValueCad: number | null
}): OwnerValueMetrics {
  const actualMinutesReturned = Math.max(0, input.minutesPriorWeek - input.minutesThisWeek)
  const projectedWeeklyMinutes = input.fixSuggestions.reduce(
    (sum, suggestion) => sum + suggestion.estimatedOwnerMinutesRecovered,
    0
  ) * WEEKLY_FROM_MONTHLY

  let estimatedMinutesRecovered = 0
  let source: OwnerValueMetricsSource = "none"

  if (actualMinutesReturned > 0) {
    estimatedMinutesRecovered = actualMinutesReturned
    source = "actual_improvement"
  } else if (projectedWeeklyMinutes > 0) {
    estimatedMinutesRecovered = projectedWeeklyMinutes
    source = "projected_fixes"
  }

  const hoursReturnedThisWeek = Math.round((estimatedMinutesRecovered / 60) * 10) / 10

  const hourly =
    input.ownerHourlyValueCad != null && input.ownerHourlyValueCad > 0
      ? input.ownerHourlyValueCad
      : null

  const estimatedBusinessValueCad =
    hourly != null ? Math.round(hoursReturnedThisWeek * hourly) : null

  return {
    hoursReturnedThisWeek,
    estimatedMinutesRecovered: Math.round(estimatedMinutesRecovered),
    estimatedBusinessValueCad,
    ownerHourlyValueCad: input.ownerHourlyValueCad,
    source,
  }
}

export function formatCadCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount)
}
