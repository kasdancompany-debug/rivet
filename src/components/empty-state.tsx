import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  /** Short context line above the title. */
  eyebrow?: string
  children?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  eyebrow,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-14 text-center shadow-[0_1px_0_rgba(15,23,42,0.05),0_12px_32px_-8px_rgba(15,23,42,0.06)] sm:px-10 sm:py-16",
        className
      )}
    >
      <div className="flex max-w-lg flex-col items-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-border/60 bg-muted/35">
          <Icon className="size-5 text-muted-foreground" strokeWidth={1.35} />
        </div>
        {eyebrow ? (
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl",
            eyebrow ? "mt-2" : ""
          )}
        >
          {title}
        </h2>
        <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-[1.6]">
          {description}
        </p>
        {children ? (
          <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}
