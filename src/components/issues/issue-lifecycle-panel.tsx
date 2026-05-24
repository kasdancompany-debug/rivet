"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Check, Circle, Loader2 } from "lucide-react"

import { assignIssueLifecycleTraining } from "@/app/actions/issue-lifecycle"
import type { IssueLifecycleView } from "@/lib/issues/lifecycle/types"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function StepIcon({ status }: { status: IssueLifecycleView["steps"][number]["status"] }) {
  if (status === "complete") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <Check className="size-3.5" aria-hidden />
      </span>
    )
  }
  if (status === "current") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
        <span className="size-2 rounded-full bg-primary" aria-hidden />
      </span>
    )
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground">
      <Circle className="size-3" aria-hidden />
    </span>
  )
}

export function IssueLifecyclePanel({
  lifecycle,
  businessId,
  issueId,
  canAssignTraining,
  linkedModuleId,
  suggestedEmployeeId,
}: {
  lifecycle: IssueLifecycleView
  businessId: string
  issueId: string
  canAssignTraining: boolean
  linkedModuleId: string | null
  suggestedEmployeeId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const current = lifecycle.steps.find((s) => s.status === "current")

  function assignTraining() {
    if (!linkedModuleId || !suggestedEmployeeId) return
    startTransition(async () => {
      const res = await assignIssueLifecycleTraining({
        businessId,
        issueId,
        moduleId: linkedModuleId,
        employeeId: suggestedEmployeeId,
      })
      if (res.ok) router.refresh()
    })
  }

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-border/60 bg-card px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {COPY.issues.lifecycleTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.issues.lifecycleHint}</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-foreground">{lifecycle.progressPercent}%</p>
      </div>

      <ol className="mt-5 space-y-0">
        {lifecycle.steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < lifecycle.steps.length - 1 ? (
              <span
                className={cn(
                  "absolute left-[0.84rem] top-8 h-[calc(100%-1.25rem)] w-px",
                  step.status === "complete" ? "bg-emerald-500/35" : "bg-border/60"
                )}
                aria-hidden
              />
            ) : null}
            <StepIcon status={step.status} />
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </p>
              {step.detail ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
              ) : null}
              {step.completedAt && step.status === "complete" ? (
                <p className="mt-1 text-[0.65rem] tabular-nums text-muted-foreground">
                  {new Date(step.completedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {current?.id === "training_assigned" &&
      canAssignTraining &&
      linkedModuleId &&
      suggestedEmployeeId ? (
        <Button
          type="button"
          size="sm"
          className="mt-2"
          disabled={pending}
          onClick={assignTraining}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {COPY.issues.lifecycleAssigningTraining}
            </>
          ) : (
            COPY.issues.lifecycleAssignTrainingCta
          )}
        </Button>
      ) : null}
    </section>
  )
}
