"use server"

import Stripe from "stripe"

import { assertStripeSecretIsTestMode } from "@/lib/billing/stripe-test-mode"
import { isBillingEnforced } from "@/lib/billing/config"
import { createClient } from "@/lib/supabase/server"

const RIVET_CHECKOUT_PRODUCT_METADATA = "rivet_lifetime_v1" as const

/**
 * Starts Stripe Checkout for the one-time Rivet license ($799 CAD via your Stripe Price).
 * Requires a linked workspace (`profiles.business_id`).
 */
export async function createCheckoutSession(): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  if (!isBillingEnforced()) {
    return { ok: false, message: "Billing is not configured for this environment." }
  }

  const priceId = process.env.STRIPE_RIVET_ONE_TIME_PRICE_ID!.trim()
  const secret = process.env.STRIPE_SECRET_KEY!.trim()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"

  try {
    assertStripeSecretIsTestMode(secret)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe configuration error."
    return { ok: false, message: msg }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "You need to be signed in." }
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle()

  if (profileErr || !profile?.business_id) {
    return {
      ok: false,
      message: "Link a workspace first (Settings or Setup), then return here to complete checkout.",
    }
  }

  const businessId = profile.business_id

  const stripe = new Stripe(secret)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard?billing=success`,
    cancel_url: `${siteUrl}/subscribe?billing=canceled`,
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: {
      supabase_user_id: user.id,
      business_id: businessId,
      rivet_product: RIVET_CHECKOUT_PRODUCT_METADATA,
    },
    payment_intent_data: {
      metadata: {
        supabase_user_id: user.id,
        business_id: businessId,
        rivet_product: RIVET_CHECKOUT_PRODUCT_METADATA,
      },
    },
  })

  if (!session.url) {
    return { ok: false, message: "Could not start checkout." }
  }
  return { ok: true, url: session.url }
}
