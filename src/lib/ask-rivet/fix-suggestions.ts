import type { AskRivetResponse } from "./types"

export type AskRivetFixKind = "create_play" | "improve_play" | "add_training" | "add_media"

export type RepeatedQuestionFixInput = {
  askCount: number
  standardId: string | null
  lowConfidenceCount: number
  hasTrainingModule: boolean
  hasMedia: boolean
}

const REPEAT_THRESHOLD = 2

export function responseHasMedia(response: Pick<AskRivetResponse, "visualExample" | "videoUrl" | "mediaAttachments">): boolean {
  if (response.mediaAttachments?.length) return true
  if (response.videoUrl) return true
  if (response.visualExample?.url) return true
  return false
}

export function parseStoredAskResponse(raw: unknown): AskRivetResponse | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Partial<AskRivetResponse>
  if (typeof r.quickAnswer !== "string") return null
  return r as AskRivetResponse
}

/** Pick one fix action for a repeated question cluster. */
export function suggestFixForRepeatedQuestion(input: RepeatedQuestionFixInput): AskRivetFixKind | null {
  if (input.askCount < REPEAT_THRESHOLD) return null

  if (!input.standardId) return "create_play"

  if (!input.hasMedia) return "add_media"

  if (!input.hasTrainingModule) return "add_training"

  if (input.lowConfidenceCount > 0 || input.askCount >= 3) return "improve_play"

  return "improve_play"
}

export function fixKindHref(
  kind: AskRivetFixKind,
  opts: { standardId: string | null; question: string }
): string {
  const ask = encodeURIComponent(opts.question)
  switch (kind) {
    case "create_play":
      return `/sops/capture?prompt=${ask}`
    case "improve_play":
      return opts.standardId ? `/sops/${opts.standardId}` : `/sops/capture?prompt=${ask}`
    case "add_training":
      return opts.standardId ? `/training/modules/new?standardId=${opts.standardId}` : "/training/modules/new"
    case "add_media":
      return opts.standardId ? `/sops/${opts.standardId}` : `/sops/capture?prompt=${ask}`
  }
}
