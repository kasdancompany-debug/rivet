import type { Json } from "@/types/database"

import {
  ALL_QUESTION_IDS,
  type AnswerKey,
  SCANNER_SECTIONS,
  type ScannerSection,
} from "@/lib/founder-dependency-scanner/schema"

export type RiskBand = "healthy" | "moderate" | "high" | "critical"

export type CategoryBreakdown = {
  sectionId: string
  title: string
  score: number
  questionCount: number
}

export type Bottleneck = {
  questionId: string
  prompt: string
  sectionTitle: string
  score: number
}

export type ScanComputeResult = {
  /** 0 = low founder dependency (good), 100 = high (fragile). */
  founderDependencyScore: number
  riskBand: RiskBand
  riskLabel: string
  categoryBreakdown: CategoryBreakdown[]
  bottlenecks: Bottleneck[]
  recommendedActions: string[]
}

function questionScore(key: AnswerKey): number {
  const map: Record<AnswerKey, number> = {
    0: 0,
    1: 34,
    2: 67,
    3: 100,
  }
  return map[key]
}

function riskBandFromScore(score: number): { band: RiskBand; label: string } {
  if (score <= 24) return { band: "healthy", label: "Healthy" }
  if (score <= 49) return { band: "moderate", label: "Moderate" }
  if (score <= 74) return { band: "high", label: "High" }
  return { band: "critical", label: "Critical" }
}

function questionMeta(id: string): { section: ScannerSection; prompt: string } | null {
  for (const section of SCANNER_SECTIONS) {
    const q = section.questions.find((x) => x.id === id)
    if (q) return { section, prompt: q.prompt }
  }
  return null
}

function defaultRecommendations(score: number): string[] {
  const base = [
    "Pick one open issue this week and turn it into a play your leads can run without you.",
    "Name a single owner for opening and another for closing—then document the last 20% only you still hold.",
    "Schedule one cross-training session so a second person can sign off on quality, not just shadow you.",
  ]
  if (score >= 75) {
    return [
      "Treat the next thirty days as stabilization: fewer new initiatives until opening, closing, and cash are delegated with proof.",
      ...base,
    ]
  }
  if (score >= 50) {
    return base
  }
  return [
    "You are in a strong position—capture what works before drift sets in. Refresh photos and pars while standards are high.",
    "Rotate who leads pre-shift huddles so judgment calls are not always yours.",
  ]
}

function sectionRecommendations(sectionId: string, avg: number): string[] {
  if (avg < 45) return []
  const map: Record<string, string[]> = {
    opening_closing: [
      "Document opening and closing as two checklists with photos—assign named owners for each daypart.",
    ],
    product_quality: [
      "Build a one-page quality bible: reference photos, remake rules, and who may sign off on training.",
    ],
    ordering_inventory: [
      "Give one lead full ordering visibility: vendor list, pars, and substitution plays in your library.",
    ],
    staff_training: [
      "Publish a 14-day onboarding path with checkpoints; tie each to a written standard someone else can verify.",
    ],
    customer_experience: [
      "Write complaint + recovery scripts with refund boundaries—train two people to execute without escalating to you.",
    ],
  }
  return map[sectionId] ?? []
}

export function computeScanResult(answers: Record<string, AnswerKey>): ScanComputeResult {
  const scores: number[] = []
  for (const id of ALL_QUESTION_IDS) {
    const k = answers[id]
    if (k === undefined) continue
    scores.push(questionScore(k))
  }

  const founderDependencyScore =
    scores.length === 0
      ? 0
      : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  const { band: riskBand, label: riskLabel } = riskBandFromScore(founderDependencyScore)

  const categoryBreakdown: CategoryBreakdown[] = SCANNER_SECTIONS.map((section) => {
    const sectionScores = section.questions
      .map((q) => {
        const k = answers[q.id]
        return k === undefined ? null : questionScore(k)
      })
      .filter((x): x is number => x !== null)

    const score =
      sectionScores.length === 0
        ? 0
        : Math.round(
            sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
          )

    return {
      sectionId: section.id,
      title: section.title,
      score,
      questionCount: section.questions.length,
    }
  })

  const bottlenecks: Bottleneck[] = ALL_QUESTION_IDS.map((id) => {
    const k = answers[id]
    if (k === undefined) return null
    const meta = questionMeta(id)
    if (!meta) return null
    return {
      questionId: id,
      prompt: meta.prompt,
      sectionTitle: meta.section.title,
      score: questionScore(k),
    }
  })
    .filter((x): x is Bottleneck => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const sortedCategories = [...categoryBreakdown].sort((a, b) => b.score - a.score)
  const recs: string[] = []
  for (const cat of sortedCategories.slice(0, 3)) {
    recs.push(...sectionRecommendations(cat.sectionId, cat.score))
  }
  const merged = [...new Set([...recs, ...defaultRecommendations(founderDependencyScore)])].slice(
    0,
    6
  )

  return {
    founderDependencyScore,
    riskBand,
    riskLabel,
    categoryBreakdown,
    bottlenecks,
    recommendedActions: merged,
  }
}

export function isScanComplete(answers: Record<string, AnswerKey>): boolean {
  return ALL_QUESTION_IDS.every((id) => answers[id] !== undefined)
}

export function buildAssessmentPayload(
  result: ScanComputeResult,
  answers: Record<string, AnswerKey>
): Json {
  const independence = Math.max(0, Math.min(100, 100 - result.founderDependencyScore))
  return {
    version: 1,
    scanner: "founder_dependency_v1",
    completedAt: new Date().toISOString(),
    answers,
    founderDependencyScore: result.founderDependencyScore,
    independenceScore: independence,
    riskBand: result.riskBand,
    categoryBreakdown: result.categoryBreakdown,
    bottlenecks: result.bottlenecks,
    recommendedActions: result.recommendedActions,
  } as unknown as Json
}
