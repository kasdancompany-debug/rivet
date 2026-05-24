import { Check } from "lucide-react"

import { EscapeAnimatedScore } from "@/components/escape-readiness/escape-animated-score"
import { EscapeAbsenceSimulationTrigger } from "@/components/escape-readiness/escape-absence-simulation"
import { EscapeAbsenceTimeline } from "@/components/escape-readiness/escape-absence-timeline"
import { EscapeProgressionTrack } from "@/components/escape-readiness/escape-progression-track"
import { ESCAPE_READINESS_MILESTONES, escapeMilestoneState } from "@/lib/escape-readiness/milestones"
import { escapeStatusTierTone } from "@/lib/escape-readiness/presentation"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function EscapeReadinessHero({
  model,
  dark = false,
  compact = false,
}: {
  model: EscapeReadinessView
  dark?: boolean
  compact?: boolean
}) {
  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const body = dark ? "text-zinc-300" : "text-muted-foreground"
  const title = dark ? "text-white" : "text-foreground"
  const track = dark ? "bg-white/[0.08]" : "bg-muted/60"
  const fill = dark ? "bg-sky-500/70" : "bg-sky-600/80 dark:bg-sky-500/75"

  const score = model.score
  const fillWidth = score == null ? 0 : Math.min(100, Math.max(0, score))

  return (
    <div
      className={cn(
        "flex flex-col items-center px-5 py-8 text-center sm:px-7",
        compact ? "py-6" : "py-10 sm:py-12"
      )}
    >
      <p className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.2em]", muted)}>
        Escape readiness
      </p>

      <div className="mt-6">
        {score == null ? (
          <span className={cn("text-5xl font-semibold tabular-nums", muted)}>—</span>
        ) : (
          <EscapeAnimatedScore
            score={score}
            gain={model.scoreGain}
            dark={dark}
            compact={compact}
          />
        )}
      </div>

      {model.statusBadge && model.statusTier ? (
        <Badge
          variant="outline"
          className={cn(
            "mt-5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
            escapeStatusTierTone(model.statusTier)
          )}
        >
          {model.statusBadge}
        </Badge>
      ) : null}

      {model.statusInterpretation ? (
        <p
          className={cn(
            "mt-4 max-w-md text-base font-medium leading-snug sm:text-lg",
            title
          )}
        >
          {model.statusInterpretation}
        </p>
      ) : null}

      {score != null ? (
        <div className="mt-8 w-full max-w-2xl">
          {model.progression ? (
            <EscapeProgressionTrack
              progression={model.progression}
              dark={dark}
              compact={compact}
            />
          ) : null}

          <div className="mt-8 border-t border-border/40 pt-8 dark:border-white/[0.08]">
            <p
              className={cn(
                "mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]",
                muted
              )}
            >
              Absence milestones
            </p>
            <div className={cn("relative h-2 overflow-hidden rounded-full", track)}>
              <div
                className={cn("absolute inset-y-0 left-0 rounded-full transition-all", fill)}
                style={{ width: `${fillWidth}%` }}
                role="presentation"
              />
              {ESCAPE_READINESS_MILESTONES.map((m) => (
                <span
                  key={m.threshold}
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-muted-foreground/40"
                  style={{ left: `${m.threshold}%` }}
                  aria-hidden
                />
              ))}
            </div>

            <ul className="mt-5 space-y-2.5 text-left">
            {ESCAPE_READINESS_MILESTONES.map((milestone) => {
              const state = escapeMilestoneState(score, milestone)
              const reached = state === "reached"
              const isNext = state === "next"

              return (
                <li
                  key={milestone.threshold}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    reached
                      ? dark
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : isNext
                        ? dark
                          ? "border-sky-500/30 bg-sky-500/10"
                          : "border-sky-500/25 bg-sky-500/[0.06]"
                        : dark
                          ? "border-white/[0.06] bg-white/[0.03]"
                          : "border-border/50 bg-muted/15"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold tabular-nums",
                      reached
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                        : isNext
                          ? "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-200"
                          : "border-border/60 text-muted-foreground"
                    )}
                  >
                    {reached ? <Check className="size-3.5" aria-hidden /> : `${milestone.threshold}%`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-medium", reached || isNext ? title : muted)}>
                      {milestone.label}
                    </p>
                    {isNext && !reached ? (
                      <p className={cn("text-xs", muted)}>
                        {milestone.threshold - score} pts to unlock
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
          </div>

          {model.absenceCapacity ? (
            <div className="mt-8 border-t border-border/40 pt-8 dark:border-white/[0.08]">
              <EscapeAbsenceTimeline
                capacity={model.absenceCapacity}
                dark={dark}
                compact={compact}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <p className={cn("mt-6 max-w-sm text-sm leading-relaxed", body)}>
          Log standards, training, and owner pulls so Rivet can score your escape path.
        </p>
      )}

      {!compact ? (
        <p className={cn("mt-6 max-w-lg text-sm leading-relaxed", body)}>{model.verdict}</p>
      ) : null}

      {score != null ? (
        <div className="mt-6 flex justify-center">
          <EscapeAbsenceSimulationTrigger model={model} dark={dark} compact={compact} />
        </div>
      ) : null}

      {model.demo ? (
        <p className={cn("mt-2 text-[11px]", muted)}>
          Illustrative example for preview—not your live workspace.
        </p>
      ) : null}
    </div>
  )
}
