"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { BookOpen, CheckCircle2, HeartPulse, Settings, Sparkles, X } from "lucide-react"

import { ONBOARDING_STORAGE_KEY, type OwnerOnboardingStored } from "@/lib/onboarding/owner-intake"
import { COPY } from "@/lib/interface-copy"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DISMISS_KEY = "rivet.welcome.dismissed.v2"

function readOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!raw) return false
    const p = JSON.parse(raw) as OwnerOnboardingStored
    return Boolean(p?.completedAt)
  } catch {
    return false
  }
}

export function WelcomeBanner({ hasWorkspace }: { hasWorkspace: boolean }) {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setDismissed(localStorage.getItem(DISMISS_KEY) === "1")
      } catch {
        setDismissed(false)
      }
      setOnboardingDone(readOnboardingComplete())
    })
  }, [])

  if (pathname !== "/dashboard" || dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      className={cn(
        "relative mb-8 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/95 px-5 py-7 shadow-[0_1px_0_rgba(15,23,42,0.05),0_16px_48px_-12px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8"
      )}
      role="region"
      aria-label={COPY.welcome.onboardingAria}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 shrink-0 text-muted-foreground hover:text-foreground sm:right-3 sm:top-3"
        onClick={dismiss}
        aria-label={COPY.welcome.dismiss}
      >
        <X className="size-4" />
      </Button>

      {onboardingDone ? (
        <div className="pr-10 sm:pr-12">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300/95">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            {COPY.welcome.doneLine}
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {COPY.welcome.doneTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{COPY.welcome.doneBody}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-10 gap-2 px-4")}
            >
              <HeartPulse className="size-4 opacity-90" aria-hidden />
              {COPY.welcome.reportAgain}
            </Link>
            <Link
              href="/sops/capture"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 gap-2 px-4")}
            >
              <Sparkles className="size-4 opacity-80" aria-hidden />
              {COPY.welcome.capture}
            </Link>
          </div>
        </div>
      ) : (
        <div className="pr-10 sm:pr-12">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {COPY.welcome.todoEyebrow}
          </p>
          <h2 className="mt-2 text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {COPY.welcome.todoTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-[1.65]">
            {COPY.welcome.todoBody}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11 justify-center gap-2 px-6")}
            >
              <HeartPulse className="size-4 opacity-95" aria-hidden />
              {COPY.welcome.todoCta}
            </Link>
            <div className="flex flex-wrap gap-2">
              <SoftChip
                icon={Settings}
                href="/settings"
                label={hasWorkspace ? COPY.welcome.chipSettingsLinked : COPY.welcome.chipSettingsUnlinked}
                emphasize={!hasWorkspace}
              />
              <SoftChip icon={BookOpen} href="/sops/templates" label={COPY.welcome.chipBrowse} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SoftChip({
  icon: Icon,
  href,
  label,
  emphasize,
}: {
  icon: LucideIcon
  href: string
  label: string
  emphasize?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: emphasize ? "secondary" : "outline", size: "sm" }),
        "h-9 gap-2 border-dashed px-3"
      )}
    >
      <Icon className="size-3.5 opacity-80" aria-hidden />
      {label}
    </Link>
  )
}
