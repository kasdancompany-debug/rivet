export type EscapeReadinessBand = "critical" | "fragile" | "building" | "ready"

export type EscapeReadinessFactorId =
  | "sop_coverage"
  | "training_coverage"
  | "unresolved_issues"
  | "owner_interruptions"
  | "undocumented_procedures"

export type EscapeReadinessFactor = {
  id: EscapeReadinessFactorId
  label: string
  /** 0–100 · higher = healthier for five days away. */
  percent: number | null
  hint: string
}

export type EscapeReadinessBiggestRisk = {
  factorId: EscapeReadinessFactorId
  title: string
  detail: string
}

export type EscapeReadinessProgressPoint = {
  /** ISO date YYYY-MM-DD */
  date: string
  score: number
}

export type EscapeReadinessView = {
  tagline: string
  headlineQuestion: string
  /** 0–100 · Escape Readiness Score · higher = more likely five days away holds. */
  score: number | null
  band: EscapeReadinessBand | null
  verdict: string
  factors: EscapeReadinessFactor[]
  biggestRisk: EscapeReadinessBiggestRisk | null
  topFixes: [string, string, string]
  progress: EscapeReadinessProgressPoint[]
  /** When true, numbers are illustrative (marketing demo). */
  demo?: boolean
}
