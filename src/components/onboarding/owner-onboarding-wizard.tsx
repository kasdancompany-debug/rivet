"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"

import { persistFounderDependencyScan } from "@/app/actions/founder-dependency-scan"
import { COPY } from "@/lib/interface-copy"
import { buildOnboardingAssessmentJson } from "@/lib/onboarding/build-onboarding-assessment"
import type { DependencyBand, OperationalDependencyReport } from "@/lib/onboarding/generate-dependency-report"
import { computeDependencyIndex, generateOperationalDependencyReport } from "@/lib/onboarding/generate-dependency-report"
import {
  defaultOwnerOnboardingAnswers,
  ONBOARDING_STORAGE_KEY,
  type OwnerOnboardingAnswers,
  type OwnerOnboardingStored,
} from "@/lib/onboarding/owner-intake"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Step =
  | "intro"
  | "days"
  | "open"
  | "close"
  | "interrupts"
  | "breaks"
  | "timeoff"
  | "standards"
  | "quality"
  | "report"

const STEP_ORDER: Step[] = [
  "intro",
  "days",
  "open",
  "close",
  "interrupts",
  "breaks",
  "timeoff",
  "standards",
  "quality",
  "report",
]

function loadStored(): OwnerOnboardingStored | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as OwnerOnboardingStored
    if (p?.version !== 2 || !p.answers) return null
    return p
  } catch {
    return null
  }
}

function saveStored(data: OwnerOnboardingStored) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function bandStyles(band: DependencyBand) {
  switch (band) {
    case "critical":
      return {
        badge: "border-rose-500/35 bg-rose-500/[0.08] text-rose-950 dark:text-rose-200/95",
        bar: "bg-rose-600/85 dark:bg-rose-500/70",
        ring: "ring-rose-500/20",
      }
    case "strained":
      return {
        badge: "border-amber-500/35 bg-amber-500/[0.09] text-amber-950 dark:text-amber-200/95",
        bar: "bg-amber-600/80 dark:bg-amber-500/60",
        ring: "ring-amber-500/20",
      }
    default:
      return {
        badge: "border-sky-500/30 bg-sky-500/[0.07] text-sky-950 dark:text-sky-200/95",
        bar: "bg-sky-600/75 dark:bg-sky-500/55",
        ring: "ring-sky-500/15",
      }
  }
}

