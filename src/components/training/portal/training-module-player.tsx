"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react"

import {
  completePortalTrainingItem,
  markPortalVideoWatched,
  savePortalStepChecklist,
  savePortalStepPhoto,
  submitPortalQuiz,
} from "@/app/actions/training-portal"
import {
  prepareStandardMediaUpload,
  finalizeStandardMediaUpload,
} from "@/app/actions/standard-media"
import { uploadStandardMediaToSignedUrl } from "@/lib/standards/upload-standard-media-client"
import { STANDARD_QUIZ_TYPE_LABELS } from "@/lib/training/portal/quiz"
import { canCompletePortalItem, getPortalCompletionBlockers } from "@/lib/training/portal/completion-rules"
import { formatEstimatedDuration } from "@/lib/training/portal/estimate-time"
import type { PortalModuleView, PortalTrainingItem } from "@/lib/training/portal/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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

  function run<T>(fn: () => Promise<T>) {
    setBanner(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === "object" && "ok" in res && res.ok === false) {
        setBanner("message" in res ? String((res as { message: string }).message) : "Something went wrong.")
        return
      }
      router.refresh()
    })
  }

  if (!item) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <p className="mt-3 text-lg font-semibold">Module complete</p>
        <p className="mt-1 text-sm text-muted-foreground">You finished every play in this module.</p>
        <Button className="mt-6 w-full" nativeButton={false} render={<Link href="/learn" />}>
          Back to my training
        </Button>
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
          <span className="font-medium text-foreground">Progress</span>
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
      />

      <div className="sticky bottom-4 z-10 space-y-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur">
        {blockers.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {blockers.map((b) => (
              <li key={b.code}>· {b.message}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Ready to mark this play complete.</p>
        )}
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={pending || !canComplete || item.progress.completed}
          onClick={() =>
            run(() =>
              completePortalTrainingItem({
                moduleId: view.moduleId,
                trainingItemId: item.trainingItemId,
              })
            )
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {item.progress.completed ? "Completed" : "Mark play complete"}
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
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending || activeIndex >= view.items.length - 1}
            onClick={() => setActiveIndex((i) => Math.min(view.items.length - 1, i + 1))}
          >
            Next
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
}: {
  item: PortalTrainingItem
  businessId: string
  moduleId: string
  pending: boolean
  quizDraft: Record<string, number>
  onQuizDraftChange: (v: Record<string, number>) => void
  onRun: <T>(fn: () => Promise<T>) => void
}) {
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)

  async function uploadPhoto(stepId: string, file: File) {
    setUploadingStepId(stepId)
    try {
      const prep = await prepareStandardMediaUpload({
        businessId,
        standardId: item.standardId,
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
      })
      if (!prep.ok) throw new Error(prep.message)
      await uploadStandardMediaToSignedUrl(prep.signedUrl, file, () => {})
      const fin = await finalizeStandardMediaUpload({
        businessId,
        standardId: item.standardId,
        storagePath: prep.path,
        contentType: file.type,
        byteSize: file.size,
      })
      if (!fin.ok) throw new Error(fin.message)
      onRun(() =>
        savePortalStepPhoto({
          moduleId,
          trainingItemId: item.trainingItemId,
          stepId,
          mediaId: fin.row.id,
          signedUrl: fin.row.signedUrl,
        })
      )
    } finally {
      setUploadingStepId(null)
    }
  }

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
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">SOP checklist</h3>
          <ul className="space-y-2">
            {item.steps.map((step) => {
              const checked = item.progress.stepChecklist.includes(step.id)
              const needsPhoto = step.requires_photo_confirmation
              const proof = item.progress.photoProofs.find((p) => p.stepId === step.id)
              return (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-xl border px-3 py-3",
                    step.is_critical ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-border/50 bg-muted/15"
                  )}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={pending || item.progress.completed}
                      className="mt-0.5"
                      onCheckedChange={(v) => {
                        const next = v === true
                        const ids = next
                          ? [...item.progress.stepChecklist, step.id]
                          : item.progress.stepChecklist.filter((id) => id !== step.id)
                        onRun(() =>
                          savePortalStepChecklist({
                            moduleId,
                            trainingItemId: item.trainingItemId,
                            stepIds: ids,
                          })
                        )
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">{step.title}</span>
                      {step.instructions ? (
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {step.instructions}
                        </span>
                      ) : null}
                    </span>
                  </label>
                  {needsPhoto ? (
                    <div className="mt-3 border-t border-border/40 pt-3">
                      <Label className="text-xs text-muted-foreground">Photo proof required</Label>
                      {proof?.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proof.signedUrl}
                          alt=""
                          className="mt-2 max-h-40 w-full rounded-lg object-cover"
                        />
                      ) : null}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-foreground"
                        disabled={pending || uploadingStepId === step.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) void uploadPhoto(step.id, file)
                        }}
                      />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {item.quiz.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Knowledge check</h3>
          {item.progress.quizPassed ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Quiz passed</p>
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
                Submit quiz
              </Button>
            </ul>
          )}
        </section>
      ) : null}
    </article>
  )
}
