import type { Tables } from "@/types/database"
import type { EmployeeTrainingViewModel } from "@/lib/training/build-views"
import { computeSuccessionRisk } from "@/lib/succession/compute-risk"
import type { ReadinessCapabilityField } from "@/lib/training/compute-readiness"
import type { SuccessionRoleRow, TeamSuccessionMapView } from "@/lib/succession/types"

function parseCapabilityField(raw: string | null): ReadinessCapabilityField | null {
  if (
    raw === "open_alone" ||
    raw === "close_alone" ||
    raw === "train_others" ||
    raw === "handle_complaints"
  ) {
    return raw
  }
  return null
}

function profileName(
  profileId: string | null,
  nameById: Map<string, string>
): string | null {
  if (!profileId) return null
  return nameById.get(profileId) ?? null
}

export function buildSuccessionMapView(input: {
  businessId: string
  businessName: string
  roleRows: Tables<"team_succession_roles">[]
  team: Pick<Tables<"profiles">, "id" | "full_name" | "role">[]
  viewModels: EmployeeTrainingViewModel[]
  canEdit: boolean
}): TeamSuccessionMapView {
  const nameById = new Map(
    input.team.map((p) => [p.id, p.full_name?.trim() || "Team member"])
  )
  const vmById = new Map(input.viewModels.map((vm) => [vm.profile.id, vm]))

  const roles: SuccessionRoleRow[] = [...input.roleRows]
    .sort((a, b) => a.sort_order - b.sort_order || a.role_label.localeCompare(b.role_label))
    .map((row) => {
      const capabilityField = parseCapabilityField(row.capability_field)
      const { level, reason } = computeSuccessionRisk({
        primaryProfileId: row.primary_profile_id,
        backupProfileId: row.backup_profile_id,
        capabilityField,
        vmById,
      })
      return {
        id: row.id,
        roleLabel: row.role_label,
        capabilityField,
        primaryProfileId: row.primary_profile_id,
        primaryName: profileName(row.primary_profile_id, nameById),
        backupProfileId: row.backup_profile_id,
        backupName: profileName(row.backup_profile_id, nameById),
        riskLevel: level,
        riskReason: reason,
        notes: row.notes,
        sortOrder: row.sort_order,
      }
    })

  const teamOptions = input.team
    .map((p) => ({
      id: p.id,
      name: p.full_name?.trim() || "Team member",
      role: p.role?.trim() || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    businessId: input.businessId,
    businessName: input.businessName,
    roles,
    teamOptions,
    canEdit: input.canEdit,
  }
}

export function summarizeSuccessionRisk(roles: SuccessionRoleRow[]) {
  const counts = { low: 0, medium: 0, high: 0, critical: 0 }
  for (const r of roles) counts[r.riskLevel] += 1
  return counts
}
