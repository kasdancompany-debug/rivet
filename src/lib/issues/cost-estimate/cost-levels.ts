export type IssueCostLevel = "low" | "moderate" | "high" | "severe"

export function costLevelFromMonthlyUsd(monthlyUsd: number): IssueCostLevel {
  if (monthlyUsd <= 0) return "low"
  if (monthlyUsd < 150) return "low"
  if (monthlyUsd < 500) return "moderate"
  if (monthlyUsd < 1500) return "high"
  return "severe"
}

export function labelForCostLevel(level: IssueCostLevel): string {
  switch (level) {
    case "low":
      return "Low bleed"
    case "moderate":
      return "Moderate"
    case "high":
      return "High bleed"
    case "severe":
      return "Severe"
    default:
      return level
  }
}

export const COST_LEVEL_STYLES: Record<
  IssueCostLevel,
  { badge: string; bar: string; headline: string }
> = {
  low: {
    badge: "border-emerald-500/25 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200",
    bar: "bg-emerald-500/70",
    headline: "border-emerald-500/25 bg-emerald-500/[0.06]",
  },
  moderate: {
    badge: "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200",
    bar: "bg-amber-500/75",
    headline: "border-amber-500/30 bg-amber-500/[0.07]",
  },
  high: {
    badge: "border-orange-500/35 bg-orange-500/8 text-orange-950 dark:text-orange-200",
    bar: "bg-orange-500/80",
    headline: "border-orange-500/35 bg-orange-500/[0.08]",
  },
  severe: {
    badge: "border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-200",
    bar: "bg-rose-500/85",
    headline: "border-rose-500/40 bg-gradient-to-br from-rose-500/12 to-amber-500/8",
  },
}
