import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { fetchBusinessForCurrentUser, fetchIssueById } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { IssueDetailForm } from "@/components/issues/issue-detail-form"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const issue = await fetchIssueById(id, supabase)
  if (!issue) return { title: "Bottleneck" }
  return { title: issue.title }
}

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params
  requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const [business, issue] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    fetchIssueById(id, supabase),
  ])

  if (!issue) notFound()
  if (!business || business.id !== issue.business_id) notFound()

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Issue row",
      status: "ok",
      detail: `Loaded issue ${issue.id} · status ${issue.status}.`,
    },
  ]

  return (
    <DashboardRouteShell routePath={`/issues/${id}`} fetchLines={fetchLines}>
      <div className="space-y-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-4 h-8 px-2 text-muted-foreground"
            nativeButton={false}
            render={<Link href="/issues" />}
          >
            <ArrowLeft className="mr-1 size-4" aria-hidden />
            All bottlenecks
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {issue.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Update status as the team clears it. Resolving removes the load from your Rivet Index view when nothing else is blocking.
          </p>
        </div>
        <IssueDetailForm issue={issue} />
      </div>
    </DashboardRouteShell>
  )
}
