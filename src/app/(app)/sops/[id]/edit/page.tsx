import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { fetchBusinessForCurrentUser, fetchSopWithSteps } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { SopForm } from "@/components/sops/sop-form"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  return { title: sop ? `Edit · ${sop.title}` : "Edit play" }
}

export default async function EditSopPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const [sop, business] = await Promise.all([fetchSopWithSteps(id, supabase), fetchBusinessForCurrentUser(supabase)])
  if (!sop) notFound()

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(Boolean(business && business.id === sop.business_id)),
    { label: "SOP edit form", status: "ok", detail: `Editing SOP ${sop.id}.` },
  ]

  return (
    <DashboardRouteShell routePath={`/sops/${id}/edit`} fetchLines={fetchLines}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Button variant="link" className="h-auto p-0 text-sm" nativeButton={false} render={<Link href="/sops" />}>
            Standards
          </Button>
          <span>/</span>
          <Button
            variant="link"
            className="h-auto max-w-[12rem] truncate p-0 text-sm"
            nativeButton={false}
            render={<Link href={`/sops/${sop.id}`} />}
          >
            {sop.title}
          </Button>
          <span>/</span>
          <span className="text-foreground">Edit</span>
        </div>
        <SopForm businessId={sop.business_id} mode="edit" initial={sop} />
      </div>
    </DashboardRouteShell>
  )
}
