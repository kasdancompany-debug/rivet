import type { OwnerInterruptionTrendDay } from "@/lib/owner-interruptions/types"
import {
  labelForTrendDayIntensity,
} from "@/lib/owner-interruptions/trend/compute-trend-day-intensity"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

const INTENSITY_CELL: Record<
  OwnerInterruptionTrendDay["intensity"],
  string
> = {
  none: "border-border/50 bg-muted/15 dark:bg-muted/10",
  low: "border-amber-500/25 bg-amber-500/10 dark:bg-amber-500/15",
  medium: "border-orange-500/35 bg-orange-500/20 dark:bg-orange-500/25",
  high: "border-rose-500/45 bg-rose-500/35 dark:bg-rose-500/40",
}

function formatTimeLost(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours}h`
}

function TrendHeatmapCell({ day }: { day: OwnerInterruptionTrendDay }) {
  const intensityLabel = labelForTrendDayIntensity(day.intensity)

  return (
    <div className="group relative">
      <div
        className={cn(
          "flex aspect-square min-h-10 w-full flex-col items-center justify-center rounded-md border px-1 py-1.5 transition-colors",
          "group-hover:ring-2 group-hover:ring-foreground/15",
          INTENSITY_CELL[day.intensity]
        )}
        aria-label={`${day.dayLabel}: ${day.count} pulls, ${day.minutes} minutes`}
      >
        <span className="text-[0.6rem] font-medium tabular-nums text-muted-foreground">{day.dayShort}</span>
      </div>

      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-lg border border-border/60 bg-popover px-3 py-2.5 text-popover-foreground shadow-md",
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      >
        <p className="text-xs font-semibold text-foreground">{day.dayLabel}</p>
        {intensityLabel ? (
          <p className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            {intensityLabel}
          </p>
        ) : null}
        <dl className="mt-2 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{COPY.interruptions.heatmapInterruptionsLabel}</dt>
            <dd className="font-semibold tabular-nums text-foreground">{day.count}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{COPY.interruptions.heatmapTimeLostLabel}</dt>
            <dd className="font-semibold tabular-nums text-foreground">{formatTimeLost(day.minutes)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{COPY.interruptions.heatmapMostCommonIssueLabel}</dt>
            <dd className="mt-0.5 font-medium leading-snug text-foreground">
              {day.mostCommonIssue ?? COPY.interruptions.heatmapNoCommonIssue}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export function InterruptionTrendHeatmap({ days }: { days: OwnerInterruptionTrendDay[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => (
          <TrendHeatmapCell key={day.ymd} day={day} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[0.65rem] text-muted-foreground">
        <span className="font-medium uppercase tracking-wide">{COPY.interruptions.heatmapLegendLabel}</span>
        {(["low", "medium", "high"] as const).map((level) => (
          <span key={level} className="inline-flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm border", INTENSITY_CELL[level])} aria-hidden />
            {labelForTrendDayIntensity(level)}
          </span>
        ))}
      </div>
    </div>
  )
}
