import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { OwnerTrainingSignoffReview } from "@/components/training/owner-training-signoff-review"
import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  fetchTrainingModuleDeep,
} from "@/lib/db/queries"
import { loadPortalModuleForEmployee } from "@/lib/training/portal/load-portal-data"
import { loadWorkspaceAccess } from "@/lib/ops/load-workspace-access"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ id: string; employeeId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const mod = await fetchTrainingModuleDeep(id, supabase)
  return { title: mod?.title ? `Sign-off · ${mod.title}` : "Step sign-off" }
}

export default async function TrainingModuleSignoffReviewPage({ params }: Props) {
  const { id: moduleId, employeeId } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) redirect("/setup")
  const access = await loadWorkspaceAccess(supabase, user.id)
  if (!access?.can("sign_off_training")) redirect("/training")

  const mod = await fetchTrainingModuleDeep(moduleId, supabase)
  if (!mod || mod.business_id !== business.id) notFound()

  const view = await loadPortalModuleForEmployee(moduleId, employeeId)
  if (!view) notFound()

  const profiles = await fetchProfilesForCurrentBusiness(supabase)
  const employeeName =
    profiles.find((p) => p.id === employeeId)?.full_name?.trim() || "Team member"

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/training/modules/${moduleId}`} />}>
        ← {mod.title}
      </Button>
      <AppPageHeader
        title="Step sign-off"
        description="Confirm manager sign-off for steps that require it before this play counts complete."
        className="mt-6 max-w-none"
      />
      <OwnerTrainingSignoffReview
        view={view}
        businessId={business.id}
        employeeId={employeeId}
        employeeName={employeeName}
      />
    </div>
  )
}
