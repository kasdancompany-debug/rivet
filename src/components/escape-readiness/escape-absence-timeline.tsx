import type { EscapeAbsenceCapacity } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

function dayToPercent(days: number, maxDays: number): number {
  return Math.min(100, Math.max(0, (days / maxDays) * 100))
}

export function EscapeAbsenceTimeline({
  capacity,
  dark = false,
  compact = false,
}: {
  capacity: EscapeAbsenceCapacity
  dark?: boolean
  compact?: boolean
}) {
  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const title = dark ? "text-white" : "text-foreground"
  const body = dark ? "text-zinc-300" : "text-muted-foreground"
  const track = dark ? "bg-white/[0.08]" : "bg-muted/60"
  const safeFill = dark ? "bg-emerald-500/35" : "bg-emerald-500/25 dark:bg-emerald-500/30"
  const capacityPin = dark ? "border-sky-400 bg-sky-500" : "border-sky-600 bg-sky-600 dark:border-sky-400 dark:bg-sky-500"
  const failurePin = dark ? "border-amber-400 bg-amber-500" : "border-amber-600 bg-amber-500"

  const maxDays = capacity.timelineMaxDays
  const capacityPct = dayToPercent(capacity.estimatedDays, maxDays)
  const failurePct = dayToPercent(capacity.failureAtDays, maxDays)
  const safePct = dayToPercent(capacity.failureAtDays, maxDays)

  return (
    <div className={cn("w-full text-left", compact ? "max-w-md" : "max-w-lg")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em]", muted)}>
            Estimated owner absence capacity
          </p>
          <p
            className={cn("mt-1 text-2xl font-semibold tabular-nums tracking-tight", title)}
          >
            {capacity.estimatedLabel}
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em]", muted)}>Confidence</p>
          <p className={cn("mt-1 text-lg font-semibold tabular-nums", title)}>
            {capacity.confidencePercent}%
          </p>
        </div>
      </div>

      <div className={cn("relative mt-5", compact ? "h-16" : "h-20")}>
        <div
          className={cn("absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full", track)}
          aria-hidden
        >
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full", safeFill)}
            style={{ width: `${safePct}%` }}
          />
        </div>

        {capacity.timelineMarks.map((mark) => (
          <span
            key={mark.days}
            className={cn(
              "absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2",
              dark ? "bg-white/20" : "bg-border/80"
            )}
            style={{ left: `${dayToPercent(mark.days, maxDays)}%` }}
            aria-hidden
          />
        ))}

        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${failurePct}%` }}
          title={`Likely failure · ${capacity.failureAtLabel}`}
        >
          <span
            className={cn("block size-3 rounded-full border-2 shadow-sm", failurePin)}
            aria-hidden
          />
          {!compact ? (
            <p className={cn("absolute left-1/2 top-4 w-max -translate-x-1/2 text-[10px] font-medium", muted)}>
              {capacity.failureAtLabel}
            </p>
          ) : null}
        </div>

        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${capacityPct}%` }}
          title={`Capacity · ${capacity.estimatedLabel}`}
        >
          <span
            className={cn(
              "block size-4 rounded-full border-2 shadow-md ring-2 ring-background/80",
              capacityPin
            )}
            aria-hidden
          />
          <p
            className={cn(
              "absolute left-1/2 top-5 w-max -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide",
              dark ? "text-sky-300" : "text-sky-700 dark:text-sky-300"
            )}
          >
            Capacity
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-2 px-0.5">
        {capacity.timelineMarks.map((mark) => (
          <span
            key={mark.days}
            className={cn("text-[10px] font-medium tabular-nums", muted)}
            style={{ flex: "1 1 0", textAlign: mark.days >= 10 ? "right" : "center" }}
          >
            {mark.label}
          </span>
        ))}
      </div>

      <div
        className={cn(
          "mt-4 rounded-lg border px-3 py-2.5",
          dark
            ? "border-amber-500/25 bg-amber-500/[0.08]"
            : "border-amber-200/70 bg-amber-500/[0.05] dark:border-amber-500/25 dark:bg-amber-500/[0.08]"
        )}
      >
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>
          Likely failure point
        </p>
        <p className={cn("mt-1 text-sm font-medium leading-snug", title)}>
          {capacity.failureAtLabel} · {capacity.likelyFailurePoint}
        </p>
        <p className={cn("mt-1 text-xs leading-relaxed", body)}>
          Stress typically shows before full capacity—plan coverage for this moment first.
        </p>
      </div>
    </div>
  )
}
