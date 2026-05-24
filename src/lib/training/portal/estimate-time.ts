import type { Tables } from "@/types/database"

export function estimateSopMinutes(
  standard: Pick<Tables<"standards">, "estimated_time_minutes">,
  steps: Pick<Tables<"standard_steps">, "estimated_time_minutes">[]
): number {
  const stepSum = steps.reduce((sum, s) => sum + (s.estimated_time_minutes ?? 3), 0)
  const base = standard.estimated_time_minutes ?? 0
  return Math.max(base, stepSum, steps.length > 0 ? steps.length * 3 : 8)
}

export function formatEstimatedDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return `${hours} hr`
  return `${hours} hr ${mins} min`
}
