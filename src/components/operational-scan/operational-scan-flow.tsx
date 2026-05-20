"use client"

import Link from "next/link"
import { useId, useState, useTransition } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

import { submitScanLead } from "@/app/(marketing)/scan/actions"
import { Logo } from "@/components/logo"
import { OperationalScanResults } from "@/components/operational-scan/operational-scan-results"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LANDING_HEADER_SIGN_IN } from "@/lib/marketing-landing-copy"
import {
  type OperationalScanAnswers,
  type OperationalScanResult,
  type OwnerInterruptionCadence,
  type StaffQuestionsBand,
  type UndocumentedProceduresBand,
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

const initialAnswers: OperationalScanAnswers = {
  businessName: "",
  website: "",
  industry: INDUSTRIES[0],
  email: "",
  staffQuestionsPerWeek: "16-30",
  staffCanOpenWithoutOwner: "partial",
  staffCanCloseWithoutOwner: "partial",
  undocumentedProcedures: "6-15",
  canRunFiveDaysWithoutOwner: "partial",
  trainingProcessExists: false,
  ownerInterruptions: "weekly",
}

type Phase = "intro" | "business" | "load" | "structure" | "contact" | "results"

const PHASE_META: Record<Exclude<Phase, "intro" | "results">, { index: string; label: string }> = {
  business: { index: "01", label: "You" },
  load: { index: "02", label: "Daily load" },
  structure: { index: "03", label: "Structure" },
  contact: { index: "04", label: "Report" },
}

const PHASE_TITLES: Record<Exclude<Phase, "intro" | "results">, string> = {
  business: "Your operation",
  load: "How much still routes through you?",
  structure: "What the team can hold without you",
  contact: "Send the cost report",
}

function choiceButton(selected: boolean) {
  return cn(
    "min-h-[2.75rem] rounded-md border px-3 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-500/50 dark:focus-visible:ring-offset-zinc-950 sm:min-h-0 sm:px-4",
    selected
      ? "border-zinc-900/25 bg-zinc-100 text-zinc-950 dark:border-white/20 dark:bg-white/10 dark:text-white"
      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600"
  )
}

const formNavRow = "flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-2"
const formBtnPrimary = "h-11 w-full sm:h-10 sm:min-w-[10.5rem] sm:w-auto"
const formBtnSecondary = "h-11 w-full sm:h-10 sm:min-w-[7.5rem] sm:w-auto"

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
    <div className="mt-2 grid gap-2 sm:grid-cols-3">
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

export function OperationalScanFlow() {
  const bizHintId = useId()
  const emailHintId = useId()
  const [phase, setPhase] = useState<Phase>("intro")
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
    setPhase("intro")
  }

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
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" aria-hidden />
            <div className={cn(landingContainer, "flex flex-1 flex-col justify-center")}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-400/70">
                Rivet Scan · 2 minutes
              </p>
              <span className="mt-3 block h-px w-10 bg-zinc-600" aria-hidden />
              <h1 className="mt-6 max-w-[24ch] text-balance text-[1.875rem] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:max-w-[28ch] sm:text-[2.35rem]">
                What is owner dependency costing you?
              </h1>
              <p className="mt-5 max-w-[42ch] text-pretty text-[15px] leading-[1.6] text-zinc-400">
                Seven direct questions. You get an Owner Dependency Score, severity read, and a conservative estimate of
                hours and dollars lost to interrupts—not a generic ops quiz.
              </p>
              <div className="mt-10">
                <Button
                  type="button"
                  size="lg"
                  className="h-11 rounded-md bg-white px-6 text-[13px] font-semibold text-zinc-950 hover:bg-zinc-100"
                  onClick={() => setPhase("business")}
                >
                  Run the scan
                  <ArrowRight className="size-3.5 opacity-50" data-icon="inline-end" />
                </Button>
              </div>
              <p className="mt-8 max-w-[48ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-zinc-600">
                No account required · honest answers only
              </p>
            </div>
          </section>
        ) : phase === "results" && result && reportGeneratedAt ? (
          <section className="flex-1 border-b border-zinc-800 bg-zinc-950 py-10 sm:py-14 print:border-0 print:bg-white print:py-0">
            <div className={cn(landingContainer, "max-w-5xl print:max-w-none")}>
              <OperationalScanResults
                result={result}
                answers={answers}
                reportDate={reportGeneratedAt}
                submissionSaved={submissionSaved}
                onRunAgain={reset}
              />
            </div>
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
            <div className={cn(landingContainer, "max-w-xl")}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {PHASE_META[phase].index} · {PHASE_META[phase].label}
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-white">
                {PHASE_TITLES[phase]}
              </h2>

              {phase === "business" ? (
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
                    <Button type="button" className={formBtnPrimary} disabled={!canProceedBusiness} onClick={() => setPhase("load")}>
                      Continue
                    </Button>
                  </div>
                </div>
              ) : null}

              {phase === "load" ? (
                <div className="mt-6 space-y-7">
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                      How many staff questions hit you per week?
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-500">Judgment calls, approvals, “what should I do?”—not casual chat.</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {(["0-5", "6-15", "16-30", "31-50", "51+"] as StaffQuestionsBand[]).map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={choiceButton(answers.staffQuestionsPerWeek === b)}
                          aria-pressed={answers.staffQuestionsPerWeek === b}
                          onClick={() => update("staffQuestionsPerWeek", b)}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                      Repeated owner interruptions
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-500">Pulls you off the floor, out of focus, or back after hours.</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["rarely", "Rarely"],
                          ["weekly", "Weekly or more"],
                          ["daily", "Most days"],
                          ["constantly", "Constantly"],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          className={choiceButton(answers.ownerInterruptions === val)}
                          aria-pressed={answers.ownerInterruptions === val}
                          onClick={() => update("ownerInterruptions", val as OwnerInterruptionCadence)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={formNavRow}>
                    <Button type="button" variant="outline" className={formBtnSecondary} onClick={() => setPhase("business")}>
                      Back
                    </Button>
                    <Button type="button" className={formBtnPrimary} onClick={() => setPhase("structure")}>
                      Continue
                    </Button>
                  </div>
                </div>
              ) : null}

              {phase === "structure" ? (
                <div className="mt-6 space-y-7">
                  <div>
                    <p className="text-[13px] font-medium">Can staff open without you?</p>
                    <YesNoPartial
                      value={answers.staffCanOpenWithoutOwner}
                      onChange={(v) => update("staffCanOpenWithoutOwner", v)}
                      labels={["Yes, reliably", "Sometimes", "No"]}
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Can staff close without you?</p>
                    <YesNoPartial
                      value={answers.staffCanCloseWithoutOwner}
                      onChange={(v) => update("staffCanCloseWithoutOwner", v)}
                      labels={["Yes, reliably", "Sometimes", "No"]}
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Undocumented procedures still in your head</p>
                    <p className="mt-1 text-[12px] text-zinc-500">Rough count of “only I know how this works.”</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
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
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Could the business run 5 days without you?</p>
                    <YesNoPartial
                      value={answers.canRunFiveDaysWithoutOwner}
                      onChange={(v) => update("canRunFiveDaysWithoutOwner", v)}
                      labels={["Yes", "Maybe once", "No"]}
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Training process exists</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={choiceButton(answers.trainingProcessExists)}
                        aria-pressed={answers.trainingProcessExists}
                        onClick={() => update("trainingProcessExists", true)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={choiceButton(!answers.trainingProcessExists)}
                        aria-pressed={!answers.trainingProcessExists}
                        onClick={() => update("trainingProcessExists", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className={formNavRow}>
                    <Button type="button" variant="outline" className={formBtnSecondary} onClick={() => setPhase("load")}>
                      Back
                    </Button>
                    <Button type="button" className={formBtnPrimary} onClick={() => setPhase("contact")}>
                      See my score
                    </Button>
                  </div>
                </div>
              ) : null}

              {phase === "contact" ? (
                <form
                  className="mt-6 space-y-5"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!canProceedContact || isSubmitting) return
                    submit()
                  }}
                >
                  <p className="text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Enter your email to unlock the Owner Dependency Score and cost estimate. The read is blunt on
                    purpose—you asked for truth.
                  </p>
                  <div>
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
                      Required · we use this to send follow-up if you want help installing Rivet.
                    </p>
                    {submitError ? (
                      <p role="alert" className="mt-3 rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700 dark:text-rose-200">
                        {submitError}
                      </p>
                    ) : null}
                  </div>
                  <div className={formNavRow}>
                    <Button type="button" variant="outline" className={formBtnSecondary} onClick={() => setPhase("structure")}>
                      Back
                    </Button>
                    <Button type="submit" className={cn(formBtnPrimary, "gap-2")} disabled={!canProceedContact || isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" data-icon="inline-start" aria-hidden />
                          Calculating…
                        </>
                      ) : (
                        "Reveal my score"
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
