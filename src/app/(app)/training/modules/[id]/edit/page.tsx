import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { fetchBusinessForCurrentUser, fetchCurrentProfile, fetchTrainingModuleDeep } from "@/lib/db/queries"
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const mod = await fetchTrainingModuleDeep(id, supabase)
  return { title: mod ? `Edit · ${mod.title}` : "Edit module" }
}

export default async function EditTrainingModulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  const profile = await fetchCurrentProfile(supabase)
  const mod = await fetchTrainingModuleDeep(id, supabase)

  if (!business || !mod || mod.business_id !== business.id) notFound()

  if (!isWorkspaceOwner(user.id, business, profile)) {
    const fetchLines: RouteFetchLine[] = [
      lineForWorkspaceLinked(true),
      { label: "Edit gate", status: "skipped", detail: "Current user is not workspace owner." },
    ]
    return (
      <DashboardRouteShell routePath={`/training/modules/${id}/edit`} fetchLines={fetchLines}>
        <>
          <AppPageHeader title="Edit module" description="Owner access required." />
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">You can’t edit this module</CardTitle>
              <CardDescription>Ask the business owner to make changes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button nativeButton={false} render={<Link href="/settings" />}>
                Open settings
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href={`/training/modules/${id}`} />}>
                View module
              </Button>
            </CardContent>
          </Card>
        </>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    { label: "Edit module form", status: "ok", detail: `Editing module ${mod.id}.` },
  ]

  return (
    <DashboardRouteShell routePath={`/training/modules/${id}/edit`} fetchLines={fetchLines}>
      <>
        <div className="mb-6">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/training/modules/${id}`} />}>
            ← Back to module
          </Button>
        </div>
        <AppPageHeader title="Edit module" description="Update the title, role preset, and description." />
        <div className="mt-8">
          <TrainingModuleForm
            businessId={business.id}
            initial={{
              id: mod.id,
              title: mod.title,
              description: mod.description,
              assigned_role: mod.assigned_role,
            }}
          />
        </div>
      </>
    </DashboardRouteShell>
  )
}
