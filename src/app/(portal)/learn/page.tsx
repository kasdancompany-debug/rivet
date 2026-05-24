import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight, GraduationCap } from "lucide-react"

import {
  fetchBusinessForCurrentUser,
  listEmployeeModuleCertificationsForEmployeeIds,
  listTrainingModulesDeepForBusiness,
} from "@/lib/db/queries"
import { buildCertificationViews } from "@/lib/training/certifications/build-views"
import { loadPortalModulesForEmployee } from "@/lib/training/portal/load-portal-data"
import { COPY } from "@/lib/interface-copy"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { TrainingPortalShell } from "@/components/training/portal/training-portal-shell"
import { EmployeeCertificationBadges } from "@/components/training/employee-certification-badges"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: COPY.trainingPortal.metadataTitle,
}

export default async function TrainingPortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) redirect("/setup")

  const modules = await loadPortalModulesForEmployee(user.id)
  const params = await searchParams

  const deepModules = await listTrainingModulesDeepForBusiness(business.id, supabase)
  const modulesById = new Map(deepModules.map((m) => [m.id, m]))
  const certificationRows = await listEmployeeModuleCertificationsForEmployeeIds([user.id], supabase)
  const { certifiedBadges } = buildCertificationViews(user.id, modulesById, certificationRows)

  return (
    <TrainingPortalShell businessName={business.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {COPY.trainingPortal.homeTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{COPY.trainingPortal.homeLead}</p>
        </div>

        {certifiedBadges.length > 0 ? (
          <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.certifications.profileHeading}
            </p>
            <div className="mt-3">
              <EmployeeCertificationBadges badges={certifiedBadges} />
            </div>
          </section>
        ) : null}

        {params.error === "invite" ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {COPY.trainingPortal.inviteInvalid}
          </p>
        ) : null}
        {params.error === "wrong-account" ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {COPY.trainingPortal.inviteWrongAccount}
          </p>
        ) : null}

        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
            <GraduationCap className="mx-auto size-10 text-muted-foreground/70" aria-hidden />
            <p className="mt-3 font-medium text-foreground">{COPY.trainingPortal.emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{COPY.trainingPortal.emptyDesc}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {modules.map((mod) => (
              <li key={mod.moduleId}>
                <Link
                  href={`/learn/${mod.moduleId}`}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-4 shadow-sm transition-[box-shadow] hover:shadow-md"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/40">
                    <GraduationCap className="size-5 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{mod.title}</p>
                    {mod.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{mod.description}</p>
                    ) : null}
                    <Badge variant="outline" className="mt-2 text-[0.62rem] capitalize">
                      {mod.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TrainingPortalShell>
  )
}
