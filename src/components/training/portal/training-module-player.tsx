"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react"

import {
  completePortalTrainingItem,
  markPortalVideoWatched,
  submitPortalQuiz,
} from "@/app/actions/training-portal"
import { StepProofCapture } from "@/components/completion-proof/step-proof-capture"
import { STANDARD_QUIZ_TYPE_LABELS } from "@/lib/training/portal/quiz"
import { canCompletePortalItem, getPortalCompletionBlockers } from "@/lib/training/portal/completion-rules"
import { formatEstimatedDuration } from "@/lib/training/portal/estimate-time"
import type { PortalModuleView, PortalTrainingItem } from "@/lib/training/portal/types"
import { Button } from "@/components/ui/button"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export function TrainingModulePlayer({
  view,
  businessId,
}: {
  view: PortalModuleView
  businessId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [activeIndex, setActiveIndex] = useState(view.activeItemIndex)
  const [banner, setBanner] = useState<string | null>(null)
  const [quizDraft, setQuizDraft] = useState<Record<string, number>>({})

  const item = view.items[activeIndex]
  const blockers = useMemo(() => (item ? getPortalCompletionBlockers(item) : []), [item])
  const canComplete = item ? canCompletePortalItem(item) : false

  function run<T>(fn: () => Promise<T>, opts?: { advanceOnComplete?: boolean }) {
    setBanner(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === "object" && "ok" in res && res.ok === false) {
        setBanner("message" in res ? String((res as { message: string }).message) : "Something went wrong.")
        return
      }
      if (
        res &&
        typeof res === "object" &&
        "ok" in res &&
        res.ok === true &&
        "passed" in res &&
        (res as { passed: boolean }).passed === false
      ) {
        setBanner(COPY.staffPortal.quizFailed)
        return
      }
      if (opts?.advanceOnComplete && activeIndex < view.items.length - 1) {
        setActiveIndex((i) => i + 1)
      }
      router.refresh()
    })
  }

  if (!item) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <p className="mt-3 text-lg font-semibold">{COPY.staffPortal.moduleCompleteTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{COPY.staffPortal.moduleCompleteLead}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/learn/certifications" />}>
            {COPY.staffPortal.moduleCompleteCerts}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            nativeButton={false}
            render={<Link href="/learn" />}
          >
            {COPY.staffPortal.moduleCompleteHome}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {view.businessName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight text-foreground">{view.title}</h1>
        {view.description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{view.description}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-foreground">{COPY.staffPortal.playerProgressLabel}</span>
          <span className="tabular-nums text-muted-foreground">{view.progressPct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${view.progressPct}%` }}
          />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          Est. {formatEstimatedDuration(view.estimatedTotalMinutes)} total · Play {activeIndex + 1} of{" "}
          {view.items.length}
        </p>
      </div>

      {banner ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {banner}
        </p>
      ) : null}

        <TrainingItemCard
          item={item}
          businessId={businessId}
          moduleId={view.moduleId}
          pending={pending}
          quizDraft={quizDraft}
          onQuizDraftChange={setQuizDraft}
          onRun={run}
          onRefresh={() => router.refresh()}
        />

      <div className="sticky bottom-4 z-10 space-y-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur">
        {blockers.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {blockers.map((b) => (
              <li key={b.code}>· {b.message}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{COPY.staffPortal.readyToComplete}</p>
        )}
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={pending || !canComplete || item.progress.completed}
          onClick={() =>
            run(
              () =>
                completePortalTrainingItem({
                  moduleId: view.moduleId,
                  trainingItemId: item.trainingItemId,
                }),
              { advanceOnComplete: true }
            )
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {item.progress.completed ? COPY.staffPortal.playCompleted : COPY.staffPortal.markPlayComplete}
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending || activeIndex === 0}
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="size-4" aria-hidden />
            {COPY.staffPortal.previousPlay}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending || activeIndex >= view.items.length - 1}
            onClick={() => {
              if (!item.progress.completed) {
                setBanner(COPY.staffPortal.finishPlayBeforeNext)
                return
              }
              setActiveIndex((i) => Math.min(view.items.length - 1, i + 1))
            }}
          >
            {COPY.staffPortal.nextPlay}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

function TrainingItemCard({
  item,
  businessId,
  moduleId,
  pending,
  quizDraft,
  onQuizDraftChange,
  onRun,
  onRefresh,
}: {
  item: PortalTrainingItem
  businessId: string
  moduleId: string
  pending: boolean
  quizDraft: Record<string, number>
  onQuizDraftChange: (v: Record<string, number>) => void
  onRun: <T>(fn: () => Promise<T>) => void
  onRefresh: () => void
}) {
  return (
    <article className="space-y-6 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <header>
        <p className="text-xs font-medium text-muted-foreground">
          Est. {formatEstimatedDuration(item.estimatedMinutes)} for this play
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{item.title}</h2>
        {item.description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        ) : null}
      </header>

      {item.capture?.trainingPack?.learningObjectives.length ? (
        <section className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
          <h3 className="text-sm font-semibold text-foreground">Learning objectives</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {item.capture.trainingPack.learningObjectives.map((obj) => (
              <li key={obj}>{obj}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {item.capture?.trainingPack?.lessonSections?.length ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Lessons</h3>
          {item.capture.trainingPack.lessonSections.map((lesson) => (
            <article key={lesson.id} className="rounded-xl border border-border/50 bg-muted/10 p-3">
              <h4 className="text-sm font-medium text-foreground">{lesson.title}</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{lesson.body}</p>
              {lesson.mediaId ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-border/50">
                  {lesson.mediaKind === "video" ? (
                    <video
                      src={`/api/standard-media/${lesson.mediaId}`}
                      controls
                      playsInline
                      className="aspect-video w-full bg-black"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/standard-media/${lesson.mediaId}`}
                      alt={lesson.title}
                      className="max-h-56 w-full object-cover"
                    />
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {item.videoUrl ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Video</h3>
          <div className="overflow-hidden rounded-xl border border-border/50 bg-black">
            <video
              src={item.videoUrl}
              controls
              playsInline
              className="aspect-video w-full"
              onEnded={() => {
                if (!item.progress.videoWatched) {
                  onRun(() =>
                    markPortalVideoWatched({
                      moduleId,
                      trainingItemId: item.trainingItemId,
                    })
                  )
                }
              }}
            />
          </div>
          {item.progress.videoWatched ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Video watched</p>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                onRun(() =>
                  markPortalVideoWatched({
                    moduleId,
                    trainingItemId: item.trainingItemId,
                  })
                )
              }
            >
              Mark video watched
            </Button>
          )}
        </section>
      ) : null}

      {item.steps.length > 0 ? (
        <StepProofCapture
          moduleId={moduleId}
          trainingItemId={item.trainingItemId}
          standardId={item.standardId}
          businessId={businessId}
          steps={item.steps}
          checklistStepIds={item.progress.stepChecklist}
          stepProofByStepId={item.progress.stepProofByStepId}
          completed={item.progress.completed}
          onRefresh={onRefresh}
        />
      ) : null}

      {item.capture?.trainingPack?.visualQuizzes.length ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{COPY.staffPortal.visualCheckTitle}</h3>
          <p className="text-xs text-muted-foreground">{COPY.staffPortal.visualCheckNote}</p>
          <ul className="space-y-3">
            {item.capture.trainingPack.visualQuizzes.map((vq) => (
              <li key={vq.id} className="space-y-2 rounded-xl border border-border/50 bg-muted/15 p-3">
                <p className="text-sm font-medium text-foreground">{vq.prompt}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-xs text-foreground">
                    <span className="font-semibold">Good · </span>
                    {vq.goodLabel}
                  </p>
                  <p className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-xs text-foreground">
                    <span className="font-semibold">Bad · </span>
                    {vq.badLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {item.quiz.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{COPY.staffPortal.knowledgeCheckTitle}</h3>
          {item.progress.quizPassed ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">{COPY.staffPortal.quizPassed}</p>
          ) : (
            <ul className="space-y-4">
              {item.quiz.map((q) => (
                <li key={q.id} className="space-y-2 rounded-xl border border-border/50 bg-muted/15 p-3">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {STANDARD_QUIZ_TYPE_LABELS[q.type]}
                  </p>
                  <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, idx) => (
                      <label
                        key={`${q.id}-${idx}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted/50"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="size-4"
                          disabled={pending}
                          checked={(quizDraft[q.id] ?? item.progress.quizAnswers[q.id]) === idx}
                          onChange={() => onQuizDraftChange({ ...quizDraft, [q.id]: idx })}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </li>
              ))}
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  const answers = { ...item.progress.quizAnswers, ...quizDraft }
                  onRun(() =>
                    submitPortalQuiz({
                      moduleId,
                      trainingItemId: item.trainingItemId,
                      standardId: item.standardId,
                      answers,
                      questions: item.quiz.map((q) => ({ id: q.id, correctIndex: q.correctIndex })),
                    })
                  )
                }}
              >
                {COPY.staffPortal.submitQuiz}
              </Button>
            </ul>
          )}
        </section>
      ) : null}
      {item.capture?.trainingPack?.certificationBadge ? (
        <section className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {item.capture.trainingPack.certificationBadge.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {item.capture.trainingPack.certificationBadge.description}
          </p>
        </section>
      ) : null}
    </article>
  )
}
