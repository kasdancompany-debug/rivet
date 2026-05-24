"use client"

import { useState, useTransition } from "react"
import Link from "next/link"

import { createCheckoutSession } from "@/app/actions/billing"
import { AppPageHeader } from "@/components/app-page-header"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SubscribeClient({
  email,
  billingCanceled = false,
  checkoutDisabledMessage = null,
}: {
  email: string
  billingCanceled?: boolean
  /** When billing env is incomplete, Checkout is blocked with this message. */
  checkoutDisabledMessage?: string | null
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function startCheckout() {
    setError(null)
    start(async () => {
      const res = await createCheckoutSession()
      if (!res.ok) {
        setError(res.message)
        return
      }
      window.location.href = res.url
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <AppPageHeader
        eyebrow="Billing"
        title="Unlock your Rivet workspace"
        description="One-time $799 CAD payment. After Stripe confirms, you return here while we unlock your workspace—usually within a few seconds."
      />

      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Rivet · $799 CAD once</CardTitle>
          <CardDescription className="space-y-2 text-sm leading-relaxed">
            <span>
              Signed in as <span className="font-medium text-foreground">{email || "your account"}</span>.
            </span>
            <span className="block text-muted-foreground">
              Includes procedures, training, logging what still routes back to you, bottlenecks, escape readiness score, and owner overview. One payment—no monthly subscription.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkoutDisabledMessage ? (
            <p
              className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-sm text-amber-950 dark:text-amber-100/90"
              role="status"
            >
              {checkoutDisabledMessage}
            </p>
          ) : null}
          {billingCanceled ? (
            <p
              className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-sm text-amber-950 dark:text-amber-100/90"
              role="status"
            >
              <span className="font-medium">{COPY.billing.checkoutCanceledTitle}. </span>
              {COPY.billing.checkoutCanceledBody}
            </p>
          ) : null}
          {error ? (
            <p
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="h-11 w-full"
            disabled={pending || Boolean(checkoutDisabledMessage)}
            onClick={startCheckout}
          >
            {pending ? "Starting checkout…" : "Continue to Stripe Checkout"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Button variant="link" className="h-auto p-0 text-xs" nativeButton={false} render={<Link href="/settings" />}>
              Open settings
            </Button>
            {" · "}
            <Button variant="link" className="h-auto p-0 text-xs" nativeButton={false} render={<Link href="/login?next=/subscribe" />}>
              Use a different account
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
