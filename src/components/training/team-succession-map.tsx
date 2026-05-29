"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  addTeamSuccessionRole,
  removeTeamSuccessionRole,
  updateTeamSuccessionRole,
} from "@/app/actions/team-succession"
import { COPY } from "@/lib/interface-copy"
import {
  SUCCESSION_RISK_LABELS,
  successionRiskClass,
} from "@/lib/succession/compute-risk"
import { summarizeSuccessionRisk } from "@/lib/succession/build-succession-map"
import type { TeamSuccessionMapView } from "@/lib/succession/types"
import { READINESS_CAPABILITY_LABELS } from "@/lib/training/compute-readiness"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function TeamSuccessionMapView({ view }: { view: TeamSuccessionMapView }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<string | null>(null)
  const [newRole, setNewRole] = useState("")
  const p = COPY.successionMap

  const riskCounts = summarizeSuccessionRisk(view.roles)

  function run<T>(fn: () => Promise<T>) {
    setBanner(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === "object" && "ok" in res && res.ok === false) {
        setBanner("message" in res ? String((res as { message: string }).message) : "Action failed.")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SUCCESSION_RISK_LABELS) as Array<keyof typeof SUCCESSION_RISK_LABELS>).map(
          (level) => (
            <Badge key={level} variant="outline" className={cn("font-normal", successionRiskClass(level))}>
              {SUCCESSION_RISK_LABELS[level]}: {riskCounts[level]}
            </Badge>
          )
        )}
      </div>

      {banner ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {banner}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/80 shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left">
              <th className="px-4 py-3 font-semibold text-foreground">{p.columnRole}</th>
              <th className="px-4 py-3 font-semibold text-foreground">{p.columnPrimary}</th>
              <th className="px-4 py-3 font-semibold text-foreground">{p.columnBackup}</th>
              <th className="px-4 py-3 font-semibold text-foreground">{p.columnRisk}</th>
              {view.canEdit ? <th className="w-12 px-2 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {view.roles.length === 0 ? (
              <tr>
                <td colSpan={view.canEdit ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">
                  {p.emptyRoles}
                </td>
              </tr>
            ) : (
              view.roles.map((row) => (
                <tr key={row.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-foreground">{row.roleLabel}</p>
                    {row.capabilityField ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {READINESS_CAPABILITY_LABELS[row.capabilityField]}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {view.canEdit ? (
                      <OwnerSelect
                        value={row.primaryProfileId}
                        options={view.teamOptions}
                        unassignedLabel={p.unassigned}
                        disabled={pending}
                        onChange={(id) =>
                          run(() =>
                            updateTeamSuccessionRole({
                              businessId: view.businessId,
                              roleId: row.id,
                              primaryProfileId: id,
                              backupProfileId: row.backupProfileId,
                              capabilityField: row.capabilityField,
                              notes: row.notes,
                            })
                          )
                        }
                      />
                    ) : (
                      <span>{row.primaryName ?? p.unassigned}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {view.canEdit ? (
                      <OwnerSelect
                        value={row.backupProfileId}
                        options={view.teamOptions}
                        unassignedLabel={p.unassigned}
                        disabled={pending}
                        onChange={(id) =>
                          run(() =>
                            updateTeamSuccessionRole({
                              businessId: view.businessId,
                              roleId: row.id,
                              primaryProfileId: row.primaryProfileId,
                              backupProfileId: id,
                              capabilityField: row.capabilityField,
                              notes: row.notes,
                            })
                          )
                        }
                      />
                    ) : (
                      <span>{row.backupName ?? p.unassigned}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge
                      variant="outline"
                      className={cn("font-medium", successionRiskClass(row.riskLevel))}
                      title={row.riskReason}
                    >
                      {SUCCESSION_RISK_LABELS[row.riskLevel]}
                    </Badge>
                    <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">{row.riskReason}</p>
                  </td>
                  {view.canEdit ? (
                    <td className="px-2 py-3 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={pending}
                        onClick={() =>
                          run(() =>
                            removeTeamSuccessionRole({
                              businessId: view.businessId,
                              roleId: row.id,
                            })
                          )
                        }
                        aria-label={`Remove ${row.roleLabel}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {view.canEdit ? (
        <form
          className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              const res = await addTeamSuccessionRole({
                businessId: view.businessId,
                roleLabel: newRole,
              })
              if (res.ok) setNewRole("")
              return res
            })
          }}
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="new-succession-role">{p.addRoleLabel}</Label>
            <Input
              id="new-succession-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder={p.addRolePlaceholder}
              disabled={pending}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending || newRole.trim().length < 2}>
            <Plus className="mr-1.5 size-4" aria-hidden />
            {p.addRoleCta}
          </Button>
        </form>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">{p.riskHint}</p>
    </div>
  )
}

function OwnerSelect({
  value,
  options,
  unassignedLabel,
  disabled,
  onChange,
}: {
  value: string | null
  options: { id: string; name: string; role: string }[]
  unassignedLabel: string
  disabled: boolean
  onChange: (id: string | null) => void
}) {
  return (
    <select
      className="h-9 w-full max-w-[14rem] rounded-lg border border-input bg-background px-2 text-sm"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
    >
      <option value="">{unassignedLabel}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
          {o.role ? ` · ${o.role}` : ""}
        </option>
      ))}
    </select>
  )
}
