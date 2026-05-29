import Link from "next/link"
import {
  AlertCircle,
  BookOpen,
  Camera,
  Clock,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { getAskRivetIntelligenceDashboard } from "@/app/actions/ask-rivet"
import type { AskRivetFixKind } from "@/lib/ask-rivet/fix-suggestions"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

const FIX_LABEL: Record<AskRivetFixKind, string> = {
  create_play: COPY.askRivet.fixCreatePlay,
  improve_play: COPY.askRivet.fixImprovePlay,
  add_training: COPY.askRivet.fixAddTraining,
  add_media: COPY.askRivet.fixAddMedia,
}

const FIX_ICON: Record<AskRivetFixKind, typeof BookOpen> = {
  create_play: BookOpen,
  improve_play: Sparkles,
  add_training: GraduationCap,
  add_media: Camera,
}

export async function AskRivetIntelligenceDashboard({ className }: { className?: string }) {
  const view = await getAskRivetIntelligenceDashboard()
  if (!view) return null

  const hasActivity = view.questionsAskedThisMonth > 0

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card/90 shadow-sm",
        className
      )}
      aria-labelledby="ask-intelligence-heading"
    >
      <div className="border-b border-border/50 px-5 py-5 sm:px-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {COPY.askRivet.intelligenceEyebrow}
        </p>
        <h2 id="ask-intelligence-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          {COPY.askRivet.intelligenceTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {COPY.askRivet.intelligenceLead}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
          {COPY.askRivet.intelligencePeriod}
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricTile
            icon={MessageCircle}
            label={COPY.askRivet.metricQuestionsAsked}
            value={String(view.questionsAskedThisMonth)}
          />
          <MetricTile
            icon={RefreshCw}
            label={COPY.askRivet.metricRepeated}
            value={String(view.repeatedQuestionsCount)}
          />
          <MetricTile
            icon={AlertCircle}
            label={COPY.askRivet.metricUnanswered}
            value={String(view.lowConfidenceQuestionsCount)}
            accent={view.lowConfidenceQuestionsCount > 0 ? "warn" : "default"}
          />
          <MetricTile
            icon={ShieldCheck}
            label={COPY.askRivet.metricPrevented}
            value={String(view.questionsPreventedThisMonth)}
            accent="positive"
          />
          <MetricTile
            icon={Clock}
            label={COPY.askRivet.metricTimeSaved}
            value={String(view.ownerHoursReturnedThisMonth)}
            suffix="h"
            accent="positive"
          />
        </div>

        {!hasActivity ? (
          <p className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
            {COPY.askRivet.emptyIntelligence}
          </p>
        ) : null}

        {view.recommendations.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-foreground">{COPY.askRivet.recommendationsTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{COPY.askRivet.recommendationsLead}</p>
            <ul className="mt-4 space-y-2">
              {view.recommendations.map((rec) => {
                const Icon = FIX_ICON[rec.fixKind]
                return (
                  <li
                    key={rec.normalizedQuestion}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">&ldquo;{rec.question}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {COPY.askRivet.recommendationReason[rec.reasonKey]} ·{" "}
                        {COPY.askRivet.fixAskedTimes(rec.askCount)}
                      </p>
                    </div>
                    <Link
                      href={rec.href}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {FIX_LABEL[rec.fixKind]}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {view.repeatedQuestions.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-foreground">{COPY.askRivet.repeatedSectionTitle}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{COPY.askRivet.repeatedSectionLead}</p>
              <ul className="mt-3 space-y-2">
                {view.repeatedQuestions.map((item) => (
                  <li
                    key={item.normalizedQuestion}
                    className="rounded-xl border border-border/45 bg-muted/10 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-foreground">&ldquo;{item.displayQuestion}&rdquo;</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {COPY.askRivet.fixAskedTimes(item.askCount)} · {item.preventedCount} prevented
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {view.lowConfidenceQuestions.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {COPY.askRivet.lowConfidenceSectionTitle}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{COPY.askRivet.lowConfidenceSectionLead}</p>
              <ul className="mt-3 space-y-2">
                {view.lowConfidenceQuestions.map((item) => (
                  <li
                    key={item.question}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-foreground">&ldquo;{item.question}&rdquo;</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.count}× {COPY.askRivet.confidenceLow}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  suffix,
  accent = "default",
}: {
  icon: typeof MessageCircle
  label: string
  value: string
  suffix?: string
  accent?: "default" | "positive" | "warn"
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        accent === "positive" && "border-emerald-500/25 bg-emerald-500/[0.04]",
        accent === "warn" && "border-amber-500/25 bg-amber-500/[0.04]",
        accent === "default" && "border-border/45 bg-muted/10"
      )}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
        {suffix ? <span className="text-base font-medium text-muted-foreground">{suffix}</span> : null}
      </p>
    </div>
  )
}
