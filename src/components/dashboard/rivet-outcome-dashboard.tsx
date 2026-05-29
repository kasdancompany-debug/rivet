import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  GraduationCap,
  MessageCircleQuestion,
} from "lucide-react"

import { EscapeAnimatedScore } from "@/components/escape-readiness/escape-animated-score"
import { EscapeFreedomPathList } from "@/components/escape-readiness/escape-freedom-path-list"
import { EscapeProgressionTrack } from "@/components/escape-readiness/escape-progression-track"
import { OutcomeMilestonesStrip } from "@/components/dashboard/outcome-milestones-strip"
import { OutcomeRecentImprovements } from "@/components/dashboard/outcome-recent-improvements"
import { OutcomeScoreTrend } from "@/components/dashboard/outcome-score-trend"
import { OutcomeSimulationTeaser } from "@/components/dashboard/outcome-simulation-teaser"
import { buildFreedomHeroMetrics } from "@/lib/dashboard/freedom-hero"
import type { DashboardViewModel } from "@/lib/dashboard/types"
import type { QuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import { escapeStatusTierTone } from "@/lib/escape-readiness/presentation"
import { COPY } from "@/lib/interface-copy"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function capacityDisplay(label: string): { value: string; suffix?: string } {
  if (label === "—" || label === "Estimating…") return { value: label }
  const match = label.match(/^([\d.]+)\s+(day|days)$/)
  if (match) return { value: match[1]!, suffix: ` ${match[2]}` }
  return { value: label }
}

export function RivetOutcomeDashboard({
  model,
  askMetrics,
}: {
  model: DashboardViewModel
  askMetrics: QuestionsPreventedMetrics | null
}) {
  const escape = model.escapeReadiness
  const m = buildFreedomHeroMetrics(model, askMetrics)
  const score = escape.score
  const capacity = capacityDisplay(m.ownerFreeCapacityLabel)
  const prevented =
    m.questionsPreventedThisMonth == null ? "—" : String(m.questionsPreventedThisMonth)
  const hours = m.ownerHoursReturned == null ? "—" : String(m.ownerHoursReturned)
  const team = m.teamReadinessPercent == null ? "—" : String(m.teamReadinessPercent)

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border/50 shadow-lg"
      aria-labelledby="rivet-outcome-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/[0.07] via-background to-amber-500/[0.04]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-sky-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 size-64 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative border-b border-border/40 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        {model.businessName ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {model.businessName}
          </p>
        ) : null}
        <p className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-800/70 dark:text-sky-300/80">
          {COPY.dashboard.outcome.eyebrow}
        </p>
        <h1
          id="rivet-outcome-heading"
          className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.15]"
        >
          {COPY.dashboard.freedomHero.question}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
          {COPY.dashboard.outcome.lead}
        </p>

        {escape.statusBadge && escape.statusTier ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                escapeStatusTierTone(escape.statusTier)
              )}
            >
              {escape.statusBadge}
            </Badge>
            {escape.statusInterpretation ? (
              <p className="text-sm font-medium leading-snug text-foreground/90">
                {escape.statusInterpretation}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative space-y-6 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        {score == null ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/15 px-6 py-10 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">{escape.verdict}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button size="sm" nativeButton={false} render={<Link href="/sops/capture" />}>
                {COPY.dashboard.firstStandardCta}
              </Button>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/escape-plan" />}>
                {COPY.dashboard.outcome.escapePlanLink}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-start lg:text-left">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {COPY.dashboard.freedomHero.escapeReadiness}
                </p>
                <div className="mt-4">
                  <EscapeAnimatedScore score={score} gain={escape.scoreGain} />
                </div>
                <OutcomeScoreTrend points={escape.progress} className="mt-4 lg:justify-start" />
                {escape.progression ? (
                  <div className="mt-6 w-full">
                    <EscapeProgressionTrack progression={escape.progression} compact />
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 lg:col-span-7">
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.09] to-background p-5 sm:p-6">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-800/80 dark:text-emerald-200/90">
                    {COPY.dashboard.freedomHero.ownerFreeCapacity}
                  </p>
                  <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight text-foreground sm:text-6xl">
                    {capacity.value}
                    {capacity.suffix ? (
                      <span className="text-3xl font-medium text-muted-foreground sm:text-4xl">
                        {capacity.suffix}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {COPY.dashboard.freedomHero.ownerFreeCapacityHint}
                  </p>
                  {escape.absenceCapacity?.likelyFailurePoint ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground/90">
                      {COPY.dashboard.outcome.capacityFailureNote(escape.absenceCapacity.likelyFailurePoint)}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    href="/questions-prevented"
                    icon={MessageCircleQuestion}
                    label={COPY.dashboard.freedomHero.questionsPrevented}
                    value={prevented}
                    sub={COPY.dashboard.freedomHero.questionsPreventedHint}
                  />
                  <MetricCard
                    href="/questions-prevented"
                    icon={Clock}
                    label={COPY.dashboard.freedomHero.ownerHoursReturned}
                    value={hours}
                    suffix={hours !== "—" ? "h" : undefined}
                    sub={COPY.dashboard.freedomHero.ownerHoursReturnedHint}
                    positive={m.ownerHoursReturned != null && m.ownerHoursReturned > 0}
                  />
                  <MetricCard
                    href="/training"
                    icon={GraduationCap}
                    label={COPY.dashboard.freedomHero.teamReadiness}
                    value={team}
                    suffix={team !== "—" ? "%" : undefined}
                    sub={COPY.dashboard.freedomHero.teamReadinessHint}
                  />
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-4">
                    <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-amber-900/90 dark:text-amber-100/90">
                      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                      {COPY.dashboard.freedomHero.highestRisk}
                    </span>
                    {m.highestRisk.href ? (
                      <Link
                        href={m.highestRisk.href}
                        className="mt-2 block text-lg font-semibold leading-snug text-foreground hover:text-primary"
                      >
                        {m.highestRisk.label}
                      </Link>
                    ) : (
                      <p className="mt-2 text-lg font-semibold leading-snug text-foreground">
                        {m.highestRisk.label}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {COPY.dashboard.freedomHero.highestRiskHint}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <OutcomeMilestonesStrip score={score} />

            <OutcomeRecentImprovements escape={escape} />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/45 bg-background/70 p-5 backdrop-blur-sm sm:p-6">
                <EscapeFreedomPathList items={escape.fastestPathToFreedom} />
                <Link
                  href="/escape-plan"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {COPY.dashboard.outcome.escapePlanLink}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <OutcomeSimulationTeaser
                escape={escape}
                askMetrics={askMetrics}
                teamReadinessPercent={model.staffReadinessPercent}
              />
            </div>

            <p className="text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
              {escape.verdict}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

function MetricCard({
  href,
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  positive,
}: {
  href: string
  icon: typeof MessageCircleQuestion
  label: string
  value: string
  suffix?: string
  sub: string
  positive?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between rounded-2xl border px-4 py-4 transition-all hover:-translate-y-px hover:shadow-md",
        positive
          ? "border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/40"
          : "border-border/50 bg-card/80 hover:border-border"
      )}
    >
      <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5 opacity-70" aria-hidden />
        {label}
      </span>
      <div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
          {value}
          {suffix ? <span className="text-lg font-medium text-muted-foreground">{suffix}</span> : null}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{sub}</p>
      </div>
    </Link>
  )
}
