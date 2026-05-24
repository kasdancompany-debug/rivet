import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { COPY } from "@/lib/interface-copy"
import type { RivetInterpretation } from "@/lib/onboarding/rivet-interpretation"
import { cn } from "@/lib/utils"

type InsightRow = {
  label: string
  body: string
  href?: string
}

function insightRows(interpretation: RivetInterpretation): InsightRow[] {
  return [
    { label: COPY.onboarding.interpretationCritical, body: interpretation.criticalDependency },
    { label: COPY.onboarding.interpretationHiddenRisk, body: interpretation.hiddenRisk },
    { label: COPY.onboarding.interpretationPredicted, body: interpretation.predictedOutcome },
    {
      label: COPY.onboarding.interpretationFirstAction,
      body: interpretation.suggestedFirstAction,
      href: interpretation.suggestedFirstActionHref,
    },
  ]
}

export function RivetInterpretationSection({ interpretation }: { interpretation: RivetInterpretation }) {
  return (
    <section className="space-y-5" aria-labelledby="rivet-interpretation-heading">
      <h2 id="rivet-interpretation-heading" className="text-lg font-semibold tracking-tight text-foreground">
        {COPY.onboarding.interpretationHeading}
      </h2>

      <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-card/70 shadow-sm">
        {insightRows(interpretation).map((row) => (
          <div key={row.label} className="space-y-2 px-5 py-5 sm:px-6">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {row.label}
            </p>
            <p className="text-sm leading-relaxed text-foreground">{row.body}</p>
            {row.href ? (
              <Link
                href={row.href}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 h-9")}
              >
                {COPY.onboarding.interpretationActionCta}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
