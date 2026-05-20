"use client"

import Link from "next/link"
import { Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Offline exports for published (active) standards only. */
export function SopDocumentActions(props: { standardId: string; published: boolean }) {
  if (!props.published) return null

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2"
        nativeButton={false}
        render={
          <Link
            href={`/sops/${props.standardId}/print?autoprint=1`}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
      >
        <Printer className="size-4 shrink-0" aria-hidden />
        Print / Save PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2"
        nativeButton={false}
        render={<Link href={`/sops/${props.standardId}/export`} prefetch={false} />}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        Markdown
      </Button>
    </div>
  )
}
