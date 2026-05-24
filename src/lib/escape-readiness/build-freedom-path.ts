import type {
  EscapeFreedomPathItem,
  EscapeReadinessFactorInput,
  EscapeReadinessFactorId,
} from "@/lib/escape-readiness/types"
import { translateScoreGainOutcome } from "@/lib/escape-readiness/translate-score-gain-outcome"

type PathTemplate = {
  title: string
  action: string
  targetFactorPercent: number
  effort: EscapeFreedomPathItem["effort"]
  timeRequired: string
}

const PATH_BY_FACTOR: Record<EscapeReadinessFactorId, PathTemplate> = {
  sop_coverage: {
    title: "Document open, close, and your highest-variance procedure",
    action: "Publish one-page SOPs with a named owner—your phone should not be step one.",
    targetFactorPercent: 78,
    effort: "medium",
    timeRequired: "3–5 hours",
  },
  training_coverage: {
    title: "Tie one training module to real work",
    action: "Assign completion to the role that runs it—not shadowing you until it sticks.",
    targetFactorPercent: 75,
    effort: "medium",
    timeRequired: "1–2 days",
  },
  unresolved_issues: {
    title: "Close or assign the oldest open issue",
    action: "Every unresolved item is a future text while you are away—give each one an owner and due date.",
    targetFactorPercent: 82,
    effort: "low",
    timeRequired: "1–2 hours",
  },
  owner_interruptions: {
    title: "Log what still routes back to you for two weeks",
    action: "Patterns show what to document next—Rivet turns the log into a score you can move.",
    targetFactorPercent: 70,
    effort: "low",
    timeRequired: "15 min/day",
  },
  undocumented_procedures: {
    title: "Write down the next procedure only you know",
    action: "Voice or bullets on the floor—assign who owns it before it becomes another pull.",
    targetFactorPercent: 72,
    effort: "low",
    timeRequired: "1–3 hours",
  },
}

const FALLBACK_PATHS: PathTemplate[] = [
  {
    title: "Pick one procedure to document this week",
    action: "Open, close, or your most repeated question—one page with a named owner.",
    targetFactorPercent: 70,
    effort: "medium",
    timeRequired: "2–4 hours",
  },
  {
    title: "Assign training on that procedure to one person",
    action: "Set a clear completion date—not shadowing you until it sticks.",
    targetFactorPercent: 68,
    effort: "medium",
    timeRequired: "1 day",
  },
  {
    title: "Log owner texts and calls for 14 days",
    action: "See what still routes through you before you trust a longer absence.",
    targetFactorPercent: 65,
    effort: "low",
    timeRequired: "15 min/day",
  },
]

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function averageFactorScore(factors: EscapeReadinessFactorInput[]): number {
  const scored = factors.filter((f) => f.percent != null) as (EscapeReadinessFactorInput & { percent: number })[]
  if (scored.length === 0) return 0
  return Math.round(scored.reduce((a, f) => a + f.percent, 0) / scored.length)
}

function scoreGainFromFactorImprovement(currentPercent: number, targetPercent: number): number {
  const delta = Math.max(0, targetPercent - currentPercent)
  return Math.max(1, Math.round(delta / 5))
}

function buildPathItem(
  template: PathTemplate,
  factor: EscapeReadinessFactorInput & { percent: number } | null,
  currentScore: number | null
): EscapeFreedomPathItem {
  const baseline = currentScore ?? averageFactorScore(factor ? [factor] : [])
  const currentFactor = factor?.percent ?? 45
  const realisticTarget = Math.max(currentFactor + 8, Math.min(template.targetFactorPercent, 92))
  const estimatedScoreGain = scoreGainFromFactorImprovement(currentFactor, realisticTarget)
  const potentialResultingScore = clamp((currentScore ?? baseline) + estimatedScoreGain, 0, 100)

  return {
    factorId: factor?.id ?? null,
    title: template.title,
    action: template.action,
    estimatedScoreGain,
    translatedOutcome: translateScoreGainOutcome(estimatedScoreGain, currentScore, factor?.id ?? null),
    effort: template.effort,
    timeRequired: template.timeRequired,
    potentialResultingScore,
  }
}

export function buildFreedomPath(
  factors: EscapeReadinessFactorInput[],
  currentScore: number | null
): [EscapeFreedomPathItem, EscapeFreedomPathItem, EscapeFreedomPathItem] {
  const scored = factors.filter((f) => f.percent != null) as (EscapeReadinessFactorInput & { percent: number })[]
  scored.sort((a, b) => a.percent - b.percent)

  const out: EscapeFreedomPathItem[] = []
  const seenFactors = new Set<EscapeReadinessFactorId>()

  for (const factor of scored) {
    if (out.length >= 3) break
    if (seenFactors.has(factor.id)) continue
    seenFactors.add(factor.id)
    out.push(buildPathItem(PATH_BY_FACTOR[factor.id], factor, currentScore))
  }

  let fallbackIndex = 0
  while (out.length < 3) {
    const template = FALLBACK_PATHS[fallbackIndex % FALLBACK_PATHS.length]!
    const weakest = scored.find((f) => !seenFactors.has(f.id)) ?? null
    if (weakest) seenFactors.add(weakest.id)
    out.push(buildPathItem(template, weakest, currentScore))
    fallbackIndex += 1
  }

  return [out[0]!, out[1]!, out[2]!]
}

export function effortLabel(effort: EscapeFreedomPathItem["effort"]): string {
  switch (effort) {
    case "low":
      return "Low"
    case "medium":
      return "Medium"
    case "high":
      return "High"
  }
}
