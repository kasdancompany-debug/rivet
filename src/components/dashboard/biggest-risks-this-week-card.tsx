import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import type { BiggestRiskThisWeekItem } from "@/lib/dashboard/biggest-risks-this-week"
import { COPY } from "@/lib/interface-copy"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function BiggestRisksThisWeekCard({ risks }: { risks: BiggestRiskThisWeekItem[] }) {
  return (
    <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/[0.04] to-transparent dark:from-rose-500/[0.07]">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/[0.08] text-rose-900 dark:text-rose-200">
            <AlertTriangle className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {COPY.dashboard.biggestRisksTitle}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{COPY.dashboard.biggestRisksSubtitle}</p>
          </div>
        </div>

        <ol className="space-y-2">
          {risks.map((risk) => (
            <li key={`${risk.rank}-${risk.label}`}>
              <Link
                href={risk.href}
                className={cn(
                  "group flex items-baseline gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors",
                  "hover:border-border/50 hover:bg-muted/30"
                )}
              >
                <span className="w-5 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                  {risk.rank}.
                </span>
                <span className="text-sm leading-snug text-foreground/90 group-hover:text-foreground">
                  {risk.label}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
