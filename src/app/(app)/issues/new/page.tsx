import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { fetchBusinessForCurrentUser, fetchProfilesForCurrentBusiness, listIssuesForBusiness } from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { IssueCreateForm } from "@/components/issues/issue-create-form"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"

export const metadata: Metadata = {
  title: COPY.issues.newMetadataTitle,
}

export default async function NewIssuePage() {
  requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/issues/new" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.issues.newEyebrow}
            title={COPY.issues.newTitle}
            description={COPY.issues.newDescription}
          />
          <BusinessLinkRequiredPanel description={COPY.issues.newConnectDesc} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const [scoringHistory, profiles] = await Promise.all([
    listIssuesForBusiness(business.id, {}, supabase),
    fetchProfilesForCurrentBusiness(supabase),
  ])

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    { label: "New issue form", status: "ok", detail: "Workspace linked; form posts to issues." },
  ]

  return (
    <DashboardRouteShell routePath="/issues/new" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          eyebrow={COPY.issues.newEyebrow}
          title={COPY.issues.newTitle}
          description={COPY.issues.newSuccessDescription}
        />
        <IssueCreateForm businessId={business.id} scoringHistory={scoringHistory} profiles={profiles} />
      </>
    </DashboardRouteShell>
  )
}
