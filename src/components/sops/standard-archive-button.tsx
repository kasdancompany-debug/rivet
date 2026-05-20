"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"

import { archiveStandard } from "@/app/actions/sops"
import { Button } from "@/components/ui/button"

export function StandardArchiveButton({ sopId, disabled }: { sopId: string; disabled?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 border-dashed sm:w-auto"
        disabled={disabled || pending}
        onClick={() => {
          if (
            !window.confirm(
              "Archive this standard? It stays in your library but won’t show as active for day-to-day runs."
            )
          ) {
            return
          }
          setError(null)
          startTransition(() => {
            void (async () => {
              const res = await archiveStandard(sopId)
              if (!res.ok) {
                setError(res.message)
                return
              }
              router.push("/sops")
              router.refresh()
            })()
          })
        }}
      >
        {pending ? "Archiving…" : null}
        <Archive className="size-4 shrink-0" aria-hidden />
        Archive
      </Button>
    </div>
  )
}
