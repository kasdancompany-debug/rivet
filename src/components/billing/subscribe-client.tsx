"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check } from "lucide-react"

import { createCheckoutSession } from "@/app/actions/billing"
import { AppPageHeader } from "@/components/app-page-header"
import type { FounderPaymentOption } from "@/lib/billing/founder-offer"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function paymentChoiceClass(selected: boolean) {
  return cn(
    "w-full rounded-lg border px-4 py-3 text-left transition-colors",
    selected
      ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30"
      : "border-border/60 bg-card hover:border-border"
  )
}

export function SubscribeClient({
  email,
  billingCanceled = false,
  billingStatusMessage = null,
  checkoutDisabledMessage = null,
  installmentCheckoutAvailable = true,
}: {
  email: string
  billingCanceled?: boolean
  billingStatusMessage?: string | null
  checkoutDisabledMessage?: string | null
  /** False when STRIPE_RIVET_INSTALLMENT_3_PRICE_ID is unset on the server. */
  installmentCheckoutAvailable?: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [paymentOption, setPaymentOption] = useState<FounderPaymentOption>("once")
  const { billing } = COPY

  function startCheckout() {
    setError(null)
    start(async () => {
      const res = await createCheckoutSession({ paymentOption })
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
        eyebrow={billing.limitedFounderRelease}
        title={billing.subscribeTitle}
        description={billing.subscribeLead}
      />

      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{billing.productName}</CardTitle>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">
              {billing.limitedFounderRelease}
            </span>
          </div>
          <CardDescription className="space-y-3 text-sm leading-relaxed">
            <span>
              Signed in as <span className="font-medium text-foreground">{email || "your account"}</span>.
            </span>
            <span className="block text-muted-foreground">{billing.subscribeCardNote}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Choose how to pay
            </p>
            <div className="mt-2 grid gap-2">
              <button
                type="button"
                className={paymentChoiceClass(paymentOption === "once")}
                onClick={() => setPaymentOption("once")}
              >
                <span className="block text-sm font-semibold text-foreground">{billing.paymentOnceLabel}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  One payment · same lifetime access
                </span>
              </button>
              <button
                type="button"
                className={paymentChoiceClass(paymentOption === "installment_3")}
                disabled={!installmentCheckoutAvailable}
                onClick={() => setPaymentOption("installment_3")}
              >
                <span className="block text-sm font-semibold text-foreground">
                  {billing.paymentInstallmentLabel}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {installmentCheckoutAvailable
                    ? "Three payments · same grandfathered access"
                    : "Available when installment checkout is enabled on this environment"}
                </span>
              </button>
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-1">
            {billing.included.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[13px] text-muted-foreground"
              >
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-muted-foreground">{billing.founderGrandfatherNote}</p>

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
              <span className="font-medium">{billing.checkoutCanceledTitle}. </span>
              {billing.checkoutCanceledBody}
            </p>
          ) : null}
          {billingStatusMessage ? (
            <p
              className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-sm text-amber-950 dark:text-amber-100/90"
              role="status"
            >
              {billingStatusMessage}
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
            disabled={
              pending ||
              Boolean(checkoutDisabledMessage) ||
              (paymentOption === "installment_3" && !installmentCheckoutAvailable)
            }
            onClick={startCheckout}
          >
            {pending ? "Starting checkout…" : billing.checkoutCta}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {billing.checkoutCta} · secure payment via Stripe
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <Button variant="link" className="h-auto p-0 text-xs" nativeButton={false} render={<Link href="/settings" />} />
            {" · "}
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              nativeButton={false}
              render={<Link href="/login?next=/subscribe" />}
            />
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
