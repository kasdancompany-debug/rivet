import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchProfilesForCurrentBusiness,
  fetchTrainingModuleDeep,
  listEmployeeTrainingProgress,
  listSopsForBusiness,
} from "@/lib/db/queries"
import { formatTrainingRole } from "@/lib/training/roles"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { TrainingModuleDeleteButton } from "@/components/training/training-module-delete-button"
import { TrainingModuleSopsEditor } from "@/components/training/training-module-sops-editor"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Badge } from "@/components/ui/badge"
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
  return { title: mod?.title ? `${mod.title} · Training` : "Training module" }
}

export default async function TrainingModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  const profile = await fetchCurrentProfile(supabase)
  if (!business) redirect("/setup")

  const mod = await fetchTrainingModuleDeep(id, supabase)
  if (!mod || mod.business_id !== business.id) notFound()

  const owner = isWorkspaceOwner(user.id, business, profile)
  const sops = await listSopsForBusiness(business.id, undefined, supabase)
  const progress = await listEmployeeTrainingProgress({ moduleId: id }, supabase)
  const profiles = await fetchProfilesForCurrentBusiness(supabase)
  const nameById = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]))

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Training module",
      status: "ok",
      detail: `Module ${mod.id} · ${(mod.training_items ?? []).length} linked standard(s) · ${progress.length} assignment row(s).`,
    },
  ]

  return (
    <DashboardRouteShell routePath={`/training/modules/${id}`} fetchLines={fetchLines}>
      <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/training" />}>
          ← Training
        </Button>
        {owner ? (
          <>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/training/modules/${id}/edit`} />}>
              Edit details
            </Button>
            <TrainingModuleDeleteButton moduleId={mod.id} title={mod.title} />
          </>
        ) : null}
      </div>

      <AppPageHeader
        title={mod.title}
        description={
          mod.description?.trim() ||
          "Standards in this module count toward anyone it is assigned to. Add every play they must know cold."
        }
        className="mb-0 max-w-2xl"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant="outline">{formatTrainingRole(mod.assigned_role)}</Badge>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Standards in this module</CardTitle>
            <CardDescription>Link plays from Standards. Required items drive completion %.</CardDescription>
          </CardHeader>
          <CardContent>
            {owner ? (
              <TrainingModuleSopsEditor moduleId={mod.id} items={mod.training_items ?? []} availableSops={sops} />
            ) : (
              <ul className="space-y-2 text-sm">
                {(mod.training_items ?? []).length === 0 ? (
                  <li className="text-muted-foreground">No standards linked.</li>
                ) : (
                  (mod.training_items ?? []).map((item) => (
                    <li key={item.id}>
                      <Link href={`/sops/${item.standard_id}`} className="font-medium hover:underline">
                        {item.standards?.title ?? "Standard"}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Assigned team</CardTitle>
            <CardDescription>Assign people from the main Training page. This list shows who is on this track.</CardDescription>
          </CardHeader>
          <CardContent>
            {progress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody assigned yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {progress.map((row) => (
                  <li key={row.id} className="flex justify-between gap-2 rounded-lg border border-border/40 px-3 py-2">
                    <span className="font-medium">{nameById[row.employee_id] ?? "Team member"}</span>
                    <span className="text-muted-foreground">{row.status.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      </>
    </DashboardRouteShell>
  )
}
