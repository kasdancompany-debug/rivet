import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PlayView } from "@/components/plays/play-view"
import { StandardPlayViewLogger } from "@/components/plays/standard-play-view-logger"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchSopPlayCompletionContextForBusiness,
  fetchSopWithSteps,
} from "@/lib/db/queries"
import { buildPlayViewModel } from "@/lib/plays/build-play-view-model"
import { computeSopPlayCompletion } from "@/lib/sops/sop-play-completion"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { createClient } from "@/lib/supabase/server"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  return { title: sop ? `${sop.title} · Play` : "Play" }
}

export default async function SopDetailPage({ params }: Props) {
  const { id } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const [sop, business, profile] = await Promise.all([
    fetchSopWithSteps(id, supabase),
    fetchBusinessForCurrentUser(supabase),
    fetchCurrentProfile(supabase),
  ])
  if (!sop) notFound()

  const owner = Boolean(business && isWorkspaceOwner(user.id, business, profile))

  const capture = parseStandardsCapture(sop.standards_capture)
  const [signedStandardMedia, completionContext] = await Promise.all([
    signStandardMediaRows(sop.standard_media ?? []),
    business ? fetchSopPlayCompletionContextForBusiness(business.id, supabase) : null,
  ])
  const model = buildPlayViewModel({ sop, capture, signedMedia: signedStandardMedia })
  const teamCompletion =
    business && completionContext ? computeSopPlayCompletion(sop, completionContext) : null

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(Boolean(business && business.id === sop.business_id)),
    {
      label: "Play steps",
      status: sop.standard_steps.length === 0 ? "empty" : "ok",
      detail: `${model.steps.length} runnable step(s) · ${sop.status}.`,
      missing: sop.standard_steps.length === 0 ? ["standard_steps"] : undefined,
    },
  ]

  return (
    <DashboardRouteShell routePath={`/sops/${id}`} fetchLines={fetchLines}>
      <StandardPlayViewLogger standardId={sop.id} source="owner" />
      <PlayView
        model={model}
        isOwner={owner}
        teamCompletion={teamCompletion}
        actions={{
          editHref: `/sops/${sop.id}/edit`,
          showArchive: sop.status !== "archived",
        }}
      />
    </DashboardRouteShell>
  )
}
