import type { ReadinessLevelBand } from "@/lib/training/compute-readiness"
import type { DelegationReadinessStatus } from "@/lib/training/compute-readiness"

export function readinessScoreTone(score: number): string {
  if (score >= 75) return "text-emerald-700 dark:text-emerald-300"
  if (score >= 35) return "text-foreground"
  return "text-muted-foreground"
}

export function readinessRingStroke(score: number): string {
  if (score >= 75) return "stroke-emerald-600 dark:stroke-emerald-400"
  if (score >= 35) return "stroke-primary"
  return "stroke-muted-foreground/40"
}

export function readinessLevelBandClass(band: ReadinessLevelBand): string {
  switch (band) {
    case "floor_ready":
      return "border-emerald-500/35 bg-emerald-500/[0.06] text-emerald-950 dark:text-emerald-100"
    case "in_progress":
      return "border-border/60 bg-muted/20 text-foreground"
    case "not_started":
      return "border-border/50 bg-muted/10 text-muted-foreground"
  }
}

export function effectiveReadinessLabel(
  score: number,
  effective: DelegationReadinessStatus
): string {
  if (effective === "ready") return "Ready"
  if (score >= 35) return "Building"
  return "Not yet"
}
