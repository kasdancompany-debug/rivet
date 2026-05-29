import Link from "next/link"
import { Check, Circle, TrendingDown } from "lucide-react"

import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export function InterruptionBecamePanel({
  outcomes,
  impact,
}: {
  outcomes: InterruptionActionPlanView["outcomes"]
  impact: InterruptionActionPlanView["impact"]
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-background/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {COPY.interruptions.becameTitle}
      </p>
      <ul className="space-y-2">
        {outcomes.map((item) => (
          <li key={item.kind}>
            {item.href && item.complete ? (
              <Link
                href={item.href}
                className="flex items-start gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] px-3 py-2.5 transition-colors hover:border-emerald-500/40"
              >
                <OutcomeIcon complete={item.complete} />
                <OutcomeBody item={item} />
              </Link>
            ) : (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
                  item.complete
                    ? "border-emerald-500/25 bg-emerald-500/[0.05]"
                    : "border-border/50 bg-muted/10"
                )}
              >
                <OutcomeIcon complete={item.complete} />
                <OutcomeBody item={item} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {impact?.isTracking ? (
        <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 text-sm">
          <TrendingDown className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">{impact.trackingLabel}</p>
        </div>
      ) : null}
    </div>
  )
}

function OutcomeIcon({ complete }: { complete: boolean }) {
  if (complete) {
    return <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
  }
  return <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
}

function OutcomeBody({ item }: { item: InterruptionActionPlanView["outcomes"][number] }) {
  return (
    <div className="min-w-0">
      <p className={cn("text-sm font-medium", item.complete ? "text-foreground" : "text-muted-foreground")}>
        {item.label}
      </p>
      {item.detail ? <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p> : null}
    </div>
  )
}
