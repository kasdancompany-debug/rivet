import type { PeriodMetricsSnapshot } from "@/lib/internal-metrics/compute-period-snapshot"
import { formatMetricsRange } from "@/lib/internal-metrics/period"

export type MetricDirection = "improved" | "worsened" | "flat"

export type CaseStudyMetricRow = {
  id: string
  label: string
  unit: string
  lowerIsBetter: boolean
  baseline: number | null
  current: number | null
  delta: number | null
  deltaPercent: number | null
  direction: MetricDirection
  baselineDisplay: string
  currentDisplay: string
  deltaDisplay: string
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function pctChange(baseline: number, current: number): number | null {
  if (baseline === 0) return current === 0 ? 0 : null
  return Math.round(((current - baseline) / baseline) * 100)
}

function directionForDelta(
  delta: number | null,
  lowerIsBetter: boolean,
  flatThreshold = 0
): MetricDirection {
  if (delta == null || Math.abs(delta) <= flatThreshold) return "flat"
  const improved = lowerIsBetter ? delta < 0 : delta > 0
  return improved ? "improved" : "worsened"
}

function formatHoursFromMinutes(minutes: number): string {
  const h = minutes / 60
  return h < 10 ? `${round1(h)}h` : `${Math.round(h)}h`
}

export function buildCaseStudyMetricRows(
  baseline: PeriodMetricsSnapshot,
  current: PeriodMetricsSnapshot
): CaseStudyMetricRow[] {
  const defs: {
    id: string
    label: string
    unit: string
    lowerIsBetter: boolean
    baseline: number | null
    current: number | null
    format: (n: number) => string
    flatThreshold?: number
  }[] = [
    {
      id: "interruptions",
      label: "Owner interruptions logged",
      unit: "pulls",
      lowerIsBetter: true,
      baseline: baseline.interruptionsLogged,
      current: current.interruptionsLogged,
      format: (n) => String(n),
    },
    {
      id: "interruption_hours",
      label: "Estimated owner time on interruptions",
      unit: "hours",
      lowerIsBetter: true,
      baseline: baseline.interruptionsOwnerMinutes / 60,
      current: current.interruptionsOwnerMinutes / 60,
      format: (n) => formatHoursFromMinutes(n * 60),
      flatThreshold: 0.25,
    },
    {
      id: "questions_prevented",
      label: "Questions prevented (Ask Rivet)",
      unit: "answers",
      lowerIsBetter: false,
      baseline: baseline.questionsPrevented,
      current: current.questionsPrevented,
      format: (n) => String(n),
    },
    {
      id: "ask_rivet_usage",
      label: "Ask Rivet usage",
      unit: "questions",
      lowerIsBetter: false,
      baseline: baseline.askRivetUsage,
      current: current.askRivetUsage,
      format: (n) => String(n),
    },
    {
      id: "owner_hours_returned",
      label: "Owner hours returned (estimated)",
      unit: "hours",
      lowerIsBetter: false,
      baseline: baseline.ownerHoursReturned,
      current: current.ownerHoursReturned,
      format: (n) => `${n}h`,
      flatThreshold: 0.25,
    },
    {
      id: "plays_created",
      label: "Plays created",
      unit: "plays",
      lowerIsBetter: false,
      baseline: baseline.playsCreated,
      current: current.playsCreated,
      format: (n) => String(n),
    },
    {
      id: "training_completions",
      label: "Training completions",
      unit: "completions",
      lowerIsBetter: false,
      baseline: baseline.trainingCompletions,
      current: current.trainingCompletions,
      format: (n) => String(n),
    },
    {
      id: "certifications_earned",
      label: "Certifications earned",
      unit: "certs",
      lowerIsBetter: false,
      baseline: baseline.certificationsEarned,
      current: current.certificationsEarned,
      format: (n) => String(n),
    },
    {
      id: "owner_free_days",
      label: "Owner-free capacity (estimated)",
      unit: "days",
      lowerIsBetter: false,
      baseline: baseline.ownerFreeCapacityDays,
      current: current.ownerFreeCapacityDays,
      format: (n) => (n < 1 ? `${round1(n)}d` : `${round1(n)} days`),
      flatThreshold: 0.2,
    },
    {
      id: "escape_score",
      label: "Escape readiness score",
      unit: "pts",
      lowerIsBetter: false,
      baseline: baseline.escapeReadinessScore,
      current: current.escapeReadinessScore,
      format: (n) => `${n}/100`,
      flatThreshold: 1,
    },
  ]

  return defs.map((d) => {
    const b = d.baseline
    const c = d.current
    const delta = b != null && c != null ? round1(c - b) : null
    const deltaPercent = b != null && c != null ? pctChange(b, c) : null
    const direction = directionForDelta(delta, d.lowerIsBetter, d.flatThreshold ?? 0)

    let deltaDisplay = "—"
    if (delta != null) {
      const threshold = d.flatThreshold ?? 0
      if (Math.abs(delta) <= threshold) {
        deltaDisplay = "No change"
      } else if (deltaPercent != null && Number.isFinite(deltaPercent) && d.baseline !== 0) {
        deltaDisplay = `${deltaPercent > 0 ? "+" : ""}${deltaPercent}%`
      } else {
        const sign = delta > 0 ? "+" : "−"
        deltaDisplay = `${sign}${d.format(Math.abs(delta))}`
      }
    }

    return {
      id: d.id,
      label: d.label,
      unit: d.unit,
      lowerIsBetter: d.lowerIsBetter,
      baseline: b,
      current: c,
      delta,
      deltaPercent,
      direction,
      baselineDisplay: b != null ? d.format(b) : "—",
      currentDisplay: c != null ? d.format(c) : "—",
      deltaDisplay,
    }
  })
}

export function buildMarketingProofBullets(
  caseStudyLabel: string,
  baseline: PeriodMetricsSnapshot,
  current: PeriodMetricsSnapshot,
  rows: CaseStudyMetricRow[]
): string[] {
  const bullets: string[] = [
    `${caseStudyLabel} — Rivet pilot (${formatMetricsRange(baseline.range)} vs ${formatMetricsRange(current.range)}):`,
  ]

  for (const row of rows) {
    if (row.direction === "flat" || row.baseline == null || row.current == null) continue
    if (row.id === "interruptions" && row.direction === "improved") {
      bullets.push(
        `Owner interruptions dropped from ${row.baselineDisplay} to ${row.currentDisplay} (${row.deltaDisplay}).`
      )
    } else if (row.id === "questions_prevented" && row.direction === "improved" && row.current > 0) {
      bullets.push(
        `Ask Rivet prevented ${row.currentDisplay} owner pulls in the current window (up from ${row.baselineDisplay}).`
      )
    } else if (row.id === "owner_hours_returned" && row.direction === "improved") {
      bullets.push(
        `An estimated ${row.currentDisplay} of owner time stayed on the floor instead of on your phone (${row.deltaDisplay} vs baseline).`
      )
    } else if (row.id === "plays_created" && row.current > row.baseline) {
      bullets.push(
        `The team documented ${row.currentDisplay} new plays (${row.baselineDisplay} in the baseline period).`
      )
    } else if (row.id === "owner_free_days" && row.direction === "improved") {
      bullets.push(
        `Estimated owner-free capacity moved from ${row.baselineDisplay} to ${row.currentDisplay}.`
      )
    } else if (row.id === "escape_score" && row.direction === "improved") {
      bullets.push(
        `Escape readiness score improved from ${row.baselineDisplay} to ${row.currentDisplay}.`
      )
    }
  }

  const topWeak = current.operationalWeakPoints[0]
  if (topWeak) {
    bullets.push(
      `Top operational weak point still surfacing: “${topWeak.label}” (${topWeak.occurrences}× in current period)—next fix: ${topWeak.suggestedFix}`
    )
  }

  const topRepeat = current.repeatedQuestions[0]
  if (topRepeat && topRepeat.askCount >= 2) {
    bullets.push(
      `Most repeated staff question: “${topRepeat.question}” (${topRepeat.askCount} asks; ${topRepeat.preventedCount} prevented owner pulls).`
    )
  }

  if (bullets.length === 1) {
    bullets.push(
      "Log interruptions and Ask Rivet usage in both windows to populate before/after proof."
    )
  }

  return bullets
}
