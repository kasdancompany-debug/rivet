import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

import { assertStripeSecretIsTestMode } from "@/lib/billing/stripe-test-mode"
import { getBillingReadiness } from "@/lib/billing/billing-readiness"
import { parseRivetCheckoutMetadata, RIVET_CHECKOUT_METADATA_KEYS } from "@/lib/billing/checkout-metadata"
import { reconcileFounderAccessAfterPurchaseChange } from "@/lib/billing/revoke-founder-access"
import { syncRivetPurchaseFromCheckoutSession } from "@/lib/billing/sync-rivet-purchase"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

type WebhookLogContext = Record<string, string | null | boolean | number>

function logStripeWebhook(message: string, context: WebhookLogContext = {}): void {
  console.info("[stripe webhook]", message, context)
}

function logStripeWebhookError(message: string, context: WebhookLogContext = {}): void {
  console.error("[stripe webhook]", message, context)
}

function checkoutSessionContext(session: Stripe.Checkout.Session): WebhookLogContext {
  const parsed = parseRivetCheckoutMetadata(session)
  return {
    checkoutSessionId: session.id,
    customerEmail: parsed.email,
    userId: parsed.userId,
    workspaceId: parsed.workspaceId,
    mode: session.mode,
    paymentStatus: session.payment_status,
  }
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
    case "unpaid":
      return "canceled"
    case "incomplete":
      return "incomplete"
    case "incomplete_expired":
      return "incomplete_expired"
    default:
      return "none"
  }
}

function resolveSubscriptionUserId(session: Stripe.Checkout.Session): string | null {
  const meta = session.metadata ?? {}
  return (
    meta[RIVET_CHECKOUT_METADATA_KEYS.userId]?.trim() ||
    meta.supabase_user_id?.trim() ||
    session.client_reference_id?.trim() ||
    null
  )
}

function resolveSubscriptionUserIdFromSub(sub: Stripe.Subscription): string | null {
  const meta = sub.metadata ?? {}
  return meta[RIVET_CHECKOUT_METADATA_KEYS.userId]?.trim() || meta.supabase_user_id?.trim() || null
}

async function upsertSubscriptionForUser(
  admin: ReturnType<typeof createAdminClient>,
  args: {
    userId: string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    status: string
  }
): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("business_id")
    .eq("id", args.userId)
    .maybeSingle()

  const businessId = (profile?.business_id as string | null | undefined) ?? null

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", args.userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date().toISOString()
  const row = {
    user_id: args.userId,
    business_id: businessId,
    stripe_customer_id: args.stripeCustomerId,
    stripe_subscription_id: args.stripeSubscriptionId,
    status: args.status,
    updated_at: now,
  }

  if (existing?.id) {
    await admin.from("subscriptions").update(row).eq("id", existing.id as string)
  } else {
    await admin.from("subscriptions").insert({
      ...row,
      created_at: now,
    })
  }
}

async function recordWebhookEvent(
  admin: ReturnType<typeof createAdminClient>,
  event: Stripe.Event
): Promise<"new" | "duplicate"> {
  const { error } = await admin.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
  })

  if (error?.code === "23505") return "duplicate"
  if (error) throw error
  return "new"
}

function skippedMetadataResponse(result: Extract<
  Awaited<ReturnType<typeof syncRivetPurchaseFromCheckoutSession>>,
  { ok: false }
>) {
  return NextResponse.json({
    received: true,
    skipped: "missing_checkout_metadata",
    missing: result.missing,
    checkout_session_id: result.checkoutSessionId,
  })
}

async function handlePaymentCheckoutSession(
  admin: ReturnType<typeof createAdminClient>,
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): Promise<NextResponse | null> {
  const parsed = parseRivetCheckoutMetadata(session)

  logStripeWebhook("processing payment checkout session", {
    eventId: event.id,
    eventType: event.type,
    checkoutSessionId: session.id,
    customerEmail: parsed.email,
    userId: parsed.userId,
    workspaceId: parsed.workspaceId,
    mode: session.mode,
    paymentStatus: session.payment_status,
  })

  const result = await syncRivetPurchaseFromCheckoutSession(admin, session)
  if (!result.ok) {
    logStripeWebhookError("rivet purchase not saved — missing metadata", {
      eventId: event.id,
      eventType: event.type,
      checkoutSessionId: result.checkoutSessionId,
      missingFields: result.missing.join(","),
      customerEmail: parsed.email,
    })
    return skippedMetadataResponse(result)
  }

  logStripeWebhook("rivet purchase upserted", {
    eventId: event.id,
    eventType: event.type,
    checkoutSessionId: result.checkoutSessionId,
    purchaseStatus: result.status,
    workspaceId: result.businessId,
    founderGrandfathered: result.founderGrandfathered,
    userId: parsed.userId,
    customerEmail: parsed.email,
  })

  return null
}

