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

export function EscapeReadinessPanel({
  model,
  className,
  compact = false,
}: {
  model: EscapeReadinessView
  className?: string
  compact?: boolean
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_0_rgba(15,23,42,0.04)]",
        className
      )}
      aria-labelledby="escape-readiness-heading"
    >
      <div className={cn("border-b border-border/40 px-5 py-6 sm:px-7", compact ? "sm:py-5" : "sm:py-7")}>
        <p className="rivet-section-label">Rivet calculates</p>
        <h2
          id="escape-readiness-heading"
          className={cn(
            "mt-2 max-w-2xl font-semibold tracking-tight text-foreground",
            compact ? "text-lg leading-snug sm:text-xl" : "text-xl leading-snug sm:text-2xl"
          )}
        >
          {model.headlineQuestion}
        </h2>
        <div className={cn("mt-6 flex flex-wrap items-end gap-5", compact && "mt-5")}>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Escape Readiness Score
            </p>
            <p className="mt-1 text-[clamp(2.75rem,8vw,4rem)] font-semibold tabular-nums leading-none tracking-tight text-foreground">
              {model.score == null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <>
                  {model.score}
                  <span className="text-[clamp(1rem,3vw,1.5rem)] font-semibold text-muted-foreground">%</span>
                </>
              )}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">Higher = more likely a week away holds</p>
          </div>
          {model.band ? (
            <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold", escapeBandTone(model.band))}>
              {escapeBandLabel(model.band)}
            </Badge>
          ) : null}
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{model.verdict}</p>
        {model.demo ? (
          <p className="mt-2 text-[11px] text-muted-foreground">Illustrative example for preview—not your live workspace.</p>
        ) : null}
      </div>

      <ul className={cn("divide-y divide-border/40", compact ? "px-4 py-1 sm:px-5" : "px-5 py-2 sm:px-7")}>
        {model.factors.map((f) => (
          <li key={f.id} className={cn("py-4", compact && "py-3.5")}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.hint}</p>
              </div>
              <p className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
                {f.percent == null ? "—" : `${f.percent}%`}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn("h-full rounded-full transition-[width]", factorBarTone(f.percent))}
                style={{ width: f.percent == null ? "0%" : `${f.percent}%` }}
                role="presentation"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
