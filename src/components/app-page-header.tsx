import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppPageHeaderProps = {
  title: string
  description: string
  /** Short label above the title — use for area context (e.g. “Standards”). */
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

export function AppPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: AppPageHeaderProps) {
  return (
    <header className={cn("mb-10 sm:mb-12 lg:mb-14", className)}>
      <div className="flex flex-col gap-8 sm:gap-9 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? (
            <p className="rivet-section-label">{eyebrow}</p>
          ) : null}
          <h1
            className={cn(
              "font-semibold tracking-[-0.02em] text-foreground",
              eyebrow ? "mt-3" : "",
              "text-[1.6875rem] leading-[1.15] sm:text-[1.9375rem]"
            )}
          >
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-[1.65]">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5 lg:pt-1">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
