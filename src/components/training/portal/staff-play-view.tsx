"use client"

import type { PlayViewModel } from "@/lib/plays/build-play-view-model"
import { PlayView } from "@/components/plays/play-view"

/** Read-only play experience for staff—no owner edit/archive actions. */
export function StaffPlayView({ model }: { model: PlayViewModel }) {
  return <PlayView model={model} staffMode />
}
