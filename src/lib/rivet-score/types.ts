/**
 * Rivet Index: owner-dependency model (0–100 per dimension; higher = more load on the owner).
 */

export const RIVET_INDEX_CATEGORIES = [
  { id: "operations", label: "Operations" },
  { id: "product_quality", label: "Product Quality" },
  { id: "team_readiness", label: "Team Readiness" },
  { id: "customer_experience", label: "Customer Experience" },
  { id: "leadership_redundancy", label: "Leadership Redundancy" },
  { id: "training_systems", label: "Training Systems" },
] as const

export type RivetIndexCategoryId = (typeof RIVET_INDEX_CATEGORIES)[number]["id"]

/** Visual band for dependency on this dimension (lower dependency → more structurally transferable). */
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
  /** Owner dependency 0–100 — the Rivet Index; null when not enough live signal to score fairly. */
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
