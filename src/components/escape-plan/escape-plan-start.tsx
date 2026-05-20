"use client"

import { Footprints } from "lucide-react"

import { EscapePlanGuidedIntake } from "@/components/escape-plan/escape-plan-guided-intake"

export function EscapePlanStart({ businessName }: { businessName: string }) {
  return (
    <div className="space-y-10">
      <div className="rounded-xl border border-border/60 bg-card px-6 py-9 shadow-[0_1px_0_rgba(15,23,42,0.05),0_12px_32px_-8px_rgba(15,23,42,0.06)] sm:px-10 sm:py-11">
        <div className="flex justify-end">
          <Footprints className="size-6 text-muted-foreground/35" aria-hidden />
        </div>
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {businessName}
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl sm:leading-tight">
          Escape Plan
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-[1.6] text-muted-foreground sm:text-base">
          A premium guided arc: six installation phases from standards through stepping back safely.
          You will answer a short intake, then receive milestones, tasks, staff assignments, standards
          to document, and risk warnings tailored to what you shared.
        </p>
      </div>

      <EscapePlanGuidedIntake businessName={businessName} />
    </div>
  )
}
