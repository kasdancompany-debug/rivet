import { Check } from "lucide-react"

import { ESCAPE_READINESS_MILESTONES, escapeMilestoneState } from "@/lib/escape-readiness/milestones"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export function OutcomeMilestonesStrip({ score }: { score: number | null }) {
  if (score == null) return null

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 px-4 py-4 backdrop-blur-sm sm:px-5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {COPY.dashboard.outcome.milestonesTitle}
      </p>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted/80">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-600/90 to-emerald-500/85"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          role="presentation"
        />
        {ESCAPE_READINESS_MILESTONES.map((m) => (
          <span
            key={m.threshold}
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-muted-foreground/50"
            style={{ left: `${m.threshold}%` }}
            aria-hidden
          />
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        {ESCAPE_READINESS_MILESTONES.map((milestone) => {
          const state = escapeMilestoneState(score, milestone)
          const reached = state === "reached"
          const isNext = state === "next"

          return (
            <li
              key={milestone.threshold}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 sm:min-w-[10rem]",
                reached
                  ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                  : isNext
                    ? "border-sky-500/35 bg-sky-500/[0.08] ring-1 ring-sky-500/20"
                    : "border-border/45 bg-muted/15 opacity-80"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.62rem] font-bold tabular-nums",
                  reached
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                    : isNext
                      ? "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-100"
                      : "border-border/50 text-muted-foreground"
                )}
              >
                {reached ? <Check className="size-3.5" aria-hidden /> : milestone.threshold}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug text-foreground">{milestone.label}</p>
                {isNext && !reached ? (
                  <p className="text-[0.62rem] text-muted-foreground">
                    {COPY.dashboard.outcome.milestonePtsAway(milestone.threshold - score)}
                  </p>
                ) : reached ? (
                  <p className="text-[0.62rem] text-emerald-700 dark:text-emerald-300">
                    {COPY.dashboard.outcome.milestoneReached}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
