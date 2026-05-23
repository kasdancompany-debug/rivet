import type { Metadata } from "next"
import Link from "next/link"
import { HeartPulse, Settings } from "lucide-react"

import { AppPageHeader } from "@/components/app-page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataPortabilityCard } from "@/components/settings/data-portability-card"
import { WorkspaceLinkedSummary } from "@/components/settings/workspace-linked-summary"
import { WorkspaceSetupCard } from "@/components/settings/workspace-setup-card"
import { EmptyState } from "@/components/empty-state"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { isBillingEnforced } from "@/lib/billing/config"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass"
import { COPY } from "@/lib/interface-copy"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  const sessionFallback = !authUser ? (await supabase.auth.getSession()).data.session?.user : null
  const sessionReady = Boolean(authUser ?? sessionFallback)
  const noSessionExplanation = isDevAuthBypassEnabled()
    ? COPY.settingsWorkspace.serverSessionRequiredBypass
    : COPY.settingsWorkspace.serverSessionRequired

  const business = await fetchBusinessForCurrentUser(supabase)

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(Boolean(business)),
    {
      label: "Settings shell",
      status: "ok",
      detail: "Account and portability controls rendered.",
    },
  ]

  return (
    <DashboardRouteShell routePath="/settings" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          eyebrow="Account"
          title="Settings"
          description="Business name, billing access, and exports. Day-to-day work lives in Overview, Standards, training, and bottlenecks."
        />
        {business ? (
          <WorkspaceLinkedSummary businessName={business.name} />
        ) : (
          <WorkspaceSetupCard sessionReady={sessionReady} noSessionExplanation={noSessionExplanation} />
        )}
        <DataPortabilityCard hasWorkspace={Boolean(business)} />

        {isBillingEnforced() ? (
          <Card className="mt-10 border-border/55 bg-card/80 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold">Subscription</CardTitle>
              <CardDescription>
                Rivet stays available while your Stripe subscription is active. Open billing to start checkout or confirm
                access after paying.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" nativeButton={false} render={<Link href="/subscribe" />}>
                Open billing
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-10 border-border/55 bg-card/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">Re-run intake</CardTitle>
            <CardDescription>
              Update your reality check when the floor changes materially—scores and copy refresh from the latest pass.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/onboarding"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex h-10 flex-1 min-w-[12rem] items-center justify-start gap-2 px-4"
              )}
            >
              <HeartPulse className="size-4 shrink-0 opacity-80" aria-hidden />
              Reality check
            </Link>
          </CardContent>
        </Card>

        <EmptyState
          className="mt-10"
          icon={Settings}
          eyebrow="Account"
          title="Additional account controls are limited for now."
          description="Hours, notifications, and deeper account policy will surface here as they are wired. Until then, use Overview and Standards to move load off the owner."
        >
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            Back to Overview
          </Button>
        </EmptyState>
      </>
    </DashboardRouteShell>
  )
}
