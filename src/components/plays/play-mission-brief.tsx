"use client"

import { Target, Zap } from "lucide-react"

import { cn } from "@/lib/utils"

/** Short operational context — not a document preamble. */
export function PlayMissionBrief({
  operationalProblem,
  successCriteria,
  className,
}: {
  operationalProblem: string | null
  successCriteria: string | null
  className?: string
}) {
  if (!operationalProblem && !successCriteria) return null

  return (
    <section
      className={cn(
        "space-y-4 rounded-3xl border border-border/40 bg-gradient-to-b from-muted/30 to-transparent p-5 sm:p-6",
        className
      )}
      aria-label="Play context"
    >
      {operationalProblem ? (
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground">
            <Zap className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-muted-foreground">Why this play exists</p>
            <p className="mt-1.5 text-base leading-relaxed text-foreground sm:text-[1.05rem]">
              {operationalProblem}
            </p>
          </div>
        </div>
      ) : null}
      {successCriteria ? (
        <div
          className={cn(
            "flex gap-4",
            operationalProblem && "border-t border-border/30 pt-4"
          )}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Target className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-muted-foreground">Done right looks like</p>
            <p className="mt-1.5 text-base leading-relaxed text-foreground sm:text-[1.05rem]">
              {successCriteria}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
