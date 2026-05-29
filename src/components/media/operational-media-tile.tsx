"use client"

import { useState } from "react"
import { FileText, Film, ImageIcon, Music, ZoomIn } from "lucide-react"

import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import {
  isAudioMedia,
  isImageMedia,
  isPdfMedia,
  isVideoMedia,
  mediaDisplayUrl,
  mediaLabel,
} from "@/lib/standards/standard-media-display"
import { cn } from "@/lib/utils"

function MediaKindIcon({ media }: { media: StandardMediaRowSigned }) {
  if (isVideoMedia(media)) return <Film className="size-3.5" aria-hidden />
  if (isPdfMedia(media)) return <FileText className="size-3.5" aria-hidden />
  if (isAudioMedia(media)) return <Music className="size-3.5" aria-hidden />
  return <ImageIcon className="size-3.5" aria-hidden />
}

export function OperationalMediaTile({
  media,
  aspect = "square",
  onRemove,
  className,
  expandLabel = "View",
}: {
  media: StandardMediaRowSigned
  aspect?: "square" | "video" | "auto"
  onRemove?: React.ReactNode
  className?: string
  expandLabel?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const url = mediaDisplayUrl(media)
  const label = mediaLabel(media)

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "video" ? "aspect-video" : "min-h-[8rem]"

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl bg-muted/20 ring-1 ring-border/50", className)}>
      <div className={cn("relative w-full", aspectClass)}>
        {!loaded ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/40 to-muted/10" aria-hidden />
        ) : null}

        {url && isImageMedia(media) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              aspect === "auto" && "max-h-72",
              loaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        ) : url && isVideoMedia(media) ? (
          <video
            src={url}
            className={cn("h-full w-full bg-black object-cover", loaded ? "opacity-100" : "opacity-0")}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
          />
        ) : (
          <div className="flex h-full min-h-[6rem] flex-col items-center justify-center gap-2 px-3 text-center">
            <MediaKindIcon media={media} />
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2 pt-8">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
            <MediaKindIcon media={media} />
            {label}
          </p>
        </div>

        {onRemove ? <div className="absolute right-1.5 top-1.5 z-10">{onRemove}</div> : null}

        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition hover:bg-black/25 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setExpanded(true)}
          aria-label={expandLabel}
        >
          <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md">
            <ZoomIn className="size-3.5" aria-hidden />
            {expandLabel}
          </span>
        </button>
      </div>

      {expanded && url ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={() => setExpanded(false)}
        >
          <div
            className="max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isImageMedia(media) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={label} className="max-h-[85vh] w-full object-contain" />
            ) : isVideoMedia(media) ? (
              <video src={url} controls autoPlay className="max-h-[85vh] w-full bg-black" playsInline />
            ) : isPdfMedia(media) ? (
              <iframe src={url} title={label} className="h-[80vh] w-[min(90vw,48rem)] border-0 bg-white" />
            ) : isAudioMedia(media) ? (
              <div className="p-8">
                <audio src={url} controls autoPlay className="w-full min-w-[16rem]" />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
