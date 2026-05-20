"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SopPrintToolbar({ standardId }: { standardId: string }) {
  const searchParams = useSearchParams()

  const autoprint = searchParams.get("autoprint") === "1"

  useEffect(() => {
    if (!autoprint) return
    const t = window.setTimeout(() => {
      window.print()
    }, 450)
    return () => window.clearTimeout(t)
  }, [autoprint])

  return (
    <div className="no-print mb-8 flex flex-wrap items-center gap-2 border-b border-border/60 pb-6">
      <Button type="button" className="h-11 gap-2" onClick={() => window.print()}>
        <Printer className="size-4 shrink-0" aria-hidden />
        Print / Save as PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2"
        nativeButton={false}
        render={<Link href={`/sops/${standardId}/export`} prefetch={false} />}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        Download Markdown
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-11 gap-2"
        nativeButton={false}
        render={<Link href={`/sops/${standardId}`} />}
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Back to live standard
      </Button>
      <p className="w-full text-xs text-muted-foreground">
        In the print dialog, choose <span className="font-medium text-foreground">Save as PDF</span> to
        hand this to staff offline.
      </p>
    </div>
  )
}
