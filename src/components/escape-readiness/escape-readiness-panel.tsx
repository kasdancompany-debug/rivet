import Link from "next/link"

import { EscapeWeeklyChangeCard } from "@/components/escape-readiness/escape-weekly-change-card"
import { EscapeReadinessFactorList } from "@/components/escape-readiness/escape-readiness-factor-list"
import { EscapeFreedomPathList } from "@/components/escape-readiness/escape-freedom-path-list"
import { EscapeBiggestRiskCard } from "@/components/escape-readiness/escape-biggest-risk-card"
import { EscapeReadinessHero } from "@/components/escape-readiness/escape-readiness-hero"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

function ProgressSparkline({ progress, dark }: { progress: EscapeReadinessView["progress"]; dark?: boolean }) {
  const points = progress.slice(-14)
  if (points.length < 2) return null

  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const divider = dark ? "border-white/[0.08]" : "border-border/40"

  return (
    <div className={cn("border-t px-5 py-5 sm:px-7", divider)}>
      <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em]", muted)}>
        Progress over time
      </p>
      <p className={cn("mt-1 text-xs", muted)}>Escape Readiness Score · last {points.length} days</p>
      <div className="mt-3 flex h-14 items-end gap-px">
        {points.map((p) => {
          const h = Math.max(6, Math.round((p.score / 100) * 56))
          return (
            <div
              key={p.date}
              className="group flex min-w-0 flex-1 flex-col justify-end"
              title={`${p.date}: ${p.score}%`}
            >
              <div
                className="mx-auto w-full max-w-[10px] rounded-[2px] bg-emerald-600/50 transition-colors group-hover:bg-emerald-600/70 dark:bg-emerald-500/45"
                style={{ height: `${h}px` }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EscapeReadinessPanel({
  model,
  className,
  compact = false,
  dark = false,
}: {
  model: EscapeReadinessView
  className?: string
  compact?: boolean
  /** Scan results page uses a dark shell. */
  dark?: boolean
}) {
  const shell = dark
    ? "border-white/[0.08] bg-black/40 text-zinc-100 shadow-none"
    : "border-border/60 bg-card shadow-[0_1px_0_rgba(15,23,42,0.04)]"
  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const divider = dark ? "border-white/[0.08]" : "border-border/40"

  return (
    <section
      className={cn("overflow-hidden rounded-2xl border", shell, className)}
      aria-labelledby="escape-readiness-heading"
    >
      <div className={cn("border-b", divider)}>
        <EscapeReadinessHero model={model} dark={dark} compact={compact} />
        <h2 id="escape-readiness-heading" className="sr-only">
          {model.headlineQuestion}
        </h2>

        {model.biggestRisk ? (
          <EscapeBiggestRiskCard risk={model.biggestRisk} dark={dark} compact={compact} />
        ) : null}

        {model.weeklyChange ? (
          <EscapeWeeklyChangeCard weeklyChange={model.weeklyChange} dark={dark} compact={compact} />
        ) : null}

        {!compact && model.progress.length >= 2 ? (
          <ProgressSparkline progress={model.progress} dark={dark} />
        ) : null}
      </div>

      <div className={cn("px-5 py-4 sm:px-7", compact && "px-4 sm:px-5")}>
        <EscapeFreedomPathList items={model.fastestPathToFreedom} dark={dark} compact={compact} />
        {!dark && !compact ? (
          <p className="mt-4">
            <Link href="/escape-plan" className="text-xs font-medium text-primary hover:underline">
              Open full escape plan →
            </Link>
          </p>
        ) : null}
      </div>

      <EscapeReadinessFactorList
        factors={model.factors}
        dark={dark}
        compact={compact}
        className={cn("border-t", divider, compact ? "px-4 py-2 sm:px-5" : "px-5 py-2 sm:px-7")}
      />

      {compact && model.progress.length >= 2 ? (
        <ProgressSparkline progress={model.progress} dark={dark} />
      ) : null}
    </section>
  )
}
