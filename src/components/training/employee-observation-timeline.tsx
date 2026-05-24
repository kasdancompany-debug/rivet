"use client"

import { useState } from "react"
import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react"

import { createManagerObservation } from "@/app/actions/manager-observations"
import { COPY } from "@/lib/interface-copy"
import type { ManagerObservationView } from "@/lib/training/build-views"
import type { ManagerObservationType } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const TYPE_META: Record<
  ManagerObservationType,
  { label: string; icon: typeof Sparkles; badgeClass: string }
> = {
  positive: {
    label: COPY.managerObservations.typePositive,
    icon: Sparkles,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200/95",
  },
  improvement: {
    label: COPY.managerObservations.typeImprovement,
    icon: TrendingUp,
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200/95",
  },
  critical: {
    label: COPY.managerObservations.typeCritical,
    icon: AlertTriangle,
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-200/95",
  },
}

function formatObservedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function EmployeeObservationTimeline({
  observations,
  businessId,
  employeeId,
  isOwner,
  pending,
  onAction,
}: {
  observations: ManagerObservationView[]
  businessId: string
  employeeId: string
  isOwner: boolean
  pending: boolean
  onAction: (fn: () => Promise<unknown>) => void
}) {
  const [observationType, setObservationType] = useState<ManagerObservationType>("positive")
  const [notes, setNotes] = useState("")

  return (
    <section className="space-y-4" aria-labelledby={`observations-${employeeId}`}>
      <div>
        <h3 id={`observations-${employeeId}`} className="text-sm font-semibold text-foreground">
          {COPY.managerObservations.timelineTitle}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{COPY.managerObservations.timelineLead}</p>
      </div>

      {isOwner ? (
        <form
          className="space-y-3 rounded-xl border border-border/50 bg-muted/15 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = notes.trim()
            if (trimmed.length < 3) return
            onAction(async () => {
              const res = await createManagerObservation({
                businessId,
                employeeId,
                observationType,
                notes: trimmed,
              })
              if (res.ok) setNotes("")
              return res
            })
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`obs-type-${employeeId}`}>{COPY.managerObservations.typeLabel}</Label>
              <select
                id={`obs-type-${employeeId}`}
                value={observationType}
                disabled={pending}
                onChange={(e) => setObservationType(e.target.value as ManagerObservationType)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="positive">{COPY.managerObservations.typePositive}</option>
                <option value="improvement">{COPY.managerObservations.typeImprovement}</option>
                <option value="critical">{COPY.managerObservations.typeCritical}</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`obs-notes-${employeeId}`}>{COPY.managerObservations.notesLabel}</Label>
            <textarea
              id={`obs-notes-${employeeId}`}
              value={notes}
              disabled={pending}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={COPY.managerObservations.notesPlaceholder}
              className="flex min-h-[5rem] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" size="sm" disabled={pending || notes.trim().length < 3}>
            {COPY.managerObservations.submit}
          </Button>
        </form>
      ) : null}

      {observations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
          {COPY.managerObservations.empty}
        </p>
      ) : (
        <ol className="relative space-y-0 border-l border-border/60 pl-4">
          {observations.map((obs) => {
            const meta = TYPE_META[obs.type]
            const Icon = meta.icon
            return (
              <li key={obs.id} className="relative pb-6 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[calc(0.5rem+1px)] top-1.5 size-2.5 rounded-full ring-2 ring-background",
                    obs.type === "positive"
                      ? "bg-emerald-500"
                      : obs.type === "improvement"
                        ? "bg-amber-400"
                        : "bg-red-500"
                  )}
                  aria-hidden
                />
                <div className="rounded-xl border border-border/50 bg-card/60 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className={cn("gap-1 font-normal", meta.badgeClass)}>
                      <Icon className="size-3" aria-hidden />
                      {meta.label}
                    </Badge>
                    <time className="text-[0.65rem] text-muted-foreground" dateTime={obs.observedAt}>
                      {formatObservedAt(obs.observedAt)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{obs.notes}</p>
                  <p className="mt-2 text-[0.65rem] text-muted-foreground">
                    {COPY.managerObservations.loggedBy(obs.observerName)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
