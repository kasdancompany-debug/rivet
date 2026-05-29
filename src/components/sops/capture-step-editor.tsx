"use client"

import { AlertTriangle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StepProofRequirementFields } from "@/components/completion-proof/step-proof-requirement-fields"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StepExampleFields } from "@/components/sops/step-example-fields"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import type { CaptureStepFields } from "@/lib/sops/step-fields"
import { cn } from "@/lib/utils"

export type CaptureStepRow = CaptureStepFields & {
  key: string
  title: string
  instructions: string
  media_url: string
}

type CaptureStepEditorProps = {
  step: CaptureStepRow
  index: number
  canRemove: boolean
  canUpload: boolean
  uploadPending?: boolean
  goodExampleMedia?: StandardMediaRowSigned | null
  badExampleMedia?: StandardMediaRowSigned | null
  onChange: (patch: Partial<CaptureStepRow>) => void
  onRemove: () => void
  onUploadGoodExample: (file: File) => void | Promise<void>
  onUploadBadExample: (file: File) => void | Promise<void>
  onRemoveGoodExample?: () => void
  onRemoveBadExample?: () => void
}

export function CaptureStepEditor({
  step,
  index,
  canRemove,
  canUpload,
  uploadPending,
  goodExampleMedia,
  badExampleMedia,
  onChange,
  onRemove,
  onUploadGoodExample,
  onUploadBadExample,
  onRemoveGoodExample,
  onRemoveBadExample,
}: CaptureStepEditorProps) {
  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        step.isCritical
          ? "border-amber-500/35 bg-amber-500/[0.03]"
          : "border-border/60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
          {step.isCritical ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/[0.08] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100/90">
              <AlertTriangle className="size-3 shrink-0" aria-hidden />
              Critical
            </span>
          ) : null}
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 text-muted-foreground"
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="mt-2 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`step-title-${step.key}`} className="text-sm">
            Step title
          </Label>
          <Input
            id={`step-title-${step.key}`}
            value={step.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Step title"
            className="h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`step-instructions-${step.key}`} className="text-sm">
            What to do
          </Label>
          <Textarea
            id={`step-instructions-${step.key}`}
            value={step.instructions}
            onChange={(e) => onChange({ instructions: e.target.value })}
            placeholder="What to do (plain language)"
            className="min-h-[5rem] text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`step-visual-${step.key}`} className="text-sm">
            Visual target
          </Label>
          <Textarea
            id={`step-visual-${step.key}`}
            value={step.visualTarget}
            onChange={(e) => onChange({ visualTarget: e.target.value })}
            placeholder="What done-right looks like on the line"
            className="min-h-[3.5rem] text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`step-mistakes-${step.key}`} className="text-sm">
            Common mistakes
          </Label>
          <Textarea
            id={`step-mistakes-${step.key}`}
            value={step.commonMistakes}
            onChange={(e) => onChange({ commonMistakes: e.target.value })}
            placeholder="One mistake per line — what crew gets wrong under rush"
            className="min-h-[3.5rem] text-sm"
          />
        </div>

        <StepExampleFields
          stepKey={step.key}
          goodCaption={step.goodExampleCaption}
          badCaption={step.badExampleCaption}
          goodMedia={goodExampleMedia}
          badMedia={badExampleMedia}
          canUpload={canUpload}
          uploadPending={uploadPending}
          onGoodCaptionChange={(goodExampleCaption) => onChange({ goodExampleCaption })}
          onBadCaptionChange={(badExampleCaption) => onChange({ badExampleCaption })}
          onUploadGood={onUploadGoodExample}
          onUploadBad={onUploadBadExample}
          onRemoveGood={onRemoveGoodExample}
          onRemoveBad={onRemoveBadExample}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`step-minutes-${step.key}`} className="text-sm">
              Estimated time (min)
            </Label>
            <Input
              id={`step-minutes-${step.key}`}
              type="number"
              min={0}
              value={step.estimatedMinutes}
              onChange={(e) => onChange({ estimatedMinutes: e.target.value })}
              placeholder="e.g. 2"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`step-verification-${step.key}`} className="text-sm">
              Verification
            </Label>
            <Input
              id={`step-verification-${step.key}`}
              value={step.verification}
              onChange={(e) => onChange({ verification: e.target.value })}
              placeholder="How crew proves it is done"
              className="h-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-lg border border-border/50 bg-muted/15 px-3 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={step.isCritical}
              onCheckedChange={(c) => onChange({ isCritical: Boolean(c) })}
            />
            Critical step
            <span className="text-xs font-normal text-muted-foreground">
              — failure here creates real risk
            </span>
          </label>
          <StepProofRequirementFields
            values={{
              requiresPhoto: step.requiresPhoto,
              requiresVideo: step.requiresVideo,
              requiresManagerSignoff: step.requiresManagerSignoff,
              requiresChecklist: step.requiresChecklist,
            }}
            onChange={onChange}
            compact
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`step-notes-${step.key}`} className="text-sm">
            Optional notes
          </Label>
          <Textarea
            id={`step-notes-${step.key}`}
            value={step.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Tips, exceptions, or where to find supplies"
            className="min-h-[3.5rem] resize-y text-sm"
          />
        </div>
      </div>
    </li>
  )
}
