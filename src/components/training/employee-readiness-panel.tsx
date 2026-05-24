"use client"

import {
  READINESS_SIGNAL_LABELS,
  READINESS_SIGNAL_ORDER,
  DELEGATION_STATUS_LABELS,
  delegationStatusClass,
  type ReadinessCapabilityField,
  type DelegationReadinessStatus,
} from "@/lib/training/compute-readiness"
import type { ComputedEmployeeReadiness } from "@/lib/training/build-views"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function EmployeeReadinessPanel({
  readiness,
  isOwner,
  pending,
  onOverride,
}: {
  readiness: ComputedEmployeeReadiness
  isOwner: boolean
  pending: boolean
  onOverride: (field: ReadinessCapabilityField, value: DelegationReadinessStatus | null) => void
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Overall readiness score
          </p>
          <p className="text-3xl font-semibold tabular-nums text-foreground">{readiness.overallScore}%</p>
        </div>
        <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {READINESS_SIGNAL_ORDER.map((key) => (
            <li key={key} className="flex items-center justify-between gap-3 sm:min-w-[11rem]">
              <span>{READINESS_SIGNAL_LABELS[key]}</span>
              <span className="font-medium tabular-nums text-foreground">{readiness.signals[key]}%</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-3">
        {readiness.capabilities.map((cap) => (
          <li
            key={cap.field}
            className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/15 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">{cap.label}</p>
              <p className="text-xs text-muted-foreground">
                Calculated {cap.score}% · {DELEGATION_STATUS_LABELS[cap.calculated]}
                {cap.overridden ? " · Manager override active" : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("font-normal", delegationStatusClass(cap.effective))}>
                {DELEGATION_STATUS_LABELS[cap.effective]}
              </Badge>
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <Label htmlFor={`override-${cap.field}`} className="sr-only">
                    Override {cap.label}
                  </Label>
                  <select
                    id={`override-${cap.field}`}
                    disabled={pending}
                    value={cap.override ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value
                      onOverride(
                        cap.field,
                        raw === "" ? null : (raw as DelegationReadinessStatus)
                      )
                    }}
                    className="h-9 min-w-[10rem] rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Use calculated</option>
                    <option value="ready">Override: Ready</option>
                    <option value="needs_work">Override: Needs work</option>
                  </select>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
