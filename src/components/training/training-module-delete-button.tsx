"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { deleteTrainingModule } from "@/app/actions/training"
import { Button } from "@/components/ui/button"

export function TrainingModuleDeleteButton({ moduleId, title }: { moduleId: string; title: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete module “${title}”? This removes assignments and linked standards.`)) return
          setError(null)
          startTransition(async () => {
            const res = await deleteTrainingModule(moduleId)
            if (res.ok) {
              router.push("/training")
              router.refresh()
            } else {
              setError(res.message)
            }
          })
        }}
      >
        {pending ? "Deleting…" : "Delete module"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
