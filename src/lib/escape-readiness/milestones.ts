export type EscapeMilestone = {
  threshold: number
  label: string
}

export const ESCAPE_READINESS_MILESTONES: EscapeMilestone[] = [
  { threshold: 80, label: "Survives long weekend" },
  { threshold: 90, label: "Survives one week" },
  { threshold: 95, label: "Operator mode" },
]

export function escapeMilestoneState(
  score: number | null,
  milestone: EscapeMilestone
): "reached" | "next" | "locked" {
  if (score == null) return "locked"
  if (score >= milestone.threshold) return "reached"
  const next = ESCAPE_READINESS_MILESTONES.find((m) => score < m.threshold)
  if (next?.threshold === milestone.threshold) return "next"
  return "locked"
}
