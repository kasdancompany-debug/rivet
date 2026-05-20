"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { getRouteIntent } from "@/lib/nav-route-intros"
import { cn } from "@/lib/utils"

/**
 * Persistent orientation for the current route: where you are, why it exists, one suggested next step.
 * Complements page-specific headers; does not replace them.
 */
export function RouteIntentStrip({ className }: { className?: string }) {
  const pathname = usePathname()
  const intent = getRouteIntent(pathname)
  if (!intent) return null

  return (
    <aside
      className={cn(
        "mb-8 rounded-xl border border-border/55 bg-muted/25 px-4 py-3.5 sm:px-5 sm:py-4",
        className
      )}
      aria-label="Where you are in Rivet"
    >
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{intent.eyebrow}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">{intent.intent}</p>
      <p className="mt-2.5 text-[13px]">
        <span className="text-muted-foreground">Suggested next: </span>
        <Link
          href={intent.nextHref}
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          {intent.nextLabel}
          <ArrowRight className="size-3.5 shrink-0 opacity-80" aria-hidden />
        </Link>
      </p>
    </aside>
  )
}
