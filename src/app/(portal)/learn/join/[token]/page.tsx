import type { Metadata } from "next"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { acceptTrainingPortalInvite } from "@/app/actions/training-portal"
import { resolveTrainingInviteByToken } from "@/lib/db/queries"
import { parseResolvedInvite } from "@/lib/training/portal/build-portal-module"
import { COPY } from "@/lib/interface-copy"
import { getServerAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { TrainingPortalShell } from "@/components/training/portal/training-portal-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: COPY.trainingPortal.joinTitle,
}

type Props = { params: Promise<{ token: string }> }

export default async function TrainingPortalJoinPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()
  const raw = await resolveTrainingInviteByToken(token, supabase)
  const invite = parseResolvedInvite(raw)

  const user = await getServerAuthUser()

  if (user && invite.valid && invite.moduleId) {
    await acceptTrainingPortalInvite(token)
  }

  if (!invite.valid) {
    return (
      <TrainingPortalShell>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <p className="font-semibold text-foreground">{COPY.trainingPortal.inviteInvalid}</p>
          <Button className="mt-6 w-full" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </TrainingPortalShell>
    )
  }

  const loginNext = `/learn/join/${token}`

  return (
    <TrainingPortalShell businessName={invite.businessName}>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
          <GraduationCap className="size-7 text-primary" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {invite.businessName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{invite.moduleTitle}</h1>
          {invite.moduleDescription ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{invite.moduleDescription}</p>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{COPY.trainingPortal.joinLead}</p>
        <div className="space-y-2">
          <Button className="h-12 w-full text-base" nativeButton={false} render={<Link href={`/login?next=${encodeURIComponent(loginNext)}`} />}>
            {COPY.trainingPortal.joinSignIn}
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full"
            nativeButton={false}
            render={<Link href={`/signup?next=${encodeURIComponent(loginNext)}`} />}
          >
            {COPY.trainingPortal.joinCreateAccount}
          </Button>
        </div>
      </div>
    </TrainingPortalShell>
  )
}
