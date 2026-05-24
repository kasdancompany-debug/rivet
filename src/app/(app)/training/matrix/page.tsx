import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  listEmployeeModuleCertificationsForEmployeeIds,
  listTrainingModulesDeepForBusiness,
  listTrainingProgressForBusinessModules,
} from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { buildTeamReadinessMatrix } from "@/lib/training/readiness-matrix/build-matrix"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { TeamReadinessMatrixView } from "@/components/training/team-readiness-matrix"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: COPY.readinessMatrix.metadataTitle,
}

export default async function TeamReadinessMatrixPage() {
  requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/training/matrix" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.readinessMatrix.eyebrow}
            title={COPY.readinessMatrix.title}
            description={COPY.readinessMatrix.description}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const modules = await listTrainingModulesDeepForBusiness(business.id, supabase)
  const moduleIds = modules.map((m) => m.id)
  const progress = await listTrainingProgressForBusinessModules(moduleIds, supabase)
  const profiles = await fetchProfilesForCurrentBusiness(supabase)
  const teamRaw = profiles.filter(
    (p) => p.business_id === business.id || p.id === business.owner_id
  )
  const team = [...new Map(teamRaw.map((p) => [p.id, p])).values()].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, undefined, { sensitivity: "base" })
  )
  const employeeIds = team.map((p) => p.id)
  const certificationRows = await listEmployeeModuleCertificationsForEmployeeIds(employeeIds, supabase)

  const matrix = buildTeamReadinessMatrix({
    employees: team,
    modules,
    progress,
    certificationRows,
  })

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Readiness matrix",
      status: modules.length === 0 || team.length === 0 ? "empty" : "ok",
      detail: `${modules.length} module(s) · ${team.length} team member(s).`,
    },
  ]

  return (
    <DashboardRouteShell routePath="/training/matrix" fetchLines={fetchLines}>
      <>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-9 text-muted-foreground"
            nativeButton={false}
            render={<Link href="/training" />}
          >
            <ArrowLeft className="mr-1.5 size-4" aria-hidden />
            {COPY.readinessMatrix.backToTraining}
          </Button>
        </div>

        <AppPageHeader
          eyebrow={COPY.readinessMatrix.eyebrow}
          title={COPY.readinessMatrix.title}
          description={COPY.readinessMatrix.description}
        />

        <div className="mt-8">
          <TeamReadinessMatrixView matrix={matrix} />
        </div>
      </>
    </DashboardRouteShell>
  )
}
