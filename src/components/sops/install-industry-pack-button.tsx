"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Download } from "lucide-react"

import { installIndustryStarterPack } from "@/app/actions/sop-templates"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function InstallIndustryPackButton({
  industryId,
  industryName,
  className,
}: {
  industryId: string
  industryName: string
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onInstall() {
    setError(null)
    startTransition(async () => {
      const res = await installIndustryStarterPack(industryId)
      if (res.ok) {
        router.push("/sops")
        router.refresh()
        return
      }
      setError(res.message)
    })
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button type="button" size="lg" className="gap-2" disabled={pending} onClick={onInstall}>
        <Download className="size-4" aria-hidden />
        {pending ? "Installing pack…" : `Install full ${industryName} pack`}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="status">
          {error}
        </p>
      ) : (
        <p className="text-[0.7rem] text-muted-foreground">
          Installs eight linked drafts—opening through escalation. You can delete or edit any card after install.
        </p>
      )}
    </div>
  )
}
