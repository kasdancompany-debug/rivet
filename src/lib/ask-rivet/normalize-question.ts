const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "how",
  "do",
  "i",
  "we",
  "what",
  "where",
  "when",
  "why",
  "is",
  "are",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "my",
  "our",
  "should",
  "can",
  "does",
])

export function normalizeAskQuestion(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function questionTokens(raw: string): string[] {
  return normalizeAskQuestion(raw)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

export function questionsSimilar(a: string, b: string): boolean {
  const na = normalizeAskQuestion(a)
  const nb = normalizeAskQuestion(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  const ta = new Set(questionTokens(a))
  const tb = new Set(questionTokens(b))
  if (ta.size === 0 || tb.size === 0) return false
  let overlap = 0
  for (const t of ta) {
    if (tb.has(t)) overlap += 1
  }
  return overlap / Math.min(ta.size, tb.size) >= 0.6
}
