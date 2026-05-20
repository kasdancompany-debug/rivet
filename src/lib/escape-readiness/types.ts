export type EscapeReadinessBand = "critical" | "fragile" | "building" | "ready"

export type EscapeReadinessFactorId =
  | "procedures"
  | "training"
  | "owner_dependencies"
  | "staffing"

export type EscapeReadinessFactor = {
  id: EscapeReadinessFactorId
  label: string
  /** 0–100 · higher = healthier for a week away. */
  percent: number | null
  hint: string
}

export type EscapeReadinessView = {
  headlineQuestion: string
  /** 0–100 · Escape Readiness Score · higher = more likely to survive a week away. */
  score: number | null
  band: EscapeReadinessBand | null
  verdict: string
  factors: EscapeReadinessFactor[]
  /** When true, numbers are illustrative (marketing demo). */
  demo?: boolean
}
