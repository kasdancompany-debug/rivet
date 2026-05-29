import type { Metadata } from "next"
import Link from "next/link"
import { Users } from "lucide-react"

import {
  acceptWorkspaceInvite,
  getWorkspaceInvitePreview,
} from "@/app/actions/workspace-invites"
import { getServerAuthUser } from "@/lib/auth/server-auth"
import { WORKSPACE_ROLE_LABELS } from "@/lib/ops/workspace-role-types"
import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Join your team on Rivet",
}

type Props = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string; expected?: string }>
}

function errorMessage(code: string | undefined, expectedEmail?: string): string {
  switch (code) {
    case "email_mismatch":
      return expectedEmail
        ? `Sign in with ${expectedEmail} to accept this invite.`
        : "Sign in with the email address that received this invite."
    case "other_workspace":
      return "Your account is already linked to another workspace. Contact your owner for help."
    case "join_failed":
      return "We could not add you to the team. Try again or ask your owner to resend the invite."
    case "invalid":
      return "This invite link is invalid, expired, or was revoked."
    default:
      return "This invite link is invalid, expired, or was revoked."
  }
}

export default async function WorkspaceJoinPage({ params, searchParams }: Props) {
  const { token } = await params
  const sp = await searchParams
  const invite = await getWorkspaceInvitePreview(token)
  const user = await getServerAuthUser()
  const joinPath = `/join/${token}`

  if (user && invite.valid) {
    await acceptWorkspaceInvite(token)
  }

  if (!invite.valid) {
    return (
      <StaffPortalShell hideNav>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <p className="font-semibold text-foreground">{errorMessage(sp.error)}</p>
          <Button className="mt-6 w-full" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </StaffPortalShell>
    )
  }

  const roleLabel = invite.role ? WORKSPACE_ROLE_LABELS[invite.role] : "Team member"

  return (
    <StaffPortalShell businessName={invite.businessName} hideNav>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
          <Users className="size-7 text-primary" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Team invite
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{invite.businessName}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            You are joining as <span className="font-medium text-foreground">{roleLabel}</span>.
            {invite.email ? (
              <>
                {" "}
                Use <span className="font-medium text-foreground">{invite.email}</span> when you
                sign in.
              </>
            ) : null}
          </p>
        </div>

        {sp.error ? (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-sm text-amber-950 dark:text-amber-100/90">
            {errorMessage(sp.error, sp.expected)}
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Create an account or sign in—then you will land in your staff portal automatically.
        </p>
        <div className="space-y-2">
          <Button
            className="h-12 w-full text-base"
            nativeButton={false}
            render={<Link href={`/login?next=${encodeURIComponent(joinPath)}`} />}
          >
            Sign in to accept
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full"
            nativeButton={false}
            render={
              <Link
                href={`/signup?next=${encodeURIComponent(joinPath)}&email=${encodeURIComponent(invite.email ?? "")}`}
              />
            }
          >
            Create account
          </Button>
        </div>
      </div>
    </StaffPortalShell>
  )
}
