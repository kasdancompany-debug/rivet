"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ArrowRight, Sparkles, UserRound } from "lucide-react"

import { createIssueFix } from "@/app/actions/issue-fix-recommendations"
import type { IssueFixRecommendation } from "@/lib/issues/fix-recommendation/types"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"

export function IssueFixRecommendationPanel({
  businessId,
  issueId,
  recommendation,
}: {
  businessId: string
  issueId: string
  recommendation: IssueFixRecommendation
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!recommendation.isRepeated) return null

  function createFix() {
    setError(null)
    startTransition(async () => {
      const res = await createIssueFix({ businessId, issueId })
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(res.editHref)
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-6 sm:px-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-semibold text-foreground">{COPY.issues.fixRecommendationTitle}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{COPY.issues.fixRecommendationLead}</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {COPY.issues.fixRecommendationRootCause}
          </dt>
          <dd className="mt-1 leading-relaxed text-foreground">{recommendation.rootCause}</dd>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.issues.fixRecommendationSuggestedPlay}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {recommendation.suggestedPlay?.title ?? COPY.issues.fixRecommendationNone}
            </dd>
            {recommendation.relatedPlayTitle ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {COPY.issues.fixRecommendationRelatedExisting(recommendation.relatedPlayTitle)}
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.issues.fixRecommendationSuggestedTraining}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {recommendation.suggestedTraining?.title ?? COPY.issues.fixRecommendationNone}
            </dd>
            {recommendation.relatedTrainingTitle ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {COPY.issues.fixRecommendationRelatedExisting(recommendation.relatedTrainingTitle)}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <UserRound className="size-3.5" aria-hidden />
            {COPY.issues.fixRecommendationSuggestedOwner}
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {recommendation.suggestedOwner
              ? `${recommendation.suggestedOwner.name} · ${recommendation.suggestedOwner.role}`
              : COPY.issues.fixRecommendationNone}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {COPY.issues.fixRecommendationRepeatReduction}
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {COPY.issues.fixRecommendationRepeatReductionValue(recommendation.estimatedRepeatReductionPercent)}
          </dd>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {COPY.issues.fixRecommendationRepeatReductionHint(recommendation.repeatCount)}
          </p>
        </div>
      </dl>

      <Button className="h-11 w-full sm:w-auto" disabled={pending} onClick={createFix}>
        {pending ? COPY.issues.fixRecommendationCreating : COPY.issues.fixRecommendationCreateCta}
        <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
      </Button>
    </div>
  )
}
