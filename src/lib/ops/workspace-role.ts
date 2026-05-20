import type { Tables } from "@/types/database"

export function isWorkspaceOwner(
  userId: string,
  business: Tables<"businesses"> | null,
  profile: Tables<"profiles"> | null
): boolean {
  if (!business) return false
  if (business.owner_id === userId) return true
  if (profile?.id === userId && profile.is_owner) return true
  return false
}
