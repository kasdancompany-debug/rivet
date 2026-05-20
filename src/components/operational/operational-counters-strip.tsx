import Link from "next/link"
import { Bell, BookOpen, GraduationCap, ListTodo, UserRound } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type OperationalCountersStripProps = {
  unresolvedBottlenecks: number
  ownerInterruptionsThisWeek: number
  ownerTasksOpen: number
  trainingProgressPercent: number | null
  standardsDepthPercent: number | null
  /** When true, show a “thin standards” alert. */
  standardsGap: boolean
  className?: string
}

export function OperationalCountersStrip({
  unresolvedBottlenecks,
  ownerInterruptionsThisWeek,
  ownerTasksOpen,
  trainingProgressPercent,
  standardsDepthPercent,
  standardsGap,
  className,
}: OperationalCountersStripProps) {
  const items = [
    {
      key: "bottlenecks",
      href: "/issues?view=unresolved",
      icon: ListTodo,
      label: COPY.counters.bottlenecks,
      value: unresolvedBottlenecks,
      tone: unresolvedBottlenecks > 0 ? "text-amber-900 dark:text-amber-200" : "text-muted-foreground",
    },
    {
      key: "week",
      href: "/interruptions",
      icon: Bell,
      label: COPY.counters.weekInterrupts,
      value: ownerInterruptionsThisWeek,
      tone: ownerInterruptionsThisWeek > 0 ? "text-rose-900 dark:text-rose-200" : "text-muted-foreground",
    },
    {
      key: "owner",
      href: "/issues?view=owner_required",
      icon: UserRound,
      label: COPY.counters.needsYou,
      value: ownerTasksOpen,
      tone: ownerTasksOpen > 0 ? "text-foreground" : "text-muted-foreground",
    },
    {
      key: "train",
      href: "/training",
      icon: GraduationCap,
      label: COPY.counters.trainingDone,
      value: trainingProgressPercent === null ? "—" : `${trainingProgressPercent}%`,
      tone: "text-muted-foreground",
    },
    {
      key: "sop",
      href: "/sops",
      icon: BookOpen,
      label: COPY.counters.standardDepth,
      value: standardsDepthPercent === null ? "—" : `${standardsDepthPercent}%`,
      tone: "text-muted-foreground",
    },
  ] as const

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            className="inline-flex min-w-[9.5rem] flex-1 flex-col gap-1 rounded-lg border border-border/50 bg-card px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/20 sm:min-w-0 sm:flex-none"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              <it.icon className="size-3 shrink-0 opacity-60" aria-hidden />
              {it.label}
            </span>
            <span className={cn("text-xl font-semibold tabular-nums tracking-tight", it.tone)}>{it.value}</span>
          </Link>
        ))}
      </div>
      {standardsGap ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-xs text-muted-foreground dark:bg-muted/10">
          <Badge variant="outline" className="border-border/60 bg-transparent text-[0.65rem] font-medium">
            {COPY.counters.standardsGapBadge}
          </Badge>
          <span>
            {COPY.counters.standardsGapText}{" "}
            <Link href="/sops" className="font-medium underline-offset-4 hover:underline">
              {COPY.counters.standardsGapLink}
            </Link>
            .
          </span>
        </div>
      ) : null}
    </div>
  )
}
