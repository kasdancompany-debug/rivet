"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import type { PilotWindowDays } from "@/lib/internal-metrics/period"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PilotWindowPicker({ windowDays }: { windowDays: PilotWindowDays }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function select(days: PilotWindowDays) {
    startTransition(() => {
      router.push(`/internal/pilot?window=${days}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        Trend window
      </span>
      {([7, 30] as const).map((days) => (
        <Button
          key={days}
          type="button"
          size="sm"
          variant={windowDays === days ? "default" : "outline"}
          disabled={pending}
          className={cn("h-9 min-w-[7rem]")}
          onClick={() => select(days)}
        >
          Last {days} days
        </Button>
      ))}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        nativeButton={false}
        render={<Link href="/internal/metrics" />}
      >
        Custom comparison →
      </Button>
    </div>
  )
}
