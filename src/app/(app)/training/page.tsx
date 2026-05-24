import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { GraduationCap, Plus } from "lucide-react"

import {
  countCompletedExecutionRecordsByEmployee,
  ensureEmployeeReadinessRows,
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchProfilesForCurrentBusiness,
  listEmployeeReadinessForBusiness,
  listEmployeeModuleCertificationsForEmployeeIds,
  listEmployeeStandardQuizCompletionsForEmployeeIds,
  listManagerObservationsForEmployeeIds,
  listTrainingModulesDeepForBusiness,
  listTrainingProgressForBusinessModules,
  listTrainingSopCompletionsForEmployeeIds,
} from "@/lib/db/queries"
import { buildEmployeeTrainingViewModel } from "@/lib/training/build-views"
import { formatTrainingRole } from "@/lib/training/roles"
import { COPY } from "@/lib/interface-copy"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { EmptyState } from "@/components/empty-state"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { TrainingEmployeeCard } from "@/components/training/training-employee-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: COPY.training.metadataTitle,
}

export default async function TrainingPage() {
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/training" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.training.noBizEyebrow}
            title={COPY.training.noBizTitle}
            description={COPY.training.noBizDesc}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const profile = await fetchCurrentProfile(supabase)
  const owner = isWorkspaceOwner(user.id, business, profile)

  if (owner) {
    await ensureEmployeeReadinessRows(business.id, supabase)
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
  const completions = await listTrainingSopCompletionsForEmployeeIds(employeeIds, supabase)
  const readinessRows = await listEmployeeReadinessForBusiness(business.id, supabase)
  const executionCounts = await countCompletedExecutionRecordsByEmployee(business.id, supabase)
  const quizCompletions = await listEmployeeStandardQuizCompletionsForEmployeeIds(employeeIds, supabase)
  const certificationRows = await listEmployeeModuleCertificationsForEmployeeIds(employeeIds, supabase)
  const observationRows = await listManagerObservationsForEmployeeIds(employeeIds, supabase)
  const modulesById = new Map(modules.map((m) => [m.id, m]))
  const profileNameById = new Map(team.map((p) => [p.id, p.full_name]))

  const viewModels = team.map((p) =>
    buildEmployeeTrainingViewModel(
      p,
      progress,
      modulesById,
      completions,
      readinessRows.find((r) => r.employee_id === p.id),
      executionCounts.get(p.id) ?? 0,
      quizCompletions,
      certificationRows,
      observationRows,
      profileNameById
    )
  )

  const moduleOptions = modules.map((m) => ({ id: m.id, title: m.title }))

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Training modules",
      status: modules.length === 0 ? "empty" : "ok",
      detail: `${modules.length} module(s) · ${team.length} team profile(s) in scope.`,
    },
  ]

  return (
    <DashboardRouteShell routePath="/training" fetchLines={fetchLines}>
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <AppPageHeader
            eyebrow={COPY.training.eyebrow}
            title={COPY.training.title}
            description={COPY.training.description}
            className="mb-0 sm:max-w-2xl"
          />
          {owner ? (
            <Button
              size="lg"
              className="h-11 shrink-0 self-start sm:self-auto"
              nativeButton={false}
              render={<Link href="/training/modules/new" />}
            >
              <Plus className="mr-2 size-4" aria-hidden />
              {COPY.training.newModule}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="h-11 shrink-0 self-start sm:self-auto"
              nativeButton={false}
              render={<Link href="/learn" />}
            >
              {COPY.trainingPortal.openPortal}
            </Button>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-4 sm:px-5">
          <p className="text-sm font-medium text-foreground">{COPY.trainingPortal.openPortal}</p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{COPY.trainingPortal.portalCtaLead}</p>
          <Button className="mt-3" variant="outline" size="sm" nativeButton={false} render={<Link href="/learn" />}>
            {COPY.trainingPortal.openPortal}
          </Button>
        </div>

        <section className="mt-10 space-y-4" aria-labelledby="modules-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="modules-heading" className="text-lg font-semibold tracking-tight">
              {COPY.training.modulesHeading}
            </h2>
            {modules.length > 0 && team.length > 0 ? (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/training/matrix" />}>
                {COPY.training.matrixLink}
              </Button>
            ) : null}
          </div>
          {modules.length === 0 ? (
            <div className="space-y-6">
              <EmptyState
                icon={GraduationCap}
                eyebrow={COPY.training.noBizEyebrow}
                title={COPY.training.emptyTitle}
                description={COPY.training.emptyDesc}
              >
                {owner ? (
                  <Button nativeButton={false} render={<Link href="/training/modules/new" />}>
                    {COPY.training.emptyCta}
                  </Button>
                ) : null}
              </EmptyState>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => {
                const n = mod.training_items?.length ?? 0
                return (
                  <li key={mod.id}>
                    <Link href={`/training/modules/${mod.id}`} className="group block outline-none">
                      <Card className="h-full border-border/60 bg-card/80 py-0 shadow-sm transition-[box-shadow] hover:shadow-md">
                        <CardHeader className="px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="text-base leading-snug group-hover:underline">
                              {mod.title}
                            </CardTitle>
                            <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                              {formatTrainingRole(mod.assigned_role)}
                            </Badge>
                          </div>
                          {mod.description ? (
                            <CardDescription className="line-clamp-2">{mod.description}</CardDescription>
                          ) : null}
                        </CardHeader>
                        <CardContent className="border-t border-border/40 px-5 py-3 text-xs text-muted-foreground">
                          {n} standard{n === 1 ? "" : "s"} in this module
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <Separator className="my-12" />

        <section className="space-y-4" aria-labelledby="team-heading">
          <h2 id="team-heading" className="text-lg font-semibold tracking-tight">
            {COPY.training.teamSectionTitle}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{COPY.training.teamSectionLead}</p>
          {team.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {COPY.training.teamEmpty}{" "}
              <Link href="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
                {COPY.training.teamLink}
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-6 lg:grid-cols-2">
              {viewModels.map((vm) => (
                <li key={vm.profile.id}>
                  <TrainingEmployeeCard
                    vm={vm}
                    businessId={business.id}
                    currentUserId={user.id}
                    isOwner={owner}
                    moduleOptions={moduleOptions}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    </DashboardRouteShell>
  )
}
