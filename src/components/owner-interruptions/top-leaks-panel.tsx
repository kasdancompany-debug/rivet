import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { OwnerInterruptionTopLeak } from "@/lib/owner-interruptions/types"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function formatOwnerTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours}h`
}

function TopLeakCard({ leak }: { leak: OwnerInterruptionTopLeak }) {
  return (
    <article className="rounded-xl border border-border/50 bg-muted/10 px-4 py-4 dark:bg-muted/5 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums",
              leak.rank === 1
                ? "border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100"
                : "border-border/60 bg-background/80 text-muted-foreground"
            )}
            aria-label={`Rank ${leak.rank}`}
          >
            {leak.rank}
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold leading-snug text-foreground">{leak.name}</h3>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/50 bg-background/70 px-3 py-2.5">
          <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.topLeakOccurrencesLabel}
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">×{leak.occurrences}</dd>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/70 px-3 py-2.5">
          <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.topLeakOwnerTimeLabel}
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {formatOwnerTime(leak.estimatedOwnerMinutes)}
          </dd>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/70 px-3 py-2.5 sm:col-span-1">
          <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.topLeakSuggestedFixLabel}
          </dt>
          <dd className="mt-1 text-sm font-medium leading-snug text-foreground">{leak.suggestedFix}</dd>
        </div>
      </dl>

      <Button className="mt-4 h-10" nativeButton={false} render={<Link href={leak.createHref} />}>
        {leak.fixType === "training_module"
          ? COPY.interruptions.fixSuggestionCreateModule
          : COPY.interruptions.fixSuggestionCreatePlay}
        <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
      </Button>
    </article>
  )
}

export function TopLeaksPanel({
  topLeaks,
  isEmpty,
}: {
  topLeaks: OwnerInterruptionTopLeak[]
  isEmpty: boolean
}) {
  return (
    <Card variant="quiet">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.interruptions.topLeaksTitle}</CardTitle>
        <CardDescription>{COPY.interruptions.topLeaksHint}</CardDescription>
      </CardHeader>
      <CardContent>
        {topLeaks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isEmpty ? COPY.interruptions.starterSectionHint : COPY.interruptions.emptyTopLeaks}
          </p>
        ) : (
          <div className="space-y-3">
            {topLeaks.map((leak) => (
              <TopLeakCard key={leak.key} leak={leak} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
