import Link from "next/link"
import { ArrowRight, Droplets } from "lucide-react"

import { InterruptionTrendHeatmap } from "@/components/owner-interruptions/interruption-trend-heatmap"
import { InterruptionSeverityBadge } from "@/components/owner-interruptions/interruption-severity-badge"
import { InterruptionStarterExamples } from "@/components/owner-interruptions/interruption-starter-examples"
import { TopLeaksPanel } from "@/components/owner-interruptions/top-leaks-panel"
import { OwnerValueMetricsPanel } from "@/components/owner-interruptions/owner-value-metrics-panel"
import type { OwnerInterruptionsDashboardView } from "@/lib/owner-interruptions/types"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export function OwnerInterruptionsDashboard({ view }: { view: OwnerInterruptionsDashboardView }) {
  const leakHours = view.estimatedOwnerHoursThisWeek
  const isEmpty = view.recent.length === 0

  return (
    <div className="space-y-9 pb-10 sm:space-y-10">
      <div className="rivet-panel relative overflow-hidden rounded-2xl px-5 py-7 sm:px-8 sm:py-8">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-foreground/15" aria-hidden />
        <div className="relative flex flex-col gap-6 pl-4 sm:pl-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/25 text-muted-foreground">
              <Droplets className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="rivet-section-label">{COPY.interruptions.weekStat}</p>
              <p className="text-4xl font-semibold tabular-nums tracking-[-0.03em] text-foreground sm:text-5xl">
                {view.interruptionsThisWeek}
                <span className="ml-2 text-lg font-medium text-muted-foreground sm:text-xl">{COPY.interruptions.unitPulls}</span>
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{COPY.interruptions.actionHint}</p>
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-border/50 bg-muted/15 px-4 py-4 sm:min-w-[14rem] dark:bg-muted/10">
            <p className="rivet-section-label">{COPY.interruptions.hoursLeak}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{leakHours}h</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{COPY.interruptions.hoursLeakHint}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="h-10" nativeButton={false} render={<Link href="/interruptions/log" />}>
          {isEmpty ? COPY.interruptions.logFirstPullCta : COPY.interruptions.logTitle}
          <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
        </Button>
        <Button variant="outline" className="h-10" nativeButton={false} render={<Link href="/issues?view=owner_required" />}>
          {COPY.dashboard.criticalAllLink}
        </Button>
      </div>

      {isEmpty ? <InterruptionStarterExamples variant="featured" /> : null}

      <Card variant="quiet">
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.trendTitle}</CardTitle>
          <CardDescription>{COPY.interruptions.trendHint}</CardDescription>
        </CardHeader>
        <CardContent>
          {view.trend14Days.every((d) => d.count === 0) ? (
            <p className="text-sm text-muted-foreground">
              {isEmpty ? COPY.interruptions.starterSectionHint : COPY.interruptions.emptyTrend}
            </p>
          ) : (
            <InterruptionTrendHeatmap days={view.trend14Days} />
          )}
        </CardContent>
      </Card>

      <Card variant="quiet">
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.channelTitle}</CardTitle>
          <CardDescription>{COPY.interruptions.channelHint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {view.bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isEmpty ? COPY.interruptions.starterSectionHint : COPY.interruptions.emptyTrend}
            </p>
          ) : (
            view.bySource.map((row) => {
              const max = view.bySource[0]?.count ?? 1
              const w = Math.max(6, Math.round((row.count / max) * 100))
              return (
                <div key={row.source}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count} · {row.minutes}m
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-foreground/55 dark:bg-foreground/45"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="quiet">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.severityTitle}</CardTitle>
            <CardDescription>{COPY.interruptions.severityHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.bySeverity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isEmpty ? COPY.interruptions.starterSectionHint : COPY.interruptions.emptyTrend}
              </p>
            ) : (
              view.bySeverity.map((row) => {
                const max = view.bySeverity[0]?.count ?? 1
                const w = Math.max(6, Math.round((row.count / max) * 100))
                return (
                  <div key={row.severity}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <InterruptionSeverityBadge severity={row.severity} showDot />
                      <span className="tabular-nums text-muted-foreground">
                        {row.count} · {row.minutes}m
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-foreground/55 dark:bg-foreground/45"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card variant="quiet">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.kindsTitle}</CardTitle>
            <CardDescription>{COPY.interruptions.kindsHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.byKind.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isEmpty ? COPY.interruptions.starterSectionHint : COPY.interruptions.emptyTrend}
              </p>
            ) : (
              view.byKind.map((row) => {
                const max = view.byKind[0]?.count ?? 1
                const w = Math.max(6, Math.round((row.count / max) * 100))
                return (
                  <div key={row.kind}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">{row.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {row.count} · {row.minutes}m
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-foreground/55 dark:bg-foreground/45"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <TopLeaksPanel topLeaks={view.topLeaks} isEmpty={isEmpty} />

      <OwnerValueMetricsPanel
        businessId={view.businessId}
        metrics={view.valueMetrics}
        isOwner={view.isOwner}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="quiet">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.rolesTitle}</CardTitle>
            <CardDescription>{COPY.interruptions.rolesHint}</CardDescription>
          </CardHeader>
          <CardContent>
            {view.byRole.length === 0 ? (
              isEmpty ? (
                <p className="text-sm text-muted-foreground">{COPY.interruptions.starterSectionHint}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{COPY.interruptions.emptyRoles}</p>
              )
            ) : (
              <ul className="space-y-2">
                {view.byRole.map((r) => (
                  <li
                    key={r.role}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">{r.role}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {r.count} · {r.minutes}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card variant="quiet">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.peopleTitle}</CardTitle>
            <CardDescription>{COPY.interruptions.peopleHint}</CardDescription>
          </CardHeader>
          <CardContent>
            {view.topPeople.length === 0 ? (
              isEmpty ? (
                <p className="text-sm text-muted-foreground">{COPY.interruptions.starterSectionHint}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{COPY.interruptions.emptyRoles}</p>
              )
            ) : (
              <ul className="space-y-2">
                {view.topPeople.map((p) => (
                  <li
                    key={p.profileId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.role}</p>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {p.count} · {p.minutes}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="quiet">
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.recentTitle}</CardTitle>
          <CardDescription>{COPY.interruptions.recentHint}</CardDescription>
        </CardHeader>
        <CardContent>
          {view.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isEmpty ? COPY.interruptions.starterSectionHint : COPY.interruptions.emptyTrend}
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {view.recent.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <InterruptionSeverityBadge severity={r.severity} showDot />
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                          "border border-border/60 bg-muted/40 text-muted-foreground"
                        )}
                      >
                        {r.kindLabel}
                      </span>
                      <span className="text-[0.65rem] text-muted-foreground">{r.sourceLabel}</span>
                      <span className="text-[0.65rem] tabular-nums text-muted-foreground">{r.estimatedMinutes}m</span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-foreground">{r.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.loggerName}
                      {r.loggerRole ? ` · ${r.loggerRole}` : null}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-right" dateTime={r.occurredAt}>
                    {formatShortDate(r.occurredAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
