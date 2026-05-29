"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"

import { saveSop } from "@/app/actions/sops"
import { StepProofRequirementFields } from "@/components/completion-proof/step-proof-requirement-fields"
import { COPY } from "@/lib/interface-copy"
import { SOP_CATEGORIES, formatSopCategory, isSopCategory } from "@/lib/sops/categories"
import type { StandardWithSteps } from "@/lib/db/queries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { SopStatus } from "@/types/database"

type LocalStep = {
  key: string
  title: string
  instructions: string
  media_url: string
  requires_photo_confirmation: boolean
  requires_video_proof: boolean
  requires_manager_signoff: boolean
  requires_checklist_completion: boolean
}

function newStep(): LocalStep {
  return {
    key: crypto.randomUUID(),
    title: "",
    instructions: "",
    media_url: "",
    requires_photo_confirmation: false,
    requires_video_proof: false,
    requires_manager_signoff: false,
    requires_checklist_completion: true,
  }
}

function LevelPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-base font-medium">{label}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-12 min-w-0 flex-1 rounded-xl border text-sm font-semibold transition-all",
              value === n
                ? "border-foreground/30 bg-foreground/[0.06] text-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                : "border-border/70 bg-card text-muted-foreground hover:border-foreground/15 hover:bg-muted/40"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">1 = lowest · 5 = highest</p>
    </div>
  )
}

type SopFormProps = {
  businessId: string
  mode: "create" | "edit"
  initial?: StandardWithSteps | null
}

