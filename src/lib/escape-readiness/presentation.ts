import type { EscapeReadinessBand } from "@/lib/escape-readiness/types"

export function bandFromScoreForEscape(score: number): EscapeReadinessBand {
  if (score >= 78) return "ready"
  if (score >= 58) return "building"
  if (score >= 38) return "fragile"
  return "critical"
}

export function verdictForEscapeScore(score: number | null): string {
  if (score == null) {
    return "Add standards, training assignments, and readiness rows so Rivet can score a real week away—not a guess."
  }
  if (score >= 78) {
    return "A week away is plausible: plays, teaching, and backups are carrying most load-bearing paths."
  }
  if (score >= 58) {
    return "Routine days could hold—but exceptions, vendor calls, and quality still snap back to you."
  }
  if (score >= 38) {
    return "A week away would stress the business: critical paths and staffing depth are still thin."
  }
  return "A week away is not credible today—too many procedures, dependencies, and gaps still route through you."
}

export function escapeBandLabel(band: EscapeReadinessBand): string {
  switch (band) {
    case "ready":
      return "Escape ready"
    case "building":
      return "Building"
    case "fragile":
      return "Fragile"
    case "critical":
      return "Critical"
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
