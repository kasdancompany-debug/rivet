"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Pencil, RotateCcw, Save } from "lucide-react"

import {
  previewPlaySystemFromText,
  quickCaptureAndSaveDraft,
} from "@/app/actions/quick-capture"
import { convertWorkflowDemonstration } from "@/app/actions/workflow-capture"
import { transcribeVoiceCapture } from "@/app/actions/voice-capture"
import { CapturePlayHero } from "@/components/sops/capture-play-hero"
import { CapturePlayWowPreview } from "@/components/sops/capture-play-wow-preview"
import type { PlaySystemPreview } from "@/lib/sops/quick-capture/build-play-system-preview"
import type { QuickCaptureSource } from "@/lib/sops/quick-capture/types"
import { useVoiceCapture } from "@/hooks/use-voice-capture"
import { useWorkflowVideoCapture } from "@/hooks/use-workflow-video-capture"
import { buildPlaySystemPreview } from "@/lib/sops/quick-capture/build-play-system-preview"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const GENERATING_MESSAGES = [
  "Reading the operational problem…",
  "Drafting a professional play title…",
  "Building steps and verification…",
  "Generating training module and quiz…",
  "Preparing the Ask Rivet answer…",
]

type Phase = "intake" | "generating" | "preview"

export function CapturePlayExperience({
  businessId,
  initialPlayPrompt = "",
}: {
  businessId: string
  initialPlayPrompt?: string
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>(
    initialPlayPrompt.trim().length >= 8 ? "generating" : "intake"
  )
  const [prompt, setPrompt] = useState(initialPlayPrompt)
  const [preview, setPreview] = useState<PlaySystemPreview | null>(null)
  const [source, setSource] = useState<QuickCaptureSource | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)
  const [pending, startTransition] = useTransition()

  const runPreview = useCallback((text: string) => {
    setError(null)
    setPhase("generating")
    setMessageIndex(0)
    startTransition(async () => {
      const res = await previewPlaySystemFromText(text)
      if (!res.ok) {
        setError(res.message)
        setPhase("intake")
        return
      }
      setPreview(res.preview)
      setSource(res.source)
      setPrompt(text)
      setPhase("preview")
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }, [])

  useEffect(() => {
    const trimmed = initialPlayPrompt.trim()
    if (trimmed.length >= 8) {
      runPreview(trimmed)
    }
  }, [initialPlayPrompt, runPreview])

  const onGenerate = () => runPreview(prompt)

  useEffect(() => {
    if (phase !== "generating") return
    const timer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % GENERATING_MESSAGES.length)
    }, 1400)
    return () => clearInterval(timer)
  }, [phase])

  const onSaveDraft = () => {
    if (!preview) return
    setError(null)
    startTransition(async () => {
      const res = await quickCaptureAndSaveDraft({
        businessId,
        text: preview.originalPrompt,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(`/sops/capture/${res.id}`)
    })
  }

  const onRefine = () => {
    if (!preview) return
    setError(null)
    startTransition(async () => {
      const res = await quickCaptureAndSaveDraft({
        businessId,
        text: preview.originalPrompt,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(`/sops/capture/${res.id}?refine=1`)
    })
  }

  const onStartOver = () => {
    setPreview(null)
    setSource(null)
    setError(null)
    setPhase("intake")
    setPrompt("")
  }

  const onWorkflowRecordingComplete = useCallback(
    (blob: Blob) => {
      setError(null)
      startTransition(async () => {
        const formData = new FormData()
        formData.append("video", blob, "workflow.webm")
        const result = await convertWorkflowDemonstration(formData)
        if (!result.ok) {
          setError(result.message)
          return
        }
        setPrompt(result.transcript)
        const built = buildPlaySystemPreview(result.draft, result.transcript)
        setPreview(built)
        setSource(result.source)
        setPhase("preview")
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
    },
    []
  )

  const {
    isRecording: workflowRecording,
    error: workflowError,
    bindPreview: bindWorkflowPreview,
    toggleRecording: toggleWorkflowRecording,
  } = useWorkflowVideoCapture(onWorkflowRecordingComplete)

  const onVoiceRecordingComplete = useCallback(
    (blob: Blob) => {
      setError(null)
      setVoiceTranscribing(true)
      startTransition(async () => {
        const formData = new FormData()
        formData.append("audio", blob, "capture.webm")
        const transcribed = await transcribeVoiceCapture(formData)
        setVoiceTranscribing(false)
        if (!transcribed.ok) {
          setError(transcribed.message)
          return
        }
        setPrompt(transcribed.transcript)
        runPreview(transcribed.transcript)
      })
    },
    [runPreview]
  )

  const {
    isRecording: voiceRecording,
    error: voiceError,
    toggleRecording: toggleVoiceRecording,
  } = useVoiceCapture(onVoiceRecordingComplete)

  useEffect(() => {
    if (voiceError) setError(voiceError)
  }, [voiceError])

  useEffect(() => {
    if (workflowError) setError(workflowError)
  }, [workflowError])

  const generating = phase === "generating" || pending

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/sops" />}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Plays library
        </Button>
        {phase === "preview" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground"
            disabled={generating}
            onClick={onStartOver}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Start over
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {phase === "intake" ? (
        <CapturePlayHero
          value={prompt}
          onChange={setPrompt}
          onGenerate={onGenerate}
          generating={generating}
          onVoiceToggle={toggleVoiceRecording}
          onWorkflowToggle={toggleWorkflowRecording}
          voiceRecording={voiceRecording}
          voiceTranscribing={voiceTranscribing}
          workflowRecording={workflowRecording}
          workflowProcessing={generating && workflowRecording === false}
          workflowPreviewRef={bindWorkflowPreview}
        />
      ) : null}

      {phase === "generating" ? (
        <div
          className={cn(
            "flex min-h-[20rem] flex-col items-center justify-center rounded-[1.75rem]",
            "border border-border/60 bg-gradient-to-b from-muted/30 to-background px-8 py-16 text-center"
          )}
        >
          <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
          <p className="mt-6 text-lg font-semibold tracking-tight text-foreground">
            {GENERATING_MESSAGES[messageIndex]}
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Turning your frustration into a play, training, quiz, and crew-ready answer.
          </p>
        </div>
      ) : null}

      {phase === "preview" && preview ? (
        <>
          <CapturePlayWowPreview preview={preview} />

          {source === "heuristic" ? (
            <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              Drafted locally—add OPENAI_API_KEY for richer inference. You can refine any field before
              publishing.
            </p>
          ) : null}

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Save to your library, then add photos before publishing.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2"
                disabled={generating}
                onClick={onRefine}
              >
                <Pencil className="size-4" aria-hidden />
                Refine details
              </Button>
              <Button
                type="button"
                className="h-11 gap-2"
                disabled={generating}
                onClick={onSaveDraft}
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-4" aria-hidden />
                )}
                Save Play
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
