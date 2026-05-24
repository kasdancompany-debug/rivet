"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"

import type { EscapeProgression, EscapeProgressionStageView } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

function nodeTone(
  state: EscapeProgressionStageView["state"],
  dark?: boolean
): { ring: string; fill: string; label: string } {
  switch (state) {
    case "completed":
      return {
        ring: dark
          ? "border-emerald-400/50 bg-emerald-500/20"
          : "border-emerald-500/40 bg-emerald-500/15",
        fill: dark ? "bg-emerald-400" : "bg-emerald-500",
        label: dark ? "text-emerald-200" : "text-emerald-800 dark:text-emerald-200",
      }
    case "current":
      return {
        ring: dark
          ? "border-sky-400/60 bg-sky-500/20 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
          : "border-sky-500/50 bg-sky-500/15 shadow-[0_0_0_4px_rgba(14,165,233,0.08)]",
        fill: dark ? "bg-sky-400" : "bg-sky-500",
        label: dark ? "text-sky-100" : "text-sky-900 dark:text-sky-100",
      }
    default:
      return {
        ring: dark ? "border-white/10 bg-white/[0.04]" : "border-border/60 bg-muted/30",
        fill: dark ? "bg-zinc-600" : "bg-muted-foreground/35",
        label: dark ? "text-zinc-500" : "text-muted-foreground",
      }
  }
}

export function EscapeProgressionTrack({
  progression,
  dark = false,
  compact = false,
}: {
  progression: EscapeProgression
  dark?: boolean
  compact?: boolean
}) {
  const [animatedPercent, setAnimatedPercent] = useState(0)

  useEffect(() => {
    const target = progression.overallPercent
    const start = performance.now()
    const duration = 900

    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setAnimatedPercent(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [progression.overallPercent])

  const track = dark ? "bg-white/[0.08]" : "bg-muted/60"
  const fill = dark
    ? "bg-gradient-to-r from-sky-500/80 via-sky-400/90 to-emerald-400/80"
    : "bg-gradient-to-r from-sky-600/85 via-sky-500/90 to-emerald-500/85"

  const currentStage = progression.stages.find((s) => s.state === "current")

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1">
        <p
          className={cn(
            "font-mono text-[10px] font-semibold uppercase tracking-[0.16em]",
            dark ? "text-zinc-500" : "text-muted-foreground"
          )}
        >
          Progression
        </p>
        {progression.nextStageLabel && progression.pointsToNextStage != null ? (
          <p className={cn("text-[11px]", dark ? "text-zinc-400" : "text-muted-foreground")}>
            {progression.pointsToNextStage} pts to {progression.nextStageLabel}
          </p>
        ) : (
          <p className={cn("text-[11px] font-medium", dark ? "text-emerald-300" : "text-emerald-700")}>
            Final stage reached
          </p>
        )}
      </div>

      <div className={cn("relative mt-4", compact ? "h-1.5" : "h-2")}>
        <div className={cn("absolute inset-0 overflow-hidden rounded-full", track)} aria-hidden />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out",
            fill
          )}
          style={{ width: `${animatedPercent}%` }}
          aria-hidden
        />
        {progression.stages.map((stage) => (
          <span
            key={stage.id}
            className={cn(
              "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background",
              stage.state === "completed"
                ? dark
                  ? "bg-emerald-400"
                  : "bg-emerald-500"
                : stage.state === "current"
                  ? dark
                    ? "bg-sky-400"
                    : "bg-sky-500"
                  : dark
                    ? "bg-zinc-600"
                    : "bg-muted-foreground/40"
            )}
            style={{ left: `${stage.trackStartPercent}%` }}
            aria-hidden
          />
        ))}
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-5 sm:gap-1.5">
        {progression.stages.map((stage, index) => {
          const tone = nodeTone(stage.state, dark)
          const isCurrent = stage.state === "current"

          return (
            <li
              key={stage.id}
              className={cn(
                "relative flex flex-col items-center rounded-xl border px-2 py-3 text-center transition-all duration-500",
                stage.state === "completed"
                  ? dark
                    ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                    : "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : isCurrent
                    ? dark
                      ? "border-sky-500/35 bg-sky-500/[0.08]"
                      : "border-sky-500/25 bg-sky-500/[0.06]"
                    : dark
                      ? "border-white/[0.06] bg-white/[0.02]"
                      : "border-border/50 bg-muted/10"
              )}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-colors duration-500",
                  tone.ring,
                  isCurrent && "motion-safe:animate-pulse"
                )}
              >
                {stage.state === "completed" ? (
                  <Check className={cn("size-3.5", tone.label)} aria-hidden />
                ) : (
                  <span className={cn("size-2 rounded-full", tone.fill)} aria-hidden />
                )}
              </span>
              <p className={cn("mt-2 text-[11px] font-semibold leading-tight", tone.label)}>
                {stage.label}
              </p>
              {isCurrent ? (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", fill)}
                    style={{ width: `${stage.segmentFillPercent}%` }}
                  />
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      {currentStage ? (
        <p
          className={cn(
            "mt-4 text-sm leading-relaxed",
            dark ? "text-zinc-300" : "text-muted-foreground"
          )}
        >
          {currentStage.summary}
        </p>
      ) : null}
    </div>
  )
}
