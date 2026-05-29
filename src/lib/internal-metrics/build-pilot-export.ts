import type { CaseStudyMetricRow } from "@/lib/internal-metrics/build-metric-deltas"
import type { PeriodMetricsSnapshot } from "@/lib/internal-metrics/compute-period-snapshot"
import type { PilotDailySeries } from "@/lib/internal-metrics/build-daily-series"
import { formatMetricsRange } from "@/lib/internal-metrics/period"

function csvEscape(value: string | number): string {
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function seriesSection(
  lines: string[],
  metricLabel: string,
  points: { date: string; value: number }[]
) {
  lines.push(`${csvEscape(metricLabel)},Date,Value`)
  for (const p of points) {
    lines.push(`${csvEscape(metricLabel)},${p.date},${p.value}`)
  }
  lines.push("")
}

export function buildPilotMetricsCsv(input: {
  caseStudyLabel: string
  businessName: string
  windowDays: number
  baseline: PeriodMetricsSnapshot
  current: PeriodMetricsSnapshot
  metricRows: CaseStudyMetricRow[]
  daily: PilotDailySeries
}): string {
  const lines: string[] = [
    `# ${input.caseStudyLabel} — Rivet pilot metrics export`,
    `# Business: ${input.businessName}`,
    `# Window: last ${input.windowDays} days vs prior ${input.windowDays} days`,
    `# Generated: ${new Date().toISOString()}`,
    "",
    "Section,Metric,Baseline,Current,Change",
  ]

  for (const row of input.metricRows) {
    lines.push(
      [
        "Summary",
        csvEscape(row.label),
        csvEscape(row.baselineDisplay),
        csvEscape(row.currentDisplay),
        csvEscape(row.deltaDisplay),
      ].join(",")
    )
  }

  lines.push("")
  seriesSection(lines, "Interruptions logged", input.daily.interruptions)
  seriesSection(lines, "Ask Rivet usage", input.daily.askRivetUsage)
  seriesSection(lines, "Questions prevented", input.daily.questionsPrevented)
  seriesSection(lines, "Plays created", input.daily.playsCreated)
  seriesSection(lines, "Training completions", input.daily.trainingCompletions)
  seriesSection(lines, "Certifications earned", input.daily.certificationsEarned)
  seriesSection(lines, "Escape readiness score", input.daily.escapeReadiness)
  seriesSection(lines, "Owner-free capacity (days)", input.daily.ownerFreeCapacityDays)

  lines.push(`Period baseline,${formatMetricsRange(input.baseline.range)}`)
  lines.push(`Period current,${formatMetricsRange(input.current.range)}`)

  return lines.join("\n")
}
