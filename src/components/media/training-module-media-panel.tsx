"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { OperationalMediaPreview } from "@/components/media/operational-media-preview"
import { OperationalMediaTypeStrip } from "@/components/media/operational-media-type-strip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type TrainingPlayMediaGroup = {
  standardId: string
  standardTitle: string
  media: StandardMediaRowSigned[]
}

export function TrainingModuleMediaPanel({ groups }: { groups: TrainingPlayMediaGroup[] }) {
  const withMedia = groups.filter((g) => g.media.length > 0)
  if (withMedia.length === 0) return null

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Module media</CardTitle>
        <CardDescription>
          Photos, video, audio, and PDFs uploaded on linked plays—private Rivet storage, not external links.
        </CardDescription>
        <OperationalMediaTypeStrip className="pt-1" />
      </CardHeader>
      <CardContent className="space-y-6">
        {withMedia.map((group) => (
          <div key={group.standardId} className="space-y-3">
            <Link
              href={`/sops/${group.standardId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <BookOpen className="size-3.5" aria-hidden />
              {group.standardTitle}
            </Link>
            <ul className="grid gap-3 sm:grid-cols-2">
              {group.media.map((row) => (
                <li
                  key={row.id}
                  className="overflow-hidden rounded-xl ring-1 ring-border/50"
                >
                  <OperationalMediaPreview media={row} aspect="auto" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
