import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, BookOpen, Clapperboard, Library } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { fetchBusinessForCurrentUser, listSopsForBusiness } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { isSopCategory } from "@/lib/sops/categories"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { EmptyState } from "@/components/empty-state"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { SopCard } from "@/components/sops/sop-card"
import { SopCategoryFilters } from "@/components/sops/sop-category-filters"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: COPY.sops.metadataTitle,
}

export default async function SopsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const sp = await searchParams
  const categoryParam = sp.category
  const categoryFilter =
    categoryParam && isSopCategory(categoryParam) ? categoryParam : undefined

  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)

  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/sops" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.sops.eyebrow}
            title={COPY.sops.title}
            description={COPY.sops.descNoBiz}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-8 border-border/60 bg-card/70 shadow-sm" />
        </>
      </DashboardRouteShell>
    )
  }

  const sops = await listSopsForBusiness(business.id, {
    category: categoryFilter,
  })

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Standards (SOPs) list",
      status: sops.length === 0 ? "empty" : "ok",
      detail: `${sops.length} SOP(s)${categoryFilter ? ` · category filter: ${categoryFilter}` : ""}.`,
      missing: sops.length === 0 ? ["sops for this business"] : undefined,
    },
  ]

  return (
    <DashboardRouteShell routePath="/sops" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          eyebrow={COPY.sops.eyebrow}
          title={COPY.sops.title}
          description={COPY.sops.desc}
          actions={
            <>
              <Button
                size="lg"
                variant="outline"
                className="h-11"
                nativeButton={false}
                render={<Link href="/sops/templates" />}
              >
                <Library className="mr-2 size-4" aria-hidden />
                {COPY.sops.gallery}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-11"
                nativeButton={false}
                render={<Link href="/sops/capture" />}
              >
                <Clapperboard className="mr-2 size-4" aria-hidden />
                {COPY.sops.capture}
              </Button>
              <Button size="lg" className="h-11" nativeButton={false} render={<Link href="/sops/new" />}>
                {COPY.sops.new}
              </Button>
            </>
          }
        />

        <aside className="mt-8 rounded-xl border border-border/60 bg-muted/25 px-6 py-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-sm font-semibold text-foreground">{COPY.sops.starterTitle}</p>
            <p className="text-sm leading-[1.6] text-muted-foreground">{COPY.sops.starterBody}</p>
          </div>
          <Button className="mt-4 shrink-0 sm:mt-0" nativeButton={false} render={<Link href="/sops/templates" />}>
            {COPY.sops.starterCta}
          </Button>
        </aside>

        <div className="mt-10 space-y-6">
          <SopCategoryFilters active={categoryFilter} />
          {sops.length === 0 ? (
            <div className="space-y-6">
              <EmptyState
                icon={BookOpen}
                eyebrow={COPY.sops.emptyEyebrow}
                title={COPY.sops.emptyTitle}
                description={COPY.sops.emptyDesc}
              >
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <Button nativeButton={false} render={<Link href="/sops/templates" />}>
                    <Library className="mr-2 size-4" aria-hidden />
                    {COPY.sops.browseGallery}
                  </Button>
                  <Button variant="outline" nativeButton={false} render={<Link href="/sops/new" />}>
                    {COPY.sops.authorScratch}
                  </Button>
                </div>
              </EmptyState>

              <div className="flex flex-wrap items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-5 py-4 sm:px-6">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-800 dark:text-rose-300" aria-hidden />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{COPY.sops.alertTitle}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{COPY.sops.alertBody}</p>
                </div>
              </div>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sops.map((sop) => (
                <li key={sop.id}>
                  <SopCard sop={sop} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    </DashboardRouteShell>
  )
}
