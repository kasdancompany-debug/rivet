"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useTransition } from "react"

import { logOwnerInterruption } from "@/app/actions/owner-interruptions"
import { createInterruptionActionPlan } from "@/app/actions/interruption-action-plans"
import { InterruptionActionPlanPanel } from "@/components/owner-interruptions/interruption-action-plan-panel"
import { InterruptionSeverityBadge } from "@/components/owner-interruptions/interruption-severity-badge"
import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import { OWNER_INTERRUPTION_KINDS, labelForOwnerInterruptionKind } from "@/lib/owner-interruptions/kinds"
import { computeInterruptionSeverity } from "@/lib/owner-interruptions/severity/compute-severity"
import {
  OWNER_INTERRUPTION_URGENCIES,
  hintForOwnerInterruptionUrgency,
  labelForOwnerInterruptionUrgency,
} from "@/lib/owner-interruptions/urgencies"
import {
  OWNER_INTERRUPTION_SOURCES,
  labelForOwnerInterruptionSource,
} from "@/lib/owner-interruptions/sources"
import type { OwnerInterruptionKind, OwnerInterruptionSource, OwnerInterruptionUrgency } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

const MINUTE_PRESETS = [5, 15, 30, 45, 60, 90, 120] as const

export function OwnerInterruptionLogForm({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [actionPlan, setActionPlan] = useState<InterruptionActionPlanView | null>(null)
  const [planPending, setPlanPending] = useState(false)
  const [kind, setKind] = useState<OwnerInterruptionKind>("approval_request")
  const [urgency, setUrgency] = useState<OwnerInterruptionUrgency>("today")
  const [source, setSource] = useState<OwnerInterruptionSource>("text_message")
  const [summary, setSummary] = useState("")
  const [detail, setDetail] = useState("")
  const [minutes, setMinutes] = useState<number>(15)

  const severityPreview = computeInterruptionSeverity({
    estimatedMinutes: minutes,
    urgency,
    frequencyCount: 1,
  })

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await logOwnerInterruption({
        businessId,
        kind,
        urgency,
        source,
        summary,
        detail: detail.trim() || null,
        estimatedMinutes: minutes,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setDone(true)
      setPlanPending(true)
      setActionPlan(null)
      const planRes = await createInterruptionActionPlan({
        businessId,
        interruptionId: res.id,
      })
      setPlanPending(false)
      if (planRes.ok) setActionPlan(planRes.plan)
      router.refresh()
    })
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <div className="rounded-xl border border-emerald-600/25 bg-emerald-500/[0.06] px-4 py-6 dark:bg-emerald-950/20 sm:px-6">
          <p className="text-sm font-medium text-foreground">{COPY.interruptions.logSaved}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDone(false)
                setActionPlan(null)
              }}
              className="h-10"
            >
              {COPY.interruptions.logCta}
            </Button>
            <Button size="sm" className="h-10" nativeButton={false} render={<Link href="/interruptions" />}>
              {COPY.interruptions.dashboardCta}
            </Button>
          </div>
        </div>

        {planPending ? (
          <p className="text-sm text-muted-foreground">{COPY.interruptions.actionPlanGenerating}</p>
        ) : null}

        {actionPlan ? (
          <InterruptionActionPlanPanel plan={actionPlan} onDismissed={() => setActionPlan(null)} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {OWNER_INTERRUPTION_KINDS.map((k) => {
          const active = kind === k
          return (
            <button
              key={k}
              type="button"
              disabled={pending}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors sm:py-3.5",
                active
                  ? "border-rose-500/50 bg-rose-500/[0.08] text-foreground shadow-sm dark:border-rose-400/35 dark:bg-rose-950/30"
                  : "border-border/70 bg-card/80 text-muted-foreground hover:border-foreground/20 hover:bg-muted/30"
              )}
            >
              {labelForOwnerInterruptionKind(k)}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="oi-summary">{COPY.interruptions.summaryLabel}</Label>
        <Input
          id="oi-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={COPY.interruptions.summaryPlaceholder}
          maxLength={280}
          disabled={pending}
          className="text-base sm:text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label>{COPY.interruptions.minutesLabel}</Label>
        <div className="flex flex-wrap gap-2">
          {MINUTE_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={pending}
              onClick={() => setMinutes(m)}
              className={cn(
                "min-h-11 min-w-[3.25rem] rounded-lg border px-3 text-sm font-semibold tabular-nums transition-colors",
                minutes === m
                  ? "border-foreground/30 bg-foreground/10 text-foreground"
                  : "border-border/70 bg-background text-muted-foreground hover:bg-muted/40"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{COPY.interruptions.urgencyLabel}</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {OWNER_INTERRUPTION_URGENCIES.map((u) => {
            const active = urgency === u
            return (
              <button
                key={u}
                type="button"
                disabled={pending}
                onClick={() => setUrgency(u)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-foreground/25 bg-foreground/[0.06] text-foreground shadow-sm"
                    : "border-border/70 bg-card/80 text-muted-foreground hover:border-foreground/20 hover:bg-muted/30"
                )}
              >
                <span className="block text-sm font-medium">{labelForOwnerInterruptionUrgency(u)}</span>
                <span className="mt-0.5 block text-xs leading-snug opacity-80">{hintForOwnerInterruptionUrgency(u)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{COPY.interruptions.sourceLabel}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OWNER_INTERRUPTION_SOURCES.map((s) => {
            const active = source === s
            return (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => setSource(s)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "border-foreground/25 bg-foreground/[0.06] text-foreground shadow-sm"
                    : "border-border/70 bg-card/80 text-muted-foreground hover:border-foreground/20 hover:bg-muted/30"
                )}
              >
                {labelForOwnerInterruptionSource(s)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/15 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {COPY.interruptions.severityPreviewLabel}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">{COPY.interruptions.severityPreviewHint}</p>
          </div>
          <InterruptionSeverityBadge severity={severityPreview.severity} showDot />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oi-detail">{COPY.interruptions.detailLabel}</Label>
        <Textarea
          id="oi-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={COPY.interruptions.detailPlaceholder}
          rows={3}
          disabled={pending}
        />
      </div>

      <Button className="h-12 w-full text-base sm:h-11 sm:text-sm" onClick={submit} disabled={pending || !summary.trim()}>
        {pending ? COPY.interruptions.submitting : COPY.interruptions.submit}
      </Button>
    </div>
  )
}
