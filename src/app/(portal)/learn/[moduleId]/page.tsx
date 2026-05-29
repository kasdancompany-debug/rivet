import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { loadPortalModuleForEmployee } from "@/lib/training/portal/load-portal-data"
import { loadPortalHomeForEmployee } from "@/lib/training/portal/load-portal-home"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { TrainingModulePlayer } from "@/components/training/portal/training-module-player"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ moduleId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId } = await params
  const user = await getServerAuthUser()
  if (!user) return { title: COPY.staffPortal.todayTrainingPageTitle }
  const view = await loadPortalModuleForEmployee(moduleId, user.id)
  return {
    title: view ? `${view.title} · ${COPY.staffPortal.todayTrainingPageTitle}` : COPY.staffPortal.todayTrainingPageTitle,
  }
}

export default async function TrainingPortalModulePage({ params }: Props) {
  const { moduleId } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const [business, home, view] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    loadPortalHomeForEmployee(user.id),
    loadPortalModuleForEmployee(moduleId, user.id),
  ])
  if (!business || !home) redirect("/setup")
  if (!view) notFound()

  return (
    <StaffPortalShell businessName={home.businessName} title={view.title} hideNav>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4"
        nativeButton={false}
        render={<Link href="/learn/training" />}
      >
        <ChevronLeft className="size-4" aria-hidden />
        {COPY.staffPortal.moduleBack}
      </Button>
      <TrainingModulePlayer view={view} businessId={business.id} />
    </StaffPortalShell>
  )
}
