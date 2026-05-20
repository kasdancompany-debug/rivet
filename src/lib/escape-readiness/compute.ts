import type { RivetIndexComputeContext } from "@/lib/rivet-score/compute"

import { bandFromScoreForEscape, verdictForEscapeScore } from "@/lib/escape-readiness/presentation"
import type { EscapeReadinessFactor, EscapeReadinessView } from "@/lib/escape-readiness/types"

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function averageNullable(nums: (number | null)[]): number | null {
  const defined = nums.filter((n): n is number => n != null && Number.isFinite(n))
  if (defined.length === 0) return null
  return Math.round(defined.reduce((a, b) => a + b, 0) / defined.length)
}

function computeProceduresComplete(ctx: RivetIndexComputeContext): {
  percent: number | null
  hint: string
} {
  const active = ctx.standards.filter((s) => s.status === "active")
  if (active.length === 0) {
    return {
      percent: null,
      hint: "No active standards yet—capture open, close, and quality plays first.",
    }
  }
  if (ctx.standardsDepthPercent != null) {
    return {
      percent: ctx.standardsDepthPercent,
      hint: `Documentation depth averages ${ctx.standardsDepthPercent}% across active plays (steps, roles, evidence, refresh).`,
    }
  }
  let withSteps = 0
  for (const s of active) {
    if ((ctx.stepCountBySopId.get(s.id) ?? 0) >= 1) withSteps += 1
  }
  const pct = Math.round((withSteps / active.length) * 100)
  return {
    percent: pct,
    hint: `${withSteps} of ${active.length} active play(s) have at least one documented step.`,
  }
}

function computeTrainingCoverage(ctx: RivetIndexComputeContext): {
  percent: number | null
  hint: string
} {
  const pct = ctx.staffReadinessPercent ?? ctx.trainingProgressPercent
  if (pct == null) {
    return {
      percent: null,
      hint: "No training assignments on record—assign modules before measuring coverage.",
    }
  }
  const label =
    ctx.staffReadinessPercent != null ? "Average per-person module completion" : "Overall module completion"
  return {
    percent: pct,
    hint: `${label} is about ${pct}% across the team.`,
  }
}

function computeCriticalOwnerDependencyRisk(ctx: RivetIndexComputeContext): {
  riskPercent: number | null
  hint: string
} {
  const active = ctx.standards.filter((s) => s.status === "active")
  const openOwner = ctx.bottlenecks.filter(
    (i) => i.owner_required && (i.status === "open" || i.status === "in_progress")
  )

  if (active.length === 0 && openOwner.length === 0 && ctx.ownerInterruptionsThisWeekCount === 0) {
    return {
      riskPercent: null,
      hint: "No active standards or owner-flagged issues yet—dependency risk is not measurable.",
    }
  }

  let risk = 0
  let criticalThin = 0
  for (const s of active) {
    if (s.owner_dependency_level >= 4) {
      const steps = ctx.stepCountBySopId.get(s.id) ?? 0
      if (steps < 2) {
        criticalThin += 1
        risk += 14
      } else {
        risk += 6
      }
    } else if (s.owner_dependency_level >= 3) {
      risk += 3
    }
  }
  risk += openOwner.length * 10
  risk += clamp(Math.round(ctx.ownerInterruptionsThisWeekCount * 2.5), 0, 24)

  const draft = ctx.standards.filter((s) => s.status === "draft").length
  risk += draft * 4

  const riskPercent = clamp(risk, 0, 100)
  const mitigated = 100 - riskPercent
  let hint = `About ${mitigated}% of critical paths look mitigated on paper.`
  if (criticalThin > 0) {
    hint = `${criticalThin} high–owner-dependency play(s) still lack runnable steps—${openOwner.length} issue(s) still need you.`
  } else if (openOwner.length > 0) {
    hint = `${openOwner.length} open issue(s) still flagged owner-required before the team can move on.`
  } else if (ctx.ownerInterruptionsThisWeekCount > 0) {
    hint = `${ctx.ownerInterruptionsThisWeekCount} owner interrupt(s) logged this week—judgment is still routing to you.`
  }

  return { riskPercent, hint }
}

function computeStaffingRisk(ctx: RivetIndexComputeContext): {
  riskPercent: number | null
  hint: string
} {
  const rows = ctx.readinessRows
  const interruptLift = clamp(Math.round(ctx.ownerInterruptionsThisWeekCount * 5), 0, 30)

  if (rows.length === 0) {
    if (ctx.teamProfileCount <= 1) {
      return {
        riskPercent: null,
        hint: "Only one profile on the business—add teammates and readiness rows to measure staffing risk.",
      }
    }
    if (ctx.ownerInterruptionsThisWeekCount > 0) {
      return {
        riskPercent: clamp(48 + interruptLift, 0, 100),
        hint: `${ctx.ownerInterruptionsThisWeekCount} interrupt(s) this week with no readiness rows—mark who can open alone.`,
      }
    }
    return {
      riskPercent: null,
      hint: "No readiness rows yet—record who can open, close, and coach without you.",
    }
  }

  let notReadyOpens = 0
  for (const r of rows) {
    if (r.open_alone === "not_ready") notReadyOpens += 1
  }
  const ratio = notReadyOpens / Math.max(1, rows.length)
  const riskPercent = clamp(Math.round(22 + ratio * 58 + interruptLift), 0, 100)
  const hint =
    notReadyOpens > 0
      ? `${notReadyOpens} teammate(s) not cleared to open alone—staffing risk stays elevated.`
      : "Opening coverage has named backups on record."
  return { riskPercent, hint }
}

export function computeEscapeReadiness(ctx: RivetIndexComputeContext): EscapeReadinessView {
  const procedures = computeProceduresComplete(ctx)
  const training = computeTrainingCoverage(ctx)
  const ownerDeps = computeCriticalOwnerDependencyRisk(ctx)
  const staffing = computeStaffingRisk(ctx)

  const ownerMitigation =
    ownerDeps.riskPercent == null ? null : clamp(100 - ownerDeps.riskPercent, 0, 100)
  const staffingCoverage =
    staffing.riskPercent == null ? null : clamp(100 - staffing.riskPercent, 0, 100)

  const score = averageNullable([
    procedures.percent,
    training.percent,
    ownerMitigation,
    staffingCoverage,
  ])

  const factors: EscapeReadinessFactor[] = [
    {
      id: "procedures",
      label: "Procedures complete",
      percent: procedures.percent,
      hint: procedures.hint,
    },
    {
      id: "training",
      label: "Training coverage",
      percent: training.percent,
      hint: training.hint,
    },
    {
      id: "owner_dependencies",
      label: "Critical owner dependencies",
      percent: ownerMitigation,
      hint: ownerDeps.hint,
    },
    {
      id: "staffing",
      label: "Staffing risk",
      percent: staffingCoverage,
      hint: staffing.hint,
    },
  ]

  const band = score == null ? null : bandFromScoreForEscape(score)

  return {
    headlineQuestion: "Can your business survive if you disappear for a week?",
    score,
    band,
    verdict: verdictForEscapeScore(score),
    factors,
  }
}
