import Link from "next/link"
import { escapeBandLabel, escapeBandTone } from "@/lib/escape-readiness/presentation"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function factorBarTone(percent: number | null): string {
  if (percent == null) return "bg-muted/50"
  if (percent >= 75) return "bg-emerald-600 dark:bg-emerald-500"
  if (percent >= 50) return "bg-sky-600 dark:bg-sky-500"
  if (percent >= 35) return "bg-amber-500"
  return "bg-rose-600 dark:bg-rose-500"
}

function ProgressSparkline({ progress }: { progress: EscapeReadinessView["progress"] }) {
  const points = progress.slice(-14)
  if (points.length < 2) return null

  return (
    <div className="mt-6 border-t border-border/40 pt-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Progress over time
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Escape Readiness Score · last {points.length} days</p>
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
  const body = dark ? "text-zinc-300" : "text-muted-foreground"
  const title = dark ? "text-white" : "text-foreground"
  const divider = dark ? "border-white/[0.08]" : "border-border/40"

  return (
    <section
      className={cn("overflow-hidden rounded-2xl border", shell, className)}
      aria-labelledby="escape-readiness-heading"
    >
      <div className={cn("border-b px-5 py-6 sm:px-7", divider, compact ? "sm:py-5" : "sm:py-7")}>
        <p className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.18em]", muted)}>
          Escape readiness
        </p>
        <p className={cn("mt-3 max-w-2xl text-sm leading-relaxed", body)}>{model.tagline}</p>
        <h2
          id="escape-readiness-heading"
          className={cn(
            "mt-4 max-w-2xl font-semibold tracking-tight",
            title,
            compact ? "text-lg leading-snug sm:text-xl" : "text-xl leading-snug sm:text-2xl"
          )}
        >
          {model.headlineQuestion}
        </h2>
        <div className={cn("mt-6 flex flex-wrap items-end gap-5", compact && "mt-5")}>
          <div>
            <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em]", muted)}>
              Escape Readiness Score
            </p>
            <p className={cn("mt-1 text-[clamp(2.75rem,8vw,4rem)] font-semibold tabular-nums leading-none tracking-tight", title)}>
              {model.score == null ? (
                <span className={muted}>—</span>
              ) : (
                <>
                  {model.score}
                  <span className={cn("text-[clamp(1rem,3vw,1.5rem)] font-semibold", muted)}>%</span>
                </>
              )}
            </p>
            <p className={cn("mt-1.5 text-xs", muted)}>Higher = more likely five days away would hold</p>
          </div>
          {model.band ? (
            <Badge
              variant="outline"
              className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold", escapeBandTone(model.band))}
            >
              {escapeBandLabel(model.band)}
            </Badge>
          ) : null}
        </div>
        <p className={cn("mt-4 max-w-2xl text-sm leading-relaxed", body)}>{model.verdict}</p>
        {model.demo ? (
          <p className={cn("mt-2 text-[11px]", muted)}>
            Illustrative example for preview—not your live workspace.
          </p>
        ) : null}

        {model.biggestRisk ? (
          <div
            className={cn(
              "mt-5 rounded-xl border px-4 py-3.5",
              dark
                ? "border-rose-500/25 bg-rose-500/[0.08]"
                : "border-rose-200/70 bg-rose-500/[0.05] dark:border-rose-500/25 dark:bg-rose-500/[0.08]"
            )}
          >
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", dark ? "text-rose-300/90" : "text-rose-800 dark:text-rose-200")}>
              Biggest risk
            </p>
            <p className={cn("mt-1 text-sm font-semibold", title)}>{model.biggestRisk.title}</p>
            <p className={cn("mt-1 text-xs leading-relaxed", body)}>{model.biggestRisk.detail}</p>
          </div>
        ) : null}

        {!compact && model.progress.length >= 2 ? <ProgressSparkline progress={model.progress} /> : null}
      </div>

      <div className={cn("px-5 py-4 sm:px-7", compact && "px-4 sm:px-5")}>
        <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em]", muted)}>Top 3 fixes</p>
        <ol className="mt-3 list-none space-y-3 p-0">
          {model.topFixes.map((line, i) => (
            <li key={line} className="flex gap-3 text-sm leading-relaxed">
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                  dark
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200/90"
                    : "border-primary/25 bg-primary/[0.06] text-foreground"
                )}
              >
                {i + 1}
              </span>
              <span className={body}>{line}</span>
            </li>
          ))}
        </ol>
        {!dark && !compact ? (
          <p className="mt-4">
            <Link href="/escape-plan" className="text-xs font-medium text-primary hover:underline">
              Open full escape plan →
            </Link>
          </p>
        ) : null}
      </div>

      <ul className={cn("divide-y", divider, compact ? "px-4 py-1 sm:px-5" : "px-5 py-2 sm:px-7")}>
        {model.factors.map((f) => (
          <li key={f.id} className={cn("py-4", compact && "py-3.5")}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", title)}>{f.label}</p>
                <p className={cn("mt-1 text-xs leading-relaxed", body)}>{f.hint}</p>
              </div>
              <p className={cn("shrink-0 text-lg font-semibold tabular-nums", title)}>
                {f.percent == null ? "—" : `${f.percent}%`}
              </p>
            </div>
            <div className={cn("mt-3 h-1.5 overflow-hidden rounded-full", dark ? "bg-white/[0.08]" : "bg-muted/60")}>
              <div
                className={cn("h-full rounded-full transition-[width]", factorBarTone(f.percent))}
                style={{ width: f.percent == null ? "0%" : `${f.percent}%` }}
                role="presentation"
              />
            </div>
          </li>
        ))}
      </ul>

      {compact && model.progress.length >= 2 ? (
        <div className={cn("border-t px-5 py-4 sm:px-7", divider)}>
          <ProgressSparkline progress={model.progress} />
        </div>
      ) : null}
    </section>
  )
}
