"use client"

import { useEffect, useState } from "react"

import { formatAbsenceDays } from "@/lib/escape-readiness/absence-capacity"
import {
  type OperationalScanResult,
  formatSeverityLabel,
  severityStyles,
} from "@/lib/operational-scan/score"
import { cn } from "@/lib/utils"

const REVEAL_MS = 1400

function revealGlowClass(severity: OperationalScanResult["severity"]): string {
  switch (severity) {
    case "LOW":
      return "bg-emerald-400/25"
    case "MODERATE":
      return "bg-amber-400/25"
    case "HIGH":
      return "bg-orange-400/30"
    case "CRITICAL":
      return "bg-rose-400/35"
    default:
      return "bg-zinc-400/20"
  }
}

export function ScanScoreReveal({
  result,
  stepAwayDays,
}: {
  result: OperationalScanResult
  stepAwayDays: number
}) {
  const targetScore = result.ownerDependencyScore
  const styles = severityStyles(result.severity)
  const daysLabel = formatAbsenceDays(stepAwayDays)

  const [displayScore, setDisplayScore] = useState(0)
  const [ringProgress, setRingProgress] = useState(0)
  const [revealing, setRevealing] = useState(true)
  const [showPayoff, setShowPayoff] = useState(false)

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reducedMotion) {
      setDisplayScore(targetScore)
      setRingProgress(targetScore / 100)
      setRevealing(false)
      setShowPayoff(true)
      return
    }

    setDisplayScore(0)
    setRingProgress(0)
    setRevealing(true)
    setShowPayoff(false)

    const start = performance.now()
    let frame = 0
    let payoffTimer: number | undefined

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / REVEAL_MS)
      const eased = 1 - (1 - t) ** 3
      setDisplayScore(Math.round(targetScore * eased))
      setRingProgress((targetScore / 100) * eased)

      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setDisplayScore(targetScore)
        setRingProgress(targetScore / 100)
        setRevealing(false)
        payoffTimer = window.setTimeout(() => setShowPayoff(true), 120)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      if (payoffTimer) window.clearTimeout(payoffTimer)
    }
  }, [targetScore])

  const r = 52
  const c = 2 * Math.PI * r
  const dash = c * ringProgress

  return (
    <div className="relative flex flex-col items-center text-center">
      <div
        className="relative aspect-square w-[min(21rem,88vw)] max-w-[21rem]"
        role="img"
        aria-label={`Owner Dependency Score ${targetScore} out of 100`}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-[8%] rounded-full blur-3xl transition-opacity duration-700",
            revealGlowClass(result.severity),
            revealing ? "scan-score-reveal-glow opacity-70" : "opacity-0"
          )}
        />

        <svg viewBox="0 0 120 120" className="relative size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="4.5" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            className={cn(styles.ring, revealing && "drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]")}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash + 0.001}`}
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Owner Dependency Score
          </p>
          <p
            className={cn(
              "mt-2 text-[clamp(4.5rem,15vw,6rem)] font-semibold tabular-nums leading-none tracking-[-0.05em]",
              styles.score,
              revealing && "scan-score-reveal-pulse"
            )}
          >
            {displayScore}
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600">
            0–100 · higher = more depends on you
          </p>
        </div>
      </div>

      <p
        className={cn(
          "mt-8 max-w-lg text-balance text-[clamp(1.125rem,4vw,1.625rem)] font-medium leading-snug tracking-tight text-zinc-300 transition-all duration-700",
          showPayoff ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        You could likely step away for{" "}
        <span className={cn("font-semibold", styles.score)}>{daysLabel}</span> without major operational
        breakdowns
      </p>

      <p
        className={cn(
          "mt-6 inline-flex rounded-md border px-4 py-1.5 text-[13px] font-semibold tracking-tight transition-all duration-500",
          styles.badge,
          showPayoff ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        )}
      >
        Severity · {formatSeverityLabel(result.severity)}
      </p>
    </div>
  )
}
