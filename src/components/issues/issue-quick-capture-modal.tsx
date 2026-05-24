"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import { Loader2, Mic, MicOff, Plus } from "lucide-react"

import { quickCaptureIssue } from "@/app/actions/issue-quick-capture"
import { transcribeVoiceCapture } from "@/app/actions/voice-capture"
import { QUICK_CAPTURE_TIME_OPTIONS } from "@/lib/issues/quick-capture/helpers"
import { COPY } from "@/lib/interface-copy"
import { useVoiceCapture } from "@/hooks/use-voice-capture"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ProfileOption = { id: string; full_name: string | null; role: string | null }

export function IssueQuickCaptureModal({
  open,
  onOpenChange,
  businessId,
  profiles,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  profiles: ProfileOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [whatHappened, setWhatHappened] = useState("")
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [timeLostMinutes, setTimeLostMinutes] = useState<number>(15)
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
  const [transcribing, setTranscribing] = useState(false)

  const reset = useCallback(() => {
    setWhatHappened("")
    setSelectedPeople([])
    setTimeLostMinutes(15)
    setVoiceTranscript(null)
    setError(null)
    setTranscribing(false)
  }, [])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const handleVoiceBlob = useCallback(async (blob: Blob) => {
    setTranscribing(true)
    setError(null)
    const formData = new FormData()
    formData.set("audio", blob, "capture.webm")
    const res = await transcribeVoiceCapture(formData)
    setTranscribing(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setVoiceTranscript(res.transcript)
    setWhatHappened((prev) => {
      const trimmed = prev.trim()
      return trimmed ? `${trimmed}\n\n${res.transcript}` : res.transcript
    })
  }, [])

  const { isRecording, error: voiceError, toggleRecording } = useVoiceCapture(handleVoiceBlob)

  useEffect(() => {
    if (voiceError) setError(voiceError)
  }, [voiceError])

  function togglePerson(id: string) {
    setSelectedPeople((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const res = await quickCaptureIssue({
        businessId,
        whatHappened,
        peopleInvolvedIds: selectedPeople,
        timeLostMinutes,
        voiceNoteTranscript: voiceTranscript,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      onOpenChange(false)
      router.push(`/issues/${res.id}`)
      router.refresh()
    })
  }

  const voiceBusy = isRecording || transcribing
  const canSave = whatHappened.trim().length > 0 && !voiceBusy && !pending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl px-4 pt-5 sm:mx-auto sm:max-w-lg">
        <SheetHeader className="px-0 text-left">
          <SheetTitle>{COPY.issues.quickCaptureTitle}</SheetTitle>
          <SheetDescription>{COPY.issues.quickCaptureHint}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-0 py-2">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="qc-what">{COPY.issues.quickCaptureWhatHappened}</Label>
            <Textarea
              id="qc-what"
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder={COPY.issues.quickCaptureWhatPlaceholder}
              rows={3}
              className="min-h-[5rem] resize-none rounded-xl text-base"
              disabled={pending || voiceBusy}
              autoFocus
            />
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className="rounded-full"
              disabled={pending || transcribing}
              onClick={toggleRecording}
            >
              {transcribing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : isRecording ? (
                <MicOff className="size-4" aria-hidden />
              ) : (
                <Mic className="size-4" aria-hidden />
              )}
              {transcribing
                ? COPY.issues.quickCaptureVoiceTranscribing
                : isRecording
                  ? COPY.issues.quickCaptureVoiceStop
                  : COPY.issues.quickCaptureVoiceNote}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{COPY.issues.quickCapturePeople}</Label>
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">{COPY.issues.quickCapturePeopleEmpty}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => {
                  const selected = selectedPeople.includes(p.id)
                  const name = p.full_name?.trim() || "Team member"
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={pending}
                      onClick={() => togglePerson(p.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/10 font-medium text-foreground"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{COPY.issues.quickCaptureTimeLost}</Label>
            <div className="flex flex-wrap gap-2" role="group" aria-label={COPY.issues.quickCaptureTimeLost}>
              {QUICK_CAPTURE_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  type="button"
                  disabled={pending}
                  onClick={() => setTimeLostMinutes(opt.minutes)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors",
                    timeLostMinutes === opt.minutes
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-muted/20 text-foreground hover:bg-muted/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="px-0 pb-6">
          <Button type="button" className="h-11 w-full rounded-xl text-base" disabled={!canSave} onClick={save}>
            {pending ? COPY.issues.quickCaptureSaving : COPY.issues.quickCaptureSave}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function IssueQuickCaptureTrigger({
  businessId,
  profiles,
  label,
  className,
  defaultOpen = false,
}: {
  businessId: string
  profiles: ProfileOption[]
  label?: string
  className?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <Button type="button" className={className} onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        {label ?? COPY.issues.quickCaptureCta}
      </Button>
      <IssueQuickCaptureModal
        open={open}
        onOpenChange={setOpen}
        businessId={businessId}
        profiles={profiles}
      />
    </>
  )
}
