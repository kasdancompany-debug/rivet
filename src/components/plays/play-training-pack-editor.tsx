"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import Link from "next/link"

import {
  publishTrainingFromPlay,
  regenerateTrainingFromPlay,
  saveTrainingPackDraft,
} from "@/app/actions/play-training"
import type {
  PlayTrainingPack,
  TrainingVideoSection,
  VisualQuizPrompt,
} from "@/lib/training/generate-training-pack"
import type { StandardQuizQuestion } from "@/lib/sops/generate-standard-quiz"
import { STANDARD_QUIZ_TYPE_LABELS } from "@/lib/sops/generate-standard-quiz"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function linesToList(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
}

function listToLines(items: string[]): string {
  return items.join("\n")
}

export function PlayTrainingPackEditor({
  standardId,
  playTitle,
  initialPack,
  moduleId,
}: {
  standardId: string
  playTitle: string
  initialPack: PlayTrainingPack
  moduleId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<string | null>(null)
  const [objectivesText, setObjectivesText] = useState(listToLines(initialPack.learningObjectives))
  const [checklistText, setChecklistText] = useState(listToLines(initialPack.completionChecklist))
  const [certTitle, setCertTitle] = useState(initialPack.certificationBadge.title)
  const [certDescription, setCertDescription] = useState(initialPack.certificationBadge.description)
  const [lessons, setLessons] = useState(initialPack.lessonSections)
  const [videoSections, setVideoSections] = useState(initialPack.videoSections)
  const [scenarioText, setScenarioText] = useState(listToLines(initialPack.scenarioQuestions))
  const [quizQuestions, setQuizQuestions] = useState(initialPack.quizQuestions)
  const [visualQuizzes, setVisualQuizzes] = useState(initialPack.visualQuizzes)

  function buildPack(): PlayTrainingPack {
    return {
      ...initialPack,
      learningObjectives: linesToList(objectivesText).slice(0, 6),
      lessonSections: lessons,
      videoSections,
      scenarioQuestions: linesToList(scenarioText).slice(0, 5),
      quizQuestions,
      visualQuizzes,
      completionChecklist: linesToList(checklistText).slice(0, 12),
      certificationBadge: {
        title: certTitle.trim() || `${playTitle} — certified`,
        description: certDescription.trim(),
      },
      moduleId: moduleId ?? initialPack.moduleId,
      status: "draft",
    }
  }

  function updateQuiz(id: string, patch: Partial<StandardQuizQuestion>) {
    setQuizQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  function updateVideo(index: number, patch: Partial<TrainingVideoSection>) {
    setVideoSections((prev) => prev.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)))
  }

  function updateVisual(id: string, patch: Partial<VisualQuizPrompt>) {
    setVisualQuizzes((prev) => prev.map((vq) => (vq.id === id ? { ...vq, ...patch } : vq)))
  }

  function runSave(onDone?: () => void) {
    setBanner(null)
    startTransition(async () => {
      const res = await saveTrainingPackDraft(standardId, buildPack())
      if (!res.ok) {
        setBanner(res.message)
        return
      }
      onDone?.()
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Review what was generated from <span className="font-medium text-foreground">{playTitle}</span>. Edit
        anything, save a draft, then publish when crew can take it in the Training Center.
      </p>

      {banner ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {banner}
        </p>
      ) : null}

      <section className="space-y-2">
        <Label htmlFor="objectives">Learning objectives</Label>
        <Textarea
          id="objectives"
          value={objectivesText}
          onChange={(e) => setObjectivesText(e.target.value)}
          className="min-h-[7rem] font-mono text-sm"
          placeholder="One objective per line"
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Lesson sections</h2>
          <p className="text-xs text-muted-foreground">
            Short lessons with embedded play media. Media links come from the play upload.
          </p>
        </div>
        <ul className="space-y-3">
          {lessons.map((lesson, index) => (
            <li key={lesson.id} className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-2">
              <Input
                value={lesson.title}
                onChange={(e) =>
                  setLessons((prev) =>
                    prev.map((l, i) => (i === index ? { ...l, title: e.target.value } : l))
                  )
                }
                placeholder="Section title"
              />
              <Textarea
                value={lesson.body}
                onChange={(e) =>
                  setLessons((prev) =>
                    prev.map((l, i) => (i === index ? { ...l, body: e.target.value } : l))
                  )
                }
                className="min-h-[5rem] text-sm"
                placeholder="What crew should learn in this section"
              />
              {lesson.mediaId ? (
                <p className="text-xs text-muted-foreground">Embedded media attached from play</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {videoSections.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Video / photo lessons</h2>
          <ul className="space-y-3">
            {videoSections.map((sec, index) => (
              <li key={`${sec.title}-${index}`} className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-2">
                <Input
                  value={sec.title}
                  onChange={(e) => updateVideo(index, { title: e.target.value })}
                  placeholder="Section title"
                />
                <Textarea
                  value={sec.focus}
                  onChange={(e) => updateVideo(index, { focus: e.target.value })}
                  className="min-h-[3.5rem] text-sm"
                  placeholder="What crew should watch for"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {quizQuestions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Multiple choice quiz</h2>
          <ul className="space-y-3">
            {quizQuestions.map((q) => (
              <li key={q.id} className="rounded-xl border border-border/50 p-4 space-y-2">
                <Badge variant="outline" className="text-[0.62rem]">
                  {STANDARD_QUIZ_TYPE_LABELS[q.type]}
                </Badge>
                <Textarea
                  value={q.prompt}
                  onChange={(e) => updateQuiz(q.id, { prompt: e.target.value })}
                  className="min-h-[3.5rem] text-sm"
                />
                <Textarea
                  value={q.options.join("\n")}
                  onChange={(e) =>
                    updateQuiz(q.id, {
                      options: linesToList(e.target.value).slice(0, 6),
                    })
                  }
                  className="min-h-[4rem] font-mono text-xs"
                  placeholder="One answer option per line"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <Label htmlFor="scenarios">Scenario questions</Label>
        <Textarea
          id="scenarios"
          value={scenarioText}
          onChange={(e) => setScenarioText(e.target.value)}
          className="min-h-[5rem] text-sm"
          placeholder="One scenario prompt per line"
        />
      </section>

      {visualQuizzes.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Visual scenarios</h2>
          <ul className="space-y-3">
            {visualQuizzes.map((vq) => (
              <li key={vq.id} className="rounded-xl border border-border/50 p-4 space-y-2">
                <Textarea
                  value={vq.prompt}
                  onChange={(e) => updateVisual(vq.id, { prompt: e.target.value })}
                  className="min-h-[3rem] text-sm"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={vq.goodLabel}
                    onChange={(e) => updateVisual(vq.id, { goodLabel: e.target.value })}
                    placeholder="Good label"
                  />
                  <Input
                    value={vq.badLabel}
                    onChange={(e) => updateVisual(vq.id, { badLabel: e.target.value })}
                    placeholder="Bad label"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <Label htmlFor="checklist">Completion checklist</Label>
        <Textarea
          id="checklist"
          value={checklistText}
          onChange={(e) => setChecklistText(e.target.value)}
          className="min-h-[6rem] font-mono text-sm"
          placeholder="One checklist item per line"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cert-title">Certification badge title</Label>
          <Input id="cert-title" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cert-desc">Certification description</Label>
          <Textarea
            id="cert-desc"
            value={certDescription}
            onChange={(e) => setCertDescription(e.target.value)}
            className="min-h-[4rem] text-sm"
          />
        </div>
      </section>

      <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">Manager sign-off</p>
        <p className="mt-1 text-muted-foreground">
          {initialPack.requiresManagerSignOff
            ? "Required before the certification badge is earned in Training Center."
            : "Optional for this module."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                "Regenerate training from the current play? Unsaved edits on this page will be replaced."
              )
            ) {
              return
            }
            setBanner(null)
            startTransition(async () => {
              const res = await regenerateTrainingFromPlay(standardId)
              if (!res.ok) {
                setBanner(res.message)
                return
              }
              router.refresh()
            })
          }}
        >
          Regenerate from play
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => runSave()}>
          Save draft
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            runSave(() => {
              startTransition(async () => {
                const res = await publishTrainingFromPlay(standardId)
                if (!res.ok) {
                  setBanner(res.message)
                  return
                }
                router.push(`/training/modules/${res.moduleId}`)
                router.refresh()
              })
            })
          }
        >
          Publish training
        </Button>
        {moduleId ? (
          <Button variant="ghost" nativeButton={false} render={<Link href={`/training/modules/${moduleId}`} />}>
            Open module
          </Button>
        ) : null}
        <Button variant="ghost" nativeButton={false} render={<Link href={`/sops/${standardId}`} />}>
          Back to play
        </Button>
      </div>

      <p
        className={cn(
          "text-xs font-medium",
          initialPack.status === "published" ? "text-emerald-700" : "text-amber-800"
        )}
      >
        Status: {initialPack.status === "published" ? "Published to Training Center" : "Draft — not yet published"}
      </p>
    </div>
  )
}
