"use client"

import { CalendarRange, Play } from "lucide-react"

import { EscapeAbsenceSimulationTrigger } from "@/components/escape-readiness/escape-absence-simulation"
import type { QuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import { COPY } from "@/lib/interface-copy"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

export function OutcomeSimulationTeaser({
  escape,
  askMetrics,
  teamReadinessPercent,
}: {
  escape: EscapeReadinessView
  askMetrics: QuestionsPreventedMetrics | null
  teamReadinessPercent: number | null
}) {
  if (escape.score == null) return null

  const capacity = escape.absenceCapacity

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-sky-500/25",
        "bg-gradient-to-br from-sky-500/[0.08] via-background to-background p-5 sm:p-6"
      )}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-sky-500/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10">
          <Play className="size-5 text-sky-700 dark:text-sky-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-800/80 dark:text-sky-200/80">
            {COPY.dashboard.outcome.simulationEyebrow}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {COPY.dashboard.outcome.simulationTitle}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {COPY.dashboard.outcome.simulationLead}
          </p>
        </div>
      </div>

      {capacity ? (
        <dl className="relative mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/45 bg-background/80 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarRange className="size-3" aria-hidden />
              {COPY.dashboard.outcome.simulationCapacityLabel}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {capacity.estimatedLabel}
            </dd>
          </div>
          <div className="rounded-xl border border-border/45 bg-background/80 px-3 py-2.5">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.dashboard.outcome.simulationBreakLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold leading-snug text-foreground">
              {capacity.failureAtLabel}
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="relative mt-4 text-xs leading-relaxed text-muted-foreground">
        {capacity?.likelyFailurePoint
          ? COPY.dashboard.outcome.simulationFailureHint(capacity.likelyFailurePoint)
          : COPY.escapeReadiness.simulationLead}
      </p>

      <div className="relative mt-5">
        <EscapeAbsenceSimulationTrigger
          model={escape}
          askMetrics={askMetrics}
          teamReadinessPercent={teamReadinessPercent}
        />
      </div>
    </div>
  )
}
