import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { COPY } from "@/lib/interface-copy"
import type { DependencyBreakdown } from "@/lib/onboarding/dependency-breakdown"
import { cn } from "@/lib/utils"

export function DependencyBreakdownSection({ breakdown }: { breakdown: DependencyBreakdown }) {
  const { categories, highestLeverage } = breakdown
  const maxContribution = Math.max(...categories.map((c) => c.contributionPoints), 1)

  return (
    <section className="space-y-6" aria-labelledby="dependency-breakdown-heading">
      <div className="space-y-1">
        <h2 id="dependency-breakdown-heading" className="text-lg font-semibold tracking-tight text-foreground">
          {COPY.onboarding.breakdownHeading}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{COPY.onboarding.breakdownSubheading}</p>
      </div>

      <ul className="space-y-4">
        {categories.map((cat) => {
          const barWidth = Math.max(4, Math.round((cat.contributionPoints / maxContribution) * 100))
          return (
            <li key={cat.id} className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{cat.contributionPoints}</span>
                  <span className="text-muted-foreground"> pts</span>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="text-xs">{cat.weightPercent}% weight</span>
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/80">
                <div
                  className="h-full rounded-full bg-foreground/55 transition-all"
                  style={{ width: `${barWidth}%` }}
                  aria-hidden
                />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-5 sm:px-6">
        <p className="text-sm font-medium text-foreground">{COPY.onboarding.leverageLabel}</p>
        <p className="mt-1.5 text-base font-semibold leading-snug text-foreground">{highestLeverage.label}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {COPY.onboarding.leverageImprovementPrefix}{" "}
          <span className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-300/95">
            +{highestLeverage.estimatedPointReduction} points
          </span>
        </p>
        <Link
          href={highestLeverage.href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 h-9")}
        >
          {COPY.onboarding.leverageCta}
        </Link>
      </div>
    </section>
  )
}
