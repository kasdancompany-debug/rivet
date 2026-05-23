import type { Tables } from "@/types/database"

import type {
  RivetCategoryScore,
  RivetIndexCategoryId,
  RivetIndexView,
} from "@/lib/rivet-score/types"
import {
  RIVET_INDEX_CATEGORIES,
  autonomyLikelihoodFromDependency,
  bandFromDependency,
} from "@/lib/rivet-score/types"

export type DailyRunCompletionStats = {
  completedRunIds: string[]
  abandonedCount: number
  itemsCompleted: number
  itemsTotal: number
  recentRunCount: number
}

export type RivetIndexComputeContext = {
  standards: Tables<"standards">[]
  stepCountBySopId: Map<string, number>
  bottlenecks: Tables<"bottlenecks">[]
  trainingProgressPercent: number | null
  staffReadinessPercent: number | null
  /** 0–100 documentation depth for active standards; null when none active. */
  standardsDepthPercent: number | null
  /** Dependency implied by latest concentration scan (0–100), if any. */
  scanDependencyPercent: number | null
  runStats: DailyRunCompletionStats
  readinessRows: Tables<"employee_readiness">[]
  teamProfileCount: number
  trainingIncompleteCount: number
  totalAssignments: number
  /** Owner interruptions since Monday UTC this week (count). */
  ownerInterruptionsThisWeekCount: number
  /** Yesterday’s overall dependency (from last stored snapshot). */
  previousOverallDependency?: number | null
  /** Yesterday’s category dependency map for band “improving” detection. */
  previousCategoryDependency?: Partial<Record<RivetIndexCategoryId, number>> | null
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function labelFor(id: RivetIndexCategoryId): string {
  return RIVET_INDEX_CATEGORIES.find((c) => c.id === id)!.label
}

function blendNullable(
  a: number | null,
  b: number | null,
  weightA: number,
  weightB: number
): number | null {
  if (a == null && b == null) return null
  if (a == null) return b
  if (b == null) return a
  const w = weightA + weightB
  return clamp(Math.round((a * weightA + b * weightB) / w), 0, 100)
}

function scoreOperations(ctx: RivetIndexComputeContext): { score: number | null; hint: string } {
  const { runStats } = ctx
  if (runStats.recentRunCount === 0) {
    return {
      score: null,
      hint: "No execution records in the last two weeks—completion discipline is not measurable yet.",
    }
  }
  if (runStats.itemsTotal === 0) {
    return {
      score: null,
      hint: "Runs exist but checklist line items are not on record yet.",
    }
  }
  const completion = runStats.itemsCompleted / runStats.itemsTotal
  const abandonedRate =
    runStats.abandonedCount / Math.max(1, runStats.abandonedCount + runStats.completedRunIds.length)
  const base = (1 - completion) * 100
  const abandonPenalty = abandonedRate * 35
  const score = clamp(Math.round(base * 0.72 + abandonPenalty), 0, 100)
  let hint = `Line completion about ${Math.round(completion * 100)}% on completed runs (last two weeks).`
  if (abandonedRate > 0.12) {
    hint = `${Math.round(abandonedRate * 100)}% of recent runs abandoned—finish runs on the floor to prove coverage.`
  }
  return { score, hint }
}

function scoreProductQuality(ctx: RivetIndexComputeContext): { score: number | null; hint: string } {
  const open = ctx.bottlenecks.filter((i) => i.status === "open" || i.status === "in_progress")
  const pq = open.filter((i) => i.category === "product_quality" || i.category === "equipment")
  const ownerPq = pq.filter((i) => i.owner_required)
  const score = clamp(Math.round(ownerPq.length * 18 + pq.length * 7), 0, 100)
  const hint =
    ownerPq.length > 0
      ? `${ownerPq.length} product or equipment issue(s) still need your judgment.`
      : pq.length > 0
        ? `${pq.length} open product or equipment thread(s)—keep standards visible.`
        : "No open product-quality or equipment bottlenecks in the unresolved queue."
  return { score, hint }
}

function scoreCustomerExperience(ctx: RivetIndexComputeContext): { score: number | null; hint: string } {
  const open = ctx.bottlenecks.filter((i) => i.status === "open" || i.status === "in_progress")
  const cx = open.filter((i) => i.category === "customer_complaint" || i.category === "staff_question")
  const ownerCx = cx.filter((i) => i.owner_required)
  const score = clamp(Math.round(ownerCx.length * 20 + cx.length * 6), 0, 100)
  const hint =
    ownerCx.length > 0
      ? `${ownerCx.length} customer-facing issue(s) still route to you first.`
      : cx.length > 0
        ? `${cx.length} service or staff-question item(s) open—tighten playbooks before volume spikes.`
        : "No unresolved customer or staff-question bottlenecks on the board."
  return { score, hint }
}

function scoreTrainingSystems(ctx: RivetIndexComputeContext): { score: number | null; hint: string } {
  if (ctx.totalAssignments === 0) {
    return {
      score: null,
      hint: "No training assignments yet—readiness is not measured on the floor.",
    }
  }
  const pct = ctx.trainingProgressPercent ?? 0
  const openRatio = ctx.trainingIncompleteCount / Math.max(1, ctx.totalAssignments)
  const score = clamp(Math.round((100 - pct) * 0.55 + openRatio * 45), 0, 100)
  const hint =
    ctx.trainingIncompleteCount > 0
      ? `${ctx.trainingIncompleteCount} assignment(s) still not completed across modules.`
      : "Training assignments look current."
  return { score, hint }
}

function scoreTeamReadiness(ctx: RivetIndexComputeContext): { score: number | null; hint: string } {
  const pct = ctx.staffReadinessPercent
  if (pct == null) {
    return {
      score: null,
      hint: "No per-person training coverage yet—assign modules to teammates for a team average.",
    }
  }
  const score = clamp(Math.round(100 - pct), 0, 100)
  const hint =
    pct < 60
      ? `Average module completion near ${pct}%—floor coverage is still thin.`
      : `Average module completion near ${pct}%—keep reinforcing backups.`
  return { score, hint }
}

function scoreLeadershipRedundancy(ctx: RivetIndexComputeContext): { score: number | null; hint: string } {
  const rows = ctx.readinessRows
  const interruptLift = clamp(Math.round(ctx.ownerInterruptionsThisWeekCount * 6), 0, 36)

  if (rows.length === 0) {
    const tc = ctx.teamProfileCount
    if (tc <= 1) {
      const score = clamp(72 + interruptLift, 0, 100)
      return {
        score,
        hint:
          "Only one profile on the business—operational redundancy is structurally thin until you add teammates.",
      }
    }
    if (ctx.ownerInterruptionsThisWeekCount > 0) {
      const score = clamp(38 + interruptLift, 0, 100)
      return {
        score,
        hint: `${ctx.ownerInterruptionsThisWeekCount} owner interruption(s) this week with no readiness rows—log who can open alone.`,
      }
    }
    return {
      score: null,
      hint: "Readiness rows missing—mark who can open, close, and coach without you.",
    }
  }

  let notReadyOpens = 0
  for (const r of rows) {
    if (r.open_alone === "not_ready") notReadyOpens += 1
  }
  const ratio = notReadyOpens / Math.max(1, rows.length)
  let score = clamp(Math.round(28 + ratio * 52 + interruptLift * 0.35), 0, 100)
  score = clamp(score + Math.round(interruptLift * 0.4), 0, 100)
  const hint =
    notReadyOpens > 0
      ? `${notReadyOpens} teammate(s) not cleared to open alone yet.`
      : "Opening coverage has named backups on record."
  return { score, hint }
}

function scoreUndocumentedProcedures(ctx: RivetIndexComputeContext): { score: number | null; hint: string } {
  const active = ctx.standards.filter((s) => s.status === "active")
  if (active.length === 0) {
    return {
      score: null,
      hint: "No active standards yet—capture procedures so the team can run without tribal knowledge.",
    }
  }
  const depth = ctx.standardsDepthPercent
  if (depth == null) {
    return {
      score: null,
      hint: "Standards exist but depth could not be computed.",
    }
  }

  let criticalThin = 0
  let thinSteps = 0
  for (const s of active) {
    const steps = ctx.stepCountBySopId.get(s.id) ?? 0
    const thin = steps < 2
    if (thin) thinSteps += 1
    if (s.owner_dependency_level >= 4 && steps < 2) criticalThin += 1
  }
  const draft = ctx.standards.filter((s) => s.status === "draft").length

  const score = clamp(Math.round(100 - depth + thinSteps * 4 + draft * 5 + criticalThin * 12), 0, 100)
  const hint =
    criticalThin > 0
      ? `${criticalThin} high–owner-dependency standard(s) still lack runnable steps.`
      : thinSteps > 0
        ? `${thinSteps} active standard(s) still need more steps for floor use.`
        : `Documentation depth about ${depth}% across pillars (title, steps, roles, evidence, recent touch).`
  return { score, hint }
}

function buildWarnings(
  ctx: RivetIndexComputeContext,
  categories: RivetCategoryScore[]
): string[] {
  const out: string[] = []
  const openOwner = ctx.bottlenecks.filter(
    (i) => i.owner_required && (i.status === "open" || i.status === "in_progress")
  )
  if (openOwner.length >= 3) {
    out.push(`${openOwner.length} owner-required issues are still unresolved—approvals are backing up.`)
  } else if (openOwner.length >= 1) {
    out.push(`${openOwner.length} issue(s) still flagged as needing you before the team can move on.`)
  }

  const criticalSop = ctx.standards.filter(
    (s) =>
      s.status === "active" &&
      s.owner_dependency_level >= 4 &&
      (ctx.stepCountBySopId.get(s.id) ?? 0) < 2
  )
  if (criticalSop.length > 0) {
    out.push(
      `${criticalSop.length} critical standard(s) are marked owner-dependent but lack documented steps.`
    )
  }

  if (ctx.trainingIncompleteCount >= 4) {
    out.push("Training assignments are spread thin—several modules still open across the team.")
  }

  if (ctx.runStats.abandonedCount >= 2) {
    out.push("Multiple daily runs were abandoned—checklists may be unrealistic or ownership unclear.")
  }

  const badReadiness = ctx.readinessRows.filter((r) => r.open_alone === "not_ready").length
  if (ctx.readinessRows.length >= 2 && badReadiness === ctx.readinessRows.length) {
    out.push("No teammate is cleared to open alone yet—single-threaded operations.")
  }

  const fragile = categories.filter((c) => c.band === "critical" || c.band === "fragile")
  for (const c of fragile.slice(0, 2)) {
    if (!out.some((w) => w.includes(c.label))) {
      out.push(`${c.label} is still a concentration point (${c.band}).`)
    }
  }

  return out.slice(0, 6)
}

function averageNullable(nums: (number | null)[]): number | null {
  const defined = nums.filter((n): n is number => n != null)
  if (defined.length === 0) return null
  return Math.round(defined.reduce((a, b) => a + b, 0) / defined.length)
}

export function computeRivetIndex(ctx: RivetIndexComputeContext): Omit<RivetIndexView, "trend"> {
  const prev = ctx.previousCategoryDependency ?? null

  const doc = scoreUndocumentedProcedures(ctx)
  const ops = scoreOperations(ctx)
  const pq = scoreProductQuality(ctx)
  const train = scoreTrainingSystems(ctx)
  const team = scoreTeamReadiness(ctx)
  const cx = scoreCustomerExperience(ctx)
  const lead = scoreLeadershipRedundancy(ctx)

  const parts: { id: RivetIndexCategoryId; score: number | null; hint: string }[] = [
    { id: "operations", score: ops.score, hint: ops.hint },
    { id: "product_quality", score: pq.score, hint: pq.hint },
    { id: "team_readiness", score: team.score, hint: team.hint },
    { id: "customer_experience", score: cx.score, hint: cx.hint },
    { id: "leadership_redundancy", score: lead.score, hint: lead.hint },
    { id: "training_systems", score: train.score, hint: train.hint },
  ]

  const blendedProduct = blendNullable(pq.score, doc.score, 0.65, 0.35)
  const blendedOps = blendNullable(ops.score, doc.score, 0.55, 0.45)

  const adjusted = parts.map((p) => {
    if (p.id === "product_quality") return { ...p, score: blendedProduct }
    if (p.id === "operations") return { ...p, score: blendedOps }
    return p
  })

  const categoryAverage = averageNullable(adjusted.map((p) => p.score))

  let dependencyScore: number | null = categoryAverage
  if (ctx.scanDependencyPercent != null) {
    if (dependencyScore == null) {
      dependencyScore = clamp(Math.round(ctx.scanDependencyPercent), 0, 100)
    } else {
      dependencyScore = clamp(
        Math.round(dependencyScore * 0.62 + ctx.scanDependencyPercent * 0.38),
        0,
        100
      )
    }
  }

  const autonomyLikelihood =
    dependencyScore == null ? null : autonomyLikelihoodFromDependency(dependencyScore)

  const categories: RivetCategoryScore[] = adjusted.map((p) => ({
    id: p.id,
    label: labelFor(p.id),
    dependencyScore: p.score,
    band:
      p.score == null ? null : bandFromDependency(p.score, prev?.[p.id] ?? null),
    hint: p.hint,
  }))

  const prevOverall = ctx.previousOverallDependency ?? null

  const overallBand =
    dependencyScore == null ? null : bandFromDependency(dependencyScore, prevOverall)

  const criticalWarnings = buildWarnings(ctx, categories)

  const headlineQuestion = "Can the business run without you today?"
  let headlineAnswer = ""
  if (dependencyScore == null) {
    headlineAnswer =
      "Not enough data yet—add procedures, training, or log owner interruptions so Rivet can score your business."
  } else if (autonomyLikelihood != null && autonomyLikelihood >= 72) {
    headlineAnswer =
      "Most days the team can run routine work without pulling you in for every decision."
  } else if (autonomyLikelihood != null && autonomyLikelihood >= 52) {
    headlineAnswer =
      "Mixed: everyday work often holds, but exceptions and approvals still come back to you."
  } else if (autonomyLikelihood != null && autonomyLikelihood >= 34) {
    headlineAnswer =
      "Limited: several important tasks still wait on your judgment when something goes wrong."
  } else {
    headlineAnswer =
      "Most of the business still runs through you—procedures, training, and backup coverage need work."
  }

  return {
    dependencyScore,
    autonomyLikelihood,
    overallBand,
    headlineQuestion,
    headlineAnswer,
    categories,
    criticalWarnings,
  }
}

export function categoryScoresRecord(
  categories: RivetCategoryScore[]
): Record<RivetIndexCategoryId, number> {
  const out: Partial<Record<RivetIndexCategoryId, number>> = {}
  for (const c of categories) {
    if (c.dependencyScore != null) out[c.id] = c.dependencyScore
  }
  return out as Record<RivetIndexCategoryId, number>
}
