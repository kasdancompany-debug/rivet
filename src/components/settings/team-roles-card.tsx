"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { updateWorkspaceMemberRole } from "@/app/actions/workspace-members"
import {
  WORKSPACE_ROLES,
  WORKSPACE_ROLE_LABELS,
  normalizeMemberRole,
  type WorkspaceRole,
} from "@/lib/ops/workspace-role-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

type MemberRow = {
  userId: string
  name: string
  email: string
  role: WorkspaceRole
  isBusinessOwner: boolean
}

export function TeamRolesCard({
  businessId,
  members,
  currentUserId,
  canEdit,
}: {
  businessId: string
  members: MemberRow[]
  currentUserId: string
  canEdit: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onRoleChange(userId: string, role: WorkspaceRole) {
    startTransition(async () => {
      await updateWorkspaceMemberRole({ businessId, userId, role })
      router.refresh()
    })
  }

  const assignableRoles = WORKSPACE_ROLES.filter((r) => r !== "owner")

  return (
    <Card className="mt-10 border-border/55 bg-card/80 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">Team roles</CardTitle>
        <CardDescription>
          Owner, Manager, Trainer, and Staff control what each person can see and do in Rivet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members linked yet.</p>
        ) : (
          <ul className="space-y-3">
            {members.map((m) => {
              const locked = m.isBusinessOwner || m.userId === currentUserId
              const rolesForSelect =
                m.isBusinessOwner ? (["owner"] as WorkspaceRole[]) : assignableRoles

              return (
                <li
                  key={m.userId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  {canEdit && !locked ? (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`role-${m.userId}`} className="sr-only">
                        Role for {m.name}
                      </Label>
                      <select
                        id={`role-${m.userId}`}
                        className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                        disabled={pending}
                        value={m.role}
                        onChange={(e) =>
                          onRoleChange(m.userId, e.target.value as WorkspaceRole)
                        }
                      >
                        {rolesForSelect.map((r) => (
                          <option key={r} value={r}>
                            {WORKSPACE_ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {WORKSPACE_ROLE_LABELS[m.role]}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function buildMemberRows(
  profiles: { id: string; full_name: string; email: string }[],
  members: { user_id: string; role: string }[],
  businessOwnerId: string
): MemberRow[] {
  const roleByUser = new Map(members.map((m) => [m.user_id, normalizeMemberRole(m.role)]))
  return profiles
    .filter((p) => roleByUser.has(p.id) || p.id === businessOwnerId)
    .map((p) => ({
      userId: p.id,
      name: p.full_name?.trim() || "Team member",
      email: p.email,
      role:
        p.id === businessOwnerId
          ? "owner"
          : (roleByUser.get(p.id) ?? "staff"),
      isBusinessOwner: p.id === businessOwnerId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
