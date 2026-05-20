import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft, Library } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { ALL_SOP_CATEGORY_TAB_ORDER, isSopCategory } from "@/lib/sops/categories"
import type { SopCategoryValue } from "@/lib/sops/categories"
import { INDUSTRY_PACKS, getIndustryPack } from "@/lib/sop-templates/industries"
import type { IndustryId } from "@/lib/sop-templates/types"
import { getStarterTemplatesByFilters } from "@/lib/sop-templates/starter-templates"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { InstallIndustryPackButton } from "@/components/sops/install-industry-pack-button"
import { TemplateCategoryFilters } from "@/components/sops/template-category-filters"
import { TemplateIndustryTabs } from "@/components/sops/template-industry-tabs"
import { TemplateStarterCard } from "@/components/sops/template-starter-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: COPY.templates.metadataTitle,
}

function templateCategoriesInDisplayOrder(templates: { category: string }[]): SopCategoryValue[] {
  const present = new Set(templates.map((t) => t.category))
  return ALL_SOP_CATEGORY_TAB_ORDER.filter((c): c is SopCategoryValue => present.has(c))
}

function resolveIndustryParam(raw: string | undefined): IndustryId | "legacy" | undefined {
  if (!raw) return undefined
  if (raw === "legacy") return "legacy"
  if (INDUSTRY_PACKS.some((p) => p.id === raw)) return raw as IndustryId
  return undefined
}

export default async function SopTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; industry?: string }>
}) {
  const sp = await searchParams
  const categoryParam = sp.category
  const categoryFilter =
    categoryParam && isSopCategory(categoryParam) ? categoryParam : undefined

  const industryResolved = resolveIndustryParam(sp.industry)
  const industryParamForLinks =
    industryResolved === undefined ? undefined : industryResolved === "legacy" ? "legacy" : industryResolved

  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)

  const templates = getStarterTemplatesByFilters({
    category: categoryFilter,
    industryId: industryResolved,
  })
  const filterableCategories = templateCategoriesInDisplayOrder(templates)
  const activePack =
    industryResolved && industryResolved !== "legacy" ? getIndustryPack(industryResolved) : undefined

  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/sops/templates" fetchLines={fetchLines}>
        <>
          <Button
            variant="ghost"
            className="mb-4 -ml-2 h-9 text-muted-foreground"
            nativeButton={false}
            render={<Link href="/sops" />}
          >
            <ArrowLeft className="mr-1 size-4" aria-hidden />
            {COPY.templates.back}
          </Button>
          <AppPageHeader title={COPY.templates.title} description={COPY.templates.description} />
          <BusinessLinkRequiredPanel description={COPY.templates.noBizDesc} className="mt-8 border-border/60 bg-card/70 shadow-sm" />
        </>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Starter templates (static)",
      status: templates.length === 0 ? "empty" : "ok",
      detail: `${templates.length} template(s) for current filters.`,
    },
  ]

  return (
    <DashboardRouteShell routePath="/sops/templates" fetchLines={fetchLines}>
      <>
        <Button
          variant="ghost"
          className="mb-4 -ml-2 h-9 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/sops" />}
        >
          <ArrowLeft className="mr-1 size-4" aria-hidden />
          {COPY.templates.back}
        </Button>

        <section
          className="rounded-xl border border-border/60 bg-muted/20 px-6 py-9 sm:px-10 sm:py-10"
          aria-labelledby="templates-hero-heading"
        >
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
              <Library className="size-3.5 text-muted-foreground" aria-hidden />
              {COPY.templates.heroBadge}
            </div>
            <h1
              id="templates-hero-heading"
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              <span className="block">{COPY.templates.heroTitle1}</span>
              <span className="mt-1 block text-muted-foreground sm:mt-2">{COPY.templates.heroTitle2}</span>
            </h1>
            <p className="text-base leading-[1.6] text-muted-foreground sm:text-lg">{COPY.templates.heroLead}</p>
          </div>
        </section>

        <div className="mt-10 space-y-6">
          <AppPageHeader
            eyebrow={COPY.templates.listEyebrow}
            title={COPY.templates.listTitle}
            description={COPY.templates.listDesc}
            className="mb-0"
          />

          <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted/40" aria-hidden />}>
            <TemplateIndustryTabs
              activeIndustry={
                industryResolved === undefined ? "all" : industryResolved === "legacy" ? "legacy" : industryResolved
              }
            />
          </Suspense>

          {activePack ? (
            <Card className="border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="space-y-2 border-b border-border/40 pb-4">
                <CardTitle className="text-xl">{activePack.name} pack</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{activePack.tagline}</CardDescription>
                <p className="text-sm leading-relaxed text-muted-foreground">{activePack.description}</p>
              </CardHeader>
              <CardContent className="pt-5">
                <InstallIndustryPackButton industryId={activePack.id} industryName={activePack.name} />
              </CardContent>
            </Card>
          ) : null}

          <TemplateCategoryFilters
            active={categoryFilter}
            categoriesInOrder={filterableCategories}
            industryParam={industryParamForLinks}
          />
          {templates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              {COPY.templates.emptyFilter} Try{" "}
              <Link href="/sops/templates" className="font-medium text-primary underline-offset-4 hover:underline">
                {COPY.templates.emptyFilterLink}
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((t) => (
                <li key={t.id}>
                  <TemplateStarterCard template={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    </DashboardRouteShell>
  )
}
