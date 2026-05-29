"use client"

import type { AskRivetMediaAttachment } from "@/lib/ask-rivet/types"
import { parseStandardMediaApiId } from "@/lib/standards/standard-media-display"
import { OperationalMediaPreview } from "@/components/media/operational-media-preview"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { cn } from "@/lib/utils"

const KIND_LABEL: Record<AskRivetMediaAttachment["kind"], string> = {
  photo: "Photo",
  video: "Video",
  pdf: "PDF",
  audio: "Audio",
}

export function AskRivetMediaGallery({
  attachments,
  signedByMediaId,
  className,
}: {
  attachments: AskRivetMediaAttachment[]
  signedByMediaId?: Map<string, StandardMediaRowSigned>
  className?: string
}) {
  if (attachments.length === 0) return null

  return (
    <section className={cn("space-y-2", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Related media
      </p>
      <ul className="space-y-3">
        {attachments.map((item) => {
          const mediaId = parseStandardMediaApiId(item.url)
          const signed = mediaId && signedByMediaId?.get(mediaId)

          return (
            <li
              key={`${item.url}-${item.caption ?? ""}`}
              className="overflow-hidden rounded-2xl border border-border/50 bg-muted/10 shadow-sm"
            >
              <p className="border-b border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {KIND_LABEL[item.kind]}
              </p>
              {signed ? (
                <OperationalMediaPreview
                  media={signed}
                  aspect={item.kind === "video" ? "video" : "auto"}
                />
              ) : item.kind === "video" ? (
                <video src={item.url} controls className="aspect-video w-full bg-black/5" preload="metadata">
                  <track kind="captions" />
                </video>
              ) : item.kind === "audio" ? (
                <audio src={item.url} controls className="w-full px-3 py-4" preload="metadata" />
              ) : item.kind === "pdf" ? (
                <iframe src={item.url} title={item.caption ?? "PDF"} className="aspect-[4/3] w-full border-0 bg-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="max-h-56 w-full object-cover" />
              )}
              {item.caption ? (
                <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">{item.caption}</p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
