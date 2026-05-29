import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AskRivetPanel } from "@/components/ask-rivet/ask-rivet-panel"
import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { COPY } from "@/lib/interface-copy"
import { loadPortalHomeForEmployee } from "@/lib/training/portal/load-portal-home"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"

export const metadata: Metadata = {
  title: COPY.staffPortal.askRivetTitle,
}

export default async function LearnAskPage() {
  const user = requireAuthUser(await getServerAuthUser())
  const view = await loadPortalHomeForEmployee(user.id)
  if (!view) redirect("/setup")

  return (
    <StaffPortalShell businessName={view.businessName} title={COPY.staffPortal.askRivetTitle}>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{COPY.staffPortal.askRivetLead}</p>
      <AskRivetPanel portal />
    </StaffPortalShell>
  )
}
