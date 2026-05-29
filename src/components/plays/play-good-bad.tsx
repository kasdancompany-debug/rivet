"use client"

import { Check, X } from "lucide-react"

import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { parseStandardMediaApiId } from "@/lib/standards/standard-media-display"
import type { StepExampleRef } from "@/lib/sops/play-metadata"
import { PlayMediaPreview } from "@/components/plays/play-media-preview"
import { cn } from "@/lib/utils"

export function PlayGoodBadExample({
  good,
  bad,
  mediaById,
}: {
  good?: StepExampleRef
  bad?: StepExampleRef
  mediaById: Map<string, StandardMediaRowSigned> | Record<string, StandardMediaRowSigned>
}) {
  if (!good && !bad) return null

  const lookup =
    mediaById instanceof Map
      ? (id: string) => mediaById.get(id)
      : (id: string) => mediaById[id]

  return (
    <div className="space-y-4">
      {good ? (
        <PlayExampleSection
          variant="good"
          title="Good example"
          example={good}
          media={resolveExampleMedia(good, lookup)}
        />
      ) : null}
      {bad ? (
        <PlayExampleSection
          variant="bad"
          title="Bad example"
          example={bad}
          media={resolveExampleMedia(bad, lookup)}
        />
      ) : null}
    </div>
  )
}

function resolveExampleMedia(
  example: StepExampleRef,
  lookup: (id: string) => StandardMediaRowSigned | undefined
): StandardMediaRowSigned | undefined {
  if (example.mediaId) return lookup(example.mediaId)
  const fromUrl = parseStandardMediaApiId(example.url)
  return fromUrl ? lookup(fromUrl) : undefined
}

function PlayExampleSection({
  variant,
  title,
  example,
  media,
}: {
  variant: "good" | "bad"
  title: string
  example: StepExampleRef
  media?: StandardMediaRowSigned
}) {
  const isGood = variant === "good"
  const Icon = isGood ? Check : X
  const explanation =
    example.caption?.trim() ||
    (isGood ? "Match this on the line." : "Stop if you see this — fix before continuing.")

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl ring-1",
        isGood
          ? "bg-emerald-500/[0.04] ring-emerald-500/25"
          : "bg-rose-500/[0.04] ring-rose-500/25"
      )}
    >
      <figcaption className="flex items-center gap-2.5 px-4 py-3">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            isGood
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          )}
        >
          <Icon className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <span className="text-base font-semibold text-foreground">{title}</span>
      </figcaption>

      {media ? (
        <div className="px-1 pb-1">
          <PlayMediaPreview
            media={media}
            aspect="video"
            className="overflow-hidden rounded-xl"
            alt={explanation}
          />
        </div>
      ) : example.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={example.url}
          alt={explanation}
          className="max-h-56 w-full object-cover"
        />
      ) : null}

      <p className="px-4 pb-4 pt-2 text-[15px] leading-relaxed text-muted-foreground">{explanation}</p>
    </figure>
  )
}
