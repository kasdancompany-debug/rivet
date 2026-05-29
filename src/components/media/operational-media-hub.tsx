"use client"

import type { ReactNode } from "react"

import type { OperationalUploadJob } from "@/lib/media/types"
import { OperationalMediaTypeStrip } from "@/components/media/operational-media-type-strip"
import { OperationalMediaUploadQueue } from "@/components/media/operational-media-upload-queue"
import { cn } from "@/lib/utils"

export function OperationalMediaHub({
  title = "Operational memory",
  description = "Upload photos, videos, PDFs, screenshots, and audio to Rivet—private storage with workspace isolation. No external Drive links required.",
  jobs,
  onDismissJob,
  children,
  className,
}: {
  title?: string
  description?: string
  jobs: OperationalUploadJob[]
  onDismissJob?: (jobId: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-5", className)} aria-labelledby="operational-media-hub-heading">
      <div className="space-y-2">
        <h2 id="operational-media-hub-heading" className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        <OperationalMediaTypeStrip />
      </div>

      <OperationalMediaUploadQueue jobs={jobs} onDismiss={onDismissJob} />

      <div className="space-y-4">{children}</div>
    </section>
  )
}
