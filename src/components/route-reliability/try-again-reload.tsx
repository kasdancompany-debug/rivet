"use client"

import { useRouter } from "next/navigation"

import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"

/** Re-runs server loaders for the current route without a full navigation. */
export function TryAgainReload({ label = COPY.dashboard.errorNextCta }: { label?: string }) {
  const router = useRouter()
  return (
    <Button type="button" variant="secondary" onClick={() => router.refresh()}>
      {label}
    </Button>
  )
}