function ChoiceGrid<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | null
  onChange: (v: T) => void
  options: { value: T; label: string; hint?: string }[]
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col items-start rounded-xl border px-4 py-4 text-left text-sm transition-all",
              on
                ? "border-foreground/25 bg-foreground/[0.06] shadow-sm ring-2 ring-ring ring-offset-2 ring-offset-background"
                : "border-border/70 bg-card hover:border-foreground/15 hover:bg-muted/30"
            )}
          >
            <span className="font-semibold text-foreground">{o.label}</span>
            {o.hint ? <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.hint}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export function OwnerOnboardingWizard() {
  const router = useRouter()
  const init = useMemo(() => {
    const s = loadStored()
    const answers = s?.answers ?? defaultOwnerOnboardingAnswers()
    const startStep: Step =
      s?.completedAt ? "report" : "intro"
    return { answers, startStep, hadCompleted: Boolean(s?.completedAt) }
  }, [])

  const [step, setStep] = useState<Step>(init.startStep)
  const [answers, setAnswers] = useState<OwnerOnboardingAnswers>(init.answers)
  const [report, setReport] = useState<OperationalDependencyReport | null>(() =>
    init.startStep === "report" ? generateOperationalDependencyReport(init.answers) : null
  )
  const [persist, setPersist] = useState<"idle" | "saving" | "saved" | "skipped" | "error">("idle")
  const [hadLocalReport] = useState(init.hadCompleted)

  useEffect(() => {
    if (persist === "skipped") {
      router.replace("/setup")
    }
  }, [persist, router])

  const idx = STEP_ORDER.indexOf(step)
  const questionCount = STEP_ORDER.length - 2
  const questionIdx = Math.max(0, idx - 1)

  const update = useCallback(<K extends keyof OwnerOnboardingAnswers>(key: K, v: OwnerOnboardingAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: v }))
  }, [])

  const persistReport = useCallback(
    (next: OwnerOnboardingAnswers, rep: OperationalDependencyReport) => {
      setPersist("saving")
      const payload = buildOnboardingAssessmentJson(next, rep)
      void persistFounderDependencyScan({
        dependencyPercent: rep.dependencyIndex,
        assessmentJson: payload,
      }).then((res) => {
        if (res.ok) setPersist("saved")
        else if (res.reason === "no_business") setPersist("skipped")
        else setPersist("error")
      })
    },
    []
  )

  function next() {
    const i = STEP_ORDER.indexOf(step)
    if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1]!)
  }

  function back() {
    const i = STEP_ORDER.indexOf(step)
    if (i > 0) setStep(STEP_ORDER[i - 1]!)
  }

  function validateCurrent(): boolean {
    switch (step) {
      case "days":
        return answers.daysPerWeek !== null
      case "open":
        return answers.openWithoutYou !== null
      case "close":
        return answers.closeWithoutYou !== null
      case "interrupts":
        return answers.staffInterrupts !== null
      case "timeoff":
        return answers.avoidedTimeOff !== null
      case "standards":
        return answers.standardsMode !== null
      case "quality":
        return answers.qualityOnOnePerson !== null
      default:
        return true
    }
  }

  function goNext() {
    if (!validateCurrent()) return
    if (step === "quality") {
      const rep = generateOperationalDependencyReport(answers)
      setReport(rep)
      setStep("report")
      const completedAt = new Date().toISOString()
      saveStored({ version: 2, answers, completedAt })
      persistReport(answers, rep)
      return
    }
    next()
  }

  function restart() {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setAnswers(defaultOwnerOnboardingAnswers())
    setReport(null)
    setStep("intro")
    setPersist("idle")
  }

  const dependencyPreview = useMemo(() => computeDependencyIndex(answers), [answers])
  const styles = report ? bandStyles(report.band) : bandStyles("contained")

  return (
    <div className="mx-auto max-w-2xl pb-28">
      {step !== "intro" && step !== "report" ? (
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {COPY.onboarding.questionProgress(questionIdx, questionCount)}
          </p>
          <div className="h-1.5 flex-1 max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/40 transition-[width] duration-300"
              style={{ width: `${(questionIdx / questionCount) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {step === "intro" ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {COPY.onboarding.introEyebrow}
            </p>
            <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
              {COPY.ownerWizard.intro.title}
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground">{COPY.ownerWizard.intro.lead}</p>
            <p className="text-sm font-medium text-foreground/90">{COPY.ownerWizard.intro.speed}</p>
          </div>
          <Card className="border-border/60 bg-muted/20 shadow-sm">
            <CardContent className="space-y-2 p-5 text-sm leading-relaxed text-muted-foreground">
              <p>{COPY.onboarding.reportIntroCard1}</p>
              <p className="text-foreground/85">{COPY.onboarding.reportIntroCard2}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === "days" ? (
        <QuestionShell title={COPY.ownerWizard.days.title} subtitle={COPY.ownerWizard.days.subtitle}>
          <ChoiceGrid
            value={answers.daysPerWeek}
            onChange={(v) => update("daysPerWeek", v)}
            options={[...COPY.ownerWizard.days.choices]}
          />
        </QuestionShell>
      ) : null}

      {step === "open" ? (
        <QuestionShell title={COPY.ownerWizard.open.title} subtitle={COPY.ownerWizard.open.subtitle}>
          <ChoiceGrid
            value={answers.openWithoutYou}
            onChange={(v) => update("openWithoutYou", v)}
            options={[...COPY.ownerWizard.open.choices]}
          />
        </QuestionShell>
      ) : null}

      {step === "close" ? (
        <QuestionShell title={COPY.ownerWizard.close.title} subtitle={COPY.ownerWizard.close.subtitle}>
          <ChoiceGrid
            value={answers.closeWithoutYou}
            onChange={(v) => update("closeWithoutYou", v)}
            options={[...COPY.ownerWizard.close.choices]}
          />
        </QuestionShell>
      ) : null}

      {step === "interrupts" ? (
        <QuestionShell title={COPY.ownerWizard.interrupts.title} subtitle={COPY.ownerWizard.interrupts.subtitle}>
          <ChoiceGrid
            value={answers.staffInterrupts}
            onChange={(v) => update("staffInterrupts", v)}
            options={[...COPY.ownerWizard.interrupts.choices]}
          />
        </QuestionShell>
      ) : null}

      {step === "breaks" ? (
        <QuestionShell title={COPY.ownerWizard.breaks.title} subtitle={COPY.ownerWizard.breaks.subtitle}>
          <Label htmlFor="breaks" className="sr-only">
            {COPY.ownerWizard.breaks.labelSr}
          </Label>
          <Textarea
            id="breaks"
            value={answers.breaksWhenYouLeave}
            onChange={(e) => update("breaksWhenYouLeave", e.target.value)}
            placeholder={COPY.ownerWizard.breaks.placeholder}
            className="min-h-[9rem] text-base leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">{COPY.ownerWizard.breaks.footnote}</p>
        </QuestionShell>
      ) : null}

      {step === "timeoff" ? (
        <QuestionShell title={COPY.ownerWizard.timeoff.title} subtitle={COPY.ownerWizard.timeoff.subtitle}>
          <ChoiceGrid
            value={answers.avoidedTimeOff}
            onChange={(v) => update("avoidedTimeOff", v)}
            options={[...COPY.ownerWizard.timeoff.choices]}
          />
        </QuestionShell>
      ) : null}

      {step === "standards" ? (
        <QuestionShell title={COPY.ownerWizard.standards.title} subtitle={COPY.ownerWizard.standards.subtitle}>
          <ChoiceGrid
            value={answers.standardsMode}
            onChange={(v) => update("standardsMode", v)}
            options={[...COPY.ownerWizard.standards.choices]}
          />
        </QuestionShell>
      ) : null}

      {step === "quality" ? (
        <QuestionShell title={COPY.ownerWizard.quality.title} subtitle={COPY.ownerWizard.quality.subtitle}>
          <ChoiceGrid
            value={answers.qualityOnOnePerson}
            onChange={(v) => update("qualityOnOnePerson", v)}
            options={[...COPY.ownerWizard.quality.choices]}
          />
        </QuestionShell>
      ) : null}

      {step === "report" && report ? (
        <div className="space-y-10">
          <div className="space-y-3">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {COPY.onboarding.reportEyebrow}
            </p>
            <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
              {report.headline}
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground">{report.subheadline}</p>
          </div>

          <Card className={cn("border-border/60 shadow-md ring-2 ring-offset-2 ring-offset-background", styles.ring)}>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {COPY.onboarding.reportIndexLabel}
                  </p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                    {report.dependencyIndex}
                    <span className="text-lg font-medium text-muted-foreground">/100</span>
                  </p>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                    {COPY.onboarding.reportIndexHint}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                    styles.badge
                  )}
                >
                  {report.band === "critical"
                    ? COPY.onboarding.bandCritical
                    : report.band === "strained"
                      ? COPY.onboarding.bandStrained
                      : COPY.onboarding.bandContained}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", styles.bar)} style={{ width: `${report.dependencyIndex}%` }} />
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3" aria-labelledby="heard-heading">
            <h2 id="heard-heading" className="text-lg font-semibold tracking-tight">
              {COPY.onboarding.heardHeading}
            </h2>
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              {report.heardBullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/35" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-xl border border-border/60 bg-muted/15 px-5 py-6 sm:px-7">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{report.patternTitle}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{report.patternBody}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {COPY.onboarding.uncomfortableHeading}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{report.uncomfortableTruth}</p>
          </section>

          <section className="space-y-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-6 sm:px-7">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{COPY.onboarding.stakesHeading}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{report.stakes}</p>
          </section>

          <section className="space-y-4" aria-labelledby="moves-heading">
            <h2 id="moves-heading" className="text-lg font-semibold tracking-tight">
              {COPY.onboarding.movesHeading}
            </h2>
            <ul className="space-y-3">
              {report.yourMoves.map((m) => (
                <li key={m.title}>
                  <Link
                    href={m.href}
                    className="block rounded-xl border border-border/60 bg-card px-4 py-4 shadow-sm transition-colors hover:bg-muted/25"
                  >
                    <p className="font-semibold text-foreground">{m.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.description}</p>
                    <p className="mt-2 text-xs font-medium text-primary">{COPY.onboarding.movesOpen}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-6">
            <p className="text-xs text-muted-foreground">
              {hadLocalReport && persist === "idle" ? COPY.onboarding.persistIdle : null}
              {persist === "saving" ? COPY.onboarding.persistSaving : null}
              {persist === "saved" ? COPY.onboarding.persistSaved : null}
              {persist === "skipped" ? COPY.onboarding.persistSkipped : null}
              {persist === "error" ? COPY.onboarding.persistError : null}
            </p>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={restart}>
              <RotateCcw className="size-3.5" aria-hidden />
              {COPY.onboarding.retake}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {step !== "intro" && step !== "report" ? (
            <Button type="button" variant="ghost" className="gap-1 text-muted-foreground" onClick={back}>
              <ArrowLeft className="size-4" aria-hidden />
              {COPY.onboarding.back}
            </Button>
          ) : (
            <span />
          )}
          {step === "intro" ? (
            <Button type="button" className="gap-2 px-6" onClick={() => setStep("days")}>
              {COPY.onboarding.begin}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : null}
          {step !== "intro" && step !== "report" ? (
            <Button type="button" className="gap-2 px-6" disabled={!validateCurrent()} onClick={goNext}>
              {step === "quality" ? COPY.onboarding.seeReport : COPY.onboarding.continue}
              {step !== "quality" ? <ArrowRight className="size-4" aria-hidden /> : null}
            </Button>
          ) : null}
          {step === "report" ? (
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11 px-6")}>
              {COPY.onboarding.backOverview}
            </Link>
          ) : null}
        </div>
      </div>

      {step !== "intro" && step !== "report" ? (
        <p className="mt-6 text-center text-[0.65rem] text-muted-foreground">
          {COPY.onboarding.livePreview(dependencyPreview)}
        </p>
      ) : null}
    </div>
  )
}

function QuestionShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-balance text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
