"use client"

import Link from "next/link"
import { useId, useState, useTransition } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

import { submitScanLead } from "@/app/(marketing)/scan/actions"
import { Logo } from "@/components/logo"
import { OperationalScanResults } from "@/components/operational-scan/operational-scan-results"
import { ScanProgress } from "@/components/operational-scan/scan-progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LANDING_HEADER_SIGN_IN } from "@/lib/marketing-landing-copy"
import { SCAN_EMAIL_STEP, SCAN_INTRO } from "@/lib/operational-scan/scan-copy"
import {
  type OperationalScanAnswers,
  type OperationalScanResult,
  type RepeatedMistakesBand,
  type TrainingConsistency,
  type UndocumentedProceduresBand,
  type WeeklyCountBand,
  type YesPartialNo,
  computeOperationalScanScores,
} from "@/lib/operational-scan/score"
import { cn } from "@/lib/utils"

const landingContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

const INDUSTRIES = [
  "Hospitality",
  "Retail",
  "Professional services",
  "Trades & field",
  "Manufacturing & production",
  "Health & wellness",
  "Other",
] as const

const QUESTION_COUNT = 8

const initialAnswers: OperationalScanAnswers = {
  businessName: "",
  website: "",
  industry: INDUSTRIES[0],
  email: "",
  staffQuestionsPerWeek: "16-30",
  ownerTextsCallsPerWeek: "16-30",
  staffCanOpenWithoutOwner: "partial",
  staffCanCloseWithoutOwner: "partial",
  undocumentedProcedures: "6-15",
  trainingConsistency: "sometimes",
  canRunFiveDaysWithoutOwner: "partial",
  repeatedMistakesIssues: "weekly",
}

type Phase = "intro" | "business" | "questions" | "email" | "results"

function choiceButton(selected: boolean) {
  return cn(
    "min-h-[2.75rem] rounded-md border px-3 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-500/50 dark:focus-visible:ring-offset-zinc-950 sm:min-h-0 sm:px-4",
    selected
      ? "border-zinc-900/25 bg-zinc-100 text-zinc-950 dark:border-white/20 dark:bg-white/10 dark:text-white"
      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600"
  )
}

const formNavRow = "flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-2"
const formBtnPrimary = "h-11 w-full sm:h-10 sm:min-w-[10.5rem] sm:w-auto"
const formBtnSecondary = "h-11 w-full sm:h-10 sm:min-w-[7.5rem] sm:w-auto"

const WEEKLY_BANDS: WeeklyCountBand[] = ["0-5", "6-15", "16-30", "31-50", "51+"]

