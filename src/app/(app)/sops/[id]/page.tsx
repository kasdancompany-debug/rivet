import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

import { fetchBusinessForCurrentUser, fetchSopWithSteps } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { formatSopCategory } from "@/lib/sops/categories"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { dependencyLabel, importanceLabel, statusLabel } from "@/lib/sops/labels"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SopDocumentActions } from "@/components/sops/sop-document-actions"
import { StandardArchiveButton } from "@/components/sops/standard-archive-button"
import { SopStandardsCaptureSection } from "@/components/sops/sop-standards-capture-section"
import { StandardMediaGallery } from "@/components/sops/standard-media-gallery"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  return {
    title: sop ? sop.title : "Standard",
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-950 dark:text-emerald-300/95"
    case "archived":
      return "border-border/80 bg-muted/50 text-muted-foreground"
    default:
      return "border-amber-500/25 bg-amber-500/[0.06] text-amber-950 dark:text-amber-300/95"
  }
}

export default async function SopDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const [sop, business] = await Promise.all([fetchSopWithSteps(id, supabase), fetchBusinessForCurrentUser(supabase)])
  if (!sop) notFound()

  const updated = new Date(sop.updated_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const capture = parseStandardsCapture(sop.standards_capture)
  const signedStandardMedia = await signStandardMediaRows(sop.standard_media ?? [])

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(Boolean(business && business.id === sop.business_id)),
    {
      label: "SOP + steps",
      status: sop.standard_steps.length === 0 ? "empty" : "ok",
      detail: `${sop.standard_steps.length} step row(s) · status ${sop.status}.`,
      missing: sop.standard_steps.length === 0 ? ["standard_steps"] : undefined,
    },
  ]

  return (
    <DashboardRouteShell routePath={`/sops/${id}`} fetchLines={fetchLines}>
      <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/sops" className="hover:text-foreground">
              Standards
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground">{formatSopCategory(sop.category)}</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {sop.title}
          </h1>
          {sop.description ? (
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              {sop.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 self-start sm:items-end">
          <SopDocumentActions standardId={sop.id} published={sop.status === "active"} />
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              className="h-11 w-full sm:w-auto"
              nativeButton={false}
              render={<Link href={`/sops/${sop.id}/edit`} />}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
            {sop.status !== "archived" ? <StandardArchiveButton sopId={sop.id} /> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge
          variant="outline"
          className={cn("rounded-full px-3 py-1 text-xs font-medium", statusBadgeClass(sop.status))}
        >
          {statusLabel(sop.status)}
        </Badge>
        <Badge variant="outline" className="rounded-full border-border/80 bg-muted/30 px-3 py-1 text-xs">
          Importance {sop.importance_level}/5 · {importanceLabel(sop.importance_level)}
        </Badge>
        <Badge variant="outline" className="rounded-full border-border/80 bg-muted/30 px-3 py-1 text-xs">
          Owner dependency {sop.owner_dependency_level}/5
        </Badge>
        {sop.estimated_time_minutes != null ? (
          <Badge variant="outline" className="rounded-full border-border/80 bg-muted/30 px-3 py-1 text-xs">
            About {sop.estimated_time_minutes} min
          </Badge>
        ) : null}
        <span className="w-full text-sm text-muted-foreground sm:w-auto sm:self-center">
          Last updated {updated}
        </span>
      </div>

      <p className="max-w-3xl text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Owner dependency in plain words: </span>
        {dependencyLabel(sop.owner_dependency_level)}
      </p>

      <Separator />

      {signedStandardMedia.length > 0 ? (
        <>
          <StandardMediaGallery items={signedStandardMedia} />
          <Separator />
        </>
      ) : null}

      {capture ? <SopStandardsCaptureSection capture={capture} /> : null}
      {capture ? <Separator /> : null}

      <section className="space-y-4" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="text-xl font-semibold tracking-tight">
          Steps
        </h2>
        {sop.standard_steps.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-muted/10">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No steps yet. Edit this SOP to add the checklist your team should follow.
            </CardContent>
          </Card>
        ) : (
          <ol className="space-y-4">
            {sop.standard_steps.map((step, i) => (
              <li key={step.id}>
                <Card className="border-border/60 bg-card/70 shadow-sm">
                  <CardHeader className="border-b border-border/40 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <CardTitle className="text-lg font-semibold leading-snug">
                        <span className="mr-2 font-mono text-sm font-medium text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {step.title}
                      </CardTitle>
                      {step.requires_photo_confirmation ? (
                        <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                          Photo required
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5 pb-6">
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                      {step.instructions || "—"}
                    </p>
                    {step.media_url ? (
                      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                        <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
                          {step.media_url.startsWith("/api/standard-media/") ? "Walkthrough video" : "Reference link"}
                        </p>
                        {step.media_url.startsWith("/api/standard-media/") ? (
                          <video
                            src={step.media_url}
                            controls
                            className="mt-2 max-h-64 w-full rounded-lg border border-border/50 bg-black/5"
                            preload="metadata"
                          >
                            <track kind="captions" />
                          </video>
                        ) : (
                          <a
                            href={step.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 break-all font-mono text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {step.media_url}
                          </a>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
      </div>
    </DashboardRouteShell>
  )
}
