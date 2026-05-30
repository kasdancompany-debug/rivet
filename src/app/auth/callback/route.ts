import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getSafeInternalNextPath } from "@/lib/auth/safe-next-path"
import type { Database } from "@/types/database"

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = getSafeInternalNextPath(searchParams.get("next"), "/setup")

  if (!url || !key || !code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_config&next=${encodeURIComponent(next)}`
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth&next=${encodeURIComponent(next)}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
