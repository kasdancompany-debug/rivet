"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
} from "lucide-react"

import { persistFounderDependencyScan } from "@/app/actions/founder-dependency-scan"
import {
  buildAssessmentPayload,
  computeScanResult,
  isScanComplete,
  type RiskBand,
  type ScanComputeResult,
} from "@/lib/founder-dependency-scanner/compute"
import {
  ANSWER_SCALE,
  type AnswerKey,
  SCANNER_SECTIONS,
} from "@/lib/founder-dependency-scanner/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "rivet.scanner.v1"

type Phase = "intro" | "scan" | "results"

type SaveState =
  | "idle"
  | "saving"
  | "saved"
  | "skipped"
  | "error"
  | "restored"

type StoredDraft = {
  phase: Phase
  sectionIndex: number
  answers: Record<string, AnswerKey>
}

function loadDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDraft
    if (!parsed || typeof parsed !== "object") return null
    return parsed
  } catch {
    return null
  }
}

function saveDraft(draft: StoredDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function riskPresentation(band: RiskBand) {
  switch (band) {
    case "healthy":
      return {
        label: "Healthy",
        badge:
          "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-300/95",
        accent: "text-emerald-800 dark:text-emerald-400/95",
        bar: "bg-emerald-600/75 dark:bg-emerald-500/60",
      }
    case "moderate":
      return {
        label: "Moderate",
        badge: "border-border/80 bg-muted/50 text-foreground",
        accent: "text-foreground",
        bar: "bg-foreground/55",
      }
    case "high":
      return {
        label: "High",
        badge: "border-amber-500/30 bg-amber-500/[0.07] text-amber-950 dark:text-amber-300/95",
        accent: "text-amber-900 dark:text-amber-400/95",
        bar: "bg-amber-600/75 dark:bg-amber-500/55",
      }
    default:
      return {
        label: "Critical",
        badge: "border-rose-500/30 bg-rose-500/[0.08] text-rose-950 dark:text-rose-300/95",
        accent: "text-rose-900 dark:text-rose-400/95",
        bar: "bg-rose-600/80 dark:bg-rose-500/60",
      }
  }
}

function createInitialScannerState() {
  const d = loadDraft()
  const answers: Record<string, AnswerKey> =
    d?.answers && Object.keys(d.answers).length > 0 ? { ...d.answers } : {}

  let phase: Phase = "intro"
  let sectionIndex = 0
  let result: ScanComputeResult | null = null
  let saveState: SaveState = "idle"
  let persistLocked = false

  if (Object.keys(answers).length > 0) {
    if (d?.phase === "results" && isScanComplete(answers)) {
      phase = "results"
      result = computeScanResult(answers)
      persistLocked = true
      saveState = "restored"
    } else if (d?.phase === "scan") {
      phase = "scan"
      sectionIndex = Math.min(
        SCANNER_SECTIONS.length - 1,
        Math.max(0, d.sectionIndex ?? 0)
      )
    }
  }

  return { phase, sectionIndex, answers, result, saveState, persistLocked }
}

export function FounderDependencyScanner() {
  const init = useMemo(() => createInitialScannerState(), [])
  const [phase, setPhase] = useState<Phase>(init.phase)
  const [sectionIndex, setSectionIndex] = useState(init.sectionIndex)
  const [answers, setAnswers] = useState<Record<string, AnswerKey>>(init.answers)
  const [result, setResult] = useState<ScanComputeResult | null>(init.result)
  const [saveState, setSaveState] = useState<SaveState>(init.saveState)
  const persistOnce = useRef(init.persistLocked)

  useEffect(() => {
    if (phase === "intro") return
    saveDraft({ phase, sectionIndex, answers })
  }, [phase, sectionIndex, answers])

  const section = SCANNER_SECTIONS[sectionIndex]!
  const sectionFilled = section.questions.every((q) => answers[q.id] !== undefined)

  const setAnswer = useCallback((questionId: string, key: AnswerKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: key }))
  }, [])

  function goResults() {
    if (!isScanComplete(answers)) return
    const r = computeScanResult(answers)
    setResult(r)
    setPhase("results")
    saveDraft({ phase: "results", sectionIndex, answers })
  }

  useEffect(() => {
    if (phase !== "results" || !result) return
    if (persistOnce.current) return
    persistOnce.current = true
    setSaveState("saving")
    const payload = buildAssessmentPayload(result, answers)
    void persistFounderDependencyScan({
      dependencyPercent: result.founderDependencyScore,
      assessmentJson: payload,
    }).then((res) => {
      if (res.ok) setSaveState("saved")
      else if (res.reason === "no_business") setSaveState("skipped")
      else setSaveState("error")
    })
  }, [phase, result, answers])

  const progress = useMemo(() => {
    const answered = Object.keys(answers).length
    const total = SCANNER_SECTIONS.reduce((n, s) => n + s.questions.length, 0)
    return Math.round((answered / total) * 100)
  }, [answers])

  const restart = () => {
    clearDraft()
    setAnswers({})
    setSectionIndex(0)
    setResult(null)
    setPhase("intro")
    setSaveState("idle")
    persistOnce.current = false
  }

  if (phase === "intro") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/50 bg-muted/20 px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Activity className="size-3.5 opacity-70" aria-hidden />
            Transition diagnostic
          </div>
          <CardTitle className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.75rem] sm:leading-snug">
            Concentration scan
          </CardTitle>
          <CardDescription className="max-w-2xl text-base leading-[1.6] text-muted-foreground sm:text-lg">
            A structured pass across opening, product, inventory, people, and customer recovery.
            Answer plainly; the read is only as useful as the truth you bring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-6 py-10 sm:px-10 sm:py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                t: "Seventeen signals",
                d: "Across five operating areas where owner concentration usually hides.",
              },
              {
                t: "Weighted clarity",
                d: "Each response maps to dependency pressure—not pass/fail judgment.",
              },
              {
                t: "Actionable output",
                d: "You will leave with a score, risk band, bottlenecks, and next moves.",
              },
            ].map((x) => (
              <div
                key={x.t}
                className="rounded-2xl border border-border/60 bg-background/60 px-4 py-5"
              >
                <p className="text-sm font-medium text-foreground">{x.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
          <Separator className="bg-border/60" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Allow about eight quiet minutes. You can leave and return—progress is
              saved on this device.
            </p>
            <Button
              size="lg"
              className="h-11 shrink-0 px-6"
              onClick={() => {
                setPhase("scan")
                setSectionIndex(0)
              }}
            >
              Begin assessment
              <ArrowRight className="size-4 opacity-80" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "scan") {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Section {sectionIndex + 1} of {SCANNER_SECTIONS.length}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {section.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              {section.lede}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
              Overall progress
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {progress}
              <span className="text-base font-medium text-muted-foreground">%</span>
            </p>
            <div className="mt-2 h-1 w-full min-w-[8rem] overflow-hidden rounded-full bg-muted sm:ml-auto sm:w-36">
              <div
                className="h-full rounded-full bg-foreground/60 transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {section.questions.map((q) => (
            <div key={q.id} className="space-y-4">
              <div>
                <h3 className="text-lg font-medium leading-snug tracking-tight text-foreground sm:text-xl">
                  {q.prompt}
                </h3>
                {q.context ? (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {q.context}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ANSWER_SCALE.map((opt) => {
                  const selected = answers[q.id] === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAnswer(q.id, opt.key)}
                      className={cn(
                        "flex flex-col rounded-2xl border px-4 py-4 text-left transition-all outline-none",
                        "hover:border-foreground/20 hover:bg-muted/30",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        selected
                          ? "border-foreground/25 bg-foreground/[0.04] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]"
                          : "border-border/70 bg-card/60"
                      )}
                    >
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <span className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {opt.hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/50 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="h-10 border-border/80"
            onClick={() => {
              if (sectionIndex === 0) {
                setPhase("intro")
              } else {
                setSectionIndex((i) => i - 1)
              }
            }}
          >
            <ArrowLeft className="size-4 opacity-70" />
            Back
          </Button>
          {sectionIndex < SCANNER_SECTIONS.length - 1 ? (
            <Button
              className="h-10 px-6"
              disabled={!sectionFilled}
              onClick={() => sectionFilled && setSectionIndex((i) => i + 1)}
            >
              Continue
              <ArrowRight className="size-4 opacity-80" />
            </Button>
          ) : (
            <Button
              className="h-10 px-6"
              disabled={!isScanComplete(answers)}
              onClick={goResults}
            >
              View diagnostic results
              <ClipboardList className="size-4 opacity-80" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!result) return null

  const rp = riskPresentation(result.riskBand)

  return (
    <div className="space-y-12 sm:space-y-14">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-10 px-6 py-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-12 lg:px-10 lg:py-12">
          <div className="space-y-6">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Diagnostic outcome
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-6xl font-semibold tabular-nums tracking-tighter text-foreground sm:text-7xl">
                {result.founderDependencyScore}
              </span>
              <span className="text-xl font-medium text-muted-foreground">/ 100</span>
            </div>
            <p className="max-w-md text-sm leading-[1.6] text-muted-foreground">
              Owner concentration score. Lower means fewer critical paths require you personally.
              Treat it as a baseline, not a verdict.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Risk level
              </span>
              <Badge variant="outline" className={cn("rounded-full px-3 py-1", rp.badge)}>
                <span className={cn("font-semibold", rp.accent)}>{result.riskLabel}</span>
              </Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-6 sm:p-8">
            <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
              What this band implies
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {result.riskBand === "healthy" &&
                "Operational load is largely portable. Focus on maintenance and succession depth—not heroics."}
              {result.riskBand === "moderate" &&
                "A few concentrated gaps still pull you back in. Closing them shifts operating weight from you to the documented standard."}
              {result.riskBand === "high" &&
                "Several areas likely still wait on your judgment under pressure. The business can feel lighter than it is—until you step away."}
              {result.riskBand === "critical" &&
                "Multiple load-bearing paths still sit on you. That is fixable, but it needs deliberate sequencing—not more hours."}
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", rp.bar)}
                style={{ width: `${result.founderDependencyScore}%` }}
              />
            </div>
            {saveState === "saving" ? (
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Saving to your record…
              </p>
            ) : null}
            {saveState === "saved" ? (
              <p className="mt-4 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400/90">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Saved to your business record for your Rivet Index.
              </p>
            ) : null}
            {saveState === "skipped" ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Link a business profile to store this run in Supabase. Results above
                are still valid on this device.
              </p>
            ) : null}
            {saveState === "error" ? (
              <p className="mt-4 text-xs text-destructive">
                Could not save this run. Try again from Settings or retry later.
              </p>
            ) : null}
            {saveState === "restored" ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Restored from your last session on this device. Run again to save a
                fresh result to your business record.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Tightest bottlenecks
            </CardTitle>
            <CardDescription>
              The five strongest signals of owner concentration from your responses—address these
              first for leverage.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/50 px-0">
            {result.bottlenecks.map((b, i) => (
              <div key={b.questionId} className="flex gap-4 px-5 py-4 sm:px-6">
                <span className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
                    {b.sectionTitle}
                  </p>
                  <p className="text-sm font-medium leading-snug text-foreground">{b.prompt}</p>
                  <div className="mt-2 h-1 max-w-[12rem] overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/50"
                      style={{ width: `${b.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Recommended next actions
            </CardTitle>
            <CardDescription>
              Prioritized from your weakest categories—written to be specific enough
              to schedule this week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {result.recommendedActions.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/35" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60 shadow-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Breakdown by category
          </CardTitle>
          <CardDescription>
            Where concentration shows up across the five areas of the scan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {result.categoryBreakdown.map((cat) => (
            <div key={cat.sectionId} className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{cat.title}</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{cat.score}</span>
                  <span className="text-muted-foreground"> / 100</span>
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/80">
                <div
                  className="h-full rounded-full bg-foreground/55 transition-all"
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className="h-10" onClick={restart}>
          Run again
        </Button>
      </div>
    </div>
  )
}
