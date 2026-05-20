"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import type { OperationsCoachPromptPack } from "@/lib/operations-coach/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function OperationsCoachPromptPanel({ pack }: { pack: OperationsCoachPromptPack }) {
  const [copied, setCopied] = useState<"full" | "json" | null>(null)

  async function copyFull() {
    const text = `SYSTEM:\n${pack.system}\n\nUSER:\n${pack.user}`
    await navigator.clipboard.writeText(text)
    setCopied("full")
    window.setTimeout(() => setCopied(null), 2000)
  }

  async function copyJson() {
    await navigator.clipboard.writeText(pack.snapshotJson)
    setCopied("json")
    window.setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card className="border-border/60 bg-muted/10 shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">Prompt pack (model-ready)</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Same strings you would send to a model later: system persona plus user block with the
          business snapshot. Nothing leaves your browser until you paste it elsewhere.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={copyFull}>
          {copied === "full" ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          Copy system + user
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={copyJson}>
          {copied === "json" ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          Copy snapshot JSON
        </Button>
      </CardContent>
    </Card>
  )
}
