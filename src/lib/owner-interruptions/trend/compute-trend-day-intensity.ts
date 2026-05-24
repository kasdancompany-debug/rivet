export type TrendDayIntensity = "none" | "low" | "medium" | "high"

export function computeTrendDayIntensity(input: {
  count: number
  minutes: number
  maxCount: number
  maxMinutes: number
}): TrendDayIntensity {
  if (input.count === 0) return "none"

  const countRatio = input.maxCount > 0 ? input.count / input.maxCount : 0
  const minutesRatio = input.maxMinutes > 0 ? input.minutes / input.maxMinutes : 0
  const score = Math.max(countRatio, minutesRatio * 0.85)

  if (score >= 0.67) return "high"
  if (score >= 0.34) return "medium"
  return "low"
}

export function labelForTrendDayIntensity(intensity: TrendDayIntensity): string | null {
  switch (intensity) {
    case "low":
      return "Low"
    case "medium":
      return "Medium"
    case "high":
      return "High"
    default:
      return null
  }
}
