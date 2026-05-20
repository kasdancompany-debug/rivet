/**
 * Fallback URL/key when `NEXT_PUBLIC_SUPABASE_*` is unset so prerender and the
 * browser client can initialize without throwing (real auth still needs a project).
 */
export const SUPABASE_PLACEHOLDER_URL = "https://placeholder.supabase.co"
export const SUPABASE_PLACEHOLDER_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
