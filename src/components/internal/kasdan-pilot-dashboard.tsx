"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  Copy,
  Download,
  GraduationCap,
  MessageCircle,
  Minus,
  ShieldCheck,
  Zap,
} from "lucide-react"

import { MetricsTrendChart } from "@/components/internal/metrics-trend-chart"
import { PilotWindowPicker } from "@/components/internal/pilot-window-picker"
import { buildPilotMetricsCsv } from "@/lib/internal-metrics/build-pilot-export"
import type { CaseStudyMetricRow } from "@/lib/internal-metrics/build-metric-deltas"
import type { KasdanPilotDashboardModel } from "@/lib/internal-metrics/load-pilot-dashboard"
import { formatMetricsRange } from "@/lib/internal-metrics/period"
import { internalDiagnosticsAccessHint } from "@/lib/billing/internal-access"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function DirectionIcon({ row }: { row: CaseStudyMetricRow }) {
  if (row.direction === "improved") {
    return <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
  }
  if (row.direction === "worsened") {
    return <ArrowDownRight className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
  }
  return <Minus className="size-3.5 text-muted-foreground" aria-hidden />
}

const KPI_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  interruptions: Zap,
  questions_prevented: MessageCircle,
  ask_rivet_usage: MessageCircle,
  plays_created: BookOpen,
  training_completions: GraduationCap,
  certifications_earned: Award,
  owner_free_days: ShieldCheck,
  escape_score: ShieldCheck,
}

function KpiCard({ row }: { row: CaseStudyMetricRow }) {
  const Icon = KPI_ICONS[row.id] ?? ShieldCheck
  return (
    <article className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-muted/30">
          <Icon className="size-4 text-primary" aria-hidden />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            row.direction === "improved" && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
            row.direction === "worsened" && "bg-amber-500/10 text-amber-900 dark:text-amber-100",
            row.direction === "flat" && "bg-muted text-muted-foreground"
          )}
        >
          <DirectionIcon row={row} />
          {row.deltaDisplay}
        </span>
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {row.label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {row.currentDisplay}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Prior: {row.baselineDisplay}</p>
    </article>
  )
}

function MarketingCopyBlock({ bullets }: { bullets: string[] }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(bullets.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Case study proof (copy)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales-ready bullets comparing the prior window to the current window.
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

export function KasdanPilotDashboard({ model }: { model: KasdanPilotDashboardModel }) {
  const csv = useMemo(
    () =>
      buildPilotMetricsCsv({
        caseStudyLabel: model.caseStudyLabel,
        businessName: model.businessName,
        windowDays: model.windowDays,
        baseline: model.baseline,
        current: model.current,
        metricRows: model.metricRows,
        daily: model.daily,
      }),
    [model]
  )

  const primaryKpis = model.metricRows.filter((r) =>
    [
      "interruptions",
      "questions_prevented",
      "ask_rivet_usage",
      "plays_created",
      "training_completions",
      "certifications_earned",
      "owner_free_days",
      "escape_score",
    ].includes(r.id)
  )

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rivet-pilot-${model.windowDays}d-${model.current.range.end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-wider">
            Kasdan pilot
          </Badge>
          <Badge variant="outline" className="rounded-full text-[10px]">
            {model.businessName}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {model.caseStudyLabel} — Owner dependency dashboard
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Real-world proof that Rivet reduces owner pulls. Comparing{" "}
          <span className="font-medium text-foreground">
            {formatMetricsRange(model.baseline.range)}
          </span>{" "}
          vs{" "}
          <span className="font-medium text-foreground">
            {formatMetricsRange(model.current.range)}
          </span>
          . Charts show daily activity in the current window.
        </p>
        <p className="text-xs text-muted-foreground">{internalDiagnosticsAccessHint()}</p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PilotWindowPicker windowDays={model.windowDays} />
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={downloadCsv}>
          <Download className="size-4" aria-hidden />
          Export CSV (metrics + daily series)
        </Button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {primaryKpis.map((row) => (
          <KpiCard key={row.id} row={row} />
        ))}
      </section>

      <MarketingCopyBlock bullets={model.marketingBullets} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Daily trends</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Export individual charts as SVG for decks and case studies.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricsTrendChart
            title="Owner interruptions logged"
            subtitle="Fewer pulls = less dependency"
            points={model.daily.interruptions}
            unit="pulls"
            filename={`interruptions-${model.windowDays}d`}
          />
          <MetricsTrendChart
            title="Ask Rivet usage"
            subtitle="Crew self-serve questions"
            points={model.daily.askRivetUsage}
            unit="asks"
            filename={`ask-rivet-${model.windowDays}d`}
          />
          <MetricsTrendChart
            title="Questions prevented"
            subtitle="High-confidence answers that did not route to you"
            points={model.daily.questionsPrevented}
            unit="prevented"
            filename={`questions-prevented-${model.windowDays}d`}
          />
          <MetricsTrendChart
            title="Plays created"
            subtitle="Documented standards"
            points={model.daily.playsCreated}
            unit="plays"
            filename={`plays-created-${model.windowDays}d`}
          />
          <MetricsTrendChart
            title="Training completions"
            subtitle="Modules finished by crew"
            points={model.daily.trainingCompletions}
            unit="completions"
            filename={`training-completions-${model.windowDays}d`}
          />
          <MetricsTrendChart
            title="Certifications earned"
            subtitle="Signed-off module certs"
            points={model.daily.certificationsEarned}
            unit="certs"
            filename={`certifications-${model.windowDays}d`}
          />
          <MetricsTrendChart
            title="Escape readiness score"
            subtitle="Daily autonomy snapshot"
            points={model.daily.escapeReadiness}
            unit="pts"
            filename={`escape-readiness-${model.windowDays}d`}
            variant="line"
          />
          <MetricsTrendChart
            title="Owner-free capacity"
            subtitle="Estimated days away from score"
            points={model.daily.ownerFreeCapacityDays}
            unit="days"
            filename={`owner-free-capacity-${model.windowDays}d`}
            variant="line"
          />
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-muted/20 p-5">
        <h2 className="text-sm font-semibold">How to read this dashboard</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Interruptions down</span> +{" "}
            <span className="font-medium text-foreground">questions prevented up</span> = Rivet is
            absorbing tribal knowledge load.
          </li>
          <li>
            <span className="font-medium text-foreground">Plays + training + certs</span> show
            systemization—the floor runs from documented standards, not owner memory.
          </li>
          <li>
            <span className="font-medium text-foreground">Escape readiness + owner-free days</span>{" "}
            track whether a multi-day absence is becoming plausible.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-border/40 pt-6">
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          Overview
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/interruptions" />}>
          Interruptions
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/questions-prevented" />}>
          Questions prevented
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/internal/metrics" />}>
          Custom comparison
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/internal/billing-check" />}>
          Billing check
        </Button>
      </div>
    </div>
  )
}
