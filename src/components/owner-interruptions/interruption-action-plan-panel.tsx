"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ArrowRight, Sparkles, Users } from "lucide-react"

import {
  approveInterruptionActionPlan,
  dismissInterruptionActionPlan,
  publishInterruptionActionPlan,
} from "@/app/actions/interruption-action-plans"
import { InterruptionBecamePanel } from "@/components/owner-interruptions/interruption-became-panel"
import { InterruptionRecommendationsPanel } from "@/components/owner-interruptions/interruption-recommendations-panel"
import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import { COPY } from "@/lib/interface-copy"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function statusLabel(status: InterruptionActionPlanView["status"]): string {
  switch (status) {
    case "draft":
      return COPY.interruptions.actionPlanStatusDraft
    case "approved":
      return COPY.interruptions.actionPlanStatusApproved
    case "published":
      return COPY.interruptions.actionPlanStatusPublished
    case "dismissed":
      return COPY.interruptions.actionPlanStatusDismissed
    default:
      return status
  }
}

export function InterruptionActionPlanPanel({
  plan,
  onDismissed,
}: {
  plan: InterruptionActionPlanView
  onDismissed?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [current, setCurrent] = useState(plan)
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (!res.ok) {
        setError(res.message ?? "Something went wrong.")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold text-foreground">{COPY.interruptions.actionPlanTitle}</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{COPY.interruptions.actionPlanLead}</p>
        </div>
        <Badge variant="outline">{statusLabel(current.status)}</Badge>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.fixSuggestionRootCause}
          </dt>
          <dd className="mt-1 leading-relaxed text-foreground">{current.rootCause}</dd>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.interruptions.actionPlanRelatedSop}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {current.relatedStandard?.title ?? COPY.interruptions.actionPlanNoneFound}
            </dd>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.interruptions.actionPlanRelatedModule}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {current.relatedModule?.title ?? COPY.interruptions.actionPlanNoneFound}
            </dd>
          </div>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Users className="size-3.5" aria-hidden />
            {COPY.interruptions.actionPlanPeopleAffected}
          </dt>
          <dd className="mt-2">
            {current.affectedPeople.length === 0 ? (
              <p className="text-muted-foreground">{COPY.interruptions.actionPlanNoPeople}</p>
            ) : (
              <ul className="space-y-1.5">
                {current.affectedPeople.map((p) => (
                  <li
                    key={p.profileId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2"
                  >
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.role} · {p.reason}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {COPY.interruptions.actionPlanDraftFix}
          </dt>
          <dd className="mt-1 space-y-1">
            <p className="font-medium text-foreground">{current.suggestedTitle}</p>
            {current.suggestedDescription ? (
              <p className="text-muted-foreground">{current.suggestedDescription}</p>
            ) : null}
          </dd>
        </div>
      </dl>

      <InterruptionRecommendationsPanel plan={current} />

      <InterruptionBecamePanel outcomes={current.outcomes} impact={current.impact} />

      <div className="flex flex-wrap gap-2">
        {current.draftEditHref ? (
          <Button className="h-10" nativeButton={false} render={<Link href={current.draftEditHref} />}>
            {COPY.interruptions.actionPlanEditDraft}
            <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
          </Button>
        ) : null}

        {current.canApprove ? (
          <Button
            className="h-10"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await approveInterruptionActionPlan(current.id)
                if (res.ok) setCurrent(res.plan)
                return res
              })
            }
          >
            {COPY.interruptions.actionPlanApprove}
          </Button>
        ) : null}

        {current.canPublish ? (
          <Button
            className="h-10"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await publishInterruptionActionPlan(current.id)
                if (res.ok) {
                  setCurrent(res.plan)
                  if (res.editHref) router.push(res.editHref)
                }
                return res
              })
            }
          >
            {COPY.interruptions.actionPlanPublish}
          </Button>
        ) : null}

        {current.canDismiss ? (
          <Button
            variant="outline"
            className="h-10"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await dismissInterruptionActionPlan(current.id)
                if (res.ok) onDismissed?.()
                return res
              })
            }
          >
            {COPY.interruptions.actionPlanDismiss}
          </Button>
        ) : null}
      </div>

      {!current.isOwner ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{COPY.interruptions.actionPlanOwnerOnlyHint}</p>
      ) : null}
    </div>
  )
}
