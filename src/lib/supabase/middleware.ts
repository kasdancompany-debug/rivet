import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { isBillingExemptPath, shouldEnforceBillingGate } from "@/lib/billing/config"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass"
import {
  isApiOrStaticPath,
  isPathExemptFromBusinessRequirement,
  isPathExemptFromRealityCheck,
  isPathExemptFromTemplateInstall,
} from "@/lib/onboarding/paths"
import { createSupabaseFetch, MIDDLEWARE_SUPABASE_FETCH_MS } from "@/lib/supabase/fetch-with-timeout"
import { nextResponseCloningRequestWithReturnTo } from "@/lib/supabase/middleware-request-headers"
import { getSafeInternalNextPath } from "@/lib/auth/safe-next-path"
import type { Database } from "@/types/database"

const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/scan",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/support",
])

function isPublicPath(pathname: string) {
  if (publicPaths.has(pathname)) return true
  if (pathname.startsWith("/auth")) return true
  if (pathname === "/api/stripe/webhook") return true
  return false
}

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const returnTo = getSafeInternalNextPath(`${pathname}${search}`, pathname)

  if (isDevAuthBypassEnabled()) {
    return nextResponseCloningRequestWithReturnTo(request, returnTo)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url?.trim() || !key?.trim()) {
    if (isPublicPath(pathname)) {
      return NextResponse.next({ request })
    }
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("error", "missing_config")
    redirectUrl.searchParams.set("next", returnTo)
    return NextResponse.redirect(redirectUrl)
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = nextResponseCloningRequestWithReturnTo(request, returnTo)

  const supabase = createServerClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(MIDDLEWARE_SUPABASE_FETCH_MS) },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = nextResponseCloningRequestWithReturnTo(request, returnTo)
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  let user = null
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    user = u
  } catch {
    // Timeout or unreachable Supabase — fail open here; layouts still enforce auth.
  }

  if (!user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("next", returnTo)
    return NextResponse.redirect(redirectUrl)
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle()
  const businessId = prof?.business_id as string | null | undefined

  const needsBillingGate =
    Boolean(businessId) && shouldEnforceBillingGate() && !isBillingExemptPath(pathname)
  const needsTemplateGate =
    Boolean(businessId) && !isApiOrStaticPath(pathname) && !isPathExemptFromTemplateInstall(pathname)
  const needsRealityGate =
    Boolean(businessId) && !isApiOrStaticPath(pathname) && !isPathExemptFromRealityCheck(pathname)

  if (needsBillingGate || needsTemplateGate || needsRealityGate) {
    const [purchaseRes, businessRes, realityRes] = await Promise.all([
      needsBillingGate
        ? supabase
            .from("rivet_purchases")
            .select("id")
            .eq("business_id", businessId!)
            .eq("status", "paid")
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: { id: "skip" }, error: null }),
      needsTemplateGate
        ? supabase
            .from("businesses")
            .select("template_installed_at")
            .eq("id", businessId!)
            .maybeSingle()
        : Promise.resolve({ data: { template_installed_at: "skip" }, error: null }),
      needsRealityGate
        ? supabase
            .from("reality_checks")
            .select("id", { count: "exact", head: true })
            .eq("business_id", businessId!)
        : Promise.resolve({ count: 1, error: null }),
    ])

    if (needsBillingGate && (purchaseRes.error || !purchaseRes.data?.id)) {
      return NextResponse.redirect(new URL("/subscribe", request.url))
    }

    if (needsTemplateGate && !businessRes.error && !businessRes.data?.template_installed_at) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    if (needsRealityGate && !realityRes.error && (realityRes.count ?? 0) === 0) {
      return NextResponse.redirect(new URL("/onboarding?phase=reality-check", request.url))
    }
  }

  if (!isApiOrStaticPath(pathname)) {
    if (!businessId && !isPathExemptFromBusinessRequirement(pathname)) {
      return NextResponse.redirect(new URL("/setup", request.url))
    }
  }

  return supabaseResponse
}
