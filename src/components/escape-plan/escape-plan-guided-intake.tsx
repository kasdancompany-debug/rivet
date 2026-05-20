"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { ArrowLeft, ArrowRight, Footprints, Sparkles } from "lucide-react"

import { createOwnerEscapePlan } from "@/app/actions/escape-plan"
import {
  CHAOS_CHIPS,
  HOURS_OPTIONS,
  QUALITY_CHIPS,
  RESPONSIBILITY_CHIPS,
  STAFFING_CHIPS,
  STRESS_CHIPS,
  TEAM_SIZE_OPTIONS,
  type EscapePlanIntake,
  defaultEscapePlanIntake,
} from "@/lib/escape-plan/guided-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function utcTodayYmd(): string {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

function ChipGrid({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors sm:text-sm",
                on
                  ? "border-foreground/30 bg-foreground/[0.08] text-foreground"
                  : "border-border/70 bg-muted/30 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const STEPS = ["Load & team", "Responsibilities", "Pressure points", "Review & install"] as const

export function EscapePlanGuidedIntake({ businessName }: { businessName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [startedOn, setStartedOn] = useState(utcTodayYmd())
  const [intake, setIntake] = useState<EscapePlanIntake>(defaultEscapePlanIntake())

  const summary = useMemo(() => {
    const h = HOURS_OPTIONS.find((o) => o.value === intake.hoursBand)?.label
    const t = TEAM_SIZE_OPTIONS.find((o) => o.value === intake.teamSizeBand)?.label
    return { h, t }
  }, [intake.hoursBand, intake.teamSizeBand])

  function install() {
    setError(null)
    startTransition(async () => {
      const res = await createOwnerEscapePlan({ startedOn, intake })
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 px-6 py-10 shadow-[0_1px_0_rgba(15,23,42,0.05),0_24px_60px_-24px_rgba(15,23,42,0.14)] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute right-6 top-6 opacity-[0.07] sm:right-10 sm:top-10">
          <Sparkles className="size-24 text-foreground" aria-hidden />
        </div>
        <div className="flex justify-end sm:absolute sm:right-8 sm:top-8">
          <Footprints className="size-6 text-muted-foreground/40" aria-hidden />
        </div>
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {businessName}
        </p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl sm:leading-tight">
          Owner Escape Plan — guided installation
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Answer once with honesty. Rivet will generate a six-phase transition roadmap: milestones,
          operational tasks, staff assignments, standards to document, and explicit risk warnings—like
          installing management infrastructure, not downloading another app.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <Badge
              key={s}
              variant="outline"
              className={cn(
                "font-medium",
                i === step ? "border-foreground/25 bg-foreground/[0.06]" : "text-muted-foreground"
              )}
            >
              {i + 1}. {s}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="max-w-3xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-6">
          <CardTitle className="text-lg">{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0
              ? "Ground the roadmap in how many hours you actually carry and how many people share the floor."
              : step === 1
                ? "Select everything that still lives on your calendar or judgment—this shapes what we tell you to document first."
                : step === 2
                  ? "Name the friction. Specific beats polite here."
                  : "Confirm start date and generate your phased roadmap."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {step === 0 ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Hours you work on the business (typical week)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {HOURS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setIntake((prev) => ({ ...prev, hoursBand: o.value }))}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                        intake.hoursBand === o.value
                          ? "border-foreground/25 bg-foreground/[0.06] text-foreground"
                          : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Team size (people touching operations)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TEAM_SIZE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setIntake((prev) => ({ ...prev, teamSizeBand: o.value }))}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                        intake.teamSizeBand === o.value
                          ? "border-foreground/25 bg-foreground/[0.06] text-foreground"
                          : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <ChipGrid
              label="What still routes through you (select all that apply)"
              options={RESPONSIBILITY_CHIPS}
              selected={intake.responsibilities}
              onToggle={(v) => setIntake((prev) => ({ ...prev, responsibilities: toggleInList(prev.responsibilities, v) }))}
            />
          ) : null}

          {step === 2 ? (
            <div className="space-y-8">
              <ChipGrid
                label="Stress points"
                options={STRESS_CHIPS}
                selected={intake.stressPoints}
                onToggle={(v) => setIntake((prev) => ({ ...prev, stressPoints: toggleInList(prev.stressPoints, v) }))}
              />
              <ChipGrid
                label="Operational chaos"
                options={CHAOS_CHIPS}
                selected={intake.operationalChaos}
                onToggle={(v) =>
                  setIntake((prev) => ({ ...prev, operationalChaos: toggleInList(prev.operationalChaos, v) }))
                }
              />
              <ChipGrid
                label="Staffing weaknesses"
                options={STAFFING_CHIPS}
                selected={intake.staffingWeaknesses}
                onToggle={(v) =>
                  setIntake((prev) => ({ ...prev, staffingWeaknesses: toggleInList(prev.staffingWeaknesses, v) }))
                }
              />
              <ChipGrid
                label="Quality concerns"
                options={QUALITY_CHIPS}
                selected={intake.qualityConcerns}
                onToggle={(v) =>
                  setIntake((prev) => ({ ...prev, qualityConcerns: toggleInList(prev.qualityConcerns, v) }))
                }
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-border/60 bg-muted/15 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Summary</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>{summary.h}</li>
                  <li>{summary.t}</li>
                  <li>{intake.responsibilities.length} responsibility flags</li>
                  <li>
                    {intake.stressPoints.length + intake.operationalChaos.length + intake.staffingWeaknesses.length + intake.qualityConcerns.length}{" "}
                    pressure-point tags
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-note">Anything else we should weight? (optional)</Label>
                <Textarea
                  id="owner-note"
                  rows={3}
                  value={intake.ownerNote}
                  onChange={(e) => setIntake((prev) => ({ ...prev, ownerNote: e.target.value }))}
                  placeholder="e.g. New location opening in 8 weeks; partner conflict on standards; one key lead going on leave…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roadmap-start">Roadmap start date (UTC)</Label>
                <Input
                  id="roadmap-start"
                  type="date"
                  value={startedOn}
                  onChange={(e) => setStartedOn(e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              disabled={step === 0 || pending}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" size="sm" className="gap-1" onClick={() => setStep((s) => s + 1)}>
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button type="button" disabled={pending} onClick={install} className="gap-2">
                {pending ? "Installing…" : "Generate phased roadmap"}
                <Sparkles className="size-4 opacity-80" aria-hidden />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
