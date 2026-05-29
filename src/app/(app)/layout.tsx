import { redirect } from "next/navigation"
import { headers } from "next/headers"

import { DashboardShell } from "@/components/dashboard-shell"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { loadWorkspaceAccess } from "@/lib/ops/load-workspace-access"
import { filterNavForRole } from "@/lib/ops/workspace-permissions"
import { buildWorkspaceAccess } from "@/lib/ops/load-workspace-access"
import { getSafeInternalNextPath } from "@/lib/auth/safe-next-path"
import {
  getDevBypassMockUser,
  isDevAuthBypassEnabled,
  shouldSkipSupabaseNetwork,
} from "@/lib/dev-auth-bypass"
import { getDevWorkspaceBusiness } from "@/lib/dev-workspace"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isDevAuthBypassEnabled()) {
    if (shouldSkipSupabaseNetwork()) {
      const devBusiness = await getDevWorkspaceBusiness()
      const devAccess = buildWorkspaceAccess("owner")
      return (
        <DashboardShell
          user={getDevBypassMockUser()}
          hasWorkspace={Boolean(devBusiness)}
          navItems={filterNavForRole(devAccess.role)}
          workspaceRole={devAccess.role}
        >
          {children}
        </DashboardShell>
      )
    }

    const supabase = await createClient()
    let user = getDevBypassMockUser()
    let hasWorkspace = false

    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    if (sessionUser) {
      user = sessionUser
      const business = await fetchBusinessForCurrentUser(supabase)
      hasWorkspace = Boolean(business)
    }

    const access = await loadWorkspaceAccess(supabase, user.id)
    const navItems = access ? filterNavForRole(access.role) : undefined

    return (
      <DashboardShell user={user} hasWorkspace={hasWorkspace} navItems={navItems} workspaceRole={access?.role}>
        {children}
      </DashboardShell>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const h = await headers()
    const next = getSafeInternalNextPath(h.get("x-rivet-return-to"), "/dashboard")
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  const business = await fetchBusinessForCurrentUser(supabase)
  const access = await loadWorkspaceAccess(supabase, user.id)
  const navItems = access ? filterNavForRole(access.role) : undefined

  return (
    <DashboardShell
      user={user}
      hasWorkspace={Boolean(business)}
      navItems={navItems}
      workspaceRole={access?.role}
    >
      {children}
    </DashboardShell>
  )
}
