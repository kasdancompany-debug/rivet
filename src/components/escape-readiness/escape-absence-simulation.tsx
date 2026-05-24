"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Play } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  buildAbsenceSimulation,
  simulationSourceLabel,
} from "@/lib/escape-readiness/build-absence-simulation"
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
}: {
  model: EscapeReadinessView
  dark?: boolean
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const simulation = useMemo(
    () => (open ? buildAbsenceSimulation(model) : null),
    [model, open]
  )

  if (model.score == null) return null

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
        Simulate owner absence
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle>Owner absence simulation</SheetTitle>
            <SheetDescription>
              Day-by-day scenario using your SOPs, training, issues, interruptions, and staffing
              signals.
            </SheetDescription>
          </SheetHeader>

          {simulation ? (
            <div className="space-y-5 px-4 pb-6">
              <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
                <p className="text-sm font-medium leading-snug">{simulation.headline}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {simulation.totalDays} days modeled · capacity ~{simulation.capacityDays} days ·
                  first breakdown day {simulation.firstBreakdownDay}
                </p>
              </div>

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
                              Likely breakdown
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
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
