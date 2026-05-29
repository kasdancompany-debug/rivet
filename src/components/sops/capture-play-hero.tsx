"use client"

import { Loader2, Mic, Sparkles, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const EXAMPLE_PROMPTS = [
  "Ashley keeps forgetting freezer stocking.",
  "Si keeps forgetting to load the freezer properly.",
  "New hires skip the closing deposit count.",
  "The espresso dial-in drifts after the morning rush.",
]

export function CapturePlayHero({
  value,
  onChange,
  onGenerate,
  generating,
  onVoiceToggle,
  onWorkflowToggle,
  voiceRecording,
  voiceTranscribing,
  workflowRecording,
  workflowProcessing,
  workflowPreviewRef,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  generating: boolean
  onVoiceToggle?: () => void
  onWorkflowToggle?: () => void
  voiceRecording?: boolean
  voiceTranscribing?: boolean
  workflowRecording?: boolean
  workflowProcessing?: boolean
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
        "relative overflow-hidden rounded-[1.75rem] border border-foreground/10",
        "bg-gradient-to-br from-background via-background to-muted/50",
        "px-6 py-10 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)] sm:px-10 sm:py-14"
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-emerald-500/[0.06] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/80">
            Capture a Play
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Turn frustration into a system
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Describe what keeps going wrong on the floor. Rivet builds the play, training, quiz, and
            Ask Rivet answer—so your team stops routing it back to you.
          </p>
        </div>

        <div className="space-y-4 text-left">
          <Textarea
            id="play-prompt"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ashley keeps forgetting freezer stocking."
            disabled={inputsDisabled}
            className={cn(
              "min-h-[7.5rem] resize-none border-border/50 bg-background/90 text-base leading-relaxed",
              "shadow-inner placeholder:text-muted-foreground/70 sm:min-h-[8.5rem] sm:text-lg"
            )}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canGenerate && !inputsDisabled) {
                e.preventDefault()
                onGenerate()
              }
            }}
          />

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                disabled={inputsDisabled}
                onClick={() => onChange(example)}
                className={cn(
                  "rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-left text-xs",
                  "text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground",
                  "disabled:opacity-50"
                )}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {workflowRecording ? (
          <div className="overflow-hidden rounded-xl border border-rose-500/30 bg-black text-left">
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

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            size="lg"
            className="h-12 min-w-[12rem] text-base shadow-md"
            disabled={inputsDisabled || !canGenerate}
            onClick={onGenerate}
          >
            {generating && !voiceTranscribing && !workflowProcessing ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="mr-2 size-4" aria-hidden />
            )}
            {generating ? "Building your system…" : "Generate my Play"}
          </Button>

          {onWorkflowToggle ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12"
              disabled={disabled || generating || voiceBusy || workflowProcessing}
              onClick={onWorkflowToggle}
            >
              {workflowProcessing ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Video className="mr-2 size-4" aria-hidden />
              )}
              {workflowRecording ? "Stop recording" : "Watch me do it"}
            </Button>
          ) : null}

          {onVoiceToggle ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12"
              disabled={disabled || generating || workflowBusy || voiceTranscribing}
              onClick={onVoiceToggle}
            >
              {voiceTranscribing ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Mic className="mr-2 size-4" aria-hidden />
              )}
              {voiceRecording ? "Stop" : "Talk it out"}
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          {canGenerate
            ? "Press ⌘↵ or Ctrl↵ to generate."
            : "One sentence is enough—Rivet handles the rest."}
        </p>
      </div>
    </section>
  )
}
