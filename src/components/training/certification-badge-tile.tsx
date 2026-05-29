import Link from "next/link"
import { Award, CheckCircle2 } from "lucide-react"

import type { CertificationBadge } from "@/lib/training/certifications/build-views"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

function formatEarned(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function CertificationBadgeTile({
  badge,
  href,
  className,
}: {
  badge: CertificationBadge
  href?: string
  className?: string
}) {
  const inner = (
    <div
      className={cn(
        "group relative flex min-h-[5.5rem] flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-50/80 via-background to-background px-4 py-3.5 shadow-sm transition-colors dark:from-amber-950/25 dark:via-background",
        href && "hover:border-amber-500/45 hover:shadow-md",
        className
      )}
      title={COPY.certifications.badgeTitle(badge.label, badge.certifiedAt)}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full border border-amber-500/15"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          <Award className="size-4 text-amber-700 dark:text-amber-300" aria-hidden />
        </div>
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 opacity-90" aria-hidden />
      </div>
      <div className="relative mt-3">
        <p className="text-sm font-semibold leading-snug text-foreground">{badge.label}</p>
        <p className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Certified · {formatEarned(badge.certifiedAt)}
        </p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {inner}
      </Link>
    )
  }

  return inner
}
