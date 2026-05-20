"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { installStarterTemplate } from "@/app/actions/sop-templates"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  templateId: string
  className?: string
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline" | "secondary"
}

export function InstallTemplateButton({
  templateId,
  className,
  size = "default",
  variant = "default",
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onInstall() {
    setError(null)
    startTransition(async () => {
      const res = await installStarterTemplate(templateId)
      if (res.ok) {
        router.push(`/sops/${res.id}/edit`)
        return
      }
      setError(res.message)
    })
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn(className)}
        disabled={pending}
        onClick={onInstall}
      >
        {pending ? "Installing…" : "Install to Standards"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="status">
          {error}
        </p>
      ) : null}
    </div>
  )
}
