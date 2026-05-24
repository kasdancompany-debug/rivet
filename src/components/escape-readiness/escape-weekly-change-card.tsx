import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"

import type { EscapeWeeklyChange, EscapeWeeklyChangeDirection } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

function directionTone(direction: EscapeWeeklyChangeDirection, dark?: boolean) {
  switch (direction) {
    case "up":
      return {
        icon: ArrowUp,
        badge: dark
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-200",
        label: dark ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-300",
      }
    case "down":
      return {
        icon: ArrowDown,
        badge: dark
          ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
          : "border-rose-500/25 bg-rose-500/[0.06] text-rose-800 dark:text-rose-200",
        label: dark ? "text-rose-300" : "text-rose-700 dark:text-rose-300",
      }
    case "flat":
      return {
        icon: ArrowRight,
        badge: dark
          ? "border-zinc-500/30 bg-white/[0.04] text-zinc-300"
          : "border-border/60 bg-muted/20 text-muted-foreground",
        label: mutedLabel(dark),
      }
  }
}

function mutedLabel(dark?: boolean) {
  return dark ? "text-zinc-400" : "text-muted-foreground"
}

function directionLabel(direction: EscapeWeeklyChangeDirection): string {
  switch (direction) {
    case "up":
      return "Up"
    case "down":
      return "Down"
    case "flat":
      return "Flat"
  }
}

export function EscapeWeeklyChangeCard({
  weeklyChange,
  dark = false,
  compact = false,
}: {
  weeklyChange: EscapeWeeklyChange
  dark?: boolean
  compact?: boolean
}) {
  const muted = mutedLabel(dark)
  const title = dark ? "text-white" : "text-foreground"
  const body = dark ? "text-zinc-300" : "text-muted-foreground"

  return (
    <div
      className={cn(
        "mx-auto rounded-2xl border px-4 py-4 sm:px-5 sm:py-5",
        compact ? "mb-4 max-w-md" : "mb-6 max-w-lg",
        dark ? "border-white/[0.08] bg-white/[0.03]" : "border-border/60 bg-muted/10"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>
          Weekly change
        </p>
        <p className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", muted)}>
          {weeklyChange.periodLabel}
        </p>
      </div>

      <ul className="mt-3 divide-y divide-border/40 dark:divide-white/[0.08]">
        {weeklyChange.items.map((item) => {
          const tone = directionTone(item.direction, dark)
          const Icon = tone.icon

          return (
            <li key={item.metric} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <p className={cn("text-sm font-semibold leading-snug", title)}>{item.metric}</p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      tone.badge
                    )}
                  >
                    <Icon className="size-3" aria-hidden />
                    {directionLabel(item.direction)}
                  </span>
                  <p className={cn("text-sm font-semibold tabular-nums", tone.label)}>
                    {item.differenceLabel}
                  </p>
                </div>
              </div>
              <p className={cn("mt-2 text-xs leading-relaxed", body)}>{item.explanation}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
