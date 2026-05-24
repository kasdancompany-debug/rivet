import type { OwnerInterruptionSeverity } from "@/types/database"

import { labelForOwnerInterruptionSeverity } from "@/lib/owner-interruptions/severity/severities"
import { cn } from "@/lib/utils"

const SEVERITY_STYLES: Record<
  OwnerInterruptionSeverity,
  { badge: string; dot: string }
> = {
  small_pull: {
    badge: "border-border/60 bg-muted/40 text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
  medium_pull: {
    badge: "border-amber-500/35 bg-amber-500/[0.08] text-amber-950 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  heavy_pull: {
    badge: "border-orange-500/40 bg-orange-500/[0.1] text-orange-950 dark:text-orange-100",
    dot: "bg-orange-500",
  },
  emergency: {
    badge: "border-rose-500/45 bg-rose-500/[0.12] text-rose-950 dark:text-rose-100",
    dot: "bg-rose-600",
  },
}

export function InterruptionSeverityBadge({
  severity,
  className,
  showDot = false,
}: {
  severity: OwnerInterruptionSeverity
  className?: string
  showDot?: boolean
}) {
  const styles = SEVERITY_STYLES[severity]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
        styles.badge,
        className
      )}
    >
      {showDot ? <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden /> : null}
      {labelForOwnerInterruptionSeverity(severity)}
    </span>
  )
}
