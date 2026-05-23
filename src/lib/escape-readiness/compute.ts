import type { RivetIndexComputeContext } from "@/lib/rivet-score/compute"

import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessFactor, EscapeReadinessView } from "@/lib/escape-readiness/types"

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function computeSopCoverage(ctx: RivetIndexComputeContext): {
  percent: number | null
  hint: string
} {
  const active = ctx.standards.filter((s) => s.status === "active")
  if (active.length === 0) {
    return {
      percent: null,
      hint: "No active standards yet—publish open, close, and your highest-variance plays first.",
    }
  }
  if (ctx.standardsDepthPercent != null) {
    return {
      percent: ctx.standardsDepthPercent,
      hint: `SOP depth averages ${ctx.standardsDepthPercent}% across active plays (steps, roles, evidence, refresh).`,
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

function computeUnresolvedIssuesHealth(ctx: RivetIndexComputeContext): {
  percent: number | null
  hint: string
} {
  const open = ctx.bottlenecks.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  ).length
  if (open === 0) {
    return {
      percent: 92,
      hint: "No open or in-progress issues—fewer surprises while you are away.",
    }
  }
  let percent: number
  if (open === 1) percent = 82
  else if (open <= 3) percent = 68
  else if (open <= 6) percent = 48
  else if (open <= 10) percent = 32
  else percent = 18
  return {
    percent,
    hint: `${open} unresolved issue(s) still on the board—each one is a future pull on you.`,
  }
}

function computeOwnerInterruptionsHealth(ctx: RivetIndexComputeContext): {
  percent: number | null
  hint: string
} {
  const n = ctx.ownerInterruptionsThisWeekCount
  if (n === 0) {
    return {
      percent: 100,
      hint: "No owner interruptions logged this week—track texts and calls to see the real pattern.",
    }
  }
  let percent: number
  if (n <= 2) percent = 82
  else if (n <= 5) percent = 62
  else if (n <= 9) percent = 42
  else if (n <= 15) percent = 28
  else percent = 14
  return {
    percent,
    hint: `${n} owner interrupt(s) logged this week—judgment is still routing to you.`,
  }
}

function computeUndocumentedProceduresHealth(ctx: RivetIndexComputeContext): {
  percent: number | null
  hint: string
} {
  const active = ctx.standards.filter((s) => s.status === "active")
  const drafts = ctx.standards.filter((s) => s.status === "draft")
  if (active.length === 0 && drafts.length === 0) {
    return {
      percent: null,
      hint: "No standards on file—capture the procedures only you know first.",
    }
  }
  let undocumented = drafts.length
  for (const s of active) {
    if ((ctx.stepCountBySopId.get(s.id) ?? 0) < 1) undocumented += 1
  }
  const total = active.length + drafts.length
  const documented = total - undocumented
  const pct = Math.round((documented / Math.max(1, total)) * 100)
  return {
    percent: pct,
    hint:
      undocumented === 0
        ? "Every standard on file has at least a draft or steps—keep depth growing."
        : `${undocumented} procedure gap(s)—drafts or active plays still without runnable steps.`,
  }
}

export function computeEscapeReadiness(ctx: RivetIndexComputeContext): EscapeReadinessView {
  const sop = computeSopCoverage(ctx)
  const training = computeTrainingCoverage(ctx)
  const issues = computeUnresolvedIssuesHealth(ctx)
  const interrupts = computeOwnerInterruptionsHealth(ctx)
  const undocumented = computeUndocumentedProceduresHealth(ctx)

  const factors: EscapeReadinessFactor[] = [
    {
      id: "sop_coverage",
      label: "SOP coverage",
      percent: sop.percent,
      hint: sop.hint,
    },
    {
      id: "training_coverage",
      label: "Training coverage",
      percent: training.percent,
      hint: training.hint,
    },
    {
      id: "unresolved_issues",
      label: "Unresolved issues",
      percent: issues.percent,
      hint: issues.hint,
    },
    {
      id: "owner_interruptions",
      label: "Owner interruptions",
      percent: interrupts.percent,
      hint: interrupts.hint,
    },
    {
      id: "undocumented_procedures",
      label: "Undocumented procedures",
      percent: undocumented.percent,
      hint: undocumented.hint,
    },
  ]

  const hasCoreSignal = factors.some(
    (f) =>
      (f.id === "sop_coverage" ||
        f.id === "training_coverage" ||
        f.id === "undocumented_procedures") &&
      f.percent != null
  )

  return finalizeEscapeReadinessView({
    ...(hasCoreSignal ? {} : { score: null }),
    verdict: "",
    factors,
  })
}
