import Link from "next/link"
import {
  AlertTriangle,
  BookOpen,
  Camera,
  Clock,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react"

import { getAskRivetIntelligenceDashboard } from "@/app/actions/ask-rivet"
import { fixKindHref, type AskRivetFixKind } from "@/lib/ask-rivet/fix-suggestions"
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

export async function QuestionsPreventedIntelligencePanel({
  className,
  variant = "full",
}: {
  className?: string
  variant?: "full" | "compact"
}) {
  const view = await getAskRivetIntelligenceDashboard()
  if (!view) return null

  const hasActivity = view.questionsAskedThisMonth > 0
  const isCompact = variant === "compact"

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-sm",
        className
      )}
      aria-labelledby="questions-prevented-intel-heading"
    >
      <div className="border-b border-border/50 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {COPY.askRivet.intelligenceEyebrow}
            </p>
            <h2
              id="questions-prevented-intel-heading"
              className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              {COPY.askRivet.questionsPreventedTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {COPY.askRivet.questionsPreventedIntelLead}
            </p>
          </div>
          {!isCompact ? (
            <Link
              href="/ask"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30"
            >
              {COPY.askRivet.dashboardOpen}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <HeroMetric
            label={COPY.askRivet.heroPreventedLabel}
            value={String(view.questionsPreventedThisMonth)}
            sub={COPY.askRivet.intelligencePeriod}
          />
          <HeroMetric
            label={COPY.askRivet.heroHoursLabel}
            value={String(view.ownerHoursReturnedThisMonth)}
            suffix="h"
            sub={COPY.askRivet.heroHoursSub(view.interruptionsAvoidedThisMonth)}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <MiniMetric icon={MessageCircle} label={COPY.askRivet.questionsAnsweredMonth} value={view.questionsAnsweredThisMonth} />
          <MiniMetric icon={ShieldCheck} label={COPY.askRivet.interruptionsAvoided} value={view.interruptionsAvoidedThisMonth} />
          <MiniMetric icon={HelpCircle} label={COPY.askRivet.questionsAnsweredWeek} value={view.questionsAnsweredThisWeek} />
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {!hasActivity ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
            {COPY.askRivet.questionsPreventedEmpty}
          </p>
        ) : (
          <div className="space-y-8">
            {view.topStaffQuestions.length > 0 ? (
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-muted-foreground" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">
                    {COPY.askRivet.topStaffQuestionsTitle}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{COPY.askRivet.topStaffQuestionsLead}</p>
                <ul className="mt-3 space-y-2">
                  {view.topStaffQuestions.slice(0, isCompact ? 4 : 8).map((item) => (
                    <li
                      key={item.question}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/45 bg-muted/10 px-3 py-2.5"
                    >
                      <p className="min-w-0 text-sm font-medium text-foreground">&ldquo;{item.question}&rdquo;</p>
                      <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {COPY.askRivet.staffQuestionStats(item.askCount, item.preventedCount)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {view.confusionAreas.length > 0 ? (
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">
                    {COPY.askRivet.confusionAreasTitle}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{COPY.askRivet.confusionAreasLead}</p>
                <ul className="mt-3 space-y-2">
                  {view.confusionAreas.slice(0, isCompact ? 3 : 6).map((area) => (
                    <li
                      key={area.question}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-3"
                    >
                      <p className="text-sm font-medium text-foreground">&ldquo;{area.question}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted-foreground">{area.summary}</p>
                      <p className="mt-1.5 text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
                        {COPY.askRivet.confusionAreaStats(area.askCount, area.lowConfidenceCount)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(view.recommendations.length > 0 || view.repeatedWithFixes.length > 0) && !isCompact ? (
              <div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">
                    {COPY.askRivet.suggestedFixesTitle}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{COPY.askRivet.suggestedFixesLead}</p>
                <ul className="mt-3 space-y-2">
                  {(view.recommendations.length > 0
                    ? view.recommendations
                    : view.repeatedWithFixes.map((item) => ({
                        fixKind: item.fixKind,
                        question: item.displayQuestion,
                        normalizedQuestion: item.normalizedQuestion,
                        askCount: item.askCount,
                        href: fixKindHref(item.fixKind, {
                          standardId: item.standardId,
                          question: item.displayQuestion,
                        }),
                        reasonKey: item.fixKind,
                      }))
                  ).map((rec) => {
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

            {isCompact && (view.recommendations.length > 0 || view.confusionAreas.length > 0) ? (
              <Link
                href="/questions-prevented"
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                {COPY.askRivet.viewFullIntelligence} →
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

function HeroMetric({
  label,
  value,
  suffix,
  sub,
}: {
  label: string
  value: string
  suffix?: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-background/80 px-4 py-4 shadow-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[2.75rem]">
        {value}
        {suffix ? <span className="text-2xl font-medium text-muted-foreground">{suffix}</span> : null}
      </p>
      {sub ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageCircle
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/10 px-3 py-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  )
}
