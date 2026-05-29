import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"

export type AskQueryRow = {
  normalized_question: string
  standard_id: string | null
  response: unknown
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3)
}

function scoreQuestionMatch(summary: string, question: string): number {
  const summaryTokens = new Set(tokenize(normalizeSummaryKey(summary)))
  let score = 0
  for (const token of tokenize(question)) {
    if (summaryTokens.has(token)) score += 1
  }
  return score
}

export function countMatchingAskQueries(summary: string, rows: AskQueryRow[]): number {
  return rows.filter((row) => scoreQuestionMatch(summary, row.normalized_question) >= 2).length
}

export function findMatchingAskStandardId(
  summary: string,
  rows: AskQueryRow[]
): string | null {
  let bestId: string | null = null
  let bestScore = 0
  for (const row of rows) {
    if (!row.standard_id) continue
    const score = scoreQuestionMatch(summary, row.normalized_question)
    if (score > bestScore) {
      bestScore = score
      bestId = row.standard_id
    }
  }
  return bestScore >= 2 ? bestId : null
}

export function hasVerifiedAskAnswer(summary: string, rows: AskQueryRow[]): boolean {
  return rows.some((row) => {
    if (scoreQuestionMatch(summary, row.normalized_question) < 2) return false
    if (!row.standard_id) return false
    const response = row.response
    if (!response || typeof response !== "object" || Array.isArray(response)) return false
    const confidence = (response as Record<string, unknown>).confidence
    return confidence === "high" || confidence === "medium"
  })
}
