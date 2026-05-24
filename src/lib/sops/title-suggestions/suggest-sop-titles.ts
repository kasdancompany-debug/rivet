import { formatSopCategory, type SopCategoryValue } from "@/lib/sops/categories"

export type SuggestSopTitlesInput = {
  category: SopCategoryValue
  titleDraft: string
  /** Extra context: hero prompt, purpose, etc. */
  contextText?: string
}

const FILLER =
  /^(how to|how i|the|a|an|our|my|we|i|please|make sure to|ensure|always|never)\s+/gi

const CATEGORY_PREFIXES: Partial<Record<SopCategoryValue, string[]>> = {
  opening: ["Open —", "Morning —", "Start of shift —"],
  closing: ["Close —", "End of shift —", "Shutdown —"],
  cleaning: ["Clean —", "Sanitize —", "Reset —"],
  cash_handling: ["Cash —", "Drawer —", "Deposit —"],
  customer_experience: ["Guest —", "Service —", "Front —"],
  product_quality: ["Quality —", "Line —", "Product —"],
  training: ["Train —", "Onboard —", "Certify —"],
  other: ["Run —", "Standard —"],
}

function toTitleCase(raw: string): string {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase()
      if (["at", "and", "the", "for", "to", "of", "on", "in"].includes(lower)) return lower
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase())
}

function stripPunctuation(raw: string): string {
  return raw.replace(/[.!?]+$/, "").trim()
}

function normalizeTopic(raw: string): string {
  let topic = stripPunctuation(raw.trim())
  while (FILLER.test(topic)) {
    topic = topic.replace(FILLER, "").trim()
  }
  topic = topic.replace(/\s+/g, " ")
  if (topic.length < 2) return ""
  if (topic.length > 56) {
    topic = topic.slice(0, 56).replace(/\s+\S*$/, "").trim()
  }
  return toTitleCase(topic)
}

function extractTopicFromContext(context: string): string {
  const trimmed = context.trim()
  if (!trimmed) return ""

  const incident = trimmed.match(/\w+\s+forgets?\s+(.+?)(?:[.!?]|$)/i)
  if (incident?.[1]) {
    return normalizeTopic(incident[1].replace(/\s+at\s+(opening|open|closing|close)$/i, ""))
  }

  const howMatch = trimmed.match(/^how (?:i|to|we)\s+(.+?)(?:[.!?]|$)/im)
  if (howMatch?.[1]) return normalizeTopic(howMatch[1])

  const firstLine = trimmed.split(/\n+/)[0]?.trim() ?? ""
  if (firstLine.length >= 4) return normalizeTopic(firstLine)

  return ""
}

function dedupeTitles(titles: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const title of titles) {
    const cleaned = stripPunctuation(title.trim())
    if (cleaned.length < 4) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
  }
  return out
}

function buildVariants(category: SopCategoryValue, topic: string): string[] {
  const catLabel = formatSopCategory(category)
  const catLower = catLabel.toLowerCase()
  const prefixes = CATEGORY_PREFIXES[category] ?? CATEGORY_PREFIXES.other!

  const variants: string[] = [
    `${prefixes[0]!} ${topic}`,
    `${prefixes[1] ?? prefixes[0]!} ${topic}`,
    `${topic} — ${catLower}`,
    `${catLabel}: ${topic}`,
    `${prefixes[2] ?? prefixes[0]!} ${topic}`,
    `Never miss: ${topic}`,
    `${topic} (${catLower})`,
    `${topic} every shift`,
  ]

  if (category === "closing") {
    variants.push(`${topic} at close`)
  }
  if (category === "opening") {
    variants.push(`${topic} at open`)
  }

  return variants
}

/** Returns 3–5 SOP title recommendations from category + typed/context text. */
export function suggestSopTitles(input: SuggestSopTitlesInput): string[] {
  const draftTopic = normalizeTopic(input.titleDraft)
  const contextTopic = extractTopicFromContext(input.contextText ?? "")
  const topic = draftTopic || contextTopic

  if (topic.length < 3) return []

  const current = stripPunctuation(input.titleDraft.trim()).toLowerCase()
  const suggestions = dedupeTitles(buildVariants(input.category, topic)).filter(
    (s) => s.toLowerCase() !== current
  )

  return suggestions.slice(0, 5)
}
