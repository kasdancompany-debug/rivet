export type InterruptionFixType = "sop" | "training_module"

export type InterruptionFixActionKind =
  | "create_play"
  | "improve_play"
  | "add_media"
  | "assign_training"
  | "wire_ask_rivet"

export type InterruptionFixAction = {
  kind: InterruptionFixActionKind
  label: string
  detail: string
  href: string
}

export type InterruptionFixSuggestion = {
  patternKey: string
  problemTitle: string
  rootCause: string
  fixType: InterruptionFixType
  suggestedTitle: string
  suggestedDescription: string
  capturePrompt: string
  repeatCount: number
  estimatedInterruptionsPrevented: number
  estimatedOwnerMinutesRecovered: number
  /** Primary CTA — first operational action. */
  createHref: string
  /** Full fix bundle: play, media, training, Ask Rivet. */
  actions: InterruptionFixAction[]
  sampleInterruptionId: string | null
  askMatchCount: number
}
