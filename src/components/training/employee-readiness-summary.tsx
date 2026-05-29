import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { ComputedEmployeeReadiness } from "@/lib/training/build-views"
import { READINESS_SIGNAL_LABELS, READINESS_SIGNAL_ORDER } from "@/lib/training/compute-readiness"
import { ReadinessCapabilityCard } from "@/components/training/readiness-capability-card"
import { ReadinessPctRing } from "@/components/training/readiness-pct-ring"
import { cn } from "@/lib/utils"

export function EmployeeReadinessSummary({
  readiness,
  detailHref,
  showSignals = false,
  className,
}: {
  readiness: ComputedEmployeeReadiness
  detailHref?: string
  showSignals?: boolean
  className?: string
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/80 px-4 py-4 shadow-sm">
        <ReadinessPctRing score={readiness.overallScore} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Overall readiness
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Based on training completion, quiz scores, proof uploads, manager sign-offs, observations, and
            certifications.
          </p>
          {detailHref ? (
            <Link
              href={detailHref}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              View breakdown
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {readiness.capabilities.map((cap) => (
          <ReadinessCapabilityCard key={cap.field} capability={cap} compact />
        ))}
      </div>

      {showSignals ? (
        <div className="rounded-2xl border border-border/50 bg-muted/10 px-4 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Contributing factors
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {READINESS_SIGNAL_ORDER.map((key) => (
              <li key={key} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{READINESS_SIGNAL_LABELS[key]}</span>
                <span className="font-medium tabular-nums text-foreground">{readiness.signals[key]}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
