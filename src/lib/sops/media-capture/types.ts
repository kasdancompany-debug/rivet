export type MediaCaptureContext = {
  textPrompt?: string
  transcripts: { label: string; text: string }[]
  images: { label: string; signedUrl: string }[]
  /** Combined text used for heuristic fallback when vision API unavailable. */
  fallbackText: string
}