async function handleChargeRefunded(
  admin: ReturnType<typeof createAdminClient>,
  charge: Stripe.Charge
): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id

  if (!paymentIntentId) return

  const { data: purchase, error } = await admin
    .from("rivet_purchases")
    .select("id, business_id, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle()

  if (error || !purchase?.id) return

  const now = new Date().toISOString()
  await admin
    .from("rivet_purchases")
    .update({ status: "refunded", updated_at: now })
    .eq("id", purchase.id)

  await reconcileFounderAccessAfterPurchaseChange(admin, purchase.business_id as string)
}

export async function POST(request: Request) {
  const readiness = getBillingReadiness()
  if (readiness.status !== "ready") {
    logStripeWebhookError("billing not ready", {
      missingEnvVars: readiness.missing.join(","),
    })
    return NextResponse.json({ error: "billing_not_configured" }, { status: 503 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET!.trim()
  const stripeKey = process.env.STRIPE_SECRET_KEY!.trim()

  try {
    assertStripeSecretIsTestMode(stripeKey)
  } catch {
    return NextResponse.json({ error: "live_keys_blocked" }, { status: 503 })
  }

  const body = await request.text()
  const headerList = await headers()
  const sig = headerList.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 })
  }

  const stripe = new Stripe(stripeKey)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 })
  }

  logStripeWebhook("event verified", {
    eventId: event.id,
    eventType: event.type,
  })

  try {
    const admin = createAdminClient()
    const dedupe = await recordWebhookEvent(admin, event)
    if (dedupe === "duplicate") {
      logStripeWebhook("duplicate event skipped", {
        eventId: event.id,
        eventType: event.type,
      })
      return NextResponse.json({ received: true, duplicate: true, event_id: event.id })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "payment") {
          const paymentError = await handlePaymentCheckoutSession(admin, event, session)
          if (paymentError) return paymentError
          break
        }

        if (session.mode !== "subscription") break

        logStripeWebhook("processing subscription checkout session", {
          eventId: event.id,
          eventType: event.type,
          ...checkoutSessionContext(session),
        })

        const userId = resolveSubscriptionUserId(session)
        if (!userId) {
          logStripeWebhookError("subscription checkout missing user id", {
            eventId: event.id,
            eventType: event.type,
            checkoutSessionId: session.id,
            customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
          })
          return NextResponse.json({
            received: true,
            skipped: "missing_checkout_metadata",
            missing: [RIVET_CHECKOUT_METADATA_KEYS.userId],
            checkout_session_id: session.id,
          })
        }

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null

        const email =
          session.customer_details?.email ??
          session.customer_email ??
          `rivet-${userId.slice(0, 8)}@pending.local`

        const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle()

        if (existing) {
          await upsertSubscriptionForUser(admin, {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subId,
            status: "active",
          })
        } else {
          await admin.from("profiles").insert({
            id: userId,
            email,
            full_name: email.includes("@") ? email.split("@")[0]! : "Rivet owner",
            is_owner: true,
            role: "member",
          })
          await upsertSubscriptionForUser(admin, {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subId,
            status: "active",
          })
        }
        break
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === "payment") {
          const paymentError = await handlePaymentCheckoutSession(admin, event, session)
          if (paymentError) return paymentError
        }
        break
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "payment") break
        const parsed = parseRivetCheckoutMetadata(session)
        if (!parsed.workspaceId) break
        const now = new Date().toISOString()
        await admin
          .from("rivet_purchases")
          .update({ status: "canceled", updated_at: now })
          .eq("stripe_checkout_session_id", session.id)
        break
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(admin, charge)
        break
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        logStripeWebhook("processing subscription lifecycle event", {
          eventId: event.id,
          eventType: event.type,
          supabaseUserId: resolveSubscriptionUserIdFromSub(sub),
        })

        const userId = resolveSubscriptionUserIdFromSub(sub)
        if (!userId) {
          logStripeWebhookError("subscription event missing user id", {
            eventId: event.id,
            eventType: event.type,
          })
          break
        }

        const status =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : mapStripeSubscriptionStatus(sub.status)

        await upsertSubscriptionForUser(admin, {
          userId,
          stripeSubscriptionId: sub.id,
          stripeCustomerId:
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
          status,
        })
        break
      }
      default:
        logStripeWebhook("event ignored", {
          eventId: event.id,
          eventType: event.type,
        })
        break
    }
  } catch (e) {
    logStripeWebhookError("handler failed", {
      eventId: event.id,
      eventType: event.type,
      message: e instanceof Error ? e.message : "unknown_error",
    })
    return NextResponse.json({ error: "handler_failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true, event_id: event.id })
}
