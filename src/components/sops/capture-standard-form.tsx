"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Plus } from "lucide-react"

import { deleteStandardMedia } from "@/app/actions/standard-media"
import { saveSop, type SopStepPayload } from "@/app/actions/sops"
import { convertWorkflowDemonstration } from "@/app/actions/workflow-capture"
import { generatePlayFromMedia } from "@/app/actions/media-capture"
import { convertQuickCapture } from "@/app/actions/quick-capture"
import { transcribeVoiceCapture } from "@/app/actions/voice-capture"
import type { StandardWithSteps } from "@/lib/db/queries"
import { SOP_CATEGORIES, isSopCategory } from "@/lib/sops/categories"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import { STANDARDS_CAPTURE_VERSION } from "@/lib/standards-capture/types"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { useOperationalMediaUpload } from "@/lib/media/use-operational-media-upload"
import { validatorForMediaSlot, type MediaUploadSlot } from "@/lib/media/slot-validators"
import { TRAINING_ROLE_PRESETS } from "@/lib/training/roles"
import type { QuickCaptureDraft, QuickCaptureSource } from "@/lib/sops/quick-capture/types"
import { CaptureFormActionBar } from "@/components/sops/capture-form-action-bar"
import { CaptureFloorTestCard, type FloorTestAnswer } from "@/components/sops/capture-floor-test-card"
import { CapturePlayGenerator } from "@/components/sops/capture-play-generator"
import { CapturePlayInsights } from "@/components/sops/capture-play-insights"
import {
  CaptureOperationalMemory,
  emptyOperationalMemoryState,
  operationalMemoryFromState,
  type OperationalMemoryState,
} from "@/components/sops/capture-operational-memory"
import { CaptureMediaInference } from "@/components/sops/capture-media-inference"
import { CapturePlayMediaSection } from "@/components/sops/capture-play-media-section"
import { mergeOperationalMemoryIntoCapture } from "@/lib/standards-capture/operational-memory-publish"
import { isAudioMedia } from "@/lib/standards/standard-media-display"
import { CaptureStepEditor, type CaptureStepRow } from "@/components/sops/capture-step-editor"
import { SopTitleSuggestions } from "@/components/sops/sop-title-suggestions"
import { useWorkflowVideoCapture } from "@/hooks/use-workflow-video-capture"
import { useVoiceCapture } from "@/hooks/use-voice-capture"
import { suggestSopTitles } from "@/lib/sops/title-suggestions/suggest-sop-titles"
import { shouldShowPublishImpact } from "@/lib/sops/publish-impact"
import { emptyCaptureStepFields, playMetadataToCaptureFields, stepPayloadExtras, walkthroughStepPayload } from "@/lib/sops/step-fields"
import { parseStepPlayMetadata } from "@/lib/sops/play-metadata"
import type { Json } from "@/types/database"
import type { StandardStatus } from "@/types/database"
import { Button } from "@/components/ui/button"
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
type UploadStandardFileOptions = {
  replaceMediaId?: string | null
  stepKey?: string
}

