import type { EscapeFreedomPathItem } from "@/lib/escape-readiness/types"
import { effortLabel } from "@/lib/escape-readiness/build-freedom-path"
import { cn } from "@/lib/utils"

function effortTone(effort: EscapeFreedomPathItem["effort"], dark?: boolean) {
  switch (effort) {
    case "low":
      return dark ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-300"
    case "medium":
      return dark ? "text-amber-300" : "text-amber-800 dark:text-amber-300"
    case "high":
      return dark ? "text-rose-300" : "text-rose-700 dark:text-rose-300"
  }
}

export function EscapeFreedomPathList({
  items,
  dark = false,
  compact = false,
}: {
  items: [EscapeFreedomPathItem, EscapeFreedomPathItem, EscapeFreedomPathItem]
  dark?: boolean
  compact?: boolean
}) {
  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const body = dark ? "text-zinc-300" : "text-muted-foreground"
  const title = dark ? "text-white" : "text-foreground"

  return (
    <div>
      <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em]", muted)}>
        Fastest path to freedom
      </p>
      <ol className="mt-3 list-none space-y-3 p-0">
        {items.map((item, i) => (
          <li
            key={`${item.title}-${i}`}
            className={cn(
              "rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5",
              dark ? "border-white/[0.08] bg-white/[0.03]" : "border-border/60 bg-muted/10"
            )}
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                  dark
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-200/90"
                    : "border-primary/25 bg-primary/[0.06] text-foreground"
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold leading-snug", title)}>{item.title}</p>
                {!compact ? (
                  <p className={cn("mt-1 text-xs leading-relaxed", body)}>{item.action}</p>
                ) : null}

                <dl
                  className={cn(
                    "mt-3 grid gap-2",
                    compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
                  )}
                >
                  <div>
                    <dt className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", muted)}>
                      Est. score gain
                    </dt>
                    <dd className={cn("mt-0.5 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400")}>
                      +{item.estimatedScoreGain}
                    </dd>
                  </div>
                  <div>
                    <dt className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", muted)}>
                      Est. effort
                    </dt>
                    <dd className={cn("mt-0.5 text-sm font-semibold", effortTone(item.effort, dark))}>
                      {effortLabel(item.effort)}
                    </dd>
                  </div>
                  <div>
                    <dt className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", muted)}>
                      Time required
                    </dt>
                    <dd className={cn("mt-0.5 text-sm font-medium tabular-nums", title)}>
                      {item.timeRequired}
                    </dd>
                  </div>
                  <div>
                    <dt className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", muted)}>
                      Potential score
                    </dt>
                    <dd className={cn("mt-0.5 text-sm font-semibold tabular-nums", title)}>
                      {item.potentialResultingScore}%
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
