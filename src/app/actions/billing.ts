"use server"

import Stripe from "stripe"

import {
  buildRivetCheckoutMetadata,
  rivetCheckoutCancelUrl,
  rivetCheckoutSuccessUrl,
} from "@/lib/billing/checkout-metadata"
import { assertStripeSecretIsTestMode } from "@/lib/billing/stripe-test-mode"
import { billingCheckoutBlockedMessage, isBillingEnforced } from "@/lib/billing/config"
import { createClient } from "@/lib/supabase/server"

/**
 * Starts Stripe Checkout for the one-time Rivet license ($799 CAD via your Stripe Price).
 * Requires a linked workspace (`profiles.business_id`).
 */
export async function createCheckoutSession(): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  if (!isBillingEnforced()) {
    const blocked = billingCheckoutBlockedMessage()
    return {
      ok: false,
      message: blocked ?? "Billing is not configured for this environment.",
    }
  }

  const priceId = process.env.STRIPE_RIVET_ONE_TIME_PRICE_ID!.trim()
  const secret = process.env.STRIPE_SECRET_KEY!.trim()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!siteUrl) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_SITE_URL is not configured. Set it on the server and redeploy.",
    }
  }

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

  const workspaceId = profile.business_id
  const checkoutMetadata = buildRivetCheckoutMetadata({
    userId: user.id,
    workspaceId,
    email: user.email,
  })

  const stripe = new Stripe(secret)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: rivetCheckoutSuccessUrl(siteUrl),
    cancel_url: rivetCheckoutCancelUrl(siteUrl),
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: checkoutMetadata,
    payment_intent_data: {
      metadata: checkoutMetadata,
    },
  })

  if (!session.url) {
    return { ok: false, message: "Could not start checkout." }
  }
  return { ok: true, url: session.url }
}
