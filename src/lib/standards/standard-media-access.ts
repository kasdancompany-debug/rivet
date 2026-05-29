import "server-only"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { loadWorkspaceAccess } from "@/lib/ops/load-workspace-access"
import { permissionDeniedMessage } from "@/lib/ops/workspace-permissions"
import type { TypedSupabaseClient } from "@/types/database"

export type StandardMediaAccessMode = "upload" | "delete"

/**
 * Upload: owners/managers/trainers (capture/edit/modules) and staff (step proof in portal).
 * Delete: editors only — staff may upload proof but not remove play media.
 */
export async function assertStandardMediaWorkspaceAccess(
  supabase: TypedSupabaseClient,
  businessId: string,
  mode: StandardMediaAccessMode
): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "Sign in to manage media." }
  }

  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    return { ok: false, message: "Link a workspace first." }
  }
  if (business.id !== businessId) {
    return { ok: false, message: "This media does not belong to your active workspace." }
  }

  const access = await loadWorkspaceAccess(supabase, user.id)
  if (!access) {
    return { ok: false, message: "You do not have access to this workspace." }
  }

  if (mode === "upload") {
    if (
      access.can("capture_plays") ||
      access.can("edit_plays") ||
      access.can("manage_training_modules") ||
      access.can("view_plays")
    ) {
      return { ok: true }
    }
    return { ok: false, message: permissionDeniedMessage("capture_plays") }
  }

  if (
    access.can("capture_plays") ||
    access.can("edit_plays") ||
    access.can("manage_training_modules")
  ) {
    return { ok: true }
  }

  return { ok: false, message: permissionDeniedMessage("edit_plays") }
}
