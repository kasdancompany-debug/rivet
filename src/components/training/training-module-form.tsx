"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { saveTrainingModule } from "@/app/actions/training"
import { TRAINING_ROLE_PRESETS } from "@/lib/training/roles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Initial = {
  id: string
  title: string
  description: string | null
  assigned_role: string | null
}

export function TrainingModuleForm({
  businessId,
  initial,
  defaultTitle = "",
  defaultDescription = "",
}: {
  businessId: string
  initial?: Initial
  defaultTitle?: string
  defaultDescription?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(initial?.title ?? defaultTitle)
  const [description, setDescription] = useState(initial?.description ?? defaultDescription)
  const [assignedRole, setAssignedRole] = useState(initial?.assigned_role ?? "")

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await saveTrainingModule({
        businessId,
        moduleId: initial?.id,
        title,
        description: description.trim() || null,
        assignedRole: assignedRole.trim() || null,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(`/training/modules/${res.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5">
      <div className="space-y-2">
        <Label htmlFor="tm-title">Module title</Label>
        <Input
          id="tm-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Barista fundamentals"
          required
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tm-role">Primary role</Label>
        <select
          id="tm-role"
          value={assignedRole}
          onChange={(e) => setAssignedRole(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">General (no preset)</option>
          {TRAINING_ROLE_PRESETS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Presets help you sort modules; they do not change permissions by themselves.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tm-desc">Description (optional)</Label>
        <Textarea
          id="tm-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="What someone should be able to do when they finish this track."
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Create module"}
        </Button>
        <Button type="button" variant="outline" nativeButton={false} render={<Link href="/training" />}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
