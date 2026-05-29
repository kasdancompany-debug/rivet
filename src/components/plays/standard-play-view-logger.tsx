"use client"

import { useEffect, useRef } from "react"

import { logStandardPlayView } from "@/app/actions/standard-play-views"

export function StandardPlayViewLogger({
  standardId,
  source = "portal",
}: {
  standardId: string
  source?: "portal" | "owner" | "training"
}) {
  const logged = useRef(false)

  useEffect(() => {
    if (logged.current) return
    logged.current = true
    void logStandardPlayView({ standardId, source })
  }, [standardId, source])

  return null
}
