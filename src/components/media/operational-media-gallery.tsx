"use client"

import { Trash2 } from "lucide-react"

import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { OperationalMediaTile } from "@/components/media/operational-media-tile"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function OperationalMediaGallery({
  items,
  onRemove,
  aspect = "square",
  className,
}: {
  items: StandardMediaRowSigned[]
  onRemove?: (mediaId: string) => void
  aspect?: "square" | "video" | "auto"
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {items.map((row) => (
        <li key={row.id}>
          <OperationalMediaTile
            media={row}
            aspect={aspect}
            onRemove={
              onRemove ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="size-8 opacity-95 shadow-md"
                  onClick={() => onRemove(row.id)}
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : undefined
            }
          />
        </li>
      ))}
    </ul>
  )
}
