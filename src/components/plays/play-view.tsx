"use client"



import { useCallback, useEffect, useMemo, useState } from "react"

import Link from "next/link"

import { Pencil } from "lucide-react"



import type { PlayViewModel } from "@/lib/plays/build-play-view-model"

import type { SopPlayCompletion } from "@/lib/sops/sop-play-completion"

import {

  loadPlayStepCompletion,

  savePlayStepCompletion,

} from "@/lib/plays/play-completion"

import { Button } from "@/components/ui/button"

import { PlayGoodBadExample } from "@/components/plays/play-good-bad"

import { PlayHeader } from "@/components/plays/play-header"

import { PlayMediaLibrary, resolvePlayMediaFromModel } from "@/components/plays/play-media-library"

import { PlayMissionBrief } from "@/components/plays/play-mission-brief"

import { PlayRunProgress } from "@/components/plays/play-run-progress"

import { PlayStepCard } from "@/components/plays/play-step-card"

import { PlayTrainingPanel } from "@/components/plays/play-training-panel"

import { SopDocumentActions } from "@/components/sops/sop-document-actions"

import { StandardArchiveButton } from "@/components/sops/standard-archive-button"

import { COPY } from "@/lib/interface-copy"

import { cn } from "@/lib/utils"



export function PlayView({

  model,

  actions,

  isOwner = false,

  staffMode = false,

  teamCompletion = null,

}: {

  model: PlayViewModel

  actions?: { editHref: string; showArchive: boolean }

  isOwner?: boolean

  staffMode?: boolean

  teamCompletion?: SopPlayCompletion | null

}) {

  const mediaById = new Map(model.signedMedia.map((m) => [m.id, m]))

  const playMedia = resolvePlayMediaFromModel(model)

  const supplementalMedia =

    !playMedia.walkthrough &&

    (playMedia.audioExplanation ||

      playMedia.referencePhotos.length > 0 ||

      playMedia.supportingDocuments.length > 0)



  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set())



  useEffect(() => {
    if (staffMode) return
    setCompletedIds(loadPlayStepCompletion(model.standardId))
  }, [model.standardId, staffMode])

  const stepsCompleted = useMemo(
    () => (staffMode ? 0 : model.steps.filter((s) => completedIds.has(s.id)).length),
    [completedIds, model.steps, staffMode]
  )

  const activeStepIndex = useMemo(() => {
    if (staffMode) return 0
    const firstOpen = model.steps.findIndex((s) => !completedIds.has(s.id))
    return firstOpen === -1 ? Math.max(0, model.steps.length - 1) : firstOpen
  }, [completedIds, model.steps, staffMode])

  const toggleStep = useCallback(
    (stepId: string) => {
      if (staffMode) return
      setCompletedIds((prev) => {
        const next = new Set(prev)
        if (next.has(stepId)) next.delete(stepId)
        else next.add(stepId)
        savePlayStepCompletion(model.standardId, [...next])
        return next
      })
    },
    [model.standardId, staffMode]
  )

  const allStepsDone = !staffMode && model.steps.length > 0 && stepsCompleted >= model.steps.length



  return (

    <div className="mx-auto w-full max-w-xl pb-20 sm:max-w-2xl">

      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">

        <Link

          href={staffMode ? "/learn/plays" : "/sops"}

          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"

        >

          {staffMode ? COPY.staffPortal.playBack : "← Plays"}

        </Link>

        {!staffMode && actions ? (

          <div className="flex flex-wrap gap-2">

            <SopDocumentActions standardId={model.standardId} published={model.status === "active"} />

            <Button className="h-9 rounded-xl" nativeButton={false} render={<Link href={actions.editHref} />}>

              <Pencil className="size-4" />

              Edit

            </Button>

            {actions.showArchive ? <StandardArchiveButton sopId={model.standardId} /> : null}

          </div>

        ) : null}

      </div>



      <PlayHeader

        title={model.title}

        category={model.category}

        estimatedMinutes={model.estimatedMinutes}

        assignedRoles={model.assignedRoles}

        riskLabel={model.riskLabel}

        riskLevel={model.riskLevel}

        status={model.status}

        updatedAt={model.updatedAt}
        stepsCompleted={staffMode ? 0 : stepsCompleted}
        stepsTotal={model.steps.length}

        teamCompletion={teamCompletion}

      />



      {playMedia.walkthrough ? (

        <section className="mt-8 overflow-hidden rounded-3xl shadow-lg ring-1 ring-border/40" aria-label="Walkthrough">

          <PlayMediaLibrary walkthrough={playMedia.walkthrough} referencePhotos={[]} supportingDocuments={[]} />

        </section>

      ) : null}



      <PlayMissionBrief

        className="mt-8"

        operationalProblem={model.operationalProblem}

        successCriteria={model.successCriteria}

      />



      {supplementalMedia ? (

        <section className="mt-8 space-y-3" aria-label="Reference media">

          <h2 className="text-lg font-semibold tracking-tight text-foreground">Reference media</h2>

          <PlayMediaLibrary

            audioExplanation={playMedia.audioExplanation}

            referencePhotos={playMedia.referencePhotos}

            supportingDocuments={playMedia.supportingDocuments}

            className="rounded-3xl border border-border/40 bg-card p-4 sm:p-5"

          />

        </section>

      ) : null}



      <section className="mt-10" aria-label="Play steps">

        {model.steps.length > 0 && !staffMode ? (
          <PlayRunProgress
            className="mb-6"
            stepsCompleted={stepsCompleted}
            stepsTotal={model.steps.length}
            activeStepIndex={activeStepIndex}
          />
        ) : null}

        {staffMode ? (
          <p className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-muted-foreground">
            {COPY.staffPortal.playReferenceLead}
          </p>
        ) : allStepsDone ? (

          <p

            className={cn(

              "mb-6 rounded-2xl bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-900 dark:text-emerald-100"

            )}

            role="status"

          >

            Play complete — you ran every step without needing the owner.

          </p>

        ) : (
          <p className="mb-6 text-sm text-muted-foreground">
            Work top to bottom. Mark each step when verification is done.
          </p>
        )}



        <ol className="space-y-6 sm:space-y-8">

          {model.steps.length === 0 ? (

            <li className="rounded-3xl border border-dashed border-border/60 px-6 py-16 text-center">

              <p className="text-lg font-semibold text-foreground">No steps yet</p>

              <p className="mt-2 text-sm text-muted-foreground">

                Capture this play to add the sequence your crew runs under pressure.

              </p>

            </li>

          ) : (

            model.steps.map((step, i) => (

              <li key={step.id}>

                <PlayStepCard
                  step={step}
                  completed={staffMode ? false : completedIds.has(step.id)}
                  onToggleComplete={staffMode ? undefined : () => toggleStep(step.id)}
                  isActive={!staffMode && i === activeStepIndex && !allStepsDone}
                  readOnly={staffMode}
                />

              </li>

            ))

          )}

        </ol>

      </section>



      {(model.globalGoodExamples.length > 0 || model.globalBadExamples.length > 0) && (

        <section className="mt-10 space-y-4" aria-label="Floor examples">

          <h2 className="text-lg font-semibold tracking-tight text-foreground">Floor examples</h2>

          <PlayGoodBadExample

            good={

              model.globalGoodExamples[0]

                ? {

                    url: model.globalGoodExamples[0].url,

                    caption: model.globalGoodExamples[0].caption,

                    mediaId: model.globalGoodExamples[0].mediaId,

                  }

                : undefined

            }

            bad={

              model.globalBadExamples[0]

                ? {

                    url: model.globalBadExamples[0].url,

                    caption: model.globalBadExamples[0].caption,

                    mediaId: model.globalBadExamples[0].mediaId,

                  }

                : undefined

            }

            mediaById={mediaById}

          />

        </section>

      )}



      {!staffMode ? (

        <div className="mt-12">

          <PlayTrainingPanel

            pack={model.trainingPack}

            moduleId={model.trainingModuleId}

            standardId={model.standardId}

            isOwner={isOwner}

            playPublished={model.status === "active"}

          />

        </div>

      ) : null}

    </div>

  )

}


