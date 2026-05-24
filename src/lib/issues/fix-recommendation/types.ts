export type IssueSuggestedOwner = {
  profileId: string | null
  name: string
  role: string
}

export type IssueFixDraftRef = {
  title: string
  description: string
}

export type IssueFixRecommendation = {
  isRepeated: boolean
  repeatCount: number
  rootCause: string
  suggestedPlay: IssueFixDraftRef | null
  suggestedTraining: IssueFixDraftRef | null
  suggestedOwner: IssueSuggestedOwner | null
  estimatedRepeatReductionPercent: number
  primaryFixType: "sop" | "training_module"
  capturePrompt: string
  relatedPlayTitle: string | null
  relatedTrainingTitle: string | null
}
