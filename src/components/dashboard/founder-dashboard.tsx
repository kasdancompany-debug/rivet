import Link from "next/link"
import { ArrowRight, ListTodo, Zap } from "lucide-react"

import type { DashboardViewModel, OwnerRiskItem } from "@/lib/dashboard/types"
import { DashboardTrustGate } from "@/components/dashboard/dashboard-trust-gate"
import { COPY } from "@/lib/interface-copy"
import type { ProofOfTransferView } from "@/lib/proof-of-transfer/types"

function unlinkedProofStub(): ProofOfTransferView {
  return {
    source: "unlinked",
    headline: "",
    promise: "",
    bucketCounts: { transferred: 0, fragile: 0, owner_only: 0, newly_stable: 0 },
    columns: { transferred: [], fragile: [], owner_only: [], newly_stable: [] },
  }
}
import { formatIssueSeverity } from "@/lib/issues/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DashboardPulseMetrics } from "@/components/dashboard/dashboard-pulse-metrics"
import { OwnerRelianceHero } from "@/components/dashboard/owner-reliance-hero"
import { DependencyHeatmap } from "@/components/operational/dependency-heatmap"

const MAX_CRITICAL = 3

type CriticalCard =
  | {
      kind: "issue"
      id: string
      title: string
      severity: string
      status: string
      href: string
    }
  | {
      kind: "risk"
      id: string
      title: string
      detail: string
      category: OwnerRiskItem["category"]
      href: string
    }

function riskHref(category: OwnerRiskItem["category"]): string {
  switch (category) {
    case "training":
      return "/training"
    case "issue":
      return "/issues"
    default:
      return "/sops"
  }
}

function buildCriticalCards(model: DashboardViewModel): CriticalCard[] {
  const out: CriticalCard[] = []
  const seen = new Set<string>()

  for (const row of model.ownerRequiredOpenIssues) {
    if (out.length >= MAX_CRITICAL) break
    const key = `issue:${row.title}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      kind: "issue",
      id: row.id,
      title: row.title,
      severity: row.severity,
      status: row.status,
      href: `/issues/${row.id}`,
    })
  }

  for (const risk of model.ownerRisks) {
    if (out.length >= MAX_CRITICAL) break
    const key = `risk:${risk.title}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      kind: "risk",
      id: risk.id,
      title: risk.title,
      detail: risk.detail,
      category: risk.category,
      href: riskHref(risk.category),
    })
  }

  return out
}

function riskBadgeClass(category: OwnerRiskItem["category"]): string {
  switch (category) {
    case "sop_critical":
      return "border-rose-200/70 bg-rose-500/[0.04] text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/[0.06] dark:text-rose-200"
    case "issue":
      return "border-amber-200/70 bg-amber-500/[0.04] text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/[0.06] dark:text-amber-200"
    default:
      return "border-border/60 bg-muted/40 text-muted-foreground"
  }
}

