import Link from "next/link"
import { ArrowRight, Sparkles, TrendingDown } from "lucide-react"

import { StartInterruptionFixPlanButton } from "@/components/owner-interruptions/start-interruption-fix-plan-button"
import type { InterruptionFixSuggestion } from "@/lib/owner-interruptions/fix-suggestions/types"
import { COPY } from "@/lib/interface-copy"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function FixSuggestionCard({
  suggestion,
  businessId,
}: {
  suggestion: InterruptionFixSuggestion
  businessId: string
}) {
  const hoursRecovered = Math.round((suggestion.estimatedOwnerMinutesRecovered / 60) * 10) / 10

  return (
    <article className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-primary">
            {COPY.interruptions.fixSuggestionBadge}
          </p>
          <h3 className="text-base font-semibold leading-snug text-foreground">{suggestion.problemTitle}</h3>
        </div>
        <Badge variant="outline" className="shrink-0 font-normal">
          ×{suggestion.repeatCount}
        </Badge>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.fixSuggestionRootCause}
          </dt>
          <dd className="mt-1 leading-relaxed text-foreground">{suggestion.rootCause}</dd>
        </div>
      </dl>

      {suggestion.actions.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.fixSuggestionOperationalActions}
          </p>
          <ul className="mt-2 space-y-2">
            {suggestion.actions.map((action) => (
              <li key={action.kind}>
                <Link
                  href={action.href}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/80 px-3 py-2.5",
                    "transition-colors hover:border-primary/30 hover:bg-background"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{action.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{action.detail}</span>
                  </span>
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {suggestion.askMatchCount > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {COPY.interruptions.fixSuggestionAskOverlap(suggestion.askMatchCount)}
        </p>
      ) : null}

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        <li className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.fixSuggestionInterruptionsLabel}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            ~{suggestion.estimatedInterruptionsPrevented}
          </p>
        </li>
        <li className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.fixSuggestionTimeLabel}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            ~{hoursRecovered}h
          </p>
        </li>
      </ul>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        {COPY.interruptions.fixSuggestionImpactTracking}
      </p>

      {suggestion.sampleInterruptionId ? (
        <StartInterruptionFixPlanButton
          businessId={businessId}
          interruptionId={suggestion.sampleInterruptionId}
        />
      ) : (
        <Button
          className={cn("mt-4 h-10")}
          nativeButton={false}
          render={<Link href={suggestion.createHref} />}
        >
          {suggestion.actions[0]?.label ?? COPY.interruptions.fixSuggestionCreatePlay}
          <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
        </Button>
      )}
    </article>
  )
}

export function InterruptionFixSuggestionsPanel({
  suggestions,
  businessId,
}: {
  suggestions: InterruptionFixSuggestion[]
  businessId: string
}) {
  if (suggestions.length === 0) return null

  return (
    <Card variant="quiet" className="border-primary/15">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            {COPY.interruptions.fixSuggestionsTitle}
          </CardTitle>
        </div>
        <CardDescription>{COPY.interruptions.fixSuggestionsLead}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((s) => (
          <FixSuggestionCard key={s.patternKey} suggestion={s} businessId={businessId} />
        ))}
      </CardContent>
    </Card>
  )
}
