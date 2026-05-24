"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Camera, Check, Loader2, Plus, RefreshCw, Trash2, Video } from "lucide-react"

import {
  abandonStandardMediaUpload,
  deleteStandardMedia,
  finalizeStandardMediaUpload,
  prepareStandardMediaUpload,
} from "@/app/actions/standard-media"
import { saveSop, type SopStepPayload } from "@/app/actions/sops"
import { convertQuickCapture } from "@/app/actions/quick-capture"
import { transcribeVoiceCapture } from "@/app/actions/voice-capture"
import type { StandardWithSteps } from "@/lib/db/queries"
import { SOP_CATEGORIES, isSopCategory } from "@/lib/sops/categories"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import { STANDARDS_CAPTURE_VERSION } from "@/lib/standards-capture/types"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { validateStandardMediaUpload } from "@/lib/standards/standard-media-validation"
import { uploadStandardMediaToSignedUrl } from "@/lib/standards/upload-standard-media-client"
import { TRAINING_ROLE_PRESETS } from "@/lib/training/roles"
import type { QuickCaptureDraft } from "@/lib/sops/quick-capture/types"
import { CaptureFormActionBar } from "@/components/sops/capture-form-action-bar"
import { CaptureFloorTestCard, type FloorTestAnswer } from "@/components/sops/capture-floor-test-card"
import { CapturePlayGenerator } from "@/components/sops/capture-play-generator"
import { CaptureStepEditor, type CaptureStepRow } from "@/components/sops/capture-step-editor"
import { SopTitleSuggestions } from "@/components/sops/sop-title-suggestions"
import { useVoiceCapture } from "@/hooks/use-voice-capture"
import { suggestSopTitles } from "@/lib/sops/title-suggestions/suggest-sop-titles"
import { shouldShowPublishImpact } from "@/lib/sops/publish-impact"
import { emptyCaptureStepFields, stepPayloadExtras, walkthroughStepPayload } from "@/lib/sops/step-fields"
import type { Json } from "@/types/database"
import type { StandardStatus } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type LocalStep = CaptureStepRow

function newStep(): LocalStep {
  return {
    key: crypto.randomUUID(),
    title: "",
    instructions: "",
    media_url: "",
    ...emptyCaptureStepFields(),
  }
}
type MediaUploadJob = {
  id: string
  fileName: string
  progress: number
  phase: "preparing" | "uploading" | "finalizing" | "error"
  errorMessage?: string
  retry?: () => void
}

