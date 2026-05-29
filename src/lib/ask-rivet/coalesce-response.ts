import { COPY } from "@/lib/interface-copy"

import type { AskRivetResponse } from "./types"

const EMPTY_RESPONSE_DEFAULTS: Omit<
  AskRivetResponse,
  "title" | "quickAnswer" | "confidence" | "matchScore" | "confidenceScore"
> = {
  visualExample: null,
  videoUrl: null,
  mediaAttachments: [],
  commonMistakes: [],
  ownerNote: null,
  relatedModules: [],
  relatedCertifications: [],
  estimatedMinutes: null,
  standardId: null,
  standardHref: null,
  playTitle: null,
  matchedSource: null,
  sourcePlay: null,
  sourceTraining: null,
  sourceLinks: [],
  sourcesSearched: [],
  suggestCreatePlay: false,
}

/** Merge a stored partial response with updates; returns null when required fields are missing. */
export function coalesceAskRivetResponse(
  stored: Partial<AskRivetResponse>,
  patch: Partial<AskRivetResponse> = {}
): AskRivetResponse | null {
  const merged = { ...EMPTY_RESPONSE_DEFAULTS, ...stored, ...patch }
  if (typeof merged.title !== "string" || typeof merged.quickAnswer !== "string") return null
  if (merged.confidence !== "high" && merged.confidence !== "medium" && merged.confidence !== "low") {
    return null
  }
  if (typeof merged.matchScore !== "number" || typeof merged.confidenceScore !== "number") {
    return null
  }

  return merged as AskRivetResponse
}

/** Staff portal only shows owner-verified (high confidence) answers. */
export function gateAskRivetResponseForStaff(
  response: AskRivetResponse,
  opts: { portal: boolean; isOwner: boolean }
): AskRivetResponse {
  if (!opts.portal || opts.isOwner || response.confidence === "high") {
    return response
  }

  return {
    ...response,
    title: COPY.askRivet.lowConfidenceTitle,
    quickAnswer: COPY.askRivet.lowConfidenceAnswer,
    confidence: "low",
    visualExample: null,
    videoUrl: null,
    mediaAttachments: [],
    commonMistakes: [],
    ownerNote: null,
    relatedCertifications: [],
    standardId: null,
    standardHref: null,
    playTitle: null,
    matchedSource: null,
    sourcePlay: null,
    sourceTraining: null,
    sourceLinks: [],
    suggestCreatePlay: false,
  }
}
