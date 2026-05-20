"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { addSopToTrainingModule, removeSopFromTrainingModule } from "@/app/actions/training"
import type { TrainingItemWithSop } from "@/lib/db/queries"
import type { Tables } from "@/types/database"
import { Button } from "@/components/ui/button"

export function TrainingModuleSopsEditor({
  moduleId,
  items,
  availableSops,
}: {
  moduleId: string
  items: TrainingItemWithSop[]
  availableSops: Tables<"standards">[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pick, setPick] = useState("")
  const [error, setError] = useState<string | null>(null)

  const inModule = new Set(items.map((i) => i.standard_id))
  const choices = availableSops.filter((s) => !inModule.has(s.id))

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">No standards linked yet.</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <Link
                  href={`/sops/${item.standard_id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {item.standards?.title ?? "Standard"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.standards?.status ?? "—"} · {item.required ? "Required" : "Optional"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={pending}
                aria-label="Remove standard from module"
                onClick={() => {
                  startTransition(async () => {
                    setError(null)
                    const res = await removeSopFromTrainingModule({
                      moduleId,
                      trainingItemId: item.id,
                    })
                    if (!res.ok) setError(res.message)
                    else router.refresh()
                  })
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))
        )}
      </ul>
      {choices.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="add-sop" className="text-sm font-medium">
              Add standard from list
            </label>
            <select
              id="add-sop"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Select standard…</option>
              {choices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={pending || !pick}
            onClick={() => {
              const sopId = pick
              if (!sopId) return
              startTransition(async () => {
                setError(null)
                const res = await addSopToTrainingModule({ moduleId, sopId })
                if (!res.ok) setError(res.message)
                else {
                  setPick("")
                  router.refresh()
                }
              })
            }}
          >
            Add
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Every standard in your list is already on this module.</p>
      )}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
