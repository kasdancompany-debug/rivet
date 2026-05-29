import Link from "next/link"
import {
  AlertTriangle,
  BookOpen,
  Camera,
  GraduationCap,
  MessageCircleQuestion,
  Pencil,
  Plus,
  Video,
  Zap,
} from "lucide-react"

import type {
  HighFrictionAlert,
  HighFrictionAlertSource,
  HighFrictionRecommendationKind,
} from "@/lib/high-friction-alerts/types"
import { COPY } from "@/lib/interface-copy"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SOURCE_LABEL: Record<HighFrictionAlertSource, string> = {
  ask_rivet_repeat: COPY.highFriction.sourceAsk,
  interruption_repeat: COPY.highFriction.sourceInterruption,
  quiz_question_fail: COPY.highFriction.sourceQuiz,
  high_views_low_training: COPY.highFriction.sourceViews,
}

const REC_ICON: Record<HighFrictionRecommendationKind, typeof BookOpen> = {
  add_photo: Camera,
  add_video: Video,
  clarify_step: Pencil,
  assign_training: GraduationCap,
  create_new_play: Plus,
}

function sourceIcon(source: HighFrictionAlertSource) {
  switch (source) {
    case "ask_rivet_repeat":
      return MessageCircleQuestion
    case "interruption_repeat":
      return Zap
    case "quiz_question_fail":
      return GraduationCap
    case "high_views_low_training":
      return BookOpen
  }
}

function AlertCard({ alert }: { alert: HighFrictionAlert }) {
  const SourceIcon = sourceIcon(alert.source)

  return (
    <article className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-background/80 text-amber-800 dark:text-amber-200">
          <SourceIcon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {SOURCE_LABEL[alert.source]}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">{alert.headline}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{alert.detail}</p>
        </div>
        <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
          ×{alert.count}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {COPY.highFriction.recommendationsTitle}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {alert.recommendations.map((rec) => {
            const Icon = REC_ICON[rec.kind]
            return (
              <li key={rec.kind}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5"
                  nativeButton={false}
                  render={<Link href={rec.href} />}
                >
                  <Icon className="size-3.5 opacity-80" aria-hidden />
                  {rec.label}
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}

export function HighFrictionAlertsPanel({
  alerts,
  compact = false,
  className,
}: {
  alerts: HighFrictionAlert[]
  compact?: boolean
  className?: string
}) {
  if (alerts.length === 0) {
    return (
      <Card variant="quiet" className={cn(className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            {COPY.highFriction.title}
          </CardTitle>
          <CardDescription>{COPY.highFriction.empty}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const shown = compact ? alerts.slice(0, 3) : alerts

  return (
    <Card variant="quiet" className={cn("border-amber-500/20", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                {COPY.highFriction.title}
              </CardTitle>
            </div>
            <CardDescription className="mt-1">{COPY.highFriction.lead}</CardDescription>
          </div>
          {compact ? (
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/alerts" />}>
              {COPY.highFriction.viewAll}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {shown.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </CardContent>
    </Card>
  )
}
