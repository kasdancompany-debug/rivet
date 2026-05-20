/**
 * Map common Supabase / Postgres errors to actionable dev hints.
 */
export function suggestedFixFromMessage(message: string): string {
  const m = message.toLowerCase()
  if (/42p01|relation .* does not exist|does not exist/.test(m)) {
    return "Apply pending Supabase migrations so the referenced tables exist, then redeploy."
  }
  if (/permission denied|rls|row-level security|42501/.test(m)) {
    return "Inspect RLS policies and grants for this table; confirm the authenticated role can select the needed rows."
  }
  if (/jwt|invalid.*token|session/.test(m)) {
    return "Session may be stale; sign out and back in, or check Supabase auth configuration."
  }
  if (/pgrst116|0 rows|json object requested/.test(m)) {
    return "Query expected a single row but found none—check filters and that seed data exists for this workspace."
  }
  if (/network|fetch failed|econnrefused/.test(m)) {
    return "Verify Supabase URL reachability, env vars, and that the project is not paused."
  }
  return "Check Supabase logs for this request, env vars (NEXT_PUBLIC_SUPABASE_*), and that the workspace ID is valid."
}

export function suggestedFixFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message) {
    return suggestedFixFromMessage(error.message)
  }
  return suggestedFixFromMessage(String(error))
}
