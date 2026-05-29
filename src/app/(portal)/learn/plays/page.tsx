import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react"

import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { COPY } from "@/lib/interface-copy"
import { loadPortalHomeForEmployee } from "@/lib/training/portal/load-portal-home"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: COPY.staffPortal.playsTitle,
}

export default async function StaffPlaysPage() {
  const user = requireAuthUser(await getServerAuthUser())
  const view = await loadPortalHomeForEmployee(user.id)
  if (!view) redirect("/setup")

  return (
    <StaffPortalShell businessName={view.businessName} title={COPY.staffPortal.playsTitle}>
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Home
      </Link>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {COPY.staffPortal.playsLead(view.assignedPlays.length)}
      </p>

      {view.assignedPlays.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground/70" aria-hidden />
          <p className="mt-3 font-medium text-foreground">{COPY.staffPortal.playsEmpty}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {view.assignedPlays.map((play) => (
            <li key={play.standardId}>
              <Link
                href={`/learn/plays/${play.standardId}`}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-4 shadow-sm"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/40">
                  <BookOpen className="size-5 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{play.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{play.moduleTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {play.estimatedMinutes != null ? (
                      <Badge variant="outline" className="text-[0.62rem]">
                        ~{play.estimatedMinutes} min
                      </Badge>
                    ) : null}
                    {play.completed ? (
                      <Badge variant="outline" className="border-emerald-500/30 text-[0.62rem] text-emerald-700">
                        {COPY.staffPortal.playDone}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StaffPortalShell>
  )
}