function resolveStoredMediaFields(
  cap: StandardsCaptureV1 | null,
  signedMedia: StandardMediaRowSigned[]
): {
  photoMediaIds: string[]
  audioExplanationMediaId: string | null
  supportingDocumentMediaIds: string[]
} {
  const mediaById = new Map(signedMedia.map((m) => [m.id, m]))
  let photoMediaIds = cap?.photoMediaIds?.length ? [...cap.photoMediaIds] : []
  let audioExplanationMediaId = cap?.audioExplanationMediaId ?? null
  let supportingDocumentMediaIds = cap?.supportingDocumentMediaIds?.length
    ? [...cap.supportingDocumentMediaIds]
    : []

  if (
    !audioExplanationMediaId &&
    supportingDocumentMediaIds.length === 0 &&
    (cap?.attachmentMediaIds?.length ?? 0) > 0
  ) {
    for (const id of cap!.attachmentMediaIds!) {
      const row = mediaById.get(id)
      if (isAudioMedia(row) && !audioExplanationMediaId) {
        audioExplanationMediaId = id
      } else {
        supportingDocumentMediaIds.push(id)
      }
    }
  }

  const reserved = new Set([
    cap?.walkthroughMediaId,
    cap?.operationalMemory?.goodExampleMediaId,
    cap?.operationalMemory?.badExampleMediaId,
    audioExplanationMediaId,
    ...supportingDocumentMediaIds,
    ...photoMediaIds,
  ].filter(Boolean) as string[])

  if (photoMediaIds.length === 0) {
    photoMediaIds = signedMedia
      .filter((m) => m.kind === "image" && !reserved.has(m.id))
      .map((m) => m.id)
  }

  return { photoMediaIds, audioExplanationMediaId, supportingDocumentMediaIds }
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
  photoMediaIds: string[]
  audioExplanationMediaId: string | null
  supportingDocumentMediaIds: string[]
  attachmentMediaIds: string[]
  assignedRoles: string[]
  competencyMarkers: string[]
  importanceLevel: number
  ownerDependencyLevel: number
  estimatedTimeMinutes: number | null
  steps: LocalStep[]
  operationalMemory: OperationalMemoryState
} {
  const cap = parseStandardsCapture(s.standards_capture)
  const ordered = [...s.standard_steps].sort((a, b) => a.step_order - b.step_order)
  let videoUrl = cap?.walkthroughMediaId ? "" : (cap?.videoUrl?.trim() ?? "")
  let walkthroughMediaId = cap?.walkthroughMediaId?.trim() ?? null
  let stepRows = ordered.map((st) => ({
    key: st.id,
    ...emptyCaptureStepFields(),
    ...playMetadataToCaptureFields(parseStepPlayMetadata(st.play_metadata)),
    title: st.title,
    instructions: st.instructions,
    requiresPhoto: st.requires_photo_confirmation,
    requiresVideo: st.requires_video_proof ?? false,
    requiresManagerSignoff: st.requires_manager_signoff ?? false,
    requiresChecklist: st.requires_checklist_completion !== false,
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
  const om = cap?.operationalMemory
  const operationalMemory: OperationalMemoryState = {
    ...emptyOperationalMemoryState(),
    successLooksLike: om?.successLooksLike ?? "",
    failureLooksLike: om?.failureLooksLike ?? "",
    newHireMistakesText: (om?.newHireMistakes ?? []).join("\n"),
    ifNobodyAsks: om?.ifNobodyAsks ?? "",
    ownerNote: om?.ownerNote ?? "",
    goodExampleMediaId: om?.goodExampleMediaId ?? null,
    badExampleMediaId: om?.badExampleMediaId ?? null,
  }
  const storedMedia = resolveStoredMediaFields(cap, signedMedia)
  return {
    title: s.title,
    purpose: s.description ?? "",
    category: s.category,
    videoUrl,
    walkthroughMediaId,
    photoUrls: cap?.photoUrls?.length ? [...cap.photoUrls] : [],
    photoMediaIds: storedMedia.photoMediaIds,
    audioExplanationMediaId: storedMedia.audioExplanationMediaId,
    supportingDocumentMediaIds: storedMedia.supportingDocumentMediaIds,
    attachmentMediaIds: cap?.attachmentMediaIds?.length ? [...cap.attachmentMediaIds] : [],
    assignedRoles: cap?.assignedRoles?.length ? [...cap.assignedRoles] : [],
    competencyMarkers: cap?.competencyMarkers?.length ? [...cap.competencyMarkers] : [],
    importanceLevel: s.importance_level,
    ownerDependencyLevel: s.owner_dependency_level,
    estimatedTimeMinutes: s.estimated_time_minutes,
    steps: stepRows,
    operationalMemory,
  }
}

function composeSteps(params: {
  walkthroughMediaId: string | null
  rows: LocalStep[]
}): SopStepPayload[] {
  const steps: SopStepPayload[] = []
  if (params.walkthroughMediaId) {
    steps.push({
      ...walkthroughStepPayload(),
      media_url: `/api/standard-media/${params.walkthroughMediaId}`,
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
      requires_video_proof: r.requiresVideo,
      requires_manager_signoff: r.requiresManagerSignoff,
      requires_checklist_completion: r.requiresChecklist,
      ...stepPayloadExtras(r),
    })
  }
  return steps
}

function buildCaptureJson(params: {
  walkthroughMediaId: string | null
  photoMediaIds: string[]
  audioExplanationMediaId: string | null
  supportingDocumentMediaIds: string[]
  assignedRoles: string[]
  competencyMarkers: string[]
  playDraft: QuickCaptureDraft | null
  operationalMemory: OperationalMemoryState
}): Json {
  const memory = operationalMemoryFromState(params.operationalMemory)
  const attachmentMediaIds = [
    ...params.supportingDocumentMediaIds,
    ...(params.audioExplanationMediaId ? [params.audioExplanationMediaId] : []),
  ]
  const capture: StandardsCaptureV1 = mergeOperationalMemoryIntoCapture(
    {
    version: STANDARDS_CAPTURE_VERSION,
    photoUrls: [],
    photoMediaIds: [...params.photoMediaIds],
    videoUrl: null,
    walkthroughMediaId: params.walkthroughMediaId,
    audioExplanationMediaId: params.audioExplanationMediaId,
    supportingDocumentMediaIds: [...params.supportingDocumentMediaIds],
    attachmentMediaIds,
    playInference: params.playDraft
      ? {
          operationalProblem: params.playDraft.operationalProblem,
          priority: params.playDraft.priority,
          successCriteria: params.playDraft.successCriteria,
          rootCauses: params.playDraft.rootCauses,
          estimatedRisk: params.playDraft.estimatedRisk,
          verificationMethods: params.playDraft.verificationMethods,
          trainingRecommendations: params.playDraft.trainingRecommendations,
          hiddenDependencies: params.playDraft.hiddenDependencies,
          trainingGaps: params.playDraft.trainingGaps,
          supplies: params.playDraft.supplies,
          timingNotes: params.playDraft.timingNotes,
        }
      : undefined,
    qualityStandards: [],
    acceptableExamples: [],
    unacceptableExamples: [],
    assignedRoles: [...params.assignedRoles],
    competencyMarkers: [...params.competencyMarkers],
    },
    memory
  )
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
  const [walkthroughMediaId, setWalkthroughMediaId] = useState<string | null>(
    hydrated?.walkthroughMediaId ?? null
  )
  const [photoMediaIds, setPhotoMediaIds] = useState<string[]>(hydrated?.photoMediaIds ?? [])
  const [audioExplanationMediaId, setAudioExplanationMediaId] = useState<string | null>(
    hydrated?.audioExplanationMediaId ?? null
  )
  const [supportingDocumentMediaIds, setSupportingDocumentMediaIds] = useState<string[]>(
    hydrated?.supportingDocumentMediaIds ?? []
  )
  const [mediaPatch, setMediaPatch] = useState<StandardMediaRowSigned[]>([])
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([])
  const {
    jobs: uploadJobs,
    uploadInFlight,
    upload: uploadOperationalFile,
    dismissJob,
  } = useOperationalMediaUpload({
    businessId,
    standardId: sopId,
    onError: setError,
    onRequireDraft: () =>
      setError("Add a title and save a draft first. Once this draft has an ID, you can attach media."),
  })
  const [assignedRoles, setAssignedRoles] = useState<string[]>(hydrated?.assignedRoles ?? [])
  const [competencyMarkers, setCompetencyMarkers] = useState<string[]>(hydrated?.competencyMarkers ?? [])
  const [operationalMemory, setOperationalMemory] = useState<OperationalMemoryState>(
    hydrated?.operationalMemory ?? emptyOperationalMemoryState()
  )
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
  const [playGeneratedFromWorkflow, setPlayGeneratedFromWorkflow] = useState(false)
  const [playGeneratedFromMedia, setPlayGeneratedFromMedia] = useState(false)
  const [mediaGenerating, setMediaGenerating] = useState(false)
  const [mediaContextSummary, setMediaContextSummary] = useState<string | null>(null)
  const [playSource, setPlaySource] = useState<QuickCaptureSource | null>(null)
  const [playDraft, setPlayDraft] = useState<QuickCaptureDraft | null>(null)
  const [workflowProcessing, setWorkflowProcessing] = useState(false)
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)
  const [floorTestAnswer, setFloorTestAnswer] = useState<FloorTestAnswer | null>(null)
  const manualFormRef = useRef<HTMLDivElement>(null)

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

  const mediaById = useMemo(
    () => new Map(mergedStandardMedia.map((m) => [m.id, m])),
    [mergedStandardMedia]
  )

  const walkthroughMedia = walkthroughMediaId ? mediaById.get(walkthroughMediaId) ?? null : null
  const audioExplanationMedia = audioExplanationMediaId
    ? mediaById.get(audioExplanationMediaId) ?? null
    : null
  const referencePhotoRows = photoMediaIds
    .map((id) => mediaById.get(id))
    .filter((m): m is StandardMediaRowSigned => m != null)
  const supportingDocumentRows = supportingDocumentMediaIds
    .map((id) => mediaById.get(id))
    .filter((m): m is StandardMediaRowSigned => m != null)
  const goodExampleMedia = operationalMemory.goodExampleMediaId
    ? mediaById.get(operationalMemory.goodExampleMediaId) ?? null
    : null
  const badExampleMedia = operationalMemory.badExampleMediaId
    ? mediaById.get(operationalMemory.badExampleMediaId) ?? null
    : null

  const parsedEstimatedMinutes = useMemo(() => {
    const n = Number(estimatedMinutes)
    if (estimatedMinutes.trim() === "" || Number.isNaN(n)) return null
    return Math.max(0, Math.round(n))
  }, [estimatedMinutes])

  const applyQuickCaptureDraft = useCallback((draft: QuickCaptureDraft) => {
    setPlayDraft(draft)
    setTitle(draft.title)
    setPurpose(draft.successCriteria || draft.purpose)
    const stepMistakes = [
      ...new Set(draft.steps.flatMap((s) => s.commonMistakes ?? []).filter(Boolean)),
    ]
    setOperationalMemory((prev) => ({
      ...prev,
      successLooksLike: draft.successCriteria || draft.purpose || prev.successLooksLike,
      failureLooksLike:
        draft.rootCauses.find((c) => c.title.toLowerCase().includes("visual"))?.description ??
        draft.operationalProblem ??
        prev.failureLooksLike,
      newHireMistakesText:
        stepMistakes.length > 0 ? stepMistakes.join("\n") : prev.newHireMistakesText,
    }))
    setCategory(draft.category)
    setImportanceLevel(
      Math.max(
        draft.importanceLevel,
        draft.priority === "critical" ? 5 : draft.priority === "high" ? 4 : draft.priority === "medium" ? 3 : 2
      )
    )
    setOwnerDependencyLevel(draft.ownerDependencyLevel)
    setEstimatedMinutes(String(draft.estimatedTimeMinutes))
    setAssignedRoles(draft.assignedRoles)
    setCompetencyMarkers([
      ...draft.trainingQuestions.slice(0, 4),
      ...draft.trainingCheckpoints,
      ...draft.trainingRecommendations.slice(0, 2),
    ])
    setSteps(
      draft.steps.map((step) => ({
        ...emptyCaptureStepFields(),
        key: crypto.randomUUID(),
        title: step.title,
        instructions: step.instructions,
        media_url: "",
        estimatedMinutes: step.estimatedMinutes != null ? String(step.estimatedMinutes) : "",
        isCritical: step.isCritical ?? false,
        verification: step.verification ?? "",
        requiresPhoto:
          step.proofRequirements?.photo ??
          Boolean(step.verification?.toLowerCase().includes("photo")),
        requiresVideo:
          step.proofRequirements?.video ??
          Boolean(step.verification?.toLowerCase().includes("video")),
        requiresManagerSignoff:
          step.proofRequirements?.managerSignoff ??
          Boolean(
            step.verification?.toLowerCase().includes("manager") ||
              step.verification?.toLowerCase().includes("lead") ||
              step.verification?.toLowerCase().includes("sign-off")
          ),
        requiresChecklist: step.proofRequirements?.checklist !== false,
        notes: step.supplies?.length ? `Supplies: ${step.supplies.join(", ")}` : "",
        visualTarget: step.visualTarget ?? "",
        commonMistakes: (step.commonMistakes ?? []).join("\n"),
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
        const stepsPayload = composeSteps({ walkthroughMediaId, rows: steps })
        const capture = buildCaptureJson({
          walkthroughMediaId,
          photoMediaIds,
          audioExplanationMediaId,
          supportingDocumentMediaIds,
          assignedRoles,
          competencyMarkers,
          playDraft,
          operationalMemory,
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
      photoMediaIds,
      audioExplanationMediaId,
      supportingDocumentMediaIds,
      playDraft,
      operationalMemory,
      importanceLevel,
      ownerDependencyLevel,
      parsedEstimatedMinutes,
      purpose,
      router,
      sopId,
      steps,
      title,
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
  }, [assignedRoles, category, competencyMarkers, estimatedMinutes, importanceLevel, ownerDependencyLevel, operationalMemory, photoMediaIds, audioExplanationMediaId, supportingDocumentMediaIds, playDraft, purpose, sopId, steps, title, walkthroughMediaId])

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
      const stepsPayload = composeSteps({ walkthroughMediaId, rows: steps })
      const capture = buildCaptureJson({
        walkthroughMediaId,
        photoMediaIds,
        audioExplanationMediaId,
        supportingDocumentMediaIds,
        assignedRoles,
        competencyMarkers,
        playDraft,
        operationalMemory,
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
    (text: string, opts?: { fromVoice?: boolean; fromWorkflow?: boolean }) => {
      setError(null)
      setPlayGenerating(true)
      setPlayGeneratedFromVoice(Boolean(opts?.fromVoice))
      setPlayGeneratedFromWorkflow(Boolean(opts?.fromWorkflow))
      setPlayGeneratedFromMedia(false)
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
    setPlayGeneratedFromMedia(false)
    runGeneratePlay(playPrompt)
  }

  const mediaInferenceSummary = useMemo(() => {
    const parts: string[] = []
    if (walkthroughMediaId) parts.push("demonstration video")
    if (audioExplanationMediaId) parts.push("audio explanation")
    if (photoMediaIds.length) parts.push(`${photoMediaIds.length} photo(s)`)
    if (operationalMemory.goodExampleMediaId) parts.push("good example")
    if (operationalMemory.badExampleMediaId) parts.push("bad example")
    if (playPrompt.trim().length >= 8) parts.push("description")
    return parts.join(", ")
  }, [
    audioExplanationMediaId,
    operationalMemory.badExampleMediaId,
    operationalMemory.goodExampleMediaId,
    photoMediaIds.length,
    playPrompt,
    walkthroughMediaId,
  ])

  const canGenerateFromMedia = Boolean(sopId) && mediaInferenceSummary.length > 0

  const onGenerateFromMedia = useCallback(() => {
    if (!sopId) {
      setError("Add a title and save a draft once before generating from media.")
      return
    }
    setError(null)
    setMediaGenerating(true)
    setPlayGeneratedFromMedia(false)
    startTransition(() => {
      void (async () => {
        const res = await generatePlayFromMedia({
          businessId,
          standardId: sopId,
          textPrompt: playPrompt.trim() || undefined,
          walkthroughMediaId,
          audioExplanationMediaId,
          photoMediaIds,
          goodExampleMediaId: operationalMemory.goodExampleMediaId,
          badExampleMediaId: operationalMemory.badExampleMediaId,
        })
        setMediaGenerating(false)
        if (!res.ok) {
          setError(res.message)
          return
        }
        applyQuickCaptureDraft(res.draft)
        setPlaySource(res.source)
        setPlayGenerated(true)
        setPlayGeneratedFromMedia(true)
        setPlayGeneratedFromVoice(false)
        setPlayGeneratedFromWorkflow(false)
        setMediaContextSummary(res.contextSummary)
        setError(null)
        requestAnimationFrame(() => {
          manualFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        })
      })()
    })
  }, [
    applyQuickCaptureDraft,
    audioExplanationMediaId,
    businessId,
    operationalMemory.badExampleMediaId,
    operationalMemory.goodExampleMediaId,
    photoMediaIds,
    playPrompt,
    sopId,
    walkthroughMediaId,
  ])

  const onWorkflowRecordingComplete = useCallback(
    (blob: Blob) => {
      setError(null)
      setWorkflowProcessing(true)
      startTransition(() => {
        void (async () => {
          const formData = new FormData()
          formData.append("video", blob, "workflow.webm")
          const result = await convertWorkflowDemonstration(formData)
          setWorkflowProcessing(false)
          if (!result.ok) {
            setError(result.message)
            return
          }
          setPlayPrompt(result.transcript)
          applyQuickCaptureDraft(result.draft)
          setPlaySource(result.source)
          setPlayGenerated(true)
          setPlayGeneratedFromWorkflow(true)
          setPlayGeneratedFromVoice(false)
          setError(null)
          requestAnimationFrame(() => {
            manualFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          })
        })()
      })
    },
    [applyQuickCaptureDraft]
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
          runGeneratePlay(transcribed.transcript, { fromVoice: true })
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
    if (workflowError) setError(workflowError)
  }, [workflowError])

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
    (
      file: File,
      slot: MediaUploadSlot,
      onUploaded?: (mediaId: string) => void,
      options?: UploadStandardFileOptions
    ) => {
      const replaceId =
        options?.replaceMediaId !== undefined
          ? options.replaceMediaId
          : slot === "walkthrough"
            ? walkthroughMediaId
            : slot === "audio-explanation"
              ? audioExplanationMediaId
              : slot === "good-example"
                ? operationalMemory.goodExampleMediaId
                : slot === "bad-example"
                  ? operationalMemory.badExampleMediaId
                  : null

      const progressSlot =
        slot === "step-good-example" || slot === "step-bad-example"
          ? `${slot}:${options?.stepKey ?? "unknown"}`
          : slot

      return uploadOperationalFile(file, {
        slot: progressSlot,
        validateSlot: validatorForMediaSlot(slot),
        replaceMediaId: replaceId,
        onSuccess: ({ row }) => {
          if (replaceId) {
            setRemovedMediaIds((p) => [...p, replaceId])
          }
          if (slot === "walkthrough") {
            setWalkthroughMediaId(row.id)
          } else if (slot === "reference-photo") {
            setPhotoMediaIds((prev) => [...prev.filter((id) => id !== row.id), row.id])
          } else if (slot === "audio-explanation") {
            setAudioExplanationMediaId(row.id)
          } else if (slot === "supporting-document") {
            setSupportingDocumentMediaIds((prev) => [...prev.filter((id) => id !== row.id), row.id])
          } else if (slot === "good-example") {
            setOperationalMemory((prev) => ({ ...prev, goodExampleMediaId: row.id }))
          } else if (slot === "bad-example") {
            setOperationalMemory((prev) => ({ ...prev, badExampleMediaId: row.id }))
          }
          setMediaPatch((prev) => [...prev.filter((r) => r.id !== row.id), row])
          onUploaded?.(row.id)
          router.refresh()
        },
      })
    },
    [
      audioExplanationMediaId,
      operationalMemory.badExampleMediaId,
      operationalMemory.goodExampleMediaId,
      router,
      uploadOperationalFile,
      walkthroughMediaId,
    ]
  )

  const uploadExampleMedia = useCallback(
    async (kind: "good" | "bad", file: File) => {
      await uploadStandardFile(file, kind === "good" ? "good-example" : "bad-example")
    },
    [uploadStandardFile]
  )

  const uploadStepExampleMedia = useCallback(
    async (stepKey: string, kind: "good" | "bad", file: File) => {
      const row = steps.find((s) => s.key === stepKey)
      const replaceMediaId =
        kind === "good" ? (row?.goodExampleMediaId ?? null) : (row?.badExampleMediaId ?? null)

      await uploadStandardFile(
        file,
        kind === "good" ? "step-good-example" : "step-bad-example",
        (mediaId) => {
          setSteps((prev) =>
            prev.map((s) => {
              if (s.key !== stepKey) return s
              const mediaIds = new Set(s.mediaIds)
              if (replaceMediaId) mediaIds.delete(replaceMediaId)
              mediaIds.add(mediaId)
              return kind === "good"
                ? {
                    ...s,
                    goodExampleMediaId: mediaId,
                    mediaIds: [...mediaIds],
                  }
                : {
                    ...s,
                    badExampleMediaId: mediaId,
                    mediaIds: [...mediaIds],
                  }
            })
          )
        },
        { replaceMediaId, stepKey }
      )
    },
    [steps, uploadStandardFile]
  )

  async function removeMediaById(mediaId: string, onRemoved?: () => void) {
    if (!sopId) return
    const res = await deleteStandardMedia({
      businessId,
      standardId: sopId,
      mediaId,
    })
    if (!res.ok) {
      setError(res.message)
      return
    }
    setRemovedMediaIds((p) => [...p, mediaId])
    setMediaPatch((prev) => prev.filter((r) => r.id !== mediaId))
    onRemoved?.()
    router.refresh()
  }

  const removeStepExampleMedia = useCallback(
    async (stepKey: string, kind: "good" | "bad") => {
      const row = steps.find((s) => s.key === stepKey)
      const mediaId = kind === "good" ? row?.goodExampleMediaId : row?.badExampleMediaId
      if (!mediaId) return
      await removeMediaById(mediaId, () => {
        setSteps((prev) =>
          prev.map((s) => {
            if (s.key !== stepKey) return s
            const mediaIds = s.mediaIds.filter((id) => id !== mediaId)
            return kind === "good"
              ? { ...s, goodExampleMediaId: null, mediaIds }
              : { ...s, badExampleMediaId: null, mediaIds }
          })
        )
      })
    },
    [steps]
  )

  const mediaUploadPending = uploadJobs.some(
    (j) => j.phase === "preparing" || j.phase === "uploading" || j.phase === "finalizing"
  )

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
            ← Plays
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
          generatedFromWorkflow={playGeneratedFromWorkflow}
          onGenerate={onGeneratePlay}
          voiceRecording={voiceRecording}
          voiceTranscribing={voiceTranscribing}
          onVoiceToggle={toggleVoiceRecording}
          workflowRecording={workflowRecording}
          workflowProcessing={workflowProcessing}
          onWorkflowToggle={toggleWorkflowRecording}
          workflowPreviewRef={bindWorkflowPreview}
          disabled={uploadInFlight}
        />

        {playDraft && playGenerated ? <CapturePlayInsights draft={playDraft} /> : null}

        <div ref={manualFormRef} className="space-y-8 border-t border-border/50 pt-8">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Review and edit your play</h2>
            <p className="text-sm text-muted-foreground">
              Everything below is editable—tune the title, steps, roles, and operational memory before you publish.
            </p>
          </div>

        <CaptureOperationalMemory
          state={operationalMemory}
          onChange={(patch) => setOperationalMemory((prev) => ({ ...prev, ...patch }))}
          canUpload={Boolean(sopId)}
          uploadPending={uploadInFlight}
          goodExampleMedia={goodExampleMedia}
          badExampleMedia={badExampleMedia}
          onUploadGood={(file) => uploadExampleMedia("good", file)}
          onUploadBad={(file) => uploadExampleMedia("bad", file)}
          onRemoveGood={
            operationalMemory.goodExampleMediaId
              ? () =>
                  void removeMediaById(operationalMemory.goodExampleMediaId!, () =>
                    setOperationalMemory((prev) => ({ ...prev, goodExampleMediaId: null }))
                  )
              : undefined
          }
          onRemoveBad={
            operationalMemory.badExampleMediaId
              ? () =>
                  void removeMediaById(operationalMemory.badExampleMediaId!, () =>
                    setOperationalMemory((prev) => ({ ...prev, badExampleMediaId: null }))
                  )
              : undefined
          }
        />

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
                canUpload={Boolean(sopId)}
                uploadPending={mediaUploadPending}
                goodExampleMedia={
                  row.goodExampleMediaId ? mediaById.get(row.goodExampleMediaId) ?? null : null
                }
                badExampleMedia={
                  row.badExampleMediaId ? mediaById.get(row.badExampleMediaId) ?? null : null
                }
                onChange={(patch) =>
                  setSteps((prev) =>
                    prev.map((r) => (r.key === row.key ? { ...r, ...patch } : r))
                  )
                }
                onRemove={() => setSteps((prev) => prev.filter((r) => r.key !== row.key))}
                onUploadGoodExample={(file) => uploadStepExampleMedia(row.key, "good", file)}
                onUploadBadExample={(file) => uploadStepExampleMedia(row.key, "bad", file)}
                onRemoveGoodExample={
                  row.goodExampleMediaId
                    ? () => void removeStepExampleMedia(row.key, "good")
                    : undefined
                }
                onRemoveBadExample={
                  row.badExampleMediaId
                    ? () => void removeStepExampleMedia(row.key, "bad")
                    : undefined
                }
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
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100/90">
            Do not upload confidential staff/customer information unless your policies allow it.
          </p>

          <CaptureMediaInference
            canGenerate={canGenerateFromMedia}
            generating={mediaGenerating}
            mediaSummary={mediaInferenceSummary}
            onGenerate={onGenerateFromMedia}
            disabled={uploadInFlight || pending}
            generated={playGeneratedFromMedia}
            contextSummary={mediaContextSummary}
          />

          <CapturePlayMediaSection
            canUpload={Boolean(sopId)}
            uploadJobs={uploadJobs}
            onDismissUploadJob={dismissJob}
            walkthroughMedia={walkthroughMedia}
            audioExplanationMedia={audioExplanationMedia}
            referencePhotos={referencePhotoRows}
            supportingDocuments={supportingDocumentRows}
            onUploadWalkthrough={(file) => {
              void uploadStandardFile(file, "walkthrough")
            }}
            onUploadAudio={(file) => {
              void uploadStandardFile(file, "audio-explanation")
            }}
            onUploadReferencePhotos={async (files) => {
              for (const file of files) {
                await uploadStandardFile(file, "reference-photo")
              }
            }}
            onUploadDocument={(file) => {
              void uploadStandardFile(file, "supporting-document")
            }}
            onRemoveWalkthrough={
              walkthroughMediaId
                ? () =>
                    void removeMediaById(walkthroughMediaId, () => setWalkthroughMediaId(null))
                : undefined
            }
            onRemoveAudio={
              audioExplanationMediaId
                ? () =>
                    void removeMediaById(audioExplanationMediaId, () => setAudioExplanationMediaId(null))
                : undefined
            }
            onRemoveReferencePhoto={(mediaId) =>
              void removeMediaById(mediaId, () =>
                setPhotoMediaIds((prev) => prev.filter((id) => id !== mediaId))
              )
            }
            onRemoveDocument={(mediaId) =>
              void removeMediaById(mediaId, () =>
                setSupportingDocumentMediaIds((prev) => prev.filter((id) => id !== mediaId))
              )
            }
          />

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
