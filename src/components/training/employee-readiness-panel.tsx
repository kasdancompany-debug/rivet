"use client"

import {
  READINESS_SIGNAL_LABELS,
  READINESS_SIGNAL_ORDER,
  DELEGATION_STATUS_LABELS,
  type ReadinessCapabilityField,
  type DelegationReadinessStatus,
} from "@/lib/training/compute-readiness"
import type { ComputedEmployeeReadiness } from "@/lib/training/build-views"
import { ReadinessCapabilityCard } from "@/components/training/readiness-capability-card"
import { ReadinessPctRing } from "@/components/training/readiness-pct-ring"
import { Label } from "@/components/ui/label"

export function EmployeeReadinessPanel({
  readiness,
  canManageTeam,
  pending,
  onOverride,
}: {
  readiness: ComputedEmployeeReadiness
  canManageTeam: boolean
  pending: boolean
  onOverride: (field: ReadinessCapabilityField, value: DelegationReadinessStatus | null) => void
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-border/50 bg-muted/10 px-4 py-4">
        <ReadinessPctRing score={readiness.overallScore} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Overall readiness
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Training, quizzes, proof uploads, sign-offs, observations, and certifications.
          </p>
        </div>
        <ul className="w-full grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2 lg:w-auto lg:min-w-[18rem]">
          {READINESS_SIGNAL_ORDER.map((key) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span>{READINESS_SIGNAL_LABELS[key]}</span>
              <span className="font-medium tabular-nums text-foreground">{readiness.signals[key]}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {readiness.capabilities.map((cap) => (
          <div key={cap.field} className="space-y-2">
            <ReadinessCapabilityCard capability={cap} />
            {canManageTeam ? (
              <div className="flex items-center gap-2 px-1">
                <Label htmlFor={`override-${cap.field}`} className="text-xs text-muted-foreground">
                  Manager override
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
                  className="h-8 min-w-[10rem] flex-1 rounded-lg border border-input bg-background px-2 text-xs"
                >
                  <option value="">Use calculated ({cap.score}% · {DELEGATION_STATUS_LABELS[cap.calculated]})</option>
                  <option value="ready">Floor ready</option>
                  <option value="needs_work">Needs work</option>
                </select>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