export function SopForm({ businessId, mode, initial }: SopFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [category, setCategory] = useState<string>(
    () =>
      initial?.category && isSopCategory(initial.category) ? initial.category : SOP_CATEGORIES[0]!.value
  )
  const [importance, setImportance] = useState(initial?.importance_level ?? 3)
  const [dependency, setDependency] = useState(initial?.owner_dependency_level ?? 3)
  const [minutes, setMinutes] = useState(
    initial?.estimated_time_minutes != null
      ? String(initial.estimated_time_minutes)
      : ""
  )
  const [status, setStatus] = useState<SopStatus>(initial?.status ?? "draft")

  const [steps, setSteps] = useState<LocalStep[]>(() => {
    if (initial?.standard_steps?.length) {
      return initial.standard_steps.map((s) => ({
        key: s.id,
        title: s.title,
        instructions: s.instructions,
        media_url: s.media_url ?? "",
        requires_photo_confirmation: s.requires_photo_confirmation,
        requires_video_proof: s.requires_video_proof ?? false,
        requires_manager_signoff: s.requires_manager_signoff ?? false,
        requires_checklist_completion: s.requires_checklist_completion !== false,
      }))
    }
    return [newStep()]
  })

  const heading = mode === "create" ? COPY.sops.new : COPY.sops.edit

  const payloadSteps = useMemo(
    () =>
      steps.map((s) => ({
        title: s.title,
        instructions: s.instructions,
        media_url: s.media_url.trim() === "" ? null : s.media_url,
        requires_photo_confirmation: s.requires_photo_confirmation,
        requires_video_proof: s.requires_video_proof ?? false,
        requires_manager_signoff: s.requires_manager_signoff ?? false,
        requires_checklist_completion: s.requires_checklist_completion !== false,
      })),
    [steps]
  )

  function moveStep(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= steps.length) return
    setSteps((prev) => {
      const copy = [...prev]
      const tmp = copy[index]!
      copy[index] = copy[next]!
      copy[next] = tmp
      return copy
    })
  }

  function removeStep(index: number) {
    setSteps((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function addStep() {
    setSteps((prev) => [...prev, newStep()])
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await saveSop({
        sopId: initial?.id,
        businessId,
        title,
        description,
        category,
        importance_level: importance,
        owner_dependency_level: dependency,
        estimated_time_minutes: minutes.trim() === "" ? null : Number(minutes),
        status,
        steps: payloadSteps,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(`/sops/${res.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-[0.9375rem]">
            Write it the way you would explain it to your best employee at the end of
            a long shift—short steps, plain words, no corporate filler.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10" nativeButton={false} render={<Link href="/sops" />}>
            Cancel
          </Button>
          <Button className="h-10 px-6" disabled={pending} onClick={submit}>
            {pending ? "Saving…" : mode === "create" ? "Create standard" : "Save changes"}
          </Button>
        </div>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Card className="border-border/60 bg-card/70 shadow-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="sop-title" className="text-base">
              Title
            </Label>
            <Input
              id="sop-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dial in espresso for the day"
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sop-desc" className="text-base">
              Short description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="sop-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two sentences: what this covers and when to use it."
              className="min-h-[5rem] text-base"
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sop-category" className="text-base">
                Category
              </Label>
              <select
                id="sop-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {SOP_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
                {initial?.category &&
                !SOP_CATEGORIES.some((c) => c.value === initial.category) &&
                isSopCategory(initial.category) ? (
                  <option value={initial.category}>{formatSopCategory(initial.category)}</option>
                ) : null}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sop-status" className="text-base">
                Status
              </Label>
              <select
                id="sop-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SopStatus)}
                className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="draft">Draft — still working on it</option>
                <option value="active">Active — team should follow this</option>
                <option value="archived">Archived — keep but do not use day-to-day</option>
              </select>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <LevelPicker
              label="Importance"
              hint="How bad is it if this is skipped or done wrong?"
              value={importance}
              onChange={setImportance}
            />
            <LevelPicker
              label="Owner dependency"
              hint="How much does this still wait on you personally?"
              value={dependency}
              onChange={setDependency}
            />
          </div>

          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="sop-min" className="text-base">
              Estimated time{" "}
              <span className="font-normal text-muted-foreground">(minutes, optional)</span>
            </Label>
            <Input
              id="sop-min"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 12"
              className="h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Steps</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Each step is one thing someone can do with their hands. Add a photo or
            video link when showing is easier than telling.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card
              key={step.key}
              className="border-border/60 bg-card/70 py-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/50 py-4">
                <CardTitle className="text-base font-semibold">
                  Step {index + 1}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    disabled={index === 0}
                    onClick={() => moveStep(index, -1)}
                    aria-label="Move step up"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    disabled={index === steps.length - 1}
                    onClick={() => moveStep(index, 1)}
                    aria-label="Move step down"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={steps.length <= 1}
                    onClick={() => removeStep(index)}
                    aria-label="Remove step"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5 pb-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Step title</Label>
                  <Input
                    value={step.title}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s
                        )
                      )
                    }
                    placeholder="Short headline for this step"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Instructions</Label>
                  <Textarea
                    value={step.instructions}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, instructions: e.target.value } : s
                        )
                      )
                    }
                    placeholder="Exactly what to do, in order. Use short sentences."
                    className="min-h-[7rem] text-base"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Step media is attached in{" "}
                    <span className="font-medium text-foreground">Capture a play</span>—upload photos,
                    video, audio, and PDFs to Rivet storage (not external links).
                  </p>
                </div>
                <StepProofRequirementFields
                  values={{
                    requiresPhoto: step.requires_photo_confirmation,
                    requiresVideo: step.requires_video_proof,
                    requiresManagerSignoff: step.requires_manager_signoff,
                    requiresChecklist: step.requires_checklist_completion,
                  }}
                  onChange={(patch) =>
                    setSteps((prev) =>
                      prev.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              requires_photo_confirmation:
                                patch.requiresPhoto ?? s.requires_photo_confirmation,
                              requires_video_proof:
                                patch.requiresVideo ?? s.requires_video_proof,
                              requires_manager_signoff:
                                patch.requiresManagerSignoff ?? s.requires_manager_signoff,
                              requires_checklist_completion:
                                patch.requiresChecklist ?? s.requires_checklist_completion,
                            }
                          : s
                      )
                    )
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full border-dashed border-border/80 sm:w-auto"
          onClick={addStep}
        >
          <Plus className="size-4" />
          Add another step
        </Button>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="h-10" nativeButton={false} render={<Link href="/sops" />}>
          {COPY.sops.backToPlays}
        </Button>
        <Button className="h-10 px-6" disabled={pending} onClick={submit}>
          {pending ? "Saving…" : mode === "create" ? COPY.sops.createPlay : COPY.sops.savePlay}
        </Button>
      </div>
    </div>
  )
}
