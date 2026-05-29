import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export function StaffPortalSection({
  title,
  href,
  actionLabel,
  children,
  className,
}: {
  title: string
  href?: string
  actionLabel?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {href && actionLabel ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary"
          >
            {actionLabel}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}
