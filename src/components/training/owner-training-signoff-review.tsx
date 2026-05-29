"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { StepProofCapture } from "@/components/completion-proof/step-proof-capture"
import { stepProofRequirementsFromRow } from "@/lib/completion-proof/requirements"
import type { PortalModuleView } from "@/lib/training/portal/types"

export function OwnerTrainingSignoffReview({
  view,
  businessId,
  employeeId,
  employeeName,
}: {
  view: PortalModuleView
  businessId: string
  employeeId: string
  employeeName: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeIndex, setActiveIndex] = useState(0)

  const itemsWithSignoff = view.items.filter((item) =>
    item.steps.some((s) => stepProofRequirementsFromRow(s).manager_signoff)
  )

  if (itemsWithSignoff.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No plays in this module require manager sign-off on individual steps.
      </p>
    )
  }

  const item = itemsWithSignoff[activeIndex] ?? itemsWithSignoff[0]
  const signoffSteps = item.steps.filter((s) => stepProofRequirementsFromRow(s).manager_signoff)

  function refresh() {
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review completion proof for <span className="font-medium text-foreground">{employeeName}</span>{" "}
        in <span className="font-medium text-foreground">{view.title}</span>. Sign off each step once
        checklist, photo, and video proof (when required) are in place.
      </p>

      {itemsWithSignoff.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {itemsWithSignoff.map((it, idx) => (
            <button
              key={it.trainingItemId}
              type="button"
              className={
                idx === activeIndex
                  ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
                  : "rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-muted/40"
              }
              onClick={() => setActiveIndex(idx)}
            >
              {it.title}
            </button>
          ))}
        </div>
      ) : null}

      <article className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
        <StepProofCapture
          moduleId={view.moduleId}
          trainingItemId={item.trainingItemId}
          standardId={item.standardId}
          businessId={businessId}
          steps={signoffSteps}
          checklistStepIds={item.progress.stepChecklist}
          stepProofByStepId={item.progress.stepProofByStepId}
          completed={false}
          managerSignoffEmployeeId={employeeId}
          signoffOnlyMode
          onRefresh={refresh}
        />
      </article>

    </div>
  )
}
