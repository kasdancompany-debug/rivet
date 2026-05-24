"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type VoiceCapturePhase = "idle" | "recording" | "unsupported"

const MAX_RECORD_MS = 120_000

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

export function useVoiceCapture(onComplete: (blob: Blob) => void) {
  const [phase, setPhase] = useState<VoiceCapturePhase>("idle")
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mimeTypeRef = useRef<string | undefined>(undefined)

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const stopRecording = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    const recorder = recorderRef.current
    if (recorder && recorder.state !== "inactive") {
      recorder.stop()
      return
    }
    cleanupStream()
    setPhase("idle")
  }, [cleanupStream])

  const startRecording = useCallback(async () => {
    setError(null)

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported")
      setError("Your browser does not support microphone recording.")
      return
    }

    const mimeType = pickMimeType()
    if (!mimeType) {
      setPhase("unsupported")
      setError("Your browser does not support audio recording.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      mimeTypeRef.current = mimeType

      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onerror = () => {
        setError("Recording failed. Try again.")
        cleanupStream()
        setPhase("idle")
      }

      recorder.onstop = () => {
        cleanupStream()
        recorderRef.current = null
        setPhase("idle")

        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current ?? "audio/webm" })
        chunksRef.current = []
        if (blob.size > 0) onCompleteRef.current(blob)
      }

      recorder.start()
      setPhase("recording")
      stopTimerRef.current = setTimeout(() => stopRecording(), MAX_RECORD_MS)
    } catch {
      cleanupStream()
      setPhase("idle")
      setError("Microphone access was denied or unavailable.")
    }
  }, [cleanupStream, stopRecording])

  const toggleRecording = useCallback(() => {
    if (phase === "recording") {
      stopRecording()
      return
    }
    void startRecording()
  }, [phase, startRecording, stopRecording])

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      recorderRef.current?.state !== "inactive" && recorderRef.current?.stop()
      cleanupStream()
    }
  }, [cleanupStream])

  return {
    phase,
    isRecording: phase === "recording",
    error,
    clearError: () => setError(null),
    toggleRecording,
    stopRecording,
  }
}