export function FounderDashboard({
  model,
  proof,
  postCheckoutNotice = false,
}: {
  model: DashboardViewModel
  /** Only used on setup/error shells; live overview does not block on proof fetch. */
  proof?: ProofOfTransferView
  postCheckoutNotice?: boolean
}) {
  const checkoutBanner = postCheckoutNotice ? (
      <Card className="border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{COPY.dashboard.postCheckoutTitle}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{COPY.dashboard.postCheckoutBody}</p>
          </div>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            {COPY.dashboard.postCheckoutDismiss}
          </Button>
        </CardContent>
      </Card>
    ) : null

  if (model.source !== "live") {
    return (
      <div className="space-y-6">
        {checkoutBanner}
        <DashboardTrustGate model={model} proof={proof ?? unlinkedProofStub()} />
      </div>
    )
  }

  const critical = buildCriticalCards(model)
  const executionProof = model.executionProof
  const teamReadiness = model.rivetIndex.categories.find((c) => c.id === "team_readiness")
  const trainingCat = model.rivetIndex.categories.find((c) => c.id === "training_systems")

  return (
    <div className="space-y-10 pb-12 sm:space-y-12">
      {checkoutBanner}
      <OwnerRelianceHero model={model} />
      <DashboardPulseMetrics model={model} />

      {model.needsFirstStandard ? (
        <Card className="border-dashed border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{COPY.dashboard.firstStandardTitle}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{COPY.dashboard.firstStandardBody}</p>
            </div>
            <Button size="sm" nativeButton={false} render={<Link href="/sops/capture" />}>
              {COPY.dashboard.firstStandardCta}
            </Button>
          </CardContent>
        </Card>
      ) : model.coldStart ? (
        <Card className="border-dashed border-primary/25 bg-primary/[0.03]">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{COPY.dashboard.coldStartTitle}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{COPY.dashboard.coldStartBody}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" nativeButton={false} render={<Link href="/sops/templates" />}>
                {COPY.dashboard.coldStartCtaStandards}
              </Button>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/onboarding" />}>
                {COPY.dashboard.coldStartCtaReality}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Link
        href="/interruptions"
        className="group rivet-panel flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/25 text-muted-foreground">
            <Zap className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="rivet-section-label">{COPY.interruptions.eyebrow}</p>
            <p className="text-sm font-semibold tracking-tight text-foreground">{COPY.nav.interruptions}</p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {model.ownerInterruptionsThisWeekCount} {COPY.interruptions.dashboardStripLoggedSuffix}
              {model.ownerInterruptionsThisWeekMinutes > 0
                ? ` · ${COPY.hero.weekHoursLeak(Math.round((model.ownerInterruptionsThisWeekMinutes / 60) * 10) / 10)}`
                : ""}
              {" · "}
              {COPY.interruptions.dashboardStripCta}
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>

      <section aria-labelledby="critical-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="critical-heading" className="rivet-section-label">
            {COPY.dashboard.criticalHeading}
          </h2>
          <Link
            href="/issues?view=owner_required"
            className="text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {COPY.dashboard.criticalAllLink}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {critical.length === 0 ? (
            <div className="rivet-panel-inset flex items-center gap-3 border-dashed px-4 py-5 sm:col-span-3 sm:px-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground">
                <ListTodo className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-sm font-medium leading-snug text-foreground">{COPY.dashboard.criticalEmpty}</p>
            </div>
          ) : (
            critical.map((item) => (
              <Card key={`${item.kind}-${item.id}`} variant="quiet" className="overflow-hidden">
                <CardContent className="p-0">
                  <Link href={item.href} className="block px-4 py-4 transition-colors hover:bg-muted/25 sm:px-5 sm:py-4">
                    {item.kind === "issue" ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[0.6rem] font-semibold uppercase tracking-wide">
                            {COPY.dashboard.badgeBottleneck}
                          </Badge>
                          <span className="text-[0.65rem] tabular-nums text-muted-foreground">{formatIssueSeverity(item.severity)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.title}</p>
                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                          {item.status === "open" ? COPY.dashboard.statusOpen : COPY.dashboard.statusProgress}
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className={cn("text-[0.6rem] font-semibold uppercase tracking-wide", riskBadgeClass(item.category))}>
                          {item.category === "sop_critical"
                            ? COPY.dashboard.badgeStandard
                            : item.category === "issue"
                              ? COPY.dashboard.badgeRisk
                              : item.category === "training"
                                ? COPY.dashboard.badgeTraining
                                : COPY.dashboard.badgeGap}
                        </Badge>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                      </>
                    )}
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="rivet-panel flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="rivet-section-label">{COPY.dashboard.nextEyebrow}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{model.nextBestMove.title}</p>
          </div>
          <Button size="sm" className="h-9 shrink-0" nativeButton={false} render={<Link href={model.nextBestMove.href} />}>
            {model.nextBestMove.cta}
            <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
          </Button>
        </div>
      </section>

      <section aria-labelledby="proof-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="proof-heading" className="rivet-section-label">
            {COPY.dashboard.proofHeading}
          </h2>
          <Link
            href="/escape-plan"
            className="text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {COPY.dashboard.proofFullLink}
          </Link>
        </div>
        {executionProof.length === 0 ? (
          <p className="rivet-panel-inset border-dashed px-4 py-3.5 text-sm text-muted-foreground">
            {COPY.dashboard.executionProofEmpty}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {executionProof.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex h-full flex-col rounded-lg border border-border/50 bg-card px-4 py-3.5 transition-colors hover:border-border hover:bg-muted/15"
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    {COPY.dashboard.executionProofRun}
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                    {row.checklistTitle?.trim() ||
                      (row.checklistType ? `${row.checklistType} checklist` : "Daily checklist")}
                  </span>
                  <span className="mt-auto pt-2 font-mono text-[0.65rem] text-muted-foreground tabular-nums">
                    {formatExecutionProofStamp(row.completedAt, row.shiftDate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="team-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="team-heading" className="rivet-section-label">
            {COPY.dashboard.teamHeading}
          </h2>
          <Link
            href="/training"
            className="text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {COPY.dashboard.teamLink}
          </Link>
        </div>
        <div className="rivet-panel overflow-hidden">
          <div className="grid divide-y divide-border/40 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <div className="px-5 py-5">
              <p className="rivet-section-label">{COPY.dashboard.teamTrainingDone}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {model.trainingProgressPercent ?? "—"}
                {model.trainingProgressPercent != null ? <span className="text-lg font-medium text-muted-foreground">%</span> : null}
              </p>
            </div>
            <div className="px-5 py-5">
              <p className="rivet-section-label">{COPY.dashboard.teamReadinessAvg}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {model.staffReadinessPercent ?? "—"}
                {model.staffReadinessPercent != null ? <span className="text-lg font-medium text-muted-foreground">%</span> : null}
              </p>
            </div>
            <div className="px-5 py-5 sm:col-span-2 lg:col-span-2 lg:border-t-0 lg:pl-6">
              <p className="rivet-section-label">{COPY.dashboard.teamSignals}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {teamReadiness?.dependencyScore != null || trainingCat?.dependencyScore != null ? (
                  <>
                    {teamReadiness?.dependencyScore != null ? (
                      <>
                        <span className="font-medium">{COPY.dashboard.teamSignalTeam}</span> · {teamReadiness.hint}
                      </>
                    ) : null}
                    {teamReadiness?.dependencyScore != null && trainingCat?.dependencyScore != null ? (
                      <span className="text-muted-foreground"> · </span>
                    ) : null}
                    {trainingCat?.dependencyScore != null ? (
                      <>
                        <span className="font-medium">{COPY.dashboard.teamSignalTrain}</span> · {trainingCat.hint}
                      </>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted-foreground">{COPY.dashboard.teamSignalsEmpty}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="depth-heading" className="space-y-4">
        <h2 id="depth-heading" className="rivet-section-label">
          {COPY.dashboard.depthHeading}
        </h2>
        <details className="group rivet-panel overflow-hidden">
          <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              {COPY.dashboard.depthExpand}
              <span className="text-xs font-normal text-muted-foreground group-open:hidden">{COPY.dashboard.depthExpandHint}</span>
            </span>
          </summary>
          <div className="border-t border-border/40 px-5 pb-5 pt-4">
            <DependencyHeatmap categories={model.rivetIndex.categories} />
          </div>
        </details>

        {model.rivetIndex.criticalWarnings.length > 0 ? (
          <div className="rounded-lg border border-border/50 border-l-[3px] border-l-amber-500/40 bg-muted/15 px-5 py-4 dark:bg-muted/10">
            <p className="rivet-section-label text-amber-950 dark:text-amber-200/90">{COPY.dashboard.warningsHeading}</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
              {model.rivetIndex.criticalWarnings.map((w) => (
                <li key={w} className="flex gap-3">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/25" aria-hidden />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function formatExecutionProofStamp(completedAt: string | null, shiftDate: string): string {
  if (completedAt) {
    const d = new Date(completedAt)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    }
  }
  if (shiftDate) return `Shift ${shiftDate}`
  return "—"
}
