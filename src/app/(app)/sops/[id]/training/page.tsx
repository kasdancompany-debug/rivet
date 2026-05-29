import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { PlayTrainingPackEditor } from "@/components/plays/play-training-pack-editor"
import { PlayTrainingGenerateButton } from "@/components/plays/play-training-generate-button"
import { AppPageHeader } from "@/components/app-page-header"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"
import { fetchBusinessForCurrentUser, fetchCurrentProfile, fetchSopWithSteps } from "@/lib/db/queries"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  return { title: sop ? `Training · ${sop.title}` : "Training" }
}

export default async function PlayTrainingEditPage({ params }: Props) {
  const { id } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const [sop, business, profile] = await Promise.all([
    fetchSopWithSteps(id, supabase),
    fetchBusinessForCurrentUser(supabase),
    fetchCurrentProfile(supabase),
  ])

  if (!sop || !business || sop.business_id !== business.id) notFound()
  if (!isWorkspaceOwner(user.id, business, profile)) redirect(`/sops/${id}`)

  const capture = parseStandardsCapture(sop.standards_capture)
  const pack = capture?.trainingPack ?? null
  const moduleId = pack?.moduleId ?? null

  return (
    <DashboardRouteShell routePath={`/sops/${id}/training`} fetchLines={[]}>
      <>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/sops/${id}`} />}>
            ← Back to play
          </Button>
          {moduleId ? (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/training/modules/${moduleId}`} />}>
              Open module
            </Button>
          ) : null}
        </div>

        <AppPageHeader
          eyebrow="Staff training"
          title={`Training · ${sop.title}`}
          description="Review and edit the auto-generated module before publishing to crew."
        />

        <div className="mt-8 max-w-2xl">
          {pack ? (
            <>
              {pack.status === "draft" ? (
                <p className="mb-6 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                  Auto-generated from your play. Edit anything below, save the draft, then publish when crew can take
                  it in Training Center.
                </p>
              ) : null}
              <PlayTrainingPackEditor
                standardId={id}
                playTitle={sop.title}
                initialPack={pack}
                moduleId={moduleId}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6">
              <p className="text-sm text-muted-foreground">
                No training pack yet. Generate one from this play—it pulls objectives, lessons, media, quizzes, and
                certification in one pass.
              </p>
              <div className="mt-4">
                <PlayTrainingGenerateButton standardId={id} />
              </div>
            </div>
          )}
        </div>
      </>
    </DashboardRouteShell>
  )
}
