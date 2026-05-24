export type IssuePainLevel = "low" | "medium" | "high"

export function painLevelFromScore(score: number): IssuePainLevel {
  if (score >= 70) return "high"
  if (score >= 40) return "medium"
  return "low"
}

export function labelForPainLevel(level: IssuePainLevel): string {
  switch (level) {
    case "low":
      return "Low"
    case "medium":
      return "Medium"
    case "high":
      return "High"
  }
}

export const PAIN_LEVEL_STYLES: Record<
  IssuePainLevel,
  { badge: string; dot: string; bar: string }
> = {
  low: {
    badge: "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-950 dark:text-emerald-100",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  medium: {
    badge: "border-amber-500/35 bg-amber-500/[0.08] text-amber-950 dark:text-amber-100",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  high: {
    badge: "border-rose-500/40 bg-rose-500/[0.12] text-rose-950 dark:text-rose-100",
    dot: "bg-rose-600",
    bar: "bg-rose-600",
  },
}
