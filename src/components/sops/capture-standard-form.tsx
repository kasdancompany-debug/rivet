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
import type { StandardWithSteps } from "@/lib/db/queries"
import { SOP_CATEGORIES } from "@/lib/sops/categories"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import { STANDARDS_CAPTURE_VERSION } from "@/lib/standards-capture/types"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { validateStandardMediaUpload } from "@/lib/standards/standard-media-validation"
import { uploadStandardMediaToSignedUrl } from "@/lib/standards/upload-standard-media-client"
import { TRAINING_ROLE_PRESETS } from "@/lib/training/roles"
import type { Json } from "@/types/database"
import type { StandardStatus } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type LocalStep = {
  key: string
  title: string
  instructions: string
  requiresPhoto: boolean
  media_url: string
}

type MediaUploadJob = {
  id: string
  fileName: string
  progress: number
  phase: "preparing" | "uploading" | "finalizing" | "error"
  errorMessage?: string
  retry?: () => void
}

function newStep(): LocalStep {
  return {
    key: crypto.randomUUID(),
    title: "",
    instructions: "",
    requiresPhoto: false,
    media_url: "",
  }
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
      title: "Watch: operator walkthrough",
      instructions:
        "Use this recording for pacing, order of operations, and where things live on the line.",
      media_url: `/api/standard-media/${params.walkthroughMediaId}`,
      requires_photo_confirmation: false,
    })
  } else if (v) {
    steps.push({
      title: "Watch: operator walkthrough",
      instructions:
        "Use this recording for pacing, order of operations, and where things live on the line.",
      media_url: v,
      requires_photo_confirmation: false,
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
    })
  }
  return steps
}

function buildCaptureJson(params: {
  videoUrl: string
  walkthroughMediaId: string | null
  photoUrls: string[]
  assignedRoles: string[]
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
    competencyMarkers: [],
  }
  return JSON.parse(JSON.stringify(capture)) as Json
}

export function CaptureStandardForm({
  businessId,
  initial,
  initialSignedMedia = [],
}: {
  businessId: string
  initial?: StandardWithSteps | null
  initialSignedMedia?: StandardMediaRowSigned[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedStatus, setSavedStatus] = useState<StandardStatus | null>(initial?.status ?? null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [sopId, setSopId] = useState<string | null>(initial?.id ?? null)

  const hydrated = useMemo(
    () => (initial ? hydrateFromStandard(initial, initialSignedMedia) : null),
    [initial, initialSignedMedia]
  )

  const [title, setTitle] = useState(hydrated?.title ?? "")
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
  const [customRoleDraft, setCustomRoleDraft] = useState("")
  const [steps, setSteps] = useState<LocalStep[]>(hydrated?.steps ?? [newStep()])

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

  const persist = useCallback(
    async (status: StandardStatus, opts?: { silent?: boolean }) => {
      const t = title.trim()
      if (!t) {
        if (!opts?.silent) setError("Add a title so your team can find this standard.")
        return false
      }
      const stepsPayload = composeSteps({ videoUrl, walkthroughMediaId, rows: steps })
      const capture = buildCaptureJson({ videoUrl, walkthroughMediaId, photoUrls, assignedRoles })

      const res = await saveSop({
        sopId: sopId ?? undefined,
        businessId,
        title: t,
        description: purpose.trim() === "" ? null : purpose.trim(),
        category,
        importance_level: 3,
        owner_dependency_level: 3,
        estimated_time_minutes: null,
        status,
        steps: stepsPayload,
        standards_capture: capture,
      })

      if (!res.ok) {
        if (!opts?.silent) setError(res.message)
        return false
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
      return true
    },
    [assignedRoles, businessId, category, photoUrls, purpose, router, sopId, steps, title, videoUrl, walkthroughMediaId]
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
  }, [assignedRoles, category, photoUrls, purpose, sopId, steps, title, videoUrl, walkthroughMediaId])

  const submitDraft = () => {
    setError(null)
    startTransition(() => {
      void persist("draft")
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
      const capture = buildCaptureJson({ videoUrl, walkthroughMediaId, photoUrls, assignedRoles })
      const res = await saveSop({
        sopId: sopId ?? undefined,
        businessId,
        title: t,
        description: purpose.trim() === "" ? null : purpose.trim(),
        category,
        importance_level: 3,
        owner_dependency_level: 3,
        estimated_time_minutes: null,
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
    <div className="relative pb-32 sm:pb-28">
      <div className="mx-auto max-w-lg space-y-8 px-1 sm:max-w-xl">
        <header className="space-y-2">
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
            {lastSavedAt && sopId ? (
              <span className="text-[0.65rem] text-muted-foreground">
                Saved {new Date(lastSavedAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Write it once. The shift runs it.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Draft saves automatically after you pause typing. Publish when purpose, steps, and roles are clear.
          </p>
          <Button variant="link" className="h-auto px-0 text-muted-foreground" nativeButton={false} render={<Link href="/sops" />}>
            ← Standards
          </Button>
        </header>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

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
          <Label htmlFor="cap-title" className="text-base">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cap-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Open — safe & lights"
            className="h-12 text-base"
            autoComplete="off"
          />
        </section>

        <section className="space-y-2">
          <Label htmlFor="cap-purpose" className="text-base">
            Short purpose
          </Label>
          <Textarea
            id="cap-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Why this exists and what “good” means in one or two sentences."
            className="min-h-[6.5rem] resize-y text-base leading-relaxed"
          />
        </section>

        <section className="space-y-3" aria-labelledby="steps-heading">
          <div>
            <h2 id="steps-heading" className="text-base font-semibold text-foreground">
              Steps
            </h2>
            <p className="text-xs text-muted-foreground">Short title + what to do. Add as many as you need.</p>
          </div>
          <ul className="space-y-4">
            {steps.map((row, index) => (
              <li key={row.key} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
                  {steps.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground"
                      onClick={() => setSteps((prev) => prev.filter((r) => r.key !== row.key))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
                <Input
                  value={row.title}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((r) => (r.key === row.key ? { ...r, title: e.target.value } : r))
                    )
                  }
                  placeholder="Step title"
                  className="mt-2 h-11 text-base"
                />
                <Textarea
                  value={row.instructions}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((r) => (r.key === row.key ? { ...r, instructions: e.target.value } : r))
                    )
                  }
                  placeholder="What to do (plain language)"
                  className="mt-2 min-h-[5rem] text-sm"
                />
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={row.requiresPhoto}
                    onCheckedChange={(c) =>
                      setSteps((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, requiresPhoto: Boolean(c) } : r))
                      )
                    }
                  />
                  Photo required to complete this step
                </label>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setSteps((p) => [...p, newStep()])}>
            <Plus className="mr-1.5 size-4" />
            Add step
          </Button>
        </section>

        <section className="space-y-3" aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="text-base font-semibold text-foreground">
            Owner / role
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
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-3 py-3 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85 sm:px-6">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-end gap-2 sm:max-w-xl">
          <Button
            type="button"
            variant="outline"
            className="h-12 min-w-[7rem] flex-1 sm:flex-none"
            disabled={pending || uploadInFlight}
            onClick={submitDraft}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Save draft"}
          </Button>
          <Button
            type="button"
            className="h-12 min-w-[9rem] flex-[1.2] sm:flex-none sm:px-8"
            disabled={pending || uploadInFlight}
            onClick={onPublishClick}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  )
}
