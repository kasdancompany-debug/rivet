"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2, Sparkles } from "lucide-react"

import { generateTrainingFromPlay } from "@/app/actions/play-training"
import { Button } from "@/components/ui/button"

export function PlayTrainingGenerateButton({ standardId }: { standardId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const res = await generateTrainingFromPlay(standardId)
            if (!res.ok) {
              setError(res.message)
              return
            }
            router.push(res.editHref)
            router.refresh()
          })
        }}
      >
        {pending ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="mr-2 size-4" aria-hidden />
        )}
        Generate staff training
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