function hydrateFromStandard(
  s: StandardWithSteps,
  signedMedia: StandardMediaRowSigned[]
): {
  title: string
  purpose: string
  category: string
  videoUrl: string
  walkthroughMediaId: string | null
  photoUrls: string[]
  assignedRoles: string[]
  competencyMarkers: string[]
  importanceLevel: number
  ownerDependencyLevel: number
  estimatedTimeMinutes: number | null
  steps: LocalStep[]
} {
  const cap = parseStandardsCapture(s.standards_capture)
  const ordered = [...s.standard_steps].sort((a, b) => a.step_order - b.step_order)
  let videoUrl = cap?.walkthroughMediaId ? "" : (cap?.videoUrl?.trim() ?? "")
  let walkthroughMediaId = cap?.walkthroughMediaId?.trim() ?? null
  let stepRows = ordered.map((st) => ({
    key: st.id,
    title: st.title,
    instructions: st.instructions,
    requiresPhoto: st.requires_photo_confirmation,
    media_url: st.media_url ?? "",
    estimatedMinutes:
      st.estimated_time_minutes != null ? String(st.estimated_time_minutes) : "",
    isCritical: st.is_critical ?? false,
    verification: st.verification ?? "",
    notes: st.notes ?? "",
  }))
  const firstIsVideoWalkthrough =
    stepRows.length > 0 && stepRows[0]!.title === "Watch: operator walkthrough"
  if (firstIsVideoWalkthrough) {
    const mu = stepRows[0]!.media_url?.trim() ?? ""
    if (mu.startsWith("/api/standard-media/")) {
      const id = mu.replace(/^\/api\/standard-media\//, "").split("/")[0] ?? ""
      if (id && !walkthroughMediaId) walkthroughMediaId = id
      videoUrl = ""
    } else if (mu.startsWith("http")) {
      videoUrl = mu || videoUrl
      walkthroughMediaId = null
    }
    stepRows = stepRows.slice(1)
  }
  if (walkthroughMediaId && !signedMedia.some((m) => m.id === walkthroughMediaId)) {
    walkthroughMediaId = null
  }
  if (stepRows.length === 0) {
    stepRows = [newStep()]
  }
  return {
    title: s.title,
    purpose: s.description ?? "",
    category: s.category,
    videoUrl,
    walkthroughMediaId,
    photoUrls: cap?.photoUrls?.length ? [...cap.photoUrls] : [],
    assignedRoles: cap?.assignedRoles?.length ? [...cap.assignedRoles] : [],
    competencyMarkers: cap?.competencyMarkers?.length ? [...cap.competencyMarkers] : [],
    importanceLevel: s.importance_level,
    ownerDependencyLevel: s.owner_dependency_level,
    estimatedTimeMinutes: s.estimated_time_minutes,
    steps: stepRows,
  }
}

function composeSteps(params: {
  videoUrl: string
  walkthroughMediaId: string | null
  rows: LocalStep[]
}): SopStepPayload[] {
  const steps: SopStepPayload[] = []
  const v = params.videoUrl.trim()
  if (params.walkthroughMediaId) {
    steps.push({
      ...walkthroughStepPayload(),
      media_url: `/api/standard-media/${params.walkthroughMediaId}`,
    })
  } else if (v) {
    steps.push({
      ...walkthroughStepPayload(),
      media_url: v,
    })
  }
  for (const r of params.rows) {
    const title = r.title.trim()
    const instructions = r.instructions.trim()
    const media = r.media_url.trim()
    if (!title && !instructions && !media) continue
    steps.push({
      title: title || "Step",
      instructions,
      media_url: media === "" ? null : media,
      requires_photo_confirmation: r.requiresPhoto,
      ...stepPayloadExtras(r),
    })
  }
  return steps
}

function buildCaptureJson(params: {
  videoUrl: string
  walkthroughMediaId: string | null
  photoUrls: string[]
  assignedRoles: string[]
  competencyMarkers: string[]
}): Json {
  const capture: StandardsCaptureV1 = {
    version: STANDARDS_CAPTURE_VERSION,
    photoUrls: [...params.photoUrls],
    videoUrl: params.videoUrl.trim() || null,
    walkthroughMediaId: params.walkthroughMediaId,
    qualityStandards: [],
    acceptableExamples: [],
    unacceptableExamples: [],
    assignedRoles: [...params.assignedRoles],
    competencyMarkers: [...params.competencyMarkers],
  }
  return JSON.parse(JSON.stringify(capture)) as Json
}

export function CaptureStandardForm({
  businessId,
  initial,
  initialSignedMedia = [],
  initialPlayPrompt = "",
  initialTitle = "",
}: {
  businessId: string
  initial?: StandardWithSteps | null
  initialSignedMedia?: StandardMediaRowSigned[]
  initialPlayPrompt?: string
  initialTitle?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedStatus, setSavedStatus] = useState<StandardStatus | null>(initial?.status ?? null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() =>
    initial?.updated_at ? new Date(initial.updated_at).getTime() : null
  )
  const [autosaveSaving, setAutosaveSaving] = useState(false)
  const [autosaveTick, setAutosaveTick] = useState(0)
  const [sopId, setSopId] = useState<string | null>(initial?.id ?? null)

  const hydrated = useMemo(
    () => (initial ? hydrateFromStandard(initial, initialSignedMedia) : null),
    [initial, initialSignedMedia]
  )

  const [title, setTitle] = useState(hydrated?.title ?? initialTitle)
  const [purpose, setPurpose] = useState(hydrated?.purpose ?? "")
  const [category, setCategory] = useState(hydrated?.category ?? SOP_CATEGORIES[0]!.value)
  const [videoUrl, setVideoUrl] = useState(hydrated?.videoUrl ?? "")
  const [walkthroughMediaId, setWalkthroughMediaId] = useState<string | null>(
    hydrated?.walkthroughMediaId ?? null
  )
  const [photoUrls, setPhotoUrls] = useState<string[]>(hydrated?.photoUrls ?? [])
  const [mediaPatch, setMediaPatch] = useState<StandardMediaRowSigned[]>([])
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([])
  const [uploadJobs, setUploadJobs] = useState<MediaUploadJob[]>([])
  const uploadInFlight = uploadJobs.some(
    (j) => j.phase === "preparing" || j.phase === "uploading" || j.phase === "finalizing"
  )
  const [assignedRoles, setAssignedRoles] = useState<string[]>(hydrated?.assignedRoles ?? [])
  const [competencyMarkers, setCompetencyMarkers] = useState<string[]>(hydrated?.competencyMarkers ?? [])
  const [importanceLevel, setImportanceLevel] = useState(hydrated?.importanceLevel ?? 3)
  const [ownerDependencyLevel, setOwnerDependencyLevel] = useState(hydrated?.ownerDependencyLevel ?? 3)
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    hydrated?.estimatedTimeMinutes != null ? String(hydrated.estimatedTimeMinutes) : ""
  )
  const [customRoleDraft, setCustomRoleDraft] = useState("")
  const [trainingCheckpointDraft, setTrainingCheckpointDraft] = useState("")
  const [steps, setSteps] = useState<LocalStep[]>(hydrated?.steps ?? [newStep()])

  const [playPrompt, setPlayPrompt] = useState(hydrated ? "" : initialPlayPrompt)
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [playGenerating, setPlayGenerating] = useState(false)
  const [playGenerated, setPlayGenerated] = useState(false)
  const [playGeneratedFromVoice, setPlayGeneratedFromVoice] = useState(false)
  const [playSource, setPlaySource] = useState<"openai" | "heuristic" | null>(null)
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)
  const [floorTestAnswer, setFloorTestAnswer] = useState<FloorTestAnswer | null>(null)
  const manualFormRef = useRef<HTMLDivElement>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextAutosave = useRef(false)

  const mergedStandardMedia = useMemo(() => {
    const removed = new Set(removedMediaIds)
    const map = new Map<string, StandardMediaRowSigned>()
    const serverById = new Map(initialSignedMedia.map((r) => [r.id, r]))
    for (const r of mediaPatch) {
      if (!removed.has(r.id) && !serverById.has(r.id)) map.set(r.id, r)
    }
    for (const r of initialSignedMedia) {
      if (!removed.has(r.id)) map.set(r.id, r)
    }
    return [...map.values()].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [initialSignedMedia, mediaPatch, removedMediaIds])

  const parsedEstimatedMinutes = useMemo(() => {
    const n = Number(estimatedMinutes)
    if (estimatedMinutes.trim() === "" || Number.isNaN(n)) return null
    return Math.max(0, Math.round(n))
  }, [estimatedMinutes])

  const applyQuickCaptureDraft = useCallback((draft: QuickCaptureDraft) => {
    setTitle(draft.title)
    setPurpose(draft.purpose)
    setCategory(draft.category)
    setImportanceLevel(draft.importanceLevel)
    setOwnerDependencyLevel(draft.ownerDependencyLevel)
    setEstimatedMinutes(String(draft.estimatedTimeMinutes))
    setAssignedRoles(draft.assignedRoles)
    setCompetencyMarkers(draft.trainingCheckpoints)
    setSteps(
      draft.steps.map((step) => ({
        key: crypto.randomUUID(),
        title: step.title,
        instructions: step.instructions,
        media_url: "",
        estimatedMinutes: "",
        isCritical: false,
        verification: "",
        requiresPhoto: false,
        notes: "",
      }))
    )
  }, [])

  const persist = useCallback(
    async (status: StandardStatus, opts?: { silent?: boolean }): Promise<string | null> => {
      const t = title.trim()
      if (!t) {
        if (!opts?.silent) setError("Add a title so your team can find this standard.")
        return null
      }
      if (opts?.silent) setAutosaveSaving(true)
      try {
        const stepsPayload = composeSteps({ videoUrl, walkthroughMediaId, rows: steps })
        const capture = buildCaptureJson({
          videoUrl,
          walkthroughMediaId,
          photoUrls,
          assignedRoles,
          competencyMarkers,
        })

        const res = await saveSop({
          sopId: sopId ?? undefined,
          businessId,
          title: t,
          description: purpose.trim() === "" ? null : purpose.trim(),
          category,
          importance_level: importanceLevel,
          owner_dependency_level: ownerDependencyLevel,
          estimated_time_minutes: parsedEstimatedMinutes,
          status,
          steps: stepsPayload,
          standards_capture: capture,
        })

        if (!res.ok) {
          if (!opts?.silent) setError(res.message)
          return null
        }
        setSopId(res.id)
        setSavedStatus(status)
        setLastSavedAt(Date.now())
        if (!opts?.silent) setError(null)
        if (res.id !== sopId) {
          skipNextAutosave.current = true
          router.replace(`/sops/capture/${res.id}`)
        }
        router.refresh()
        return res.id
      } finally {
        if (opts?.silent) setAutosaveSaving(false)
      }
    },
    [
      assignedRoles,
      businessId,
      category,
      competencyMarkers,
      importanceLevel,
      ownerDependencyLevel,
      parsedEstimatedMinutes,
      photoUrls,
      purpose,
      router,
      sopId,
      steps,
      title,
      videoUrl,
      walkthroughMediaId,
    ]
  )

  const persistRef = useRef(persist)
  useLayoutEffect(() => {
    persistRef.current = persist
  }, [persist])

  useEffect(() => {
    const t = title.trim()
    if (t.length < 2) return

    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      void persistRef.current("draft", { silent: true })
    }, 2800)

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [assignedRoles, category, competencyMarkers, estimatedMinutes, importanceLevel, ownerDependencyLevel, photoUrls, purpose, sopId, steps, title, videoUrl, walkthroughMediaId])

  useEffect(() => {
    if (!lastSavedAt) return
    const id = setInterval(() => setAutosaveTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [lastSavedAt])

  const showPublishImpact = useMemo(
    () =>
      shouldShowPublishImpact({
        title,
        purpose,
        stepCount: steps.filter((s) => s.title.trim() || s.instructions.trim()).length,
        assignedRoleCount: assignedRoles.length,
        ownerDependencyLevel,
      }),
    [assignedRoles.length, ownerDependencyLevel, purpose, steps, title]
  )

  const onPreviewPlay = () => {
    setError(null)
    startTransition(() => {
      void (async () => {
        const id = await persist("draft")
        if (!id) {
          if (!title.trim()) setError("Add a title to preview your play.")
          return
        }
        router.push(`/sops/${id}`)
      })()
    })
  }

  const onPublishClick = () => {
    setError(null)
    startTransition(() => {
      void (async () => {
      const t = title.trim()
      if (!t) {
        setError("Add a title before publishing.")
        return
      }
      const stepsPayload = composeSteps({ videoUrl, walkthroughMediaId, rows: steps })
      const capture = buildCaptureJson({
        videoUrl,
        walkthroughMediaId,
        photoUrls,
        assignedRoles,
        competencyMarkers,
      })
      const res = await saveSop({
        sopId: sopId ?? undefined,
        businessId,
        title: t,
        description: purpose.trim() === "" ? null : purpose.trim(),
        category,
        importance_level: importanceLevel,
        owner_dependency_level: ownerDependencyLevel,
        estimated_time_minutes: parsedEstimatedMinutes,
        status: "active",
        steps: stepsPayload,
        standards_capture: capture,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setSopId(res.id)
      router.push(`/sops/${res.id}`)
      router.refresh()
      })()
    })
  }

  const runGeneratePlay = useCallback(
    (text: string, fromVoice = false) => {
      setError(null)
      setPlayGenerating(true)
      if (!fromVoice) setPlayGeneratedFromVoice(false)
      startTransition(() => {
        void (async () => {
          const res = await convertQuickCapture(text)
          setPlayGenerating(false)
          if (!res.ok) {
            setError(res.message)
            return
          }
          applyQuickCaptureDraft(res.draft)
          setPlaySource(res.source)
          setPlayGenerated(true)
          setPlayGeneratedFromVoice(fromVoice)
          setError(null)
          requestAnimationFrame(() => {
            manualFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          })
        })()
      })
    },
    [applyQuickCaptureDraft]
  )

  const onGeneratePlay = () => {
    runGeneratePlay(playPrompt, false)
  }

  const onVoiceRecordingComplete = useCallback(
    (blob: Blob) => {
      setError(null)
      setVoiceTranscribing(true)
      startTransition(() => {
        void (async () => {
          const formData = new FormData()
          formData.append("audio", blob, "capture.webm")
          const transcribed = await transcribeVoiceCapture(formData)
          setVoiceTranscribing(false)
          if (!transcribed.ok) {
            setError(transcribed.message)
            return
          }
          setPlayPrompt(transcribed.transcript)
          runGeneratePlay(transcribed.transcript, true)
        })()
      })
    },
    [runGeneratePlay]
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
    const timer = setTimeout(() => {
      setTitleSuggestions(
        suggestSopTitles({
          category: isSopCategory(category) ? category : "other",
          titleDraft: title,
          contextText: [playPrompt, purpose].filter(Boolean).join(" "),
        })
      )
    }, 280)
    return () => clearTimeout(timer)
  }, [title, category, playPrompt, purpose])

  const toggleRole = (value: string) => {
    setAssignedRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  const addCustomRole = () => {
    const t = customRoleDraft.trim()
    if (!t) return
    setAssignedRoles((prev) => (prev.includes(t) ? prev : [...prev, t]))
    setCustomRoleDraft("")
  }

  const uploadStandardFile = useCallback(
    (file: File, role: "image" | "walkthrough") => {
      const run = async () => {
        const stdId = sopId
        if (!stdId) {
          setError(
            "Add a title and save a draft first. Once this draft has an ID, you can attach photos and video."
          )
          return
        }

        const validated = validateStandardMediaUpload({
          contentType: file.type || "application/octet-stream",
          byteSize: file.size,
        })
        if (!validated.ok) {
          setError(validated.message)
          return
        }
        if (role === "walkthrough" && validated.kind !== "video") {
          setError("Walkthrough uploads must be MP4, MOV, or WebM.")
          return
        }
        if (role === "image" && validated.kind !== "image") {
          setError("Photo uploads must be JPG, PNG, or WebP.")
          return
        }

        const jobId = crypto.randomUUID()
        setUploadJobs((j) => [
          ...j,
          { id: jobId, fileName: file.name, progress: 0, phase: "preparing" },
        ])
        setError(null)
        let pathUsed: string | null = null
        const previousWalkId = walkthroughMediaId

        try {
          if (role === "walkthrough" && previousWalkId) {
            const del = await deleteStandardMedia({
              businessId,
              standardId: stdId,
              mediaId: previousWalkId,
            })
            if (!del.ok) throw new Error(del.message)
            setWalkthroughMediaId(null)
            setRemovedMediaIds((p) => [...p, previousWalkId])
            setMediaPatch((prev) => prev.filter((r) => r.id !== previousWalkId))
          }

          const prep = await prepareStandardMediaUpload({
            businessId,
            standardId: stdId,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            byteSize: file.size,
          })
          if (!prep.ok) throw new Error(prep.message)
          pathUsed = prep.path

          setUploadJobs((j) =>
            j.map((x) => (x.id === jobId ? { ...x, phase: "uploading" as const } : x))
          )

          await uploadStandardMediaToSignedUrl(prep.signedUrl, file, (pct) => {
            setUploadJobs((j) =>
              j.map((x) => (x.id === jobId ? { ...x, progress: pct } : x))
            )
          })

          setUploadJobs((j) =>
            j.map((x) => (x.id === jobId ? { ...x, phase: "finalizing" as const } : x))
          )

          const fin = await finalizeStandardMediaUpload({
            businessId,
            standardId: stdId,
            storagePath: prep.path,
            contentType: file.type || "application/octet-stream",
            byteSize: file.size,
          })
          if (!fin.ok) {
            await abandonStandardMediaUpload({
              businessId,
              standardId: stdId,
              storagePath: prep.path,
            })
            throw new Error(fin.message)
          }

          if (role === "walkthrough") {
            setWalkthroughMediaId(fin.row.id)
            setVideoUrl("")
            setMediaPatch((prev) => [...prev.filter((r) => r.id !== fin.row.id), fin.row])
          } else {
            setMediaPatch((prev) => [...prev.filter((r) => r.id !== fin.row.id), fin.row])
          }

          setUploadJobs((j) => j.filter((x) => x.id !== jobId))
          router.refresh()
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upload failed."
          setError(msg)
          if (pathUsed) {
            await abandonStandardMediaUpload({
              businessId,
              standardId: stdId,
              storagePath: pathUsed,
            })
          }
          setUploadJobs((j) =>
            j.map((x) =>
              x.id === jobId
                ? {
                    ...x,
                    phase: "error" as const,
                    errorMessage: msg,
                    retry: () => {
                      setUploadJobs((inner) => inner.filter((z) => z.id !== jobId))
                      void run()
                    },
                  }
                : x
            )
          )
        }
      }

      void run()
    },
    [businessId, router, sopId, walkthroughMediaId]
  )

  async function onPickPhotos(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    for (const file of Array.from(files)) {
      uploadStandardFile(file, "image")
    }
    if (photoInputRef.current) photoInputRef.current.value = ""
  }

  function onPickVideoFile(file: File | null) {
    if (!file) return
    setError(null)
    uploadStandardFile(file, "walkthrough")
    if (videoFileRef.current) videoFileRef.current.value = ""
  }

  async function removeUploadedImage(row: StandardMediaRowSigned) {
    if (!sopId) return
    const res = await deleteStandardMedia({
      businessId,
      standardId: sopId,
      mediaId: row.id,
    })
    if (!res.ok) {
      setError(res.message)
      return
    }
    setRemovedMediaIds((p) => [...p, row.id])
    setMediaPatch((prev) => prev.filter((r) => r.id !== row.id))
    router.refresh()
  }

  async function removeWalkthroughClip() {
    const id = walkthroughMediaId
    if (!sopId || !id) return
    const res = await deleteStandardMedia({
      businessId,
      standardId: sopId,
      mediaId: id,
    })
    if (!res.ok) {
      setError(res.message)
      return
    }
    setWalkthroughMediaId(null)
    setRemovedMediaIds((p) => [...p, id])
    setMediaPatch((prev) => prev.filter((r) => r.id !== id))
    router.refresh()
  }

  const imageRows = mergedStandardMedia.filter((m) => m.kind === "image")

  const statusLabel =
    savedStatus === "active" ? "Published" : savedStatus === "archived" ? "Archived" : "Draft"

  return (
    <div className="relative pb-44 sm:pb-40">
      <div className="mx-auto max-w-lg space-y-8 px-1 sm:max-w-xl">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Capture a standard
            </p>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold",
                savedStatus === "active"
                  ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-900 dark:text-emerald-200"
                  : "border-amber-500/25 bg-amber-500/[0.07] text-amber-950 dark:text-amber-200"
              )}
            >
              {statusLabel}
            </span>
          </div>
          <Button variant="link" className="h-auto px-0 text-muted-foreground" nativeButton={false} render={<Link href="/sops" />}>
            ← Standards
          </Button>
        </header>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <CapturePlayGenerator
          value={playPrompt}
          onChange={setPlayPrompt}
          generating={playGenerating || pending}
          generated={playGenerated}
          source={playSource}
          generatedFromVoice={playGeneratedFromVoice}
          onGenerate={onGeneratePlay}
          voiceRecording={voiceRecording}
          voiceTranscribing={voiceTranscribing}
          onVoiceToggle={toggleVoiceRecording}
          disabled={uploadInFlight}
        />

        <div ref={manualFormRef} className="space-y-8 border-t border-border/50 pt-8">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Review and edit your play</h2>
            <p className="text-sm text-muted-foreground">
              Everything below is editable—tune the title, steps, roles, and training requirements before you publish.
            </p>
          </div>

        <section className="space-y-2">
          <Label htmlFor="cap-title" className="text-base">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cap-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Freezer lock at close"
            className="h-12 text-base"
            autoComplete="off"
          />
          <SopTitleSuggestions
            suggestions={titleSuggestions}
            activeTitle={title}
            onSelect={setTitle}
          />
        </section>

        <section className="space-y-3" aria-labelledby="cat-heading">
          <h2 id="cat-heading" className="text-base font-semibold text-foreground">
            Category
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SOP_CATEGORIES.map((c) => {
              const on = category === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "min-h-[3rem] rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    on
                      ? "border-foreground/25 bg-foreground/[0.06] text-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="cap-purpose" className="text-base">
            What should success look like?
          </Label>
          <p className="text-xs text-muted-foreground">
            Describe what success looks like on the floor.
          </p>
          <Textarea
            id="cap-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Guests receive drinks within 4 minutes..."
            className="min-h-[6.5rem] resize-y text-base leading-relaxed"
          />
        </section>

        <section className="space-y-3" aria-labelledby="steps-heading">
          <div>
            <h2 id="steps-heading" className="text-base font-semibold text-foreground">
              Steps
            </h2>
            <p className="text-xs text-muted-foreground">
              Break the play into steps—add time, verification, and mark anything critical.
            </p>
          </div>
          <ul className="space-y-4">
            {steps.map((row, index) => (
              <CaptureStepEditor
                key={row.key}
                step={row}
                index={index}
                canRemove={steps.length > 1}
                onChange={(patch) =>
                  setSteps((prev) =>
                    prev.map((r) => (r.key === row.key ? { ...r, ...patch } : r))
                  )
                }
                onRemove={() => setSteps((prev) => prev.filter((r) => r.key !== row.key))}
              />
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setSteps((p) => [...p, newStep()])}>
            <Plus className="mr-1.5 size-4" />
            Add step
          </Button>
        </section>

        <section className="space-y-3" aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="text-base font-semibold text-foreground">
            Roles
          </h2>
          <p className="text-xs text-muted-foreground">Who runs this on the floor. Tap all that apply.</p>
          <div className="flex flex-wrap gap-2">
            {TRAINING_ROLE_PRESETS.map((r) => {
              const on = assignedRoles.includes(r.value)
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRole(r.value)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                    on
                      ? "border-foreground/25 bg-foreground/[0.08] text-foreground"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {on ? <Check className="mr-1 inline size-3.5 opacity-80" aria-hidden /> : null}
                  {r.label}
                </button>
              )
            })}
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              addCustomRole()
            }}
          >
            <Input
              value={customRoleDraft}
              onChange={(e) => setCustomRoleDraft(e.target.value)}
              placeholder="Other role (e.g. key holder)"
              className="h-11 flex-1 text-base"
            />
            <Button type="submit" variant="secondary" className="h-11 shrink-0">
              Add
            </Button>
          </form>
          {assignedRoles.filter((r) => !TRAINING_ROLE_PRESETS.some((p) => p.value === r)).length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {assignedRoles
                .filter((r) => !TRAINING_ROLE_PRESETS.some((p) => p.value === r))
                .map((r) => (
                  <li
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-sm"
                  >
                    {r}
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setAssignedRoles((prev) => prev.filter((x) => x !== r))}
                      aria-label={`Remove ${r}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>

        <section className="space-y-4 rounded-xl border border-border/50 bg-card/40 px-4 py-4" aria-labelledby="metadata-heading">
          <h2 id="metadata-heading" className="text-base font-semibold text-foreground">
            Training & timing
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cap-training">Training requirements</Label>
              {competencyMarkers.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {competencyMarkers.map((marker) => (
                    <li
                      key={marker}
                      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-sm text-muted-foreground"
                    >
                      {marker}
                      <button
                        type="button"
                        className="rounded p-0.5 hover:text-foreground"
                        onClick={() =>
                          setCompetencyMarkers((prev) => prev.filter((m) => m !== marker))
                        }
                        aria-label={`Remove ${marker}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add checkpoints crew must pass before running this play solo.
                </p>
              )}
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault()
                  const t = trainingCheckpointDraft.trim()
                  if (!t) return
                  setCompetencyMarkers((prev) => (prev.includes(t) ? prev : [...prev, t]))
                  setTrainingCheckpointDraft("")
                }}
              >
                <Input
                  id="cap-training"
                  value={trainingCheckpointDraft}
                  onChange={(e) => setTrainingCheckpointDraft(e.target.value)}
                  placeholder="e.g. Shadow two closes with key holder"
                  className="h-11 flex-1 text-base"
                />
                <Button type="submit" variant="secondary" className="h-11 shrink-0">
                  Add
                </Button>
              </form>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cap-minutes">Estimated completion time (minutes)</Label>
                <Input
                  id="cap-minutes"
                  type="number"
                  min={0}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="e.g. 5"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Suggested dependency score (1–5)</Label>
                <p className="text-xs text-muted-foreground">
                  How much this play relies on you when it is missing.
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setOwnerDependencyLevel(n)}
                      className={cn(
                        "h-10 flex-1 rounded-lg border text-sm font-semibold",
                        ownerDependencyLevel === n
                          ? "border-foreground/25 bg-foreground/[0.06] text-foreground"
                          : "border-border/70 text-muted-foreground"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="space-y-4" aria-labelledby="media-heading">
          <h2 id="media-heading" className="text-base font-semibold text-foreground">
            Photos & video
          </h2>
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100/90">
            Do not upload confidential staff/customer information unless your policies allow it.
          </p>

          {uploadJobs.length > 0 ? (
            <ul className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
              {uploadJobs.map((job) => (
                <li key={job.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium text-foreground">{job.fileName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {job.phase === "preparing"
                        ? "Preparing…"
                        : job.phase === "uploading"
                          ? `${job.progress}%`
                          : job.phase === "finalizing"
                            ? "Saving…"
                            : "Failed"}
                    </span>
                  </div>
                  {job.phase !== "error" ? (
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-[width] duration-150"
                        style={{
                          width:
                            job.phase === "preparing"
                              ? "8%"
                              : job.phase === "finalizing"
                                ? "100%"
                                : `${job.progress}%`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-destructive">{job.errorMessage ?? "Upload failed."}</p>
                      {job.retry ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => job.retry?.()}
                        >
                          <RefreshCw className="size-3" aria-hidden />
                          Retry
                        </Button>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <Card className="border-border/60 bg-muted/10">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Video className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                Video
              </div>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste link (Loom, Drive, …)"
                className="h-11 font-mono text-sm"
                disabled={Boolean(walkthroughMediaId)}
              />
              {walkthroughMediaId ? (
                <p className="text-xs text-muted-foreground">
                  Remove the uploaded clip below to use a pasted link instead.
                </p>
              ) : null}
              {walkthroughMediaId ? (
                <div className="relative overflow-hidden rounded-lg border border-border/60 bg-black/5">
                  <video
                    src={`/api/standard-media/${walkthroughMediaId}`}
                    controls
                    className="max-h-56 w-full"
                    preload="metadata"
                  >
                    <track kind="captions" />
                  </video>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-2 h-8 shadow-md"
                    onClick={() => void removeWalkthroughClip()}
                  >
                    <Trash2 className="mr-1 size-3.5" aria-hidden />
                    Remove clip
                  </Button>
                </div>
              ) : null}
              <input
                ref={videoFileRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => onPickVideoFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10"
                disabled={uploadInFlight || !sopId}
                onClick={() => videoFileRef.current?.click()}
              >
                {uploadInFlight ? <Loader2 className="size-4 animate-spin" /> : null}
                Upload video file
              </Button>
              {!sopId ? (
                <p className="text-xs text-muted-foreground">
                  Add a title and save a draft once so uploads can attach to this standard.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/10">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Camera className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                Photos
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => void onPickPhotos(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10"
                disabled={uploadInFlight || !sopId}
                onClick={() => photoInputRef.current?.click()}
              >
                {uploadInFlight ? <Loader2 className="size-4 animate-spin" /> : null}
                Upload photos
              </Button>
              {!sopId ? (
                <p className="text-xs text-muted-foreground">
                  Add a title and save a draft once so uploads can attach to this standard.
                </p>
              ) : null}
              {photoUrls.length > 0 || imageRows.length > 0 ? (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photoUrls.map((url) => (
                    <li key={url} className="group relative overflow-hidden rounded-lg border border-border/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="aspect-square w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.opacity = "0.2"
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-md bg-background/95 p-1.5 shadow"
                        onClick={() => setPhotoUrls((prev) => prev.filter((u) => u !== url))}
                        aria-label="Remove photo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                  {imageRows.map((row) => (
                    <li key={row.id} className="group relative overflow-hidden rounded-lg border border-border/60">
                      {row.signedUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={row.signedUrl}
                          alt=""
                          className="aspect-square w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0.2"
                          }}
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                          Preview unavailable
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-md bg-background/95 p-1.5 shadow"
                        onClick={() => void removeUploadedImage(row)}
                        aria-label="Remove photo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <CaptureFloorTestCard value={floorTestAnswer} onChange={setFloorTestAnswer} />
      </div>

      <CaptureFormActionBar
        lastSavedAt={lastSavedAt}
        autosaveSaving={autosaveSaving}
        showImpact={showPublishImpact}
        autosaveTick={autosaveTick}
        pending={pending}
        uploadInFlight={uploadInFlight}
        onPreview={onPreviewPlay}
        onPublish={onPublishClick}
      />
    </div>
    </div>
  )
}
