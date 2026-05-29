import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { StaffPlayView } from "@/components/training/portal/staff-play-view"
import { StandardPlayViewLogger } from "@/components/plays/standard-play-view-logger"
import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { fetchSopWithSteps } from "@/lib/db/queries"
import { buildPlayViewModel } from "@/lib/plays/build-play-view-model"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { COPY } from "@/lib/interface-copy"
import {
  employeeCanAccessStandard,
  loadPortalHomeForEmployee,
} from "@/lib/training/portal/load-portal-home"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  return { title: sop ? `${sop.title} · ${COPY.staffPortal.playReadTitle}` : COPY.staffPortal.playReadTitle }
}

export default async function StaffPlayPage({ params }: Props) {
  const { id } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()

  const [sop, home, allowed] = await Promise.all([
    fetchSopWithSteps(id, supabase),
    loadPortalHomeForEmployee(user.id),
    employeeCanAccessStandard(user.id, id),
  ])

  if (!home) redirect("/setup")
  if (!sop || sop.status !== "active" || !allowed) notFound()

  const capture = parseStandardsCapture(sop.standards_capture)
  const signedStandardMedia = await signStandardMediaRows(sop.standard_media ?? [])
  const model = buildPlayViewModel({ sop, capture, signedMedia: signedStandardMedia })

  const linkedPlay = home.assignedPlays.find((p) => p.standardId === id)

  return (
    <StaffPortalShell
      businessName={home.businessName}
      title={sop.title}
      subtitle={linkedPlay?.moduleTitle}
      hideNav
    >
      {linkedPlay && !linkedPlay.completed ? (
        <p className="mb-4 rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2 text-sm text-muted-foreground">
          {COPY.staffPortal.trainingComplete}{" "}
          <Link href={`/learn/${linkedPlay.moduleId}`} className="font-medium text-primary">
            Open module →
          </Link>
        </p>
      ) : null}

      <StandardPlayViewLogger standardId={id} source="portal" />
      <StaffPlayView model={model} />
    </StaffPortalShell>
  )
}
