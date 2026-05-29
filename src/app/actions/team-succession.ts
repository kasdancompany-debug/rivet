"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  listEmployeeModuleCertificationsForEmployeeIds,
  listEmployeeReadinessForBusiness,
  listEmployeeStandardQuizCompletionsForEmployeeIds,
  listManagerObservationsForEmployeeIds,
  listTeamSuccessionRolesForBusiness,
  listTrainingModulesDeepForBusiness,
  listTrainingProgressForBusinessModules,
  listTrainingSopCompletionsForEmployeeIds,
  countCompletedExecutionRecordsByEmployee,
  ensureEmployeeReadinessRows,
} from "@/lib/db/queries"
import { buildEmployeeTrainingViewModel } from "@/lib/training/build-views"
import { buildSuccessionMapView } from "@/lib/succession/build-succession-map"
import { buildDefaultSuccessionRoleSeeds } from "@/lib/succession/seed-default-roles"
import type { TeamSuccessionMapView } from "@/lib/succession/types"
import { requireWorkspacePermission } from "@/lib/ops/workspace-auth"
import { loadWorkspaceAccess } from "@/lib/ops/load-workspace-access"
import type { ReadinessCapabilityField } from "@/lib/training/compute-readiness"
import { createClient } from "@/lib/supabase/server"

function revalidateSuccession() {
  revalidatePath("/training/succession")
  revalidatePath("/training")
  revalidatePath("/team")
}

export async function getTeamSuccessionMapView(): Promise<
  | { ok: true; view: TeamSuccessionMapView }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const access = await loadWorkspaceAccess(supabase, user.id)
    if (!access?.can("view_training_center")) {
      return { ok: false, message: "You do not have access to the Training Center." }
    }

    let roleRows = await listTeamSuccessionRolesForBusiness(business.id, supabase)
    const modules = await listTrainingModulesDeepForBusiness(business.id, supabase)

    if (roleRows.length === 0 && access.can("manage_team_training")) {
      const seeds = buildDefaultSuccessionRoleSeeds(modules)
      if (seeds.length > 0) {
        const { error } = await supabase.from("team_succession_roles").insert(
          seeds.map((s) => ({
            business_id: business.id,
            role_label: s.roleLabel,
            capability_field: s.capabilityField,
            sort_order: s.sortOrder,
          }))
        )
        if (!error) {
          roleRows = await listTeamSuccessionRolesForBusiness(business.id, supabase)
        }
      }
    }

    const profiles = await fetchProfilesForCurrentBusiness(supabase)
    const team = profiles.filter(
      (p) => p.business_id === business.id || p.id === business.owner_id
    )
    const teamUnique = [...new Map(team.map((p) => [p.id, p])).values()]

    if (access.can("manage_team_training")) {
      await ensureEmployeeReadinessRows(business.id, supabase)
    }

    const moduleIds = modules.map((m) => m.id)
    const employeeIds = teamUnique.map((p) => p.id)
    const [progress, completions, readinessRows, executionCounts, quizCompletions, certificationRows, observationRows] =
      await Promise.all([
        listTrainingProgressForBusinessModules(moduleIds, supabase),
        listTrainingSopCompletionsForEmployeeIds(employeeIds, supabase),
        listEmployeeReadinessForBusiness(business.id, supabase),
        countCompletedExecutionRecordsByEmployee(business.id, supabase),
        listEmployeeStandardQuizCompletionsForEmployeeIds(employeeIds, supabase),
        listEmployeeModuleCertificationsForEmployeeIds(employeeIds, supabase),
        listManagerObservationsForEmployeeIds(employeeIds, supabase),
      ])

    const modulesById = new Map(modules.map((m) => [m.id, m]))
    const profileNameById = new Map(teamUnique.map((p) => [p.id, p.full_name]))
    const viewModels = teamUnique.map((p) =>
      buildEmployeeTrainingViewModel(
        p,
        progress,
        modulesById,
        completions,
        readinessRows.find((r) => r.employee_id === p.id),
        executionCounts.get(p.id) ?? 0,
        quizCompletions,
        certificationRows,
        observationRows,
        profileNameById
      )
    )

    const view = buildSuccessionMapView({
      businessId: business.id,
      businessName: business.name,
      roleRows,
      team: teamUnique,
      viewModels,
      canEdit: access.can("manage_team_training"),
    })

    return { ok: true, view }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function updateTeamSuccessionRole(payload: {
  businessId: string
  roleId: string
  primaryProfileId: string | null
  backupProfileId: string | null
  capabilityField?: ReadinessCapabilityField | null
  notes?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspacePermission(supabase, "manage_team_training")
    if (!gate.ok) return gate
    if (gate.business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
    }

    if (
      payload.primaryProfileId &&
      payload.backupProfileId &&
      payload.primaryProfileId === payload.backupProfileId
    ) {
      return { ok: false, message: "Primary and backup must be different people." }
    }

    const { error } = await supabase
      .from("team_succession_roles")
      .update({
        primary_profile_id: payload.primaryProfileId,
        backup_profile_id: payload.backupProfileId,
        capability_field: payload.capabilityField ?? null,
        notes: payload.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.roleId)
      .eq("business_id", payload.businessId)

    if (error) return { ok: false, message: error.message }
    revalidateSuccession()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function addTeamSuccessionRole(payload: {
  businessId: string
  roleLabel: string
  capabilityField?: ReadinessCapabilityField | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspacePermission(supabase, "manage_team_training")
    if (!gate.ok) return gate

    const label = payload.roleLabel.trim()
    if (label.length < 2) return { ok: false, message: "Add a role name." }

    const existing = await listTeamSuccessionRolesForBusiness(payload.businessId, supabase)
    const maxOrder = existing.reduce((m, r) => Math.max(m, r.sort_order), -1)

    const { error } = await supabase.from("team_succession_roles").insert({
      business_id: payload.businessId,
      role_label: label,
      capability_field: payload.capabilityField ?? null,
      sort_order: maxOrder + 1,
    })

    if (error) {
      if (error.code === "23505") return { ok: false, message: "That role already exists." }
      return { ok: false, message: error.message }
    }

    revalidateSuccession()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function removeTeamSuccessionRole(payload: {
  businessId: string
  roleId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspacePermission(supabase, "manage_team_training")
    if (!gate.ok) return gate

    const { error } = await supabase
      .from("team_succession_roles")
      .delete()
      .eq("id", payload.roleId)
      .eq("business_id", payload.businessId)

    if (error) return { ok: false, message: error.message }
    revalidateSuccession()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
