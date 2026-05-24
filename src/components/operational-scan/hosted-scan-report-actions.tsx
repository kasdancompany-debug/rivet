"use client"

import Link from "next/link"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

export function HostedScanReportActions() {
  return (
    <div className="mt-10 flex flex-wrap gap-3 print:hidden">
      <Button
        type="button"
        variant="outline"
        className="border-white/15 text-zinc-200 hover:bg-white/[0.06]"
        onClick={() => window.print()}
      >
        <Printer className="size-4" data-icon="inline-start" />
        Print / save PDF
      </Button>
      <Button nativeButton={false} render={<Link href="/scan" />}>
        Run scan again
      </Button>
    </div>
  )
}
