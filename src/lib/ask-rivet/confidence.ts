/** Minimum aggregate match score to consider a play matched. */
export const ASK_RIVET_MATCH_THRESHOLD = 1.5

/** Below this score, staff get the verified-standard refusal (no answer text). */
export const ASK_RIVET_LOW_SCORE_THRESHOLD = 4

/** At or above this score, confidence tier is "high" (verified answer). */
export const ASK_RIVET_HIGH_SCORE_THRESHOLD = 8

/** Source types considered directly verified operational text (not inferred summaries). */
export const ASK_RIVET_VERIFIED_ANSWER_SOURCES = new Set([
  "step",
  "faq_answer",
  "verification",
  "faq_question",
])

export function askRivetConfidenceTier(
  score: number
): "high" | "medium" | "low" {
  if (score < ASK_RIVET_LOW_SCORE_THRESHOLD) return "low"
  if (score >= ASK_RIVET_HIGH_SCORE_THRESHOLD) return "high"
  return "medium"
}

/** Display score 0–100 for staff transparency. */
export function askRivetConfidenceScorePercent(score: number): number {
  if (score < ASK_RIVET_MATCH_THRESHOLD) return 0
  if (score < ASK_RIVET_LOW_SCORE_THRESHOLD) {
    return Math.round((score / ASK_RIVET_LOW_SCORE_THRESHOLD) * 35)
  }
  const normalized = Math.min(score / ASK_RIVET_HIGH_SCORE_THRESHOLD, 1)
  return Math.round(35 + normalized * 65)
}

export function askRivetReviewStatusForConfidence(
  confidence: "high" | "medium" | "low"
): "auto_approved" | "pending" {
  return confidence === "high" ? "auto_approved" : "pending"
}
