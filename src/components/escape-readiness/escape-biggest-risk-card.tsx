import { AlertTriangle } from "lucide-react"

import type { EscapeReadinessBiggestRisk } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

function severityTone(severity: EscapeReadinessBiggestRisk["severity"], dark?: boolean) {
  switch (severity) {
    case "critical":
      return {
        shell: dark
          ? "border-rose-500/35 bg-rose-500/[0.1]"
          : "border-rose-300/80 bg-rose-500/[0.06] dark:border-rose-500/35 dark:bg-rose-500/[0.1]",
        badge: dark
          ? "border-rose-400/40 bg-rose-500/20 text-rose-100"
          : "border-rose-300/80 bg-rose-500/10 text-rose-900 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-100",
        bar: "bg-rose-600 dark:bg-rose-500",
        eyebrow: dark ? "text-rose-200/90" : "text-rose-800 dark:text-rose-200",
      }
    case "high":
      return {
        shell: dark
          ? "border-orange-500/30 bg-orange-500/[0.08]"
          : "border-orange-200/80 bg-orange-500/[0.05] dark:border-orange-500/30 dark:bg-orange-500/[0.08]",
        badge: dark
          ? "border-orange-400/40 bg-orange-500/20 text-orange-100"
          : "border-orange-300/80 bg-orange-500/10 text-orange-900 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-100",
        bar: "bg-orange-500",
        eyebrow: dark ? "text-orange-200/90" : "text-orange-900 dark:text-orange-200",
      }
    case "elevated":
      return {
        shell: dark
          ? "border-amber-500/30 bg-amber-500/[0.08]"
          : "border-amber-200/80 bg-amber-500/[0.05] dark:border-amber-500/30 dark:bg-amber-500/[0.08]",
        badge: dark
          ? "border-amber-400/40 bg-amber-500/20 text-amber-100"
          : "border-amber-300/80 bg-amber-500/10 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100",
        bar: "bg-amber-500",
        eyebrow: dark ? "text-amber-200/90" : "text-amber-900 dark:text-amber-200",
      }
    case "moderate":
      return {
        shell: dark
          ? "border-sky-500/25 bg-sky-500/[0.08]"
          : "border-sky-200/80 bg-sky-500/[0.05] dark:border-sky-500/25 dark:bg-sky-500/[0.08]",
        badge: dark
          ? "border-sky-400/40 bg-sky-500/20 text-sky-100"
          : "border-sky-300/80 bg-sky-500/10 text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-100",
        bar: "bg-sky-500",
        eyebrow: dark ? "text-sky-200/90" : "text-sky-900 dark:text-sky-200",
      }
  }
}

export function EscapeBiggestRiskCard({
  risk,
  dark = false,
  compact = false,
}: {
  risk: EscapeReadinessBiggestRisk
  dark?: boolean
  compact?: boolean
}) {
  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const body = dark ? "text-zinc-300" : "text-muted-foreground"
  const title = dark ? "text-white" : "text-foreground"
  const tone = severityTone(risk.severity, dark)

  return (
    <div
      className={cn(
        "mx-auto rounded-2xl border px-4 py-4 text-left sm:px-5 sm:py-5",
        compact ? "mb-4 max-w-md" : "mb-6 max-w-lg",
        tone.shell
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn("size-4 shrink-0", tone.eyebrow)} aria-hidden />
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", tone.eyebrow)}>
            Biggest risk
          </p>
        </div>
        <div className="min-w-[7.5rem] shrink-0 text-right">
          <p className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", muted)}>Severity</p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              tone.badge
            )}
          >
            {risk.severityLabel}
          </span>
          <div className={cn("mt-2 h-1.5 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-muted/60")}>
            <div
              className={cn("h-full rounded-full transition-[width]", tone.bar)}
              style={{ width: `${risk.severityPercent}%` }}
              role="presentation"
            />
          </div>
        </div>
      </div>

      <h3 className={cn("mt-3 text-base font-semibold leading-snug sm:text-lg", title)}>{risk.title}</h3>

      <div className="mt-4">
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>
          If you disappeared tomorrow…
        </p>
        <p className={cn("mt-2 text-sm leading-relaxed", body)}>{risk.disappearingTomorrow}</p>
      </div>

      <div className="mt-4">
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>Predicted breakdowns</p>
        <ul className="mt-2.5 space-y-2">
          {risk.predictedBreakdowns.map((line) => (
            <li key={line} className="flex gap-2.5 text-sm leading-relaxed">
              <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone.bar)} aria-hidden />
              <span className={body}>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
          dark ? "border-white/[0.08] bg-black/20" : "border-border/60 bg-background/60"
        )}
      >
        <div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>
            Estimated interruptions
          </p>
          <p className={cn("mt-1 text-sm font-semibold tabular-nums", title)}>{risk.estimatedInterruptions.label}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-semibold tabular-nums leading-none", title)}>
            {risk.estimatedInterruptions.count}
          </p>
          <p className={cn("mt-1 text-[10px] uppercase tracking-wide", muted)}>pulls</p>
        </div>
      </div>
    </div>
  )
}
