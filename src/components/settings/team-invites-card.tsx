"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Mail, RefreshCw, UserPlus, X } from "lucide-react"

import {
  createWorkspaceInvite,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  type WorkspaceInviteListItem,
} from "@/app/actions/workspace-invites"
import {
  INVITABLE_WORKSPACE_ROLES,
  type InvitableWorkspaceRole,
} from "@/lib/workspace-invites/constants"
import {
  WORKSPACE_INVITE_STATUS_LABEL,
  type WorkspaceInviteDisplayStatus,
} from "@/lib/workspace-invites/display-status"
import { WORKSPACE_ROLE_LABELS } from "@/lib/ops/workspace-role-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function statusBadgeClass(status: WorkspaceInviteDisplayStatus): string {
  switch (status) {
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
    case "accepted":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
    case "expired":
      return "border-border/60 bg-muted/40 text-muted-foreground"
    case "revoked":
      return "border-border/60 bg-muted/30 text-muted-foreground line-through"
  }
}

export function TeamInvitesCard({
  invites: initialInvites,
}: {
  invites: WorkspaceInviteListItem[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<InvitableWorkspaceRole>("staff")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function onSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const sentTo = email.trim().toLowerCase()
      const res = await createWorkspaceInvite({ email, role })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setEmail("")
      setSuccess(`Invite sent to ${sentTo}.`)
      router.refresh()
    })
  }

  function onResend(inviteId: string) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await resendWorkspaceInvite(inviteId)
      if (!res.ok) {
        setError(res.message)
        return
      }
      setSuccess("Invite resent.")
      router.refresh()
    })
  }

  function onRevoke(inviteId: string) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await revokeWorkspaceInvite(inviteId)
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <Card className="mt-10 border-border/55 bg-card/80 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <UserPlus className="size-4 text-primary/80" aria-hidden />
          Invite team
        </CardTitle>
        <CardDescription>
          Send a secure link by email. They create or sign in, join your workspace, and land in the
          staff portal—usually under five minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSend} className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Work email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="crew@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="h-10 w-full min-w-[8rem] rounded-lg border border-input bg-background px-2 text-sm"
                value={role}
                disabled={pending}
                onChange={(e) => setRole(e.target.value as InvitableWorkspaceRole)}
              >
                {INVITABLE_WORKSPACE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {WORKSPACE_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="h-10 shrink-0 gap-2" disabled={pending}>
              <Mail className="size-4" aria-hidden />
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>

        {error ? (
          <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-sm text-emerald-950 dark:text-emerald-100/90">
            {success}
          </p>
        ) : null}

        {initialInvites.length > 0 ? (
          <ul className="space-y-2">
            {initialInvites.map((inv) => {
              const canAct =
                inv.displayStatus === "pending" || inv.displayStatus === "expired"
              return (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 px-3 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {WORKSPACE_ROLE_LABELS[inv.role]}
                      {inv.lastSentAt
                        ? ` · Sent ${new Date(inv.lastSentAt).toLocaleDateString()}`
                        : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        statusBadgeClass(inv.displayStatus)
                      )}
                    >
                      {WORKSPACE_INVITE_STATUS_LABEL[inv.displayStatus]}
                    </span>
                    {canAct ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          disabled={pending}
                          onClick={() => onResend(inv.id)}
                        >
                          <RefreshCw className="size-3.5" aria-hidden />
                          Resend
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-muted-foreground"
                          disabled={pending}
                          onClick={() => onRevoke(inv.id)}
                        >
                          <X className="size-3.5" aria-hidden />
                          Revoke
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No invites yet—send one to get crew on Rivet.</p>
        )}
      </CardContent>
    </Card>
  )
}
