"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Clock, DollarSign } from "lucide-react"

import { updateOwnerHourlyValue } from "@/app/actions/business-settings"
import { COPY } from "@/lib/interface-copy"
import {
  formatCadCurrency,
  type OwnerValueMetrics,
} from "@/lib/owner-interruptions/value-metrics/compute-value-metrics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function OwnerValueMetricsPanel({
  businessId,
  metrics,
  isOwner,
}: {
  businessId: string
  metrics: OwnerValueMetrics
  isOwner: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [hourlyInput, setHourlyInput] = useState(
    metrics.ownerHourlyValueCad != null ? String(metrics.ownerHourlyValueCad) : ""
  )
  const [banner, setBanner] = useState<string | null>(null)

  function saveHourlyValue() {
    setBanner(null)
    const trimmed = hourlyInput.trim()
    const parsed = trimmed === "" ? null : Number(trimmed)
    if (trimmed !== "" && (!Number.isFinite(parsed) || parsed! < 0)) {
      setBanner(COPY.interruptions.valueMetricsHourlyInvalid)
      return
    }

    startTransition(async () => {
      const res = await updateOwnerHourlyValue({
        businessId,
        hourlyValueCad: parsed,
      })
      if (!res.ok) {
        setBanner(res.message)
        return
      }
      router.refresh()
    })
  }

  const valueHint =
    metrics.source === "actual_improvement"
      ? COPY.interruptions.valueMetricsSourceActual
      : metrics.source === "projected_fixes"
        ? COPY.interruptions.valueMetricsSourceProjected
        : COPY.interruptions.valueMetricsSourceNone

  return (
    <Card variant="quiet" className="border-emerald-500/15 bg-emerald-500/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold tracking-tight">
          {COPY.interruptions.valueMetricsTitle}
        </CardTitle>
        <CardDescription>{COPY.interruptions.valueMetricsLead}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-background/80 px-4 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4" aria-hidden />
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">
                {COPY.interruptions.valueMetricsHoursLabel}
              </p>
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {metrics.hoursReturnedThisWeek}h
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{valueHint}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/80 px-4 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="size-4" aria-hidden />
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">
                {COPY.interruptions.valueMetricsBusinessLabel}
              </p>
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {metrics.estimatedBusinessValueCad != null
                ? formatCadCurrency(metrics.estimatedBusinessValueCad)
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.estimatedBusinessValueCad != null
                ? COPY.interruptions.valueMetricsBusinessHint
                : COPY.interruptions.valueMetricsBusinessEmpty}
            </p>
          </div>
        </div>

        {isOwner ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/15 p-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="owner-hourly-value">{COPY.interruptions.valueMetricsHourlyLabel}</Label>
              <Input
                id="owner-hourly-value"
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                disabled={pending}
                value={hourlyInput}
                onChange={(e) => setHourlyInput(e.target.value)}
                placeholder={COPY.interruptions.valueMetricsHourlyPlaceholder}
              />
            </div>
            <Button type="button" size="sm" className="h-10 shrink-0" disabled={pending} onClick={saveHourlyValue}>
              {pending ? COPY.interruptions.valueMetricsSaving : COPY.interruptions.valueMetricsSaveHourly}
            </Button>
          </div>
        ) : null}

        {banner ? <p className="text-sm text-destructive">{banner}</p> : null}
      </CardContent>
    </Card>
  )
}
