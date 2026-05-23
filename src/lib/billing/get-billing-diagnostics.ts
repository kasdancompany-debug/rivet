import { businessHasPaidRivetPurchase } from "@/lib/billing/rivet-access"
import {
  getBillingReadiness,
  isBillingFullyConfigured,
  REQUIRED_BILLING_ENV_VARS,
  shouldEnforceBillingGate,
} from "@/lib/billing/billing-readiness"
import { isBillingEnforced } from "@/lib/billing/config"
import { createClient } from "@/lib/supabase/server"

export type BillingEnvPresenceRow = {
  key: (typeof REQUIRED_BILLING_ENV_VARS)[number]
  present: boolean
}

export type BillingPurchaseSnapshot = {
  status: string
  purchasedAt: string | null
  updatedAt: string
}

export type BillingDiagnosticsView = {
  nodeEnv: string
  billingReadinessStatus: ReturnType<typeof getBillingReadiness>["status"]
  billingReadinessMessage: string | null
  missingEnvVars: string[]
  envPresence: BillingEnvPresenceRow[]
  stripePriceIdPresent: boolean
  stripeSecretKeyPresent: boolean
  stripeSecretKeyMode: "test" | "live" | "unknown" | null
  stripeAllowLiveKeys: boolean
  siteUrl: string | null
  paywallEnforced: boolean
  checkoutEnabled: boolean
  userEmail: string | null
  userId: string | null
  businessId: string | null
  hasPaidPurchase: boolean
  lastPurchase: BillingPurchaseSnapshot | null
}

function stripeSecretKeyMode(): BillingDiagnosticsView["stripeSecretKeyMode"] {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  if (key.startsWith("sk_test_")) return "test"
  if (key.startsWith("sk_live_")) return "live"
  return "unknown"
}

export async function getBillingDiagnosticsForCurrentUser(): Promise<BillingDiagnosticsView | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const readiness = getBillingReadiness()
  const envPresence = REQUIRED_BILLING_ENV_VARS.map((key) => ({
    key,
    present: Boolean(process.env[key]?.trim()),
  }))

  let businessId: string | null = null
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle()
  businessId = (profile?.business_id as string | null | undefined) ?? null

  let hasPaidPurchase = false
  let lastPurchase: BillingPurchaseSnapshot | null = null

  if (businessId) {
    hasPaidPurchase = await businessHasPaidRivetPurchase(supabase, businessId)
    const { data: rows } = await supabase
      .from("rivet_purchases")
      .select("status, purchased_at, updated_at")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(1)

    const row = rows?.[0]
    if (row) {
      lastPurchase = {
        status: String(row.status),
        purchasedAt: row.purchased_at as string | null,
        updatedAt: String(row.updated_at),
      }
    }
  }

  const priceId = process.env.STRIPE_RIVET_ONE_TIME_PRICE_ID?.trim()

  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    billingReadinessStatus: readiness.status,
    billingReadinessMessage: readiness.message,
    missingEnvVars: [...readiness.missing],
    envPresence,
    stripePriceIdPresent: Boolean(priceId),
    stripeSecretKeyPresent: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    stripeSecretKeyMode: stripeSecretKeyMode(),
    stripeAllowLiveKeys: process.env.STRIPE_ALLOW_LIVE_KEYS === "true",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
    paywallEnforced: shouldEnforceBillingGate(),
    checkoutEnabled: isBillingEnforced(),
    userEmail: user.email ?? null,
    userId: user.id,
    businessId,
    hasPaidPurchase,
    lastPurchase,
  }
}
