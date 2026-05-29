import { questionTokens } from "@/lib/ask-rivet/normalize-question"

export function searchTokens(query: string): string[] {
  return questionTokens(query)
}

/** Token overlap score between query and searchable text. */
export function scoreSearchMatch(text: string, query: string): number {
  const qTokens = searchTokens(query)
  if (qTokens.length === 0) return 0

  const normalized = text.toLowerCase()
  let score = 0

  for (const token of qTokens) {
    if (normalized.includes(token)) score += 1
  }

  const phrase = query.trim().toLowerCase()
  if (phrase.length >= 3 && normalized.includes(phrase)) {
    score += Math.min(4, qTokens.length)
  }

  return score
}

export function passesSearchThreshold(score: number, minScore = 1): boolean {
  return score >= minScore
}
