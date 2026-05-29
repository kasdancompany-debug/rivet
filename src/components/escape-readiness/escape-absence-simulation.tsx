"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangle, ArrowRight, Play } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { QuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import {
  buildAbsenceSimulation,
  simulationSourceLabel,
} from "@/lib/escape-readiness/build-absence-simulation"
import { formatProjectedDaysGain } from "@/lib/escape-readiness/build-absence-simulation-fixes"
import {
  buildSimulationContextFromView,
  enrichSimulationContext,
  mergeSimulationContext,
} from "@/lib/escape-readiness/build-simulation-context"
import { COPY } from "@/lib/interface-copy"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

function statusTone(status: "stable" | "strained" | "breakdown", dark?: boolean) {
  switch (status) {
    case "stable":
      return dark
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        : "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-200"
    case "strained":
      return dark
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-amber-500/25 bg-amber-500/[0.06] text-amber-900 dark:text-amber-200"
    case "breakdown":
      return dark
        ? "border-rose-500/35 bg-rose-500/10 text-rose-200"
        : "border-rose-500/25 bg-rose-500/[0.06] text-rose-900 dark:text-rose-200"
  }
}

function sourceChip(source: string, dark?: boolean) {
  return dark
    ? "border-white/10 bg-white/[0.04] text-zinc-300"
    : "border-border/60 bg-muted/30 text-muted-foreground"
}

export function EscapeAbsenceSimulationTrigger({
  model,
  dark = false,
  compact = false,
  askMetrics = null,
  teamReadinessPercent = null,
}: {
  model: EscapeReadinessView
  dark?: boolean
  compact?: boolean
  askMetrics?: QuestionsPreventedMetrics | null
  teamReadinessPercent?: number | null
}) {
  const [open, setOpen] = useState(false)
  const simulation = useMemo(() => {
    if (!open) return null
    const fallback = buildSimulationContextFromView(model)
    const merged = mergeSimulationContext(model.simulationContext, fallback)
    const ctx = enrichSimulationContext(merged, {
      unverifiedAskQuestions: askMetrics?.unverifiedQuestions,
      teamReadinessPercent,
    })
    return buildAbsenceSimulation(model, ctx)
  }, [model, open, askMetrics, teamReadinessPercent])

  if (model.score == null) return null

  const forecastDays = simulation?.days.slice(0, 4) ?? []

  return (
    <>
      <Button
        type="button"
        variant={dark ? "outline" : "default"}
        size={compact ? "sm" : "default"}
        className={cn(
          "gap-2",
          dark && "border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
        )}
        onClick={() => setOpen(true)}
      >
        <Play className="size-4" aria-hidden />
        {COPY.escapeReadiness.simulateOwnerAbsence}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle>{COPY.escapeReadiness.simulationTitle}</SheetTitle>
            <SheetDescription>{COPY.escapeReadiness.simulationLead}</SheetDescription>
          </SheetHeader>

          {simulation ? (
            <div className="space-y-5 px-4 pb-6">
              <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
                <p className="text-sm font-medium leading-snug">{simulation.headline}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {COPY.escapeReadiness.simulationMeta(
                    simulation.totalDays,
                    simulation.capacityDays,
                    simulation.firstBreakdownDay
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {COPY.escapeReadiness.forecastTitle}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {forecastDays.map((day) => (
                    <li
                      key={day.day}
                      className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0 last:pb-0"
                    >
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        Day {day.day}
                      </span>
                      <span
                        className={cn(
                          "text-right text-sm capitalize leading-snug",
                          day.status === "breakdown"
                            ? "text-rose-700 dark:text-rose-300"
                            : day.status === "strained"
                              ? "text-amber-800 dark:text-amber-200"
                              : "text-muted-foreground"
                        )}
                      >
                        {day.headline.toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {simulation.fixes.length > 0 ? (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {COPY.escapeReadiness.fixesHeadline(
                      simulation.fixes.length,
                      formatProjectedDaysGain(simulation.projectedDaysGain)
                    )}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {simulation.fixes.map((fix) => (
                      <li key={fix.title}>
                        <Link
                          href={fix.href}
                          className="group flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-background"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                              {fix.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {fix.action}
                            </p>
                          </div>
                          <ArrowRight
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <p className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {COPY.escapeReadiness.detailedTimeline}
                </p>
                <ol className="relative space-y-0 border-l border-border/60 pl-4">
                  {simulation.days.map((day) => (
                    <li key={day.day} className="relative pb-6 last:pb-0">
                      <span
                        className={cn(
                          "absolute -left-[0.57rem] top-1 size-3 rounded-full border-2 border-background",
                          day.status === "breakdown"
                            ? "bg-rose-500"
                            : day.status === "strained"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        )}
                        aria-hidden
                      />

                      <div className="rounded-xl border border-border/60 bg-card p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{day.label}</p>
                            <p className="mt-0.5 text-xs font-medium capitalize text-muted-foreground">
                              {day.headline.toLowerCase()}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{day.summary}</p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              statusTone(day.status, dark)
                            )}
                          >
                            {day.status}
                          </span>
                        </div>

                        {day.events.length > 0 ? (
                          <ul className="mt-3 space-y-2">
                            {day.events.map((evt) => (
                              <li
                                key={`${day.day}-${evt.title}-${evt.phase}`}
                                className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                      sourceChip(evt.source, dark)
                                    )}
                                  >
                                    {simulationSourceLabel(evt.source)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{evt.phase}</span>
                                </div>
                                <p className="mt-1.5 text-sm font-medium leading-snug">{evt.title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                  {evt.detail}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {day.breakdownMoment ? (
                          <div className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2.5">
                            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
                              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                                {COPY.escapeReadiness.likelyBreakdown}
                              </p>
                            </div>
                            <p className="mt-1.5 text-sm font-semibold leading-snug">
                              {day.breakdownMoment.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {day.breakdownMoment.detail}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
