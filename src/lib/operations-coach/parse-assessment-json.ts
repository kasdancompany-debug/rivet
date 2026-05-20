import type { Json } from "@/types/database"

export type ParsedAssessmentJson = {
  categoryBreakdown: { sectionId: string; title: string; score: number }[]
  bottlenecks: { prompt: string; sectionTitle: string; score: number }[]
}

export function parseAssessmentJson(json: Json | null): ParsedAssessmentJson | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null
  const o = json as Record<string, unknown>

  const rawCats = o.categoryBreakdown
  const categoryBreakdown: ParsedAssessmentJson["categoryBreakdown"] = []
  if (Array.isArray(rawCats)) {
    for (const row of rawCats) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue
      const r = row as Record<string, unknown>
      const sectionId = typeof r.sectionId === "string" ? r.sectionId : null
      const title = typeof r.title === "string" ? r.title : null
      const score = typeof r.score === "number" ? r.score : Number(r.score)
      if (sectionId && title && !Number.isNaN(score)) {
        categoryBreakdown.push({ sectionId, title, score })
      }
    }
  }

  const rawB = o.bottlenecks
  const bottlenecks: ParsedAssessmentJson["bottlenecks"] = []
  if (Array.isArray(rawB)) {
    for (const row of rawB) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue
      const r = row as Record<string, unknown>
      const prompt = typeof r.prompt === "string" ? r.prompt : null
      const sectionTitle = typeof r.sectionTitle === "string" ? r.sectionTitle : null
      const score = typeof r.score === "number" ? r.score : Number(r.score)
      if (prompt && sectionTitle && !Number.isNaN(score)) {
        bottlenecks.push({ prompt, sectionTitle, score })
      }
    }
  }

  if (categoryBreakdown.length === 0 && bottlenecks.length === 0) return null
  return { categoryBreakdown, bottlenecks }
}
