import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { StaffPortalHome } from "@/components/training/portal/staff-portal-home"
import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { COPY } from "@/lib/interface-copy"
import { loadPortalHomeForEmployee } from "@/lib/training/portal/load-portal-home"
import { loadPortalReadinessForEmployee } from "@/lib/training/portal/load-portal-readiness"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"

export const metadata: Metadata = {
  title: COPY.staffPortal.metadataTitle,
}

export default async function StaffPortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = requireAuthUser(await getServerAuthUser())
  const [view, readinessView] = await Promise.all([
    loadPortalHomeForEmployee(user.id),
    loadPortalReadinessForEmployee(user.id),
  ])
  if (!view) redirect("/setup")

  const params = await searchParams

  return (
    <StaffPortalShell businessName={view.businessName}>
      {params.error === "invite" ? (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {COPY.trainingPortal.inviteInvalid}
        </p>
      ) : null}
      {params.error === "wrong-account" ? (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {COPY.trainingPortal.inviteWrongAccount}
        </p>
      ) : null}
      <StaffPortalHome view={view} readiness={readinessView?.readiness ?? null} />
    </StaffPortalShell>
  )
}
