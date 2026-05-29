"use client"

import Link from "next/link"
import { GraduationCap, Target, BookOpen, ClipboardCheck, ShieldCheck } from "lucide-react"

import type { PlayTrainingPack } from "@/lib/training/generate-training-pack"
import { STANDARD_QUIZ_TYPE_LABELS } from "@/lib/sops/generate-standard-quiz"
import { PlayTrainingGenerateButton } from "@/components/plays/play-training-generate-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function PlayTrainingPanel({
  pack,
  moduleId,
  standardId,
  isOwner,
  playPublished,
}: {
  pack: PlayTrainingPack | null
  moduleId: string | null
  standardId: string
  isOwner: boolean
  playPublished: boolean
}) {
  if (!pack && isOwner && playPublished) {
    return (
      <section className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] p-5 shadow-sm sm:p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Staff training
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">Training draft building…</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Publishing this play should auto-generate a training draft. If it is missing, generate it now—then review
          objectives, lessons, media, quizzes, checklist, and certification before publishing to crew.
        </p>
        <div className="mt-4">
          <PlayTrainingGenerateButton standardId={standardId} />
        </div>
      </section>
    )
  }

  if (!pack) return null

  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Staff training
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">Crew learning path</h2>
          <Badge
            variant="outline"
            className={cn(
              "mt-2 text-[0.62rem]",
              pack.status === "published"
                ? "border-emerald-500/30 text-emerald-800"
                : "border-amber-500/30 text-amber-900"
            )}
          >
            {pack.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwner && pack.status === "draft" ? (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/sops/${standardId}/training`} />}
            >
              Review & publish training
            </Button>
          ) : isOwner ? (
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href={`/sops/${standardId}/training`} />}
            >
              Edit training
            </Button>
          ) : null}
          {moduleId ? (
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/training/modules/${moduleId}`} />}>
              Open module
            </Button>
          ) : null}
        </div>
      </div>

      {isOwner && pack.status === "draft" ? (
        <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100">
          Training draft is ready—crew will not see it until you publish from the training editor.
        </p>
      ) : null}

      {pack.learningObjectives.length > 0 ? (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Target className="size-3.5" aria-hidden />
            Learning objectives
          </p>
          <ul className="mt-2 space-y-2">
            {pack.learningObjectives.map((obj) => (
              <li key={obj} className="text-sm leading-relaxed text-foreground">
                {obj}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pack.lessonSections.length > 0 ? (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <BookOpen className="size-3.5" aria-hidden />
            Lessons
          </p>
          <ul className="mt-2 space-y-2">
            {pack.lessonSections.slice(0, 4).map((lesson) => (
              <li key={lesson.id} className="rounded-lg border border-border/45 bg-muted/10 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{lesson.body}</p>
                {lesson.mediaId ? (
                  <p className="mt-1 text-[0.62rem] text-muted-foreground">Includes photo or video from play</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pack.quizQuestions.length > 0 ? (
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Quiz preview</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {pack.quizQuestions.slice(0, 2).map((q) => (
              <li key={q.id}>
                <span className="text-[0.62rem] uppercase text-muted-foreground">
                  {STANDARD_QUIZ_TYPE_LABELS[q.type]}
                </span>
                <span className="ml-2">{q.prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pack.completionChecklist.length > 0 ? (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <ClipboardCheck className="size-3.5" aria-hidden />
            Completion checklist
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {pack.completionChecklist.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pack.requiresManagerSignOff ? (
        <div className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Manager sign-off required before certification.</span>
        </div>
      ) : null}

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
        <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">{pack.certificationBadge.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pack.certificationBadge.description}</p>
        </div>
      </div>
    </section>
  )
}
