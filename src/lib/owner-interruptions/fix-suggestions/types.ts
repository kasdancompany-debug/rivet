export type InterruptionFixType = "sop" | "training_module"

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
  createHref: string
}
