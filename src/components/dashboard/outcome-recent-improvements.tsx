import { ArrowDown, ArrowUp, Sparkles } from "lucide-react"

import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export function OutcomeRecentImprovements({ escape }: { escape: EscapeReadinessView }) {
  const gain = escape.scoreGain
  const weekly = escape.weeklyChange
  const hasGain = gain != null && gain.pointsGained > 0
  const hasWeekly = weekly != null && weekly.items.length > 0

  if (!hasGain && !hasWeekly) return null

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 px-4 py-4 backdrop-blur-sm sm:px-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {COPY.dashboard.outcome.recentImprovementsTitle}
        </p>
      </div>

      {hasGain ? (
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3.5">
          <p className="text-sm font-semibold text-foreground">{gain.gainLabel}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{gain.humanExplanation}</p>
          {gain.absenceDaysGained > 0 ? (
            <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-200">
              {COPY.dashboard.outcome.absenceDaysGained(gain.absenceDaysGained)}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasWeekly ? (
        <ul className={cn("space-y-2", hasGain && "mt-3")}>
          {weekly!.items.slice(0, 4).map((item) => {
            const Icon = item.direction === "up" ? ArrowUp : item.direction === "down" ? ArrowDown : null
            return (
              <li
                key={item.metric}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/35 bg-muted/10 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.metric}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.explanation}</p>
                </div>
                <div className="shrink-0 text-right">
                  {Icon ? (
                    <Icon
                      className={cn(
                        "mx-auto size-3.5",
                        item.direction === "up"
                          ? "text-emerald-600"
                          : item.direction === "down"
                            ? "text-amber-700"
                            : "text-muted-foreground"
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <p
                    className={cn(
                      "mt-0.5 text-sm font-semibold tabular-nums",
                      item.direction === "up"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : item.direction === "down"
                          ? "text-amber-800 dark:text-amber-200"
                          : "text-muted-foreground"
                    )}
                  >
                    {item.differenceLabel}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      <p className="mt-3 text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground/80">
        {weekly?.periodLabel ?? gain?.periodLabel}
      </p>
    </div>
  )
}
