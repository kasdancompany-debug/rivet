"use client"

import { cn } from "@/lib/utils"

/** Sticky run progress — Duolingo-style step dots + session bar. */
export function PlayRunProgress({
  stepsCompleted,
  stepsTotal,
  activeStepIndex,
  className,
}: {
  stepsCompleted: number
  stepsTotal: number
  activeStepIndex?: number
  className?: string
}) {
  if (stepsTotal <= 0) return null

  const pct = Math.round((stepsCompleted / stepsTotal) * 100)

  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-1 border-b border-border/40 bg-background/90 px-1 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          Step {Math.min(stepsCompleted + 1, stepsTotal)} of {stepsTotal}
        </p>
        <p className="text-sm tabular-nums text-muted-foreground">{pct}% this run</p>
      </div>
      <div className="mt-2.5 flex gap-1.5" role="list" aria-label="Step progress">
        {Array.from({ length: stepsTotal }, (_, i) => {
          const done = i < stepsCompleted
          const active = activeStepIndex === i
          return (
            <span
              key={i}
              role="listitem"
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                done
                  ? "bg-emerald-500"
                  : active
                    ? "bg-primary"
                    : "bg-muted"
              )}
              aria-label={`Step ${i + 1}${done ? ", complete" : active ? ", current" : ""}`}
            />
          )
        })}
      </div>
    </div>
  )
}
