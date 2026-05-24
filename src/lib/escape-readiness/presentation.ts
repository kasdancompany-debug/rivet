import type { EscapeReadinessBand, EscapeReadinessStatusTier } from "@/lib/escape-readiness/types"
import { progressionStageFromTier } from "@/lib/escape-readiness/progression"

export function statusTierFromScore(score: number): EscapeReadinessStatusTier {
  if (score <= 30) return "owner_dependent"
  if (score <= 60) return "fragile_emerging"
  if (score <= 80) return "building_momentum"
  if (score <= 94) return "strong_foundation"
  return "owner_optional"
}

export function escapeStatusBadge(tier: EscapeReadinessStatusTier): string {
  return progressionStageFromTier(tier).label
}

export function escapeStatusInterpretation(tier: EscapeReadinessStatusTier): string {
  return progressionStageFromTier(tier).summary
}

export function escapeStatusFromScore(score: number | null): {
  tier: EscapeReadinessStatusTier | null
  badge: string | null
  interpretation: string | null
} {
  if (score == null) {
    return { tier: null, badge: null, interpretation: null }
  }
  const tier = statusTierFromScore(score)
  return {
    tier,
    badge: escapeStatusBadge(tier),
    interpretation: escapeStatusInterpretation(tier),
  }
}

export function bandFromScoreForEscape(score: number): EscapeReadinessBand {
  if (score >= 81) return "ready"
  if (score >= 61) return "building"
  if (score >= 31) return "fragile"
  return "critical"
}

export function verdictForEscapeScore(score: number | null): string {
  if (score == null) {
    return "Add standards, training, and interruption logs so Rivet can score five days away—not a guess."
  }
  const { interpretation } = escapeStatusFromScore(score)
  if (interpretation) {
    return `${interpretation}. Five-day absence is the bar Rivet scores against.`
  }
  return "Five days away is not credible today—too much still depends on you being reachable."
}

export function escapeBandLabel(band: EscapeReadinessBand): string {
  switch (band) {
    case "ready":
      return "Escape ready"
    case "building":
      return "Building momentum"
    case "fragile":
      return "Fragile systems"
    case "critical":
      return "Owner dependent"
  }
}

export function escapeBandTone(band: EscapeReadinessBand): string {
  switch (band) {
    case "ready":
      return "border-emerald-200/80 bg-emerald-500/[0.06] text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/[0.08] dark:text-emerald-100"
    case "building":
      return "border-sky-200/80 bg-sky-500/[0.06] text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/[0.08] dark:text-sky-100"
    case "fragile":
      return "border-amber-200/80 bg-amber-500/[0.06] text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/[0.08] dark:text-amber-100"
    case "critical":
      return "border-rose-200/80 bg-rose-500/[0.06] text-rose-950 dark:border-rose-500/25 dark:bg-rose-500/[0.08] dark:text-rose-100"
  }
}

export function escapeStatusTierTone(tier: EscapeReadinessStatusTier): string {
  switch (tier) {
    case "owner_optional":
    case "strong_foundation":
      return "border-emerald-200/80 bg-emerald-500/[0.06] text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/[0.08] dark:text-emerald-100"
    case "building_momentum":
      return "border-sky-200/80 bg-sky-500/[0.06] text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/[0.08] dark:text-sky-100"
    case "fragile_emerging":
      return "border-amber-200/80 bg-amber-500/[0.06] text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/[0.08] dark:text-amber-100"
    case "owner_dependent":
      return "border-rose-200/80 bg-rose-500/[0.06] text-rose-950 dark:border-rose-500/25 dark:bg-rose-500/[0.08] dark:text-rose-100"
  }
}
