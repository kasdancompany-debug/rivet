"use client"

import { useState } from "react"
import { ExternalLink, FileText, Music } from "lucide-react"

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

type PlayMediaPreviewProps = {
  media: StandardMediaRowSigned
  aspect?: "video" | "square" | "auto"
  className?: string
  alt?: string
}

export function PlayMediaPreview({ media, aspect = "auto", className, alt }: PlayMediaPreviewProps) {
  const [loaded, setLoaded] = useState(false)
  const url = mediaDisplayUrl(media)
  const label = alt ?? mediaLabel(media)

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted px-4 py-12 text-sm text-muted-foreground",
          className
        )}
      >
        Preview unavailable
      </div>
    )
  }

  const loadingOverlay = !loaded ? (
    <div
      className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/50 to-muted/10"
      aria-hidden
    />
  ) : null

  if (isVideoMedia(media)) {
    return (
      <div className={cn("relative overflow-hidden bg-black", className)}>
        {loadingOverlay}
        <video
          src={url}
          controls
          playsInline
          className={cn(
            "relative z-[1] w-full transition-opacity duration-300",
            aspect === "video" && "aspect-video",
            aspect === "square" && "aspect-square object-cover",
            loaded ? "opacity-100" : "opacity-0"
          )}
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
        >
          <track kind="captions" />
        </video>
      </div>
    )
  }

  if (isImageMedia(media)) {
    return (
      <div className={cn("relative overflow-hidden bg-muted/15", className)}>
        {loadingOverlay}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className={cn(
            "relative z-[1] w-full object-cover transition-opacity duration-300",
            aspect === "video" && "aspect-video",
            aspect === "square" && "aspect-square",
            aspect === "auto" && "max-h-[28rem]",
            loaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
    )
  }

  if (isPdfMedia(media)) {
    return (
      <div className={cn("flex flex-col bg-muted/10", className)}>
        <iframe
          src={url}
          title={label}
          className="aspect-[3/4] w-full border-0 bg-white sm:aspect-[4/3]"
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border-t border-border/40 px-4 py-3.5 text-sm font-semibold text-primary hover:underline"
        >
          <FileText className="size-4 shrink-0" aria-hidden />
          Open PDF in new tab
          <ExternalLink className="ml-auto size-3.5 opacity-60" aria-hidden />
        </a>
      </div>
    )
  }

  if (isAudioMedia(media)) {
    return (
      <div className={cn("flex flex-col gap-3 bg-muted/15 px-4 py-5", className)}>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Music className="size-4 text-muted-foreground" aria-hidden />
          {label}
        </div>
        <audio src={url} controls className="w-full" preload="metadata" onLoadedData={() => setLoaded(true)} />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("block px-4 py-6 text-sm font-semibold text-primary underline", className)}
    >
      Open file
    </a>
  )
}
