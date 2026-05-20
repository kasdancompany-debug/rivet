import type { ReadinessBadge } from "@/types/database"
import { COPY } from "@/lib/interface-copy"

export const READINESS_BADGE_ORDER: ReadinessBadge[] = [
  "not_ready",
  "learning",
  "ready_with_support",
  "fully_ready",
]

export const READINESS_LABELS: Record<ReadinessBadge, string> = {
  not_ready: COPY.readinessBadges.not_ready,
  learning: COPY.readinessBadges.learning,
  ready_with_support: COPY.readinessBadges.ready_with_support,
  fully_ready: COPY.readinessBadges.fully_ready,
}

export function readinessBadgeClass(value: ReadinessBadge): string {
  switch (value) {
    case "fully_ready":
      return "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-950 dark:text-emerald-200/95"
    case "ready_with_support":
      return "border-sky-500/30 bg-sky-500/[0.08] text-sky-950 dark:text-sky-200/95"
    case "learning":
      return "border-amber-500/30 bg-amber-500/[0.08] text-amber-950 dark:text-amber-200/95"
    default:
      return "border-border/80 bg-muted/60 text-muted-foreground"
  }
}
