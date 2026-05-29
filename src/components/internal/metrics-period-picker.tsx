"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import type { MetricsDateRange } from "@/lib/internal-metrics/period"
import { rangeToQueryValue } from "@/lib/internal-metrics/period"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MetricsPeriodPicker({
  baseline,
  current,
}: {
  baseline: MetricsDateRange
  current: MetricsDateRange
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function apply(formData: FormData) {
    const bStart = String(formData.get("baselineStart") ?? "")
    const bEnd = String(formData.get("baselineEnd") ?? "")
    const cStart = String(formData.get("currentStart") ?? "")
    const cEnd = String(formData.get("currentEnd") ?? "")
    const params = new URLSearchParams()
    if (bStart && bEnd) params.set("baseline", `${bStart}_${bEnd}`)
    if (cStart && cEnd) params.set("current", `${cStart}_${cEnd}`)
    startTransition(() => {
      router.push(`/internal/metrics?${params.toString()}`)
    })
  }

  return (
    <form action={apply} className="rounded-xl border border-border/60 bg-card/50 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        Compare periods (UTC dates, inclusive)
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-foreground">Baseline (before)</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="baselineStart" className="text-xs">
                Start
              </Label>
              <Input
                id="baselineStart"
                name="baselineStart"
                type="date"
                defaultValue={baseline.start}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="baselineEnd" className="text-xs">
                End
              </Label>
              <Input
                id="baselineEnd"
                name="baselineEnd"
                type="date"
                defaultValue={baseline.end}
                className="mt-1"
              />
            </div>
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-foreground">Current (after)</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="currentStart" className="text-xs">
                Start
              </Label>
              <Input
                id="currentStart"
                name="currentStart"
                type="date"
                defaultValue={current.start}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currentEnd" className="text-xs">
                End
              </Label>
              <Input
                id="currentEnd"
                name="currentEnd"
                type="date"
                defaultValue={current.end}
                className="mt-1"
              />
            </div>
          </div>
        </fieldset>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Updating…" : "Update comparison"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => router.push("/internal/metrics")}
        >
          Reset to last 14 vs prior 14 days
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        URL: baseline={rangeToQueryValue(baseline)} · current={rangeToQueryValue(current)}
      </p>
    </form>
  )
}
