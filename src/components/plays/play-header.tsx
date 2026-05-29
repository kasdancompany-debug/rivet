"use client"

import { CalendarClock, Clock, ShieldAlert, Users } from "lucide-react"

import type { SopPlayCompletion } from "@/lib/sops/sop-play-completion"
import { formatSopCategory } from "@/lib/sops/categories"
import { formatTrainingRole } from "@/lib/training/roles"
import { cn } from "@/lib/utils"

export type PlayHeaderProps = {
  title: string
  category: string
  estimatedMinutes: number | null
  assignedRoles: string[]
  riskLabel: string
  riskLevel: "low" | "medium" | "high" | "critical"
  status: string
  updatedAt: string | null
  /** Session progress for the person running the play now. */
  stepsCompleted: number
  stepsTotal: number
  /** Team readiness score (documentation + training + ownership). */
  teamCompletion?: SopPlayCompletion | null
}

function riskTone(level: PlayHeaderProps["riskLevel"]): string {
  switch (level) {
    case "critical":
      return "text-rose-700 bg-rose-500/10 ring-rose-500/20 dark:text-rose-300"
    case "high":
      return "text-orange-800 bg-orange-500/10 ring-orange-500/20 dark:text-orange-200"
    case "medium":
      return "text-amber-900 bg-amber-500/10 ring-amber-500/20 dark:text-amber-100"
    default:
      return "text-emerald-800 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-200"
  }
}

function riskShort(level: PlayHeaderProps["riskLevel"]): string {
  switch (level) {
    case "critical":
      return "Critical"
    case "high":
      return "High"
    case "medium":
      return "Medium"
    default:
      return "Low"
  }
}

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
      new Date(iso)
    )
  } catch {
    return "—"
  }
}

function statusLabel(status: string): string {
  if (status === "active") return "Live"
  if (status === "archived") return "Archived"
  return "Draft"
}

export function PlayHeader({
  title,
  category,
  estimatedMinutes,
  assignedRoles,
  riskLabel,
  riskLevel,
  status,
  updatedAt,
  stepsCompleted,
  stepsTotal,
  teamCompletion,
}: PlayHeaderProps) {
  const role = assignedRoles[0]?.trim()
  const runPct = stepsTotal > 0 ? Math.round((stepsCompleted / stepsTotal) * 100) : 0
  const runComplete = stepsTotal > 0 && stepsCompleted >= stepsTotal
  const teamPct = teamCompletion?.overall ?? null

  return (
    <header className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {formatSopCategory(category)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {statusLabel(status)}
          </span>
        </div>
        <h1 className="text-[2rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-[2.35rem]">
          {title}
        </h1>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCell icon={Clock} label="Est. time" value={estimatedMinutes != null ? `${estimatedMinutes} min` : "—"} />
        <StatCell
          icon={Users}
          label="Role"
          value={role ? formatTrainingRole(role) : "All crew"}
        />
        <StatCell
          icon={ShieldAlert}
          label="Risk"
          value={riskShort(riskLevel)}
          hint={riskLabel}
          valueClassName={cn("inline-flex rounded-lg px-2 py-0.5 ring-1", riskTone(riskLevel))}
        />
        <StatCell icon={CalendarClock} label="Updated" value={formatUpdatedAt(updatedAt)} />
        <StatCell
          label="Completion rate"
          value={teamPct != null ? `${teamPct}%` : "—"}
          hint={
            teamPct != null
              ? "Team readiness · docs, training, ownership"
              : "Publish and assign training to track"
          }
          className="col-span-2 sm:col-span-1"
        />
      </dl>

      {stepsTotal > 0 ? (
        <div className="rounded-2xl bg-muted/40 px-4 py-3.5 sm:px-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Your run</p>
            <p className="text-sm tabular-nums text-muted-foreground">
              {stepsCompleted}/{stepsTotal} steps
            </p>
          </div>
          <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-background/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                runComplete ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${runPct}%` }}
              role="progressbar"
              aria-valuenow={runPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Your run: ${runPct}%`}
            />
          </div>
        </div>
      ) : null}
    </header>
  )
}

function StatCell({
  icon: Icon,
  label,
  value,
  hint,
  valueClassName,
  className,
}: {
  icon?: typeof Clock
  label: string
  value: string
  hint?: string
  valueClassName?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card px-4 py-3.5 shadow-sm",
        className
      )}
      title={hint}
    >
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon ? <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden /> : null}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 text-lg font-semibold leading-tight tracking-tight text-foreground",
          valueClassName
        )}
      >
        {value}
      </dd>
    </div>
  )
}
