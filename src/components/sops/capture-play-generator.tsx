"use client"

import { Loader2, Sparkles, Square, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { QuickCaptureSource } from "@/lib/sops/quick-capture/types"
import { cn } from "@/lib/utils"

export function CapturePlayGenerator({
  value,
  onChange,
  generating,
  generated,
  source,
  generatedFromVoice,
  generatedFromWorkflow,
  onGenerate,
  voiceRecording,
  voiceTranscribing,
  onVoiceToggle,
  workflowRecording,
  workflowProcessing,
  onWorkflowToggle,
  workflowPreviewRef,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  generating: boolean
  generated: boolean
  source: QuickCaptureSource | null
  generatedFromVoice?: boolean
  generatedFromWorkflow?: boolean
  onGenerate: () => void
  voiceRecording?: boolean
  voiceTranscribing?: boolean
  onVoiceToggle?: () => void
  workflowRecording?: boolean
  workflowProcessing?: boolean
  onWorkflowToggle?: () => void
  workflowPreviewRef?: (el: HTMLVideoElement | null) => void
  disabled?: boolean
}) {
  const canGenerate = value.trim().length >= 8
  const voiceBusy = voiceRecording || voiceTranscribing
  const workflowBusy = workflowRecording || workflowProcessing
  const inputsDisabled = disabled || generating || voiceBusy || workflowBusy

  return (
    <section
      className={cn(
        "space-y-5 rounded-2xl border px-5 py-6 sm:px-7 sm:py-8",
        "border-foreground/10 bg-gradient-to-b from-muted/40 to-muted/10 shadow-sm"
      )}
      aria-labelledby="capture-play-generator-heading"
    >
      <div className="space-y-2">
        <h1
          id="capture-play-generator-heading"
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]"
        >
          Describe what keeps happening
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Tell Rivet the recurring problem—not the SOP. We infer the operational meaning, root causes,
          and a playable standard. Or show us with{" "}
          <span className="font-medium text-foreground">Watch me do it</span>.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="play-prompt" className="sr-only">
          Describe what keeps happening
        </Label>
        <Textarea
          id="play-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Si keeps forgetting to load the freezer properly..."
          disabled={inputsDisabled}
          className="min-h-[11rem] resize-y border-border/60 bg-background/90 text-base leading-relaxed sm:min-h-[12rem] sm:text-lg"
        />
      </div>

      {workflowRecording ? (
        <div className="overflow-hidden rounded-xl border border-rose-500/30 bg-black">
          <video
            ref={workflowPreviewRef}
            className="aspect-video w-full object-cover"
            muted
            playsInline
            autoPlay
          />
          <p className="px-3 py-2 text-xs font-medium text-rose-100">
            Recording workflow — narrate each step as you do it.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full sm:w-auto sm:min-w-[11rem]"
          disabled={inputsDisabled || !canGenerate}
          onClick={onGenerate}
        >
          {generating && !voiceTranscribing && !workflowProcessing ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="mr-2 size-4" aria-hidden />
          )}
          Generate Play
        </Button>

        {onWorkflowToggle ? (
          <Button
            type="button"
            size="lg"
            variant={workflowRecording ? "destructive" : "outline"}
            className={cn(
              "h-12 w-full sm:w-auto sm:min-w-[11rem]",
              workflowRecording && "shadow-[0_0_0_2px_hsl(var(--destructive)/0.25)]"
            )}
            disabled={disabled || generating || voiceBusy || workflowProcessing}
            onClick={onWorkflowToggle}
            aria-pressed={workflowRecording}
          >
            {workflowProcessing ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : workflowRecording ? (
              <Square className="mr-2 size-3.5 fill-current" aria-hidden />
            ) : (
              <Video className="mr-2 size-4" aria-hidden />
            )}
            {workflowProcessing
              ? "Analyzing workflow…"
              : workflowRecording
                ? "Stop recording"
                : "Watch me do it"}
          </Button>
        ) : null}

        {onVoiceToggle ? (
          <Button
            type="button"
            size="lg"
            variant={voiceRecording ? "destructive" : "outline"}
            className={cn(
              "h-12 w-full sm:w-auto sm:min-w-[11rem]",
              voiceRecording && "shadow-[0_0_0_2px_hsl(var(--destructive)/0.25)]"
            )}
            disabled={disabled || generating || workflowBusy || voiceTranscribing}
            onClick={onVoiceToggle}
            aria-pressed={voiceRecording}
          >
            {voiceTranscribing ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : voiceRecording ? (
              <Square className="mr-2 size-3.5 fill-current" aria-hidden />
            ) : null}
            {voiceTranscribing
              ? "Transcribing…"
              : voiceRecording
                ? "Stop recording"
                : "🎤 Talk it out"}
          </Button>
        ) : null}

        {!canGenerate && !voiceBusy && !workflowBusy ? (
          <p className="text-xs text-muted-foreground">A short sentence is enough to start.</p>
        ) : null}
      </div>

      {generated && generatedFromWorkflow ? (
        <p className="rounded-lg border border-sky-500/25 bg-sky-500/[0.08] px-3 py-2 text-xs font-medium leading-relaxed text-sky-950 dark:text-sky-100/90">
          Generated from your workflow demonstration
        </p>
      ) : null}

      {generated && generatedFromVoice ? (
        <p className="rounded-lg border border-violet-500/25 bg-violet-500/[0.08] px-3 py-2 text-xs font-medium leading-relaxed text-violet-950 dark:text-violet-100/90">
          Generated from voice
        </p>
      ) : null}

      {generated && source ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-xs leading-relaxed text-emerald-950 dark:text-emerald-100/90">
          {source === "openai" || source === "workflow" || source === "media"
            ? "Play generated from operational inference—review title, root causes, steps, and training below."
            : "Play drafted locally—add OPENAI_API_KEY for richer inference, then edit any field below."}
        </p>
      ) : null}
    </section>
  )
}
