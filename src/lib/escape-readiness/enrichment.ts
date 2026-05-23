import { ESCAPE_READINESS_HEADLINE, ESCAPE_READINESS_TAGLINE } from "@/lib/escape-readiness/copy"
import type {
  EscapeReadinessBiggestRisk,
  EscapeReadinessFactor,
  EscapeReadinessFactorId,
  EscapeReadinessProgressPoint,
  EscapeReadinessView,
} from "@/lib/escape-readiness/types"
import { bandFromScoreForEscape, verdictForEscapeScore } from "@/lib/escape-readiness/presentation"

const FACTOR_ORDER: EscapeReadinessFactorId[] = [
  "sop_coverage",
  "training_coverage",
  "unresolved_issues",
  "owner_interruptions",
  "undocumented_procedures",
]

const FIX_BY_FACTOR: Record<
  EscapeReadinessFactorId,
  { title: string; action: string }
> = {
  sop_coverage: {
    title: "Document open, close, and your highest-variance procedure",
    action: "Publish one-page SOPs with a named owner—your phone should not be step one.",
  },
  training_coverage: {
    title: "Tie one training module to real work",
    action: "Assign completion to the role that runs it—not shadowing you until it sticks.",
  },
  unresolved_issues: {
    title: "Close or assign the oldest open issue",
    action: "Every unresolved item is a future text while you are away—give each one an owner and due date.",
  },
  owner_interruptions: {
    title: "Log owner interruptions for two weeks",
    action: "Patterns show what to document next—Rivet turns the log into a score you can move.",
  },
  undocumented_procedures: {
    title: "Write down the next procedure only you know",
    action: "Voice or bullets on the floor—assign who owns it before it becomes another pull.",
  },
}

const RISK_TITLE: Record<EscapeReadinessFactorId, string> = {
  sop_coverage: "SOP coverage is thin",
  training_coverage: "Training coverage is incomplete",
  unresolved_issues: "Too many unresolved issues",
  owner_interruptions: "Owner interruptions are high",
  undocumented_procedures: "Too much still undocumented",
}

function averageNullable(nums: (number | null)[]): number | null {
  const defined = nums.filter((n): n is number => n != null && Number.isFinite(n))
  if (defined.length === 0) return null
  return Math.round(defined.reduce((a, b) => a + b, 0) / defined.length)
}

function sortFactors(factors: EscapeReadinessFactor[]): EscapeReadinessFactor[] {
  const byId = new Map(factors.map((f) => [f.id, f]))
  return FACTOR_ORDER.map((id) => byId.get(id)).filter((f): f is EscapeReadinessFactor => Boolean(f))
}

function buildBiggestRisk(factors: EscapeReadinessFactor[]): EscapeReadinessBiggestRisk | null {
  const scored = factors.filter((f) => f.percent != null) as (EscapeReadinessFactor & { percent: number })[]
  if (scored.length === 0) return null
  scored.sort((a, b) => a.percent - b.percent)
  const weakest = scored[0]!
  return {
    factorId: weakest.id,
    title: RISK_TITLE[weakest.id],
    detail: weakest.hint,
  }
}

function buildTopFixes(factors: EscapeReadinessFactor[]): [string, string, string] {
  const scored = factors.filter((f) => f.percent != null) as (EscapeReadinessFactor & { percent: number })[]
  scored.sort((a, b) => a.percent - b.percent)
  const out: string[] = []
  const seen = new Set<string>()
  for (const f of scored) {
    if (out.length >= 3) break
    const line = `${FIX_BY_FACTOR[f.id].title} — ${FIX_BY_FACTOR[f.id].action}`
    if (seen.has(line)) continue
    seen.add(line)
    out.push(line)
  }
  const fallbacks = [
    "Pick one procedure to document this week—open, close, or your most repeated question.",
    "Assign training on that procedure to one person with a clear completion date.",
    "Log owner texts and calls for 14 days so you can see what still routes through you.",
  ]
  let i = 0
  while (out.length < 3) {
    const t = fallbacks[i % fallbacks.length]!
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
    i += 1
  }
  return [out[0]!, out[1]!, out[2]!]
}

export function finalizeEscapeReadinessView(
  partial: {
    score?: number | null
    verdict?: string
    factors: EscapeReadinessFactor[]
    progress?: EscapeReadinessProgressPoint[]
    band?: EscapeReadinessView["band"]
    demo?: boolean
  }
): EscapeReadinessView {
  const factors = sortFactors(partial.factors)
  const score =
    partial.score !== undefined
      ? partial.score
      : averageNullable(factors.map((f) => f.percent))
  const band = partial.band ?? (score == null ? null : bandFromScoreForEscape(score))
  const verdict = partial.verdict ?? verdictForEscapeScore(score)

  return {
    tagline: ESCAPE_READINESS_TAGLINE,
    headlineQuestion: ESCAPE_READINESS_HEADLINE,
    score,
    band,
    verdict,
    factors,
    biggestRisk: buildBiggestRisk(factors),
    topFixes: buildTopFixes(factors),
    progress: partial.progress ?? [],
    demo: partial.demo,
  }
}

export function escapeProgressFromAutonomyTrend(
  points: { date: string; autonomyScore: number | null }[],
  todayScore: number | null
): EscapeReadinessProgressPoint[] {
  const out = points
    .filter((p) => p.autonomyScore != null && Number.isFinite(p.autonomyScore))
    .map((p) => ({ date: p.date, score: Math.round(p.autonomyScore as number) }))
  if (todayScore != null && Number.isFinite(todayScore)) {
    const today = new Date().toISOString().slice(0, 10)
    const withoutToday = out.filter((p) => p.date !== today)
    withoutToday.push({ date: today, score: Math.round(todayScore) })
    withoutToday.sort((a, b) => a.date.localeCompare(b.date))
    return withoutToday.slice(-21)
  }
  return out.slice(-21)
}
