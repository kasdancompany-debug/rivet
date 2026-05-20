import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

import { assertStripeSecretIsTestMode } from "@/lib/billing/stripe-test-mode"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

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

async function upsertRivetPurchaseFromPaymentSession(
  admin: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.mode !== "payment") return

  const businessId = session.metadata?.business_id
  const userId = session.metadata?.supabase_user_id ?? session.client_reference_id ?? null
  if (!businessId || !userId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[stripe webhook] payment session missing business_id or user id", session.id)
    }
    return
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null
  const amount = session.amount_total ?? 0
  const currency = (session.currency ?? "cad").toLowerCase()
  const paid = session.payment_status === "paid"
  const now = new Date().toISOString()

  const { data: existing } = await admin
    .from("rivet_purchases")
    .select("id, created_at")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle()

  const row = {
    business_id: businessId,
    purchaser_user_id: userId,
    stripe_customer_id: customerId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: pi,
    amount,
    currency,
    status: paid ? "paid" : "pending",
    purchased_at: paid ? now : null,
    updated_at: now,
    created_at: (existing?.created_at as string | undefined) ?? now,
  }

  if (existing?.id) {
    await admin.from("rivet_purchases").update(row).eq("id", existing.id as string)
  } else {
    await admin.from("rivet_purchases").insert(row)
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret || !stripeKey) {
    return NextResponse.json({ error: "billing_not_configured" }, { status: 503 })
  }

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

  try {
    const admin = createAdminClient()

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === "payment") {
          await upsertRivetPurchaseFromPaymentSession(admin, session)
          break
        }
        if (session.mode !== "subscription") break

        const userId = session.metadata?.supabase_user_id ?? session.client_reference_id
        if (!userId || typeof userId !== "string") break

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null

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
          await upsertRivetPurchaseFromPaymentSession(admin, session)
        }
        break
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id
        if (!userId) break

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
        break
    }
  } catch (e) {
    console.error("[stripe webhook]", e)
    return NextResponse.json({ error: "handler_failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
