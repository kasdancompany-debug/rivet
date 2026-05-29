import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, GraduationCap } from "lucide-react"

import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { COPY } from "@/lib/interface-copy"
import { loadPortalHomeForEmployee } from "@/lib/training/portal/load-portal-home"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: COPY.staffPortal.todayTrainingPageTitle,
}

export default async function StaffTrainingListPage() {
  const user = requireAuthUser(await getServerAuthUser())
  const view = await loadPortalHomeForEmployee(user.id)
  if (!view) redirect("/setup")

  return (
    <StaffPortalShell
      businessName={view.businessName}
      title={COPY.staffPortal.todayTrainingTitle}
    >
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Home
      </Link>

      {view.todayModules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
          <GraduationCap className="mx-auto size-10 text-muted-foreground/70" aria-hidden />
          <p className="mt-3 font-medium text-foreground">{COPY.trainingPortal.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.staffPortal.todayTrainingEmpty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {view.todayModules.map((mod) => (
            <li key={mod.moduleId}>
              <Link
                href={`/learn/${mod.moduleId}`}
                className="block rounded-2xl border border-border/60 bg-card/90 px-4 py-4 shadow-sm transition-[box-shadow] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{mod.title}</p>
                    {mod.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{mod.description}</p>
                    ) : null}
                    <Badge variant="outline" className="mt-2 text-[0.62rem] capitalize">
                      {mod.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{mod.progressPct}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${mod.progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {mod.completedItems}/{mod.itemCount} plays complete
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StaffPortalShell>
  )
}
