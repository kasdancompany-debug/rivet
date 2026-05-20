"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

/** Subtle “data refresh” cadence — no fake metrics, only clock + opacity pulse. */
export function LandingHeroLiveContext({ className }: { className?: string }) {
  const [tick, setTick] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date())
      setTick((n) => n + 1)
    }, 12_000)
    return () => window.clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <p
      suppressHydrationWarning
      className={cn(
        "mt-2 font-mono text-[0.5rem] uppercase tracking-wide text-zinc-500 transition-opacity duration-500",
        tick % 2 === 1 ? "opacity-55" : "opacity-100",
        className
      )}
    >
      Last ingest · {timeStr}
    </p>
  )
}
