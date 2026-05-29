"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Check, Copy, Minus } from "lucide-react"

import type { CaseStudyMetricsDashboard } from "@/lib/internal-metrics/load-case-study-data"
import type { CaseStudyMetricRow } from "@/lib/internal-metrics/build-metric-deltas"
import { formatMetricsRange } from "@/lib/internal-metrics/period"
import { internalDiagnosticsAccessHint } from "@/lib/billing/internal-access"
import { MetricsPeriodPicker } from "@/components/internal/metrics-period-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function DirectionIcon({ row }: { row: CaseStudyMetricRow }) {
  if (row.direction === "improved") {
    return <ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
  }
  if (row.direction === "worsened") {
    return <ArrowDownRight className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
  }
  return <Minus className="size-4 text-muted-foreground" aria-hidden />
}

function MetricComparisonTable({ rows }: { rows: CaseStudyMetricRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3">Baseline</th>
            <th className="px-4 py-3">Current</th>
            <th className="px-4 py-3">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/40 last:border-b-0">
              <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.baselineDisplay}</td>
              <td className="px-4 py-3 tabular-nums text-foreground">{row.currentDisplay}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 tabular-nums font-medium",
                    row.direction === "improved" && "text-emerald-700 dark:text-emerald-300",
                    row.direction === "worsened" && "text-amber-700 dark:text-amber-300",
                    row.direction === "flat" && "text-muted-foreground"
                  )}
                >
                  <DirectionIcon row={row} />
                  {row.deltaDisplay}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScoreTrendChart({ points }: { points: { date: string; score: number }[] }) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Escape readiness snapshots will appear after daily dashboard use.
      </p>
    )
  }
  const min = Math.min(...points.map((p) => p.score))
  const max = Math.max(...points.map((p) => p.score))
  const span = Math.max(max - min, 1)

  return (
    <div className="flex h-24 items-end gap-1">
      {points.map((p) => {
        const h = 20 + ((p.score - min) / span) * 72
        return (
          <div key={p.date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full max-w-[28px] rounded-t bg-zinc-800 dark:bg-zinc-200"
              style={{ height: `${h}px` }}
              title={`${p.date}: ${p.score}`}
            />
            <span className="text-[9px] text-muted-foreground">{p.date.slice(5)}</span>
          </div>
        )
      })}
    </div>
  )
}

function MarketingCopyBlock({ bullets }: { bullets: string[] }) {
  const [copied, setCopied] = useState(false)
  const text = bullets.join("\n")

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Marketing proof (copy)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste into case studies, LinkedIn, or sales decks. Edit names and dates as needed.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? (
            <>
              <Check className="size-4" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden />
              Copy bullets
            </>
          )}
        </Button>
      </div>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </section>
  )
}

function WeakPointsTable({
  title,
  rows,
}: {
  title: string
  rows: { label: string; occurrences: number; detail: string; source: string }[]
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing flagged in this period yet—keep logging real usage.</p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            <th className="px-4 py-3">{title}</th>
            <th className="px-4 py-3">Count</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Suggested fix</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.source}-${r.label}`} className="border-b border-border/40 last:border-b-0">
              <td className="max-w-[200px] px-4 py-3 font-medium">{r.label}</td>
              <td className="px-4 py-3 tabular-nums">{r.occurrences}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.source}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CaseStudyMetricsDashboard({ model }: { model: CaseStudyMetricsDashboard }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-wider">
            Internal · case study
          </Badge>
          <Badge variant="outline" className="rounded-full text-[10px]">
            {model.businessName}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{model.caseStudyLabel} — Rivet pilot metrics</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Before/after proof from live workspace data. Baseline:{" "}
          <span className="font-medium text-foreground">{formatMetricsRange(model.baseline.range)}</span>
          {" · "}
          Current:{" "}
          <span className="font-medium text-foreground">{formatMetricsRange(model.current.range)}</span>
        </p>
        <p className="text-xs text-muted-foreground">{internalDiagnosticsAccessHint()}</p>
      </header>

      <MetricsPeriodPicker baseline={model.baseline.range} current={model.current.range} />

      <MarketingCopyBlock bullets={model.marketingBullets} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Before / after</h2>
        <MetricComparisonTable rows={model.metricRows} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border/60 p-4">
          <h3 className="text-sm font-semibold">Escape readiness trend</h3>
          <ScoreTrendChart points={model.scoreTrend} />
        </div>
        <div className="space-y-3 rounded-xl border border-border/60 p-4">
          <h3 className="text-sm font-semibold">Current period snapshot</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">{model.current.questionsAnswered}</span> Ask Rivet
              questions answered
            </li>
            <li>
              <span className="font-medium text-foreground">{model.current.playsPublishedInPeriod}</span> plays
              published
            </li>
            <li>
              Training completion rate:{" "}
              <span className="font-medium text-foreground">
                {model.current.trainingCompletionRate != null
                  ? `${model.current.trainingCompletionRate}%`
                  : "—"}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Repeated questions (current period)</h2>
        <WeakPointsTable
          title="Question"
          rows={model.current.repeatedQuestions.map((q) => ({
            label: q.question,
            occurrences: q.askCount,
            source: "Ask Rivet",
            detail: `${q.preventedCount} prevented owner pulls`,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Operational weak points (current period)</h2>
        <WeakPointsTable
          title="Weak point"
          rows={model.current.operationalWeakPoints.map((w) => ({
            label: w.label,
            occurrences: w.occurrences,
            source: w.source === "interruption" ? "Owner interruption" : "Ask Rivet",
            detail: w.suggestedFix,
          }))}
        />
      </section>

      <div className="flex flex-wrap gap-2 border-t border-border/40 pt-6">
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          Dashboard
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/interruptions" />}>
          Interruptions
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/questions-prevented" />}>
          Questions prevented
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/internal/pilot" />}>
          Kasdan pilot
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/internal/billing-check" />}>
          Billing check
        </Button>
      </div>
    </div>
  )
}
