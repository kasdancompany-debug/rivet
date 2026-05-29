import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { InterruptionBecamePanel } from "@/components/owner-interruptions/interruption-became-panel"
import type { InterruptionSystemImprovement } from "@/lib/owner-interruptions/outcomes/build-system-improvements"
import { COPY } from "@/lib/interface-copy"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function InterruptionSystemImprovementsPanel({
  improvements,
}: {
  improvements: InterruptionSystemImprovement[]
}) {
  if (improvements.length === 0) return null

  return (
    <Card variant="quiet" className="border-primary/15">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            {COPY.interruptions.systemImprovementsTitle}
          </CardTitle>
        </div>
        <CardDescription>{COPY.interruptions.systemImprovementsLead}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {improvements.map((item) => (
          <article
            key={item.planId}
            className="rounded-xl border border-border/60 bg-card/80 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold leading-snug text-foreground">{item.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.completedCount > 0
                    ? COPY.interruptions.systemImprovementsProgress(
                        item.completedCount,
                        item.outcomes.length
                      )
                    : COPY.interruptions.systemImprovementsPending}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 capitalize">
                {item.status}
              </Badge>
            </div>

            <div className="mt-3">
              <InterruptionBecamePanel
                outcomes={item.outcomes}
                impact={
                  item.impactLabel
                    ? {
                        patternKey: "",
                        beforeCount: 0,
                        afterCount: 0,
                        dropPercent: null,
                        trackingLabel: item.impactLabel,
                        isTracking: true,
                      }
                    : null
                }
              />
            </div>

            <Link
              href="/interruptions/log"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {COPY.interruptions.systemImprovementsReview}
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </article>
        ))}
      </CardContent>
    </Card>
  )
}
