"use client"

import { useEffect, useState } from "react"

import type { EscapeScoreGain } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

export function EscapeAnimatedScore({
  score,
  gain,
  dark = false,
  compact = false,
}: {
  score: number
  gain: EscapeScoreGain | null
  dark?: boolean
  compact?: boolean
}) {
  const targetScore = score
  const startScore = gain?.previousScore ?? score
  const shouldAnimate = gain != null && gain.pointsGained > 0

  const [displayScore, setDisplayScore] = useState(shouldAnimate ? startScore : targetScore)
  const [showGain, setShowGain] = useState(false)

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayScore(targetScore)
      setShowGain(false)
      return
    }

    setDisplayScore(startScore)
    setShowGain(false)

    const start = performance.now()
    const duration = 1100
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplayScore(Math.round(startScore + (targetScore - startScore) * eased))
      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setShowGain(true)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [shouldAnimate, startScore, targetScore])

  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const title = dark ? "text-white" : "text-foreground"
  const gainTone = dark
    ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
    : "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-200"

  return (
    <div className="flex flex-col items-center">
      {shouldAnimate && gain ? (
        <div
          className={cn(
            "mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tabular-nums tracking-wide transition-all duration-500",
            gainTone,
            showGain ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
        >
          {gain.gainLabel}
        </div>
      ) : null}

      <div className="flex items-baseline justify-center gap-0.5">
        <span
          className={cn(
            "font-semibold tabular-nums leading-none tracking-tight transition-colors duration-300",
            title,
            shouldAnimate && !showGain && "text-sky-600 dark:text-sky-300",
            compact ? "text-[clamp(3.5rem,14vw,5rem)]" : "text-[clamp(4rem,16vw,6.5rem)]"
          )}
        >
          {displayScore}
        </span>
        <span
          className={cn(
            "font-semibold tabular-nums leading-none",
            muted,
            compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
          )}
        >
          %
        </span>
      </div>

      {shouldAnimate && gain && showGain ? (
        <p
          className={cn(
            "mt-4 max-w-sm text-sm font-medium leading-snug transition-all duration-500",
            dark ? "text-emerald-200" : "text-emerald-800 dark:text-emerald-200",
            showGain ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
        >
          {gain.humanExplanation}
        </p>
      ) : null}

      {shouldAnimate && gain && !showGain ? (
        <p className={cn("mt-3 text-[11px] tabular-nums", muted)}>
          {gain.previousScore}% → {gain.currentScore}%
        </p>
      ) : null}
    </div>
  )
}
