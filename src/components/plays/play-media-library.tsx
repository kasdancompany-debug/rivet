"use client"



import { Camera, FileText, Mic } from "lucide-react"



import type { PlayViewModel } from "@/lib/plays/build-play-view-model"

import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"

import { PlayMediaPreview } from "@/components/plays/play-media-preview"

import { cn } from "@/lib/utils"



type PlayMediaLibraryProps = {

  walkthrough?: StandardMediaRowSigned | null

  audioExplanation?: StandardMediaRowSigned | null

  referencePhotos: StandardMediaRowSigned[]

  supportingDocuments: StandardMediaRowSigned[]

  className?: string

}



export function PlayMediaLibrary({

  walkthrough,

  audioExplanation,

  referencePhotos,

  supportingDocuments,

  className,

}: PlayMediaLibraryProps) {

  const hasContent =

    walkthrough || audioExplanation || referencePhotos.length > 0 || supportingDocuments.length > 0



  if (!hasContent) return null



  return (

    <section className={cn("space-y-5", className)} aria-label="Play media">

      {walkthrough ? (

        <PlayMediaPreview media={walkthrough} aspect="video" className="rounded-2xl" />

      ) : null}



      {audioExplanation ? (

        <MediaGroup icon={Mic} label="Audio">

          <PlayMediaPreview media={audioExplanation} className="rounded-2xl ring-1 ring-border/40" />

        </MediaGroup>

      ) : null}



      {referencePhotos.length > 0 ? (

        <MediaGroup icon={Camera} label="Photos">

          <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">

            {referencePhotos.map((photo) => (

              <li

                key={photo.id}

                className="w-[42%] shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-border/50 sm:w-40"

              >

                <PlayMediaPreview media={photo} aspect="square" />

              </li>

            ))}

          </ul>

        </MediaGroup>

      ) : null}



      {supportingDocuments.length > 0 ? (

        <MediaGroup icon={FileText} label="PDFs & files">

          <ul className="space-y-3">

            {supportingDocuments.map((doc) => (

              <li key={doc.id} className="overflow-hidden rounded-2xl ring-1 ring-border/50">

                <PlayMediaPreview media={doc} />

              </li>

            ))}

          </ul>

        </MediaGroup>

      ) : null}

    </section>

  )

}



function MediaGroup({

  icon: Icon,

  label,

  children,

}: {

  icon: typeof Mic

  label: string

  children: React.ReactNode

}) {

  return (

    <div>

      <p className="mb-2.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">

        <Icon className="size-4 opacity-70" aria-hidden />

        {label}

      </p>

      {children}

    </div>

  )

}



export function resolvePlayMediaFromModel(model: PlayViewModel) {

  const mediaById = new Map(model.signedMedia.map((m) => [m.id, m]))

  const walkthrough = model.walkthroughMediaId ? mediaById.get(model.walkthroughMediaId) ?? null : null

  const audioExplanation = model.audioExplanationMediaId

    ? mediaById.get(model.audioExplanationMediaId) ?? null

    : null

  const referencePhotos = model.photoMediaIds

    .map((id) => mediaById.get(id))

    .filter((m): m is StandardMediaRowSigned => m != null)

  const supportingDocuments = model.supportingDocumentMediaIds

    .map((id) => mediaById.get(id))

    .filter((m): m is StandardMediaRowSigned => m != null)



  return { walkthrough, audioExplanation, referencePhotos, supportingDocuments }

}


