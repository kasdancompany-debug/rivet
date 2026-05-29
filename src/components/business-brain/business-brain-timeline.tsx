"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Award,
  BookOpen,
  GraduationCap,
  MessageCircleQuestion,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import type { BusinessBrainEventKind, BusinessBrainTimelineView } from "@/lib/business-brain/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const KIND_META: Record<
  BusinessBrainEventKind,
  { label: string; icon: LucideIcon; badgeClass: string; dotClass: string }
> = {
  sop_change: {
    label: COPY.businessBrain.kindSopChange,
    icon: BookOpen,
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-200",
    dotClass: "bg-sky-500",
  },
  training_completion: {
    label: COPY.businessBrain.kindTraining,
    icon: GraduationCap,
    badgeClass: "border-violet-500/30 bg-violet-500/10 text-violet-950 dark:text-violet-200",
    dotClass: "bg-violet-500",
  },
  certification: {
    label: COPY.businessBrain.kindCertification,
    icon: Award,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200",
    dotClass: "bg-emerald-500",
  },
  question_prevented: {
    label: COPY.businessBrain.kindQuestionPrevented,
    icon: MessageCircleQuestion,
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-950 dark:text-indigo-200",
    dotClass: "bg-indigo-500",
  },
  interruptions_reduced: {
    label: COPY.businessBrain.kindInterruptionsReduced,
    icon: Zap,
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200",
    dotClass: "bg-amber-500",
  },
  escape_readiness_change: {
    label: COPY.businessBrain.kindEscapeReadiness,
    icon: TrendingUp,
    badgeClass: "border-teal-500/30 bg-teal-500/10 text-teal-950 dark:text-teal-200",
    dotClass: "bg-teal-500",
  },
}

const ALL_KINDS: BusinessBrainEventKind[] = [
  "sop_change",
  "training_completion",
  "certification",
  "question_prevented",
  "interruptions_reduced",
  "escape_readiness_change",
]

export function BusinessBrainTimeline({ view }: { view: BusinessBrainTimelineView }) {
  const [filter, setFilter] = useState<BusinessBrainEventKind | "all">("all")
  const p = COPY.businessBrain

  const filtered = useMemo(() => {
    if (filter === "all") return view.items
    return view.items.filter((item) => item.kind === filter)
  }, [filter, view.items])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          label={p.filterAll}
          count={view.items.length}
          onClick={() => setFilter("all")}
        />
        {ALL_KINDS.map((kind) => (
          <FilterChip
            key={kind}
            active={filter === kind}
            label={KIND_META[kind].label}
            count={view.countsByKind[kind]}
            onClick={() => setFilter(kind)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          {filter === "all" ? p.emptyAll : p.emptyFilter}
        </p>
      ) : (
        <ol className="relative space-y-0 border-l border-border/60 pl-5">
          {filtered.map((item) => {
            const meta = KIND_META[item.kind]
            const Icon = meta.icon
            const body = (
              <div className="rounded-2xl border border-border/50 bg-card/80 px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className={cn("gap-1 font-normal", meta.badgeClass)}>
                    <Icon className="size-3" aria-hidden />
                    {meta.label}
                  </Badge>
                  <time className="text-[0.65rem] tabular-nums text-muted-foreground" dateTime={item.at}>
                    {item.timeLabel}
                  </time>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug text-foreground">{item.title}</p>
                {item.detail ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                ) : null}
              </div>
            )

            return (
              <li key={item.id} className="relative pb-7 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[calc(0.625rem+1px)] top-2 size-2.5 rounded-full ring-2 ring-background",
                    meta.dotClass
                  )}
                  aria-hidden
                />
                {item.href ? (
                  <Link href={item.href} className="block transition-opacity hover:opacity-90">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground/25 bg-foreground/5 text-foreground"
          : "border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {label}
      <span className="tabular-nums text-muted-foreground/80">{count}</span>
    </button>
  )
}
