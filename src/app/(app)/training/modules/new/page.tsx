import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { fetchBusinessForCurrentUser, fetchCurrentProfile } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { TrainingModuleForm } from "@/components/training/training-module-form"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "New training module",
}

export default async function NewTrainingModulePage() {
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  const profile = await fetchCurrentProfile(supabase)
  if (!business || !isWorkspaceOwner(user.id, business, profile)) {
    const fetchLines: RouteFetchLine[] = [
      lineForWorkspaceLinked(Boolean(business)),
      {
        label: "Owner gate",
        status: "skipped",
        detail: "Only the workspace owner can create training modules.",
      },
    ]
    return (
      <DashboardRouteShell routePath="/training/modules/new" fetchLines={fetchLines}>
        <>
          <AppPageHeader title="New module" description="Only the business owner can create training modules." />
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Owner access required</CardTitle>
              <CardDescription>
                Ask your owner to create modules, or open Settings if you should be listed as owner.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button nativeButton={false} render={<Link href="/settings" />}>
                Open settings
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href="/training" />}>
                Back to Training
              </Button>
            </CardContent>
          </Card>
        </>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    { label: "New module form", status: "ok", detail: "Owner confirmed; form posts to training_modules." },
  ]

  return (
    <DashboardRouteShell routePath="/training/modules/new" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          title="New training module"
          description="Pick a role preset, then attach standards from your library on the next screen."
        />
        <div className="mt-8">
          <TrainingModuleForm businessId={business.id} />
        </div>
      </>
    </DashboardRouteShell>
  )
}
