export type InterruptionOutcomeKind =
  | "sop_created"
  | "media_added"
  | "training_assigned"
  | "ask_rivet_answer"

export type InterruptionOutcomeItem = {
  kind: InterruptionOutcomeKind
  label: string
  detail: string | null
  href: string | null
  complete: boolean
}

export type InterruptionFixImpact = {
  patternKey: string
  beforeCount: number
  afterCount: number
  dropPercent: number | null
  trackingLabel: string
  isTracking: boolean
}

export type InterruptionRecommendations = {
  repeatCount: number
  suggestNewPlay: boolean
  suggestTraining: boolean
  suggestMedia: boolean
  suggestAskRivet: boolean
  matchedPlayTitle: string | null
  matchedModuleTitle: string | null
  askRivetMatchCount: number
}
