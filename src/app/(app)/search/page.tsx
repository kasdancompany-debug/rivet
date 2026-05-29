import type { Metadata } from "next"
import Link from "next/link"
import { MessageCircleQuestion } from "lucide-react"

import { universalSearch } from "@/app/actions/universal-search"
import { AppPageHeader } from "@/components/app-page-header"
import { UniversalSearchBar } from "@/components/universal-search/universal-search-bar"
import { UniversalSearchResults } from "@/components/universal-search/universal-search-results"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Search",
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const initialQuery = sp.q?.trim() ?? ""

  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)

  const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(Boolean(business))]

  let serverResult = null
  if (business && initialQuery.length >= 2) {
    const res = await universalSearch(initialQuery)
    if (res.ok) serverResult = res.result
  }

  return (
    <DashboardRouteShell routePath="/search" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          eyebrow="Find anything"
          title={COPY.universalSearch.pageTitle}
          description={COPY.universalSearch.pageDescription}
        />

        {!business ? (
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        ) : (
          <div className="mt-8 max-w-3xl space-y-8">
            <UniversalSearchBar variant="inline" initialQuery={initialQuery} />

            {initialQuery.length >= 2 && serverResult ? (
              <section className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {serverResult.totalCount === 0
                    ? COPY.universalSearch.noResults
                    : `${serverResult.totalCount} result${serverResult.totalCount === 1 ? "" : "s"} for “${serverResult.query}”`}
                </p>
                {serverResult.totalCount > 0 ? (
                  <UniversalSearchResults groups={serverResult.groups} />
                ) : (
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`/ask?q=${encodeURIComponent(initialQuery)}`} />}
                  >
                    <MessageCircleQuestion className="mr-2 size-4" aria-hidden />
                    {COPY.universalSearch.askRivetCta}
                  </Button>
                )}
              </section>
            ) : null}
          </div>
        )}
      </>
    </DashboardRouteShell>
  )
}
