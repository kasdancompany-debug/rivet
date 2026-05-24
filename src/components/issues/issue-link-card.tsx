import Link from "next/link"
import { BookOpen, FileText, User, Zap } from "lucide-react"

import type { IssueLinkView } from "@/lib/issues/links/types"
import { issueLinkKindBadgeClass, labelForIssueLinkKind } from "@/lib/issues/links/constants"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { IssueLinkKind } from "@/types/database"

function iconForKind(kind: IssueLinkKind) {
  switch (kind) {
    case "standard":
      return FileText
    case "training_module":
      return BookOpen
    case "owner_interruption":
      return Zap
    case "staff_member":
      return User
    default:
      return FileText
  }
}

export function IssueLinkCard({ link, compact = false }: { link: IssueLinkView; compact?: boolean }) {
  const Icon = iconForKind(link.kind)
  const inner = (
    <>
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border",
            issueLinkKindBadgeClass(link.kind)
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{link.title}</p>
          {link.subtitle ? (
            <p className={cn("text-muted-foreground", compact ? "text-[0.65rem]" : "text-xs")}>{link.subtitle}</p>
          ) : null}
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn("shrink-0 text-[0.6rem] font-medium uppercase tracking-wide", issueLinkKindBadgeClass(link.kind))}
      >
        {labelForIssueLinkKind(link.kind)}
      </Badge>
    </>
  )

  if (link.href) {
    return (
      <Link
        href={link.href}
        className={cn(
          "flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-card transition-colors hover:bg-muted/20",
          compact ? "px-2.5 py-2" : "px-3 py-2.5"
        )}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/15",
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      )}
    >
      {inner}
    </div>
  )
}

export function IssueLinkChips({ links, max = 3 }: { links: IssueLinkView[]; max?: number }) {
  if (links.length === 0) return null

  const shown = links.slice(0, max)
  const remaining = links.length - shown.length

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((link) => {
        const Icon = iconForKind(link.kind)
        const chip = (
          <span
            className={cn(
              "inline-flex max-w-[12rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-medium",
              issueLinkKindBadgeClass(link.kind)
            )}
          >
            <Icon className="size-3 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{link.title}</span>
          </span>
        )

        if (link.href) {
          return (
            <Link key={link.id} href={link.href} className="hover:opacity-90">
              {chip}
            </Link>
          )
        }

        return <span key={link.id}>{chip}</span>
      })}
      {remaining > 0 ? (
        <span className="text-[0.65rem] text-muted-foreground">+{remaining} more</span>
      ) : null}
    </div>
  )
}
