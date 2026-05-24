import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { loadPortalModuleForEmployee } from "@/lib/training/portal/load-portal-data"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { TrainingPortalShell } from "@/components/training/portal/training-portal-shell"
import { TrainingModulePlayer } from "@/components/training/portal/training-module-player"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ moduleId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId } = await params
  const user = await getServerAuthUser()
  if (!user) return { title: "Training" }
  const view = await loadPortalModuleForEmployee(moduleId, user.id)
  return { title: view ? `${view.title} · Training` : "Training" }
}

export default async function TrainingPortalModulePage({ params }: Props) {
  const { moduleId } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) redirect("/setup")

  const view = await loadPortalModuleForEmployee(moduleId, user.id)
  if (!view) notFound()

  return (
    <TrainingPortalShell businessName={business.name}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4"
        nativeButton={false}
        render={<Link href="/learn" />}
      >
        <ChevronLeft className="size-4" aria-hidden />
        My training
      </Button>
      <TrainingModulePlayer view={view} businessId={business.id} />
    </TrainingPortalShell>
  )
}
