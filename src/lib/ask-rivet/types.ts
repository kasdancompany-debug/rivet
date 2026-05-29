export type AskRivetRelatedModule = {
  id: string
  title: string
  href: string
}

export type AskRivetRelatedCertification = {
  moduleId: string
  title: string
  description: string | null
  href: string
}

export type AskRivetMediaAttachment = {
  url: string
  kind: "photo" | "video" | "pdf" | "audio"
  caption: string | null
}

export type AskRivetSourceLink = {
  label: string
  source: string
  href: string | null
  excerpt: string
}

export type AskRivetVisualExample = {
  url: string | null
  caption: string | null
  kind: "photo" | "video" | "none"
}

export type AskRivetSourceCitation = {
  id: string
  title: string
  href: string
  excerpt: string
  sourceType: string
}

export type AskRivetReviewStatus = "auto_approved" | "pending" | "approved" | "improved"

export type AskRivetResponse = {
  title: string
  quickAnswer: string
  visualExample: AskRivetVisualExample | null
  videoUrl: string | null
  mediaAttachments: AskRivetMediaAttachment[]
  commonMistakes: string[]
  ownerNote: string | null
  relatedModules: AskRivetRelatedModule[]
  relatedCertifications: AskRivetRelatedCertification[]
  estimatedMinutes: number | null
  standardId: string | null
  standardHref: string | null
  playTitle: string | null
  matchedSource: string | null
  confidence: "high" | "medium" | "low"
  /** Raw keyword match score from search (0 when no match). */
  matchScore: number
  /** Staff-facing confidence 0–100. */
  confidenceScore: number
  /** Required citation for verified answers. */
  sourcePlay: AskRivetSourceCitation | null
  /** Linked training module citation (null when none linked). */
  sourceTraining: AskRivetSourceCitation | null
  sourceLinks: AskRivetSourceLink[]
  /** Human-readable list of what Rivet searched (for transparency). */
  sourcesSearched: string[]
  suggestCreatePlay: boolean
}

export const HIGH_FRICTION_ASK_THRESHOLD = 3
export const MINUTES_SAVED_PER_ASK = 4
