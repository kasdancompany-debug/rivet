"use client"

import { useState, useTransition } from "react"
import { ArrowRight } from "lucide-react"

import { createInterruptionActionPlan } from "@/app/actions/interruption-action-plans"
import { InterruptionActionPlanPanel } from "@/components/owner-interruptions/interruption-action-plan-panel"
import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StartInterruptionFixPlanButton({
  businessId,
  interruptionId,
  className,
}: {
  businessId: string
  interruptionId: string
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<InterruptionActionPlanView | null>(null)

  if (plan) {
    return (
      <div className="mt-4 space-y-3">
        <InterruptionActionPlanPanel plan={plan} onDismissed={() => setPlan(null)} />
      </div>
    )
  }

  return (
    <div className={cn("mt-4", className)}>
      {error ? (
        <p className="mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        className="h-10"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const res = await createInterruptionActionPlan({ businessId, interruptionId })
            if (!res.ok) {
              setError(res.message)
              return
            }
            setPlan(res.plan)
          })
        }}
      >
        {pending ? COPY.interruptions.actionPlanGenerating : COPY.interruptions.fixSuggestionStartFixPlan}
        <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
      </Button>
    </div>
  )
}
