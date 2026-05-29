"use server"

import Stripe from "stripe"

import {
  buildRivetCheckoutMetadata,
  rivetCheckoutCancelUrl,
  rivetCheckoutSuccessUrl,
} from "@/lib/billing/checkout-metadata"
import {
  type FounderPaymentOption,
  founderStripePriceId,
  FOUNDER_PAYMENT_OPTIONS,
} from "@/lib/billing/founder-offer"
import { assertStripeSecretIsTestMode } from "@/lib/billing/stripe-test-mode"
import { billingCheckoutBlockedMessage, isBillingEnforced } from "@/lib/billing/config"
import { parseRivetCheckoutMetadata } from "@/lib/billing/checkout-metadata"
import { syncRivetPurchaseFromCheckoutSession } from "@/lib/billing/sync-rivet-purchase"
import { businessHasRivetAppAccess } from "@/lib/billing/rivet-access"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Starts Stripe Checkout for Founder Lifetime Access.
 * $799 CAD once (`STRIPE_RIVET_ONE_TIME_PRICE_ID`) or 3×$299 when `STRIPE_RIVET_INSTALLMENT_3_PRICE_ID` is set.
 * Webhook grandfathers the workspace permanently on paid founder checkout.
 */
export async function createCheckoutSession(input?: {
  paymentOption?: FounderPaymentOption
}): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!isBillingEnforced()) {
    const blocked = billingCheckoutBlockedMessage()
    return {
      ok: false,
      message: blocked ?? "Billing is not configured for this environment.",
    }
  }

  const paymentOption: FounderPaymentOption = input?.paymentOption ?? "once"
  const priceId = founderStripePriceId(paymentOption)
  const oncePriceId = founderStripePriceId("once")

  if (!oncePriceId) {
    return {
      ok: false,
      message: "STRIPE_RIVET_ONE_TIME_PRICE_ID is not configured on the server.",
    }
  }

  if (paymentOption === "installment_3" && !priceId) {
    return {
      ok: false,
      message: `Installment checkout is not configured yet. Use ${FOUNDER_PAYMENT_OPTIONS.once.label} or contact support.`,
    }
  }

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
    paymentOption,
  })

  const stripe = new Stripe(secret)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId ?? oncePriceId, quantity: 1 }],
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

export type ConfirmCheckoutSessionResult =
  | { ok: true; hasAppAccess: boolean }
  | { ok: false; message: string; pending?: boolean }

/**
 * Confirms a Stripe Checkout session after redirect (closes webhook race before /dashboard).
 */
export async function confirmCheckoutSession(
  sessionId: string
): Promise<ConfirmCheckoutSessionResult> {
  const trimmed = sessionId.trim()
  if (!trimmed) {
    return { ok: false, message: "Missing checkout session." }
  }

  if (!isBillingEnforced()) {
    return { ok: false, message: billingCheckoutBlockedMessage() ?? "Billing is not configured." }
  }

  const secret = process.env.STRIPE_SECRET_KEY!.trim()
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.business_id) {
    return { ok: false, message: "Link a workspace before confirming payment." }
  }

  const stripe = new Stripe(secret)
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(trimmed)
  } catch {
    return { ok: false, message: "Could not verify checkout session." }
  }

  const parsed = parseRivetCheckoutMetadata(session)
  if (parsed.userId && parsed.userId !== user.id) {
    return { ok: false, message: "This checkout belongs to a different account." }
  }
  if (parsed.workspaceId && parsed.workspaceId !== profile.business_id) {
    return { ok: false, message: "This checkout belongs to a different workspace." }
  }

  if (session.payment_status !== "paid") {
    return {
      ok: false,
      message: "Payment is still processing. Refresh in a moment or wait for the confirmation email.",
      pending: true,
    }
  }

  const admin = createAdminClient()
  const sync = await syncRivetPurchaseFromCheckoutSession(admin, session)
  if (!sync.ok) {
    return { ok: false, message: "Checkout metadata was incomplete. Contact support with your receipt." }
  }

  const hasAppAccess = await businessHasRivetAppAccess(supabase, profile.business_id, user.id)
  return { ok: true, hasAppAccess }
}
