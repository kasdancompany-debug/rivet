"use client"

import { Check, X } from "lucide-react"

import { MediaUploadZone } from "@/components/sops/media-upload-zone"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import {
  STANDARD_MEDIA_IMAGE_MIMES,
  STANDARD_MEDIA_VIDEO_MIMES,
} from "@/lib/standards/standard-media-constants"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const EXAMPLE_ACCEPT = [...STANDARD_MEDIA_IMAGE_MIMES, ...STANDARD_MEDIA_VIDEO_MIMES].join(",")

type StepExampleFieldsProps = {
  stepKey: string
  goodCaption: string
  badCaption: string
  goodMedia?: StandardMediaRowSigned | null
  badMedia?: StandardMediaRowSigned | null
  canUpload: boolean
  uploadPending?: boolean
  onGoodCaptionChange: (value: string) => void
  onBadCaptionChange: (value: string) => void
  onUploadGood: (file: File) => void | Promise<void>
  onUploadBad: (file: File) => void | Promise<void>
  onRemoveGood?: () => void
  onRemoveBad?: () => void
}

export function StepExampleFields({
  stepKey,
  goodCaption,
  badCaption,
  goodMedia,
  badMedia,
  canUpload,
  uploadPending,
  onGoodCaptionChange,
  onBadCaptionChange,
  onUploadGood,
  onUploadBad,
  onRemoveGood,
  onRemoveBad,
}: StepExampleFieldsProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">Good vs bad standard</p>
        <p className="text-xs text-muted-foreground">
          Show crew what pass and fail look like — photo, video, and a short explanation.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ExampleColumn
          variant="good"
          stepKey={stepKey}
          caption={goodCaption}
          media={goodMedia}
          canUpload={canUpload}
          uploadPending={uploadPending}
          onCaptionChange={onGoodCaptionChange}
          onUpload={onUploadGood}
          onRemove={onRemoveGood}
        />
        <ExampleColumn
          variant="bad"
          stepKey={stepKey}
          caption={badCaption}
          media={badMedia}
          canUpload={canUpload}
          uploadPending={uploadPending}
          onCaptionChange={onBadCaptionChange}
          onUpload={onUploadBad}
          onRemove={onRemoveBad}
        />
      </div>
    </div>
  )
}

function ExampleColumn({
  variant,
  stepKey,
  caption,
  media,
  canUpload,
  uploadPending,
  onCaptionChange,
  onUpload,
  onRemove,
}: {
  variant: "good" | "bad"
  stepKey: string
  caption: string
  media?: StandardMediaRowSigned | null
  canUpload: boolean
  uploadPending?: boolean
  onCaptionChange: (value: string) => void
  onUpload: (file: File) => void | Promise<void>
  onRemove?: () => void
}) {
  const isGood = variant === "good"
  const Icon = isGood ? Check : X
  const idPrefix = `step-${variant}-${stepKey}`

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border p-2.5",
        isGood
          ? "border-emerald-500/25 bg-emerald-500/[0.04]"
          : "border-rose-500/25 bg-rose-500/[0.04]"
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide",
          isGood ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"
        )}
      >
        <span
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full",
            isGood ? "bg-emerald-500/15" : "bg-rose-500/15"
          )}
        >
          <Icon className="size-2.5" aria-hidden />
        </span>
        {isGood ? "Good example" : "Bad example"}
      </p>

      <MediaUploadZone
        label=""
        accept={EXAMPLE_ACCEPT}
        media={media}
        canUpload={canUpload}
        uploadPending={uploadPending}
        onUpload={onUpload}
        onRemove={onRemove}
        uploadLabel="Add photo or video"
        replaceLabel="Replace"
        previewAspect="video"
        className="[&>p:first-child]:hidden"
      />

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-caption`} className="text-xs text-muted-foreground">
          What makes this {isGood ? "good" : "bad"}?
        </Label>
        <Textarea
          id={`${idPrefix}-caption`}
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder={
            isGood
              ? "Freezer stocked by category, labels facing out, oldest product forward."
              : "Boxes mixed, labels hidden, no rotation."
          }
          className="min-h-[4.5rem] resize-y text-sm"
        />
      </div>
    </div>
  )
}
