"use client"

import { cn } from "@/lib/utils"
import type { QuickCaptureDraft } from "@/lib/sops/quick-capture/types"
import { formatSopCategory } from "@/lib/sops/categories"

function priorityClass(priority: QuickCaptureDraft["priority"]): string {
  switch (priority) {
    case "critical":
      return "border-rose-500/35 bg-rose-500/10 text-rose-950 dark:text-rose-100"
    case "high":
      return "border-orange-500/30 bg-orange-500/10 text-orange-950 dark:text-orange-100"
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
    default:
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
  }
}

export function CapturePlayInsights({ draft }: { draft: QuickCaptureDraft }) {
  return (
    <section
      className="space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-6 sm:px-7"
      aria-labelledby="play-insights-heading"
    >
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">
          Rivet understood your operation
        </p>
        <h2 id="play-insights-heading" className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          What we inferred
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Likely problem
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{draft.operationalProblem}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Category · Priority · Risk
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-md border border-border/70 px-2 py-1 text-xs font-medium">
              {formatSopCategory(draft.category)}
            </span>
            <span
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-semibold capitalize",
                priorityClass(draft.priority)
              )}
            >
              {draft.priority} priority
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{draft.estimatedRisk}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Success criteria
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{draft.successCriteria}</p>
      </div>

      {draft.hiddenDependencies.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Hidden dependencies
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {draft.hiddenDependencies.map((dep) => (
              <li key={dep}>{dep}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft.trainingGaps.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Likely training gaps
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {draft.trainingGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft.rootCauses.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Root causes
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {draft.rootCauses.map((cause) => (
              <li key={cause.title} className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{cause.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{cause.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft.verificationMethods.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Verification methods
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {draft.verificationMethods.map((method) => (
              <li key={method}>{method}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft.trainingRecommendations.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Training recommendations
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {draft.trainingRecommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft.trainingQuestions.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Training questions
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-foreground">
            {draft.trainingQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {draft.steps.some((s) => (s.commonMistakes?.length ?? 0) > 0) ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Common mistakes
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {[
              ...new Set(
                draft.steps.flatMap((s) => s.commonMistakes ?? []).filter(Boolean)
              ),
            ].map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft.supplies && draft.supplies.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Supplies: </span>
          {draft.supplies.join(" · ")}
        </p>
      ) : null}

      {draft.timingNotes ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Timing: </span>
          {draft.timingNotes}
        </p>
      ) : null}
    </section>
  )
}
