/**
 * Rivet Score: owner-dependency model (0–100 per dimension; higher = more load on the owner).
 */

export const RIVET_INDEX_CATEGORIES = [
  { id: "operations", label: "Daily operations" },
  { id: "product_quality", label: "Quality standards" },
  { id: "team_readiness", label: "Team readiness" },
  { id: "customer_experience", label: "Customer issues" },
  { id: "leadership_redundancy", label: "Backup coverage" },
  { id: "training_systems", label: "Training" },
] as const

export type RivetIndexCategoryId = (typeof RIVET_INDEX_CATEGORIES)[number]["id"]

/** Visual band for how much this area still depends on the owner (lower = better). */
export type RivetIndexBand = "critical" | "fragile" | "improving" | "stable" | "transferable"

export type RivetCategoryScore = {
  id: RivetIndexCategoryId
  label: string
  /** Owner dependency 0–100 for this category; null when there is not enough signal yet. */
  dependencyScore: number | null
  band: RivetIndexBand | null
  /** Short signal shown under the category. */
  hint: string
}

export type RivetIndexTrendPoint = {
  /** ISO date YYYY-MM-DD (UTC). */
  date: string
  dependencyScore: number | null
  autonomyScore: number | null
}

export type RivetIndexView = {
  /** Owner dependency 0–100 — the Rivet Score; null when not enough data to score fairly. */
  dependencyScore: number | null
  /** Inverse: how likely the business is to run well without the owner today. */
  autonomyLikelihood: number | null
  overallBand: RivetIndexBand | null
  headlineQuestion: string
  headlineAnswer: string
  categories: RivetCategoryScore[]
  criticalWarnings: string[]
  trend: RivetIndexTrendPoint[]
}

export function bandFromDependency(
  dependency: number,
  previousDependency?: number | null
): RivetIndexBand {
  const d = Math.round(dependency)
  const improving =
    previousDependency != null && previousDependency - d >= 3 && d < previousDependency

  if (d >= 82) return improving ? "fragile" : "critical"
  if (d >= 66) return improving ? "stable" : "fragile"
  if (d >= 48) return improving ? "stable" : "improving"
  if (d >= 32) return "stable"
  return "transferable"
}

export function autonomyLikelihoodFromDependency(dependency: number): number {
  return Math.max(0, Math.min(100, 100 - Math.round(dependency)))
}