function YesNoPartial({
  value,
  onChange,
  labels = ["Yes", "Partially", "No"],
}: {
  value: YesPartialNo
  onChange: (v: YesPartialNo) => void
  labels?: [string, string, string]
}) {
  const opts: YesPartialNo[] = ["yes", "partial", "no"]
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {opts.map((v, i) => (
        <button
          key={v}
          type="button"
          className={choiceButton(value === v)}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  )
}

function WeeklyBandPicker({
  value,
  onChange,
  hint,
}: {
  value: WeeklyCountBand
  onChange: (v: WeeklyCountBand) => void
  hint?: string
}) {
  return (
    <>
      {hint ? <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{hint}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {WEEKLY_BANDS.map((b) => (
          <button
            key={b}
            type="button"
            className={choiceButton(value === b)}
            aria-pressed={value === b}
            onClick={() => onChange(b)}
          >
            {b}
          </button>
        ))}
      </div>
    </>
  )
}

export function OperationalScanFlow() {
  const bizHintId = useId()
  const emailHintId = useId()
  const [phase, setPhase] = useState<Phase>("intro")
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<OperationalScanAnswers>(initialAnswers)
  const [result, setResult] = useState<OperationalScanResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionSaved, setSubmissionSaved] = useState(false)
  const [reportGeneratedAt, setReportGeneratedAt] = useState<Date | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  const update = <K extends keyof OperationalScanAnswers>(key: K, value: OperationalScanAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const canProceedBusiness = answers.businessName.trim().length >= 2 && answers.industry.trim().length > 0
  const emailTrim = answers.email.trim()
  const canProceedContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)

  const submit = () => {
    setSubmitError(null)
    const payload: OperationalScanAnswers = {
      ...answers,
      businessName: answers.businessName.trim(),
      website: answers.website.trim(),
      industry: answers.industry.trim(),
      email: answers.email.trim(),
    }
    startTransition(async () => {
      const res = await submitScanLead(payload)
      if (!res.ok) {
        setSubmitError(res.error)
        return
      }
      setSubmissionSaved(true)
      setReportGeneratedAt(new Date())
      setAnswers(payload)
      setResult(computeOperationalScanScores(payload))
      setPhase("results")
    })
  }

  const reset = () => {
    setAnswers(initialAnswers)
    setResult(null)
    setSubmitError(null)
    setSubmissionSaved(false)
    setReportGeneratedAt(null)
    setQuestionIndex(0)
    setPhase("intro")
  }

  const goNextQuestion = () => {
    if (questionIndex < QUESTION_COUNT - 1) {
      setQuestionIndex((i) => i + 1)
    } else {
      setPhase("email")
    }
  }

  const goPrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1)
    } else {
      setPhase("business")
    }
  }

  const questionTitles = [
    "How many staff questions hit you per week?",
    "How many owner texts or calls per week?",
    "Can staff open without you?",
    "Can staff close without you?",
    "How many procedures still live only in your head?",
    "How consistent is training?",
    "Could the business run 5 days without you?",
    "How often do the same mistakes or issues repeat?",
  ]

  const questionHints = [
    "Judgment calls, approvals, “what should I do?”—not casual chat.",
    "Texts, calls, and walk-ups that pull you back in—not routine FYIs.",
    null,
    null,
    "Rough count of “only I know how this works.”",
    null,
    null,
    "Rework, complaints, quality misses—the same themes recycling.",
  ]

  return (
    <div className="flex min-h-svh flex-col bg-zinc-50 text-zinc-950 antialiased print:bg-white dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md print:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className={cn(landingContainer, "flex h-12 items-center justify-between sm:h-14")}>
          <Logo href="/" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-md px-3 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            {LANDING_HEADER_SIGN_IN}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col" aria-busy={isSubmitting}>
        {phase === "intro" ? (
          <section className="relative flex flex-1 flex-col border-b border-zinc-800 bg-zinc-950 py-14 text-zinc-100 sm:py-20">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/25 to-transparent" aria-hidden />
            <div className={cn(landingContainer, "mx-auto flex max-w-xl flex-1 flex-col justify-center")}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-400/80">
                {SCAN_INTRO.eyebrow}
              </p>
              <span className="mt-3 block h-px w-10 bg-zinc-600" aria-hidden />
              <h1 className="mt-6 text-balance text-[1.875rem] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-[2.35rem]">
                {SCAN_INTRO.headline}
              </h1>
              <p className="mt-5 text-pretty text-[15px] leading-[1.65] text-zinc-400">{SCAN_INTRO.subhead}</p>
              <div className="mt-10">
                <Button
                  type="button"
                  size="lg"
                  className="h-11 rounded-md bg-white px-6 text-[13px] font-semibold text-zinc-950 hover:bg-zinc-100"
                  onClick={() => setPhase("business")}
                >
                  {SCAN_INTRO.cta}
                  <ArrowRight className="size-3.5 opacity-50" data-icon="inline-end" />
                </Button>
              </div>
              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">{SCAN_INTRO.footnote}</p>
            </div>
          </section>
        ) : phase === "results" && result && reportGeneratedAt ? (
          <section className="flex-1 border-b border-zinc-800 bg-zinc-950 py-10 sm:py-14 print:border-0 print:bg-white print:py-0">
            <OperationalScanResults
              result={result}
              answers={answers}
              reportDate={reportGeneratedAt}
              submissionSaved={submissionSaved}
              onRunAgain={reset}
            />
          </section>
        ) : phase === "results" ? (
          <section className="flex-1 border-b border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
            <div className={cn(landingContainer, "max-w-lg")}>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Report unavailable</h2>
              <p className="mt-2 text-[14px] text-zinc-600 dark:text-zinc-400">Submit your email again or restart the scan.</p>
              <Button type="button" className="mt-6" onClick={reset}>
                Start over
              </Button>
            </div>
          </section>
        ) : (
          <section className="flex-1 border-b border-zinc-200 bg-white py-10 pb-28 dark:border-zinc-800 dark:bg-zinc-950 sm:py-12">
            <div className={cn(landingContainer, "mx-auto max-w-xl")}>
              {phase === "questions" ? (
                <ScanProgress step={questionIndex + 1} total={QUESTION_COUNT} className="mb-8" />
              ) : null}

              {phase === "business" ? (
                <>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Before we score</p>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-white">
                    Tell us about your operation
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    So your report has a name—not a generic placeholder.
                  </p>
                  <div className="mt-6 space-y-5">
                    <div>
                      <Label htmlFor="biz-name">Business name</Label>
                      <Input
                        id="biz-name"
                        className="mt-1.5 h-10"
                        value={answers.businessName}
                        onChange={(e) => update("businessName", e.target.value)}
                        aria-describedby={bizHintId}
                      />
                      <p id={bizHintId} className="mt-1.5 text-[12px] text-zinc-500">
                        Required · at least 2 characters.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="web">Website (optional)</Label>
                      <Input
                        id="web"
                        className="mt-1.5 h-10"
                        placeholder="https://"
                        value={answers.website}
                        onChange={(e) => update("website", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <select
                        id="industry"
                        className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] dark:border-zinc-700 dark:bg-zinc-950"
                        value={answers.industry}
                        onChange={(e) => update("industry", e.target.value)}
                      >
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={formNavRow}>
                      <Button type="button" variant="outline" className={formBtnSecondary} onClick={() => setPhase("intro")}>
                        Back
                      </Button>
                      <Button
                        type="button"
                        className={formBtnPrimary}
                        disabled={!canProceedBusiness}
                        onClick={() => {
                          setQuestionIndex(0)
                          setPhase("questions")
                        }}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}

              {phase === "questions" ? (
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-white">
                    {questionTitles[questionIndex]}
                  </h2>
                  {questionHints[questionIndex] ? (
                    <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {questionHints[questionIndex]}
                    </p>
                  ) : null}

                  <div className="mt-6">
                    {questionIndex === 0 ? (
                      <WeeklyBandPicker
                        value={answers.staffQuestionsPerWeek}
                        onChange={(v) => update("staffQuestionsPerWeek", v)}
                      />
                    ) : null}
                    {questionIndex === 1 ? (
                      <WeeklyBandPicker
                        value={answers.ownerTextsCallsPerWeek}
                        onChange={(v) => update("ownerTextsCallsPerWeek", v)}
                      />
                    ) : null}
                    {questionIndex === 2 ? (
                      <YesNoPartial
                        value={answers.staffCanOpenWithoutOwner}
                        onChange={(v) => update("staffCanOpenWithoutOwner", v)}
                        labels={["Yes, reliably", "Sometimes", "No"]}
                      />
                    ) : null}
                    {questionIndex === 3 ? (
                      <YesNoPartial
                        value={answers.staffCanCloseWithoutOwner}
                        onChange={(v) => update("staffCanCloseWithoutOwner", v)}
                        labels={["Yes, reliably", "Sometimes", "No"]}
                      />
                    ) : null}
                    {questionIndex === 4 ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {(["0", "1-5", "6-15", "16-30", "31+"] as UndocumentedProceduresBand[]).map((b) => (
                          <button
                            key={b}
                            type="button"
                            className={choiceButton(answers.undocumentedProcedures === b)}
                            aria-pressed={answers.undocumentedProcedures === b}
                            onClick={() => update("undocumentedProcedures", b)}
                          >
                            {b === "0" ? "None" : b}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {questionIndex === 5 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(
                          [
                            ["consistent", "Consistent — same every hire"],
                            ["sometimes", "Sometimes — depends who trains"],
                            ["rarely", "Rarely — mostly shadowing me"],
                            ["none", "No real process"],
                          ] as const
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            className={choiceButton(answers.trainingConsistency === val)}
                            aria-pressed={answers.trainingConsistency === val}
                            onClick={() => update("trainingConsistency", val as TrainingConsistency)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {questionIndex === 6 ? (
                      <YesNoPartial
                        value={answers.canRunFiveDaysWithoutOwner}
                        onChange={(v) => update("canRunFiveDaysWithoutOwner", v)}
                        labels={["Yes", "Maybe once", "No"]}
                      />
                    ) : null}
                    {questionIndex === 7 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(
                          [
                            ["rarely", "Rarely"],
                            ["monthly", "A few times a month"],
                            ["weekly", "Weekly"],
                            ["daily", "Daily or constant"],
                          ] as const
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            className={choiceButton(answers.repeatedMistakesIssues === val)}
                            aria-pressed={answers.repeatedMistakesIssues === val}
                            onClick={() => update("repeatedMistakesIssues", val as RepeatedMistakesBand)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className={formNavRow}>
                    <Button type="button" variant="outline" className={formBtnSecondary} onClick={goPrevQuestion}>
                      Back
                    </Button>
                    <Button type="button" className={formBtnPrimary} onClick={goNextQuestion}>
                      {questionIndex === QUESTION_COUNT - 1 ? "See my score" : "Continue"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {phase === "email" ? (
                <form
                  className="mt-2"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!canProceedContact || isSubmitting) return
                    submit()
                  }}
                >
                  <h2 className="text-xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-white">
                    {SCAN_EMAIL_STEP.title}
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">{SCAN_EMAIL_STEP.body}</p>
                  <div className="mt-6">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="mt-1.5 h-10"
                      placeholder="you@company.com"
                      value={answers.email}
                      onChange={(e) => update("email", e.target.value)}
                      aria-describedby={emailHintId}
                    />
                    <p id={emailHintId} className="mt-1.5 text-[12px] text-zinc-500">
                      Required · we send your score and cost read.
                    </p>
                    {submitError ? (
                      <p
                        role="alert"
                        className="mt-3 rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700 dark:text-rose-200"
                      >
                        {submitError}
                      </p>
                    ) : null}
                  </div>
                  <div className={formNavRow}>
                    <Button
                      type="button"
                      variant="outline"
                      className={formBtnSecondary}
                      onClick={() => {
                        setQuestionIndex(QUESTION_COUNT - 1)
                        setPhase("questions")
                      }}
                    >
                      Back
                    </Button>
                    <Button type="submit" className={cn(formBtnPrimary, "gap-2")} disabled={!canProceedContact || isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" data-icon="inline-start" aria-hidden />
                          {SCAN_EMAIL_STEP.submitting}
                        </>
                      ) : (
                        SCAN_EMAIL_STEP.submit
                      )}
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
