"use client"

import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CaptureMediaInferenceProps = {
  canGenerate: boolean
  generating: boolean
  mediaSummary: string
  onGenerate: () => void
  disabled?: boolean
  generated?: boolean
  contextSummary?: string | null
}

export function CaptureMediaInference({
  canGenerate,
  generating,
  mediaSummary,
  onGenerate,
  disabled,
  generated,
  contextSummary,
}: CaptureMediaInferenceProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4 sm:px-5",
        canGenerate
          ? "border-primary/25 bg-primary/[0.04]"
          : "border-border/60 bg-muted/10"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Infer play from uploaded media</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Rivet reads your video narration, audio notes, and photos — then reconstructs the operational
            process (steps, verification, root causes, training questions). It does not summarize uploads.
          </p>
          {mediaSummary ? (
            <p className="mt-2 text-xs font-medium text-foreground/80">Ready: {mediaSummary}</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Upload a demonstration video, photos, or an audio explanation first.
            </p>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          className="h-10 shrink-0 gap-2 sm:min-w-[10rem]"
          disabled={disabled || generating || !canGenerate}
          onClick={onGenerate}
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {generating ? "Analyzing media…" : "Generate from media"}
        </Button>
      </div>

      {generated && contextSummary ? (
        <p className="mt-3 rounded-lg border border-sky-500/25 bg-sky-500/[0.08] px-3 py-2 text-xs font-medium leading-relaxed text-sky-950 dark:text-sky-100/90">
          Play inferred from {contextSummary}. Review steps and operational memory below.
        </p>
      ) : null}
    </div>
  )
}
