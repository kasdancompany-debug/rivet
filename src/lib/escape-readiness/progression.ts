import type { EscapeReadinessStatusTier } from "@/lib/escape-readiness/types"

export type EscapeProgressionStageId =
  | "builder"
  | "operator"
  | "delegator"
  | "scaler"
  | "owner_optional"

export type EscapeProgressionStage = {
  id: EscapeProgressionStageId
  label: string
  minScore: number
  maxScore: number
  /** Position on the 0–100 track where this stage begins. */
  trackStartPercent: number
  tier: EscapeReadinessStatusTier
  summary: string
}

export type EscapeProgressionStageState = "completed" | "current" | "upcoming"

export type EscapeProgressionStageView = EscapeProgressionStage & {
  state: EscapeProgressionStageState
  /** 0–100 fill within the current stage segment. */
  segmentFillPercent: number
}

export type EscapeProgression = {
  currentStageId: EscapeProgressionStageId
  currentStageLabel: string
  nextStageId: EscapeProgressionStageId | null
  nextStageLabel: string | null
  pointsToNextStage: number | null
  /** 0–100 · score mapped to the progression track. */
  overallPercent: number
  stages: EscapeProgressionStageView[]
}

export const ESCAPE_PROGRESSION_STAGES: EscapeProgressionStage[] = [
  {
    id: "builder",
    label: "Builder",
    minScore: 0,
    maxScore: 30,
    trackStartPercent: 0,
    tier: "owner_dependent",
    summary: "Building the systems the business needs to run without you.",
  },
  {
    id: "operator",
    label: "Operator",
    minScore: 31,
    maxScore: 60,
    trackStartPercent: 31,
    tier: "fragile_emerging",
    summary: "You still run the floor—procedures and training are taking shape.",
  },
  {
    id: "delegator",
    label: "Delegator",
    minScore: 61,
    maxScore: 80,
    trackStartPercent: 61,
    tier: "building_momentum",
    summary: "More work leaves your hands, but judgment still routes back to you.",
  },
  {
    id: "scaler",
    label: "Scaler",
    minScore: 81,
    maxScore: 94,
    trackStartPercent: 81,
    tier: "strong_foundation",
    summary: "Operations scale—most days run without daily owner input.",
  },
  {
    id: "owner_optional",
    label: "Owner Optional",
    minScore: 95,
    maxScore: 100,
    trackStartPercent: 95,
    tier: "owner_optional",
    summary: "The business holds when you step away for a full week or more.",
  },
]

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function stageState(
  score: number,
  stage: EscapeProgressionStage
): EscapeProgressionStageState {
  if (score > stage.maxScore) return "completed"
  if (score >= stage.minScore) return "current"
  return "upcoming"
}

function segmentFillPercent(score: number, stage: EscapeProgressionStage): number {
  const span = stage.maxScore - stage.minScore
  if (span <= 0) return 100
  return clamp(Math.round(((score - stage.minScore) / span) * 100), 0, 100)
}

export function progressionStageFromScore(score: number): EscapeProgressionStage {
  return (
    ESCAPE_PROGRESSION_STAGES.find(
      (stage) => score >= stage.minScore && score <= stage.maxScore
    ) ?? ESCAPE_PROGRESSION_STAGES[0]!
  )
}

export function progressionStageFromTier(tier: EscapeReadinessStatusTier): EscapeProgressionStage {
  return ESCAPE_PROGRESSION_STAGES.find((stage) => stage.tier === tier) ?? ESCAPE_PROGRESSION_STAGES[0]!
}

export function buildProgression(score: number | null): EscapeProgression | null {
  if (score == null) return null

  const rounded = clamp(Math.round(score), 0, 100)
  const current = progressionStageFromScore(rounded)
  const currentIndex = ESCAPE_PROGRESSION_STAGES.findIndex((s) => s.id === current.id)
  const next = currentIndex >= 0 ? ESCAPE_PROGRESSION_STAGES[currentIndex + 1] : undefined

  const stages: EscapeProgressionStageView[] = ESCAPE_PROGRESSION_STAGES.map((stage) => {
    const state = stageState(rounded, stage)
    return {
      ...stage,
      state,
      segmentFillPercent:
        state === "completed" ? 100 : state === "current" ? segmentFillPercent(rounded, stage) : 0,
    }
  })

  return {
    currentStageId: current.id,
    currentStageLabel: current.label,
    nextStageId: next?.id ?? null,
    nextStageLabel: next?.label ?? null,
    pointsToNextStage: next ? Math.max(0, next.minScore - rounded) : null,
    overallPercent: rounded,
    stages,
  }
}

export function progressionStageLabel(id: EscapeProgressionStageId): string {
  return ESCAPE_PROGRESSION_STAGES.find((s) => s.id === id)?.label ?? id
}
