import Link from "next/link"
import { Check, X } from "lucide-react"

import type { BillingDiagnosticsView } from "@/lib/billing/get-billing-diagnostics"
import { internalDiagnosticsAccessHint } from "@/lib/billing/internal-access"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold",
        ok
          ? "border-emerald-200/80 bg-emerald-500/[0.06] text-emerald-950 dark:border-emerald-500/25 dark:text-emerald-100"
          : "border-amber-200/80 bg-amber-500/[0.06] text-amber-950 dark:border-amber-500/25 dark:text-amber-100"
      )}
    >
      {label}
    </Badge>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/40 py-3.5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-foreground sm:max-w-[65%] sm:text-right">{children}</dd>
    </div>
  )
}

function PresentIcon({ present }: { present: boolean }) {
  return present ? (
    <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-label="Present" />
  ) : (
    <X className="size-4 text-amber-600 dark:text-amber-400" aria-label="Missing" />
  )
}

function readinessLabel(status: BillingDiagnosticsView["billingReadinessStatus"]): string {
  switch (status) {
    case "ready":
      return "Ready"
    case "misconfigured":
      return "Misconfigured"
    case "off":
      return "Off"
  }
}

export function BillingDiagnosticsPanel({ model }: { model: BillingDiagnosticsView }) {
  const qaPass =
    model.billingReadinessStatus === "ready" &&
    model.businessId != null &&
    (model.hasPaidPurchase || model.paywallEnforced)

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Internal · launch QA
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing diagnostics</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Environment and workspace billing state — no secret values. {internalDiagnosticsAccessHint()}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          ok={model.billingReadinessStatus === "ready"}
          label={`Billing ${readinessLabel(model.billingReadinessStatus)}`}
        />
        <StatusBadge ok={model.paywallEnforced} label={model.paywallEnforced ? "Paywall on" : "Paywall off"} />
        <StatusBadge ok={model.checkoutEnabled} label={model.checkoutEnabled ? "Checkout enabled" : "Checkout blocked"} />
        {model.hasPaidPurchase ? (
          <StatusBadge ok label="Paid purchase on file" />
        ) : (
          <StatusBadge ok={false} label="No paid purchase" />
        )}
      </div>

      {model.billingReadinessMessage ? (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-950 dark:text-amber-100/95">
          {model.billingReadinessMessage}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/40 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">Session & workspace</h2>
        </div>
        <dl className="px-5 sm:px-6">
          <Row label="NODE_ENV">{model.nodeEnv}</Row>
          <Row label="Current user email">{model.userEmail ?? "—"}</Row>
          <Row label="User id">
            <span className="font-mono text-xs break-all">{model.userId ?? "—"}</span>
          </Row>
          <Row label="Workspace id (business_id)">
            <span className="font-mono text-xs break-all">{model.businessId ?? "—"}</span>
          </Row>
          <Row label="Has paid rivet_purchases row">{model.hasPaidPurchase ? "Yes" : "No"}</Row>
          <Row label="Last purchase status">{model.lastPurchase?.status ?? "—"}</Row>
          <Row label="Last purchase updated">
            {model.lastPurchase?.updatedAt
              ? new Date(model.lastPurchase.updatedAt).toLocaleString()
              : "—"}
          </Row>
          <Row label="Last purchased at">
            {model.lastPurchase?.purchasedAt
              ? new Date(model.lastPurchase.purchasedAt).toLocaleString()
              : "—"}
          </Row>
        </dl>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/40 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">Environment (presence only)</h2>
        </div>
        <dl className="px-5 sm:px-6">
          <Row label="NEXT_PUBLIC_SITE_URL">
            <span className="font-mono text-xs break-all">{model.siteUrl ?? "—"}</span>
          </Row>
          <Row label="STRIPE_RIVET_ONE_TIME_PRICE_ID">
            {model.stripePriceIdPresent ? "Present (price_…)" : "Missing"}
          </Row>
          <Row label="STRIPE_SECRET_KEY">
            {model.stripeSecretKeyPresent
              ? `Present (${model.stripeSecretKeyMode ?? "unknown"} mode)`
              : "Missing"}
          </Row>
          <Row label="STRIPE_ALLOW_LIVE_KEYS">{model.stripeAllowLiveKeys ? "true" : "false / unset"}</Row>
        </dl>
        <div className="border-t border-border/40 px-5 py-4 sm:px-6">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Required billing vars
          </p>
          <ul className="space-y-2">
            {model.envPresence.map((row) => (
              <li key={row.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-mono text-xs">{row.key}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {row.present ? "Present" : "Missing"}
                  <PresentIcon present={row.present} />
                </span>
              </li>
            ))}
          </ul>
          {model.missingEnvVars.length > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">Missing: {model.missingEnvVars.join(", ")}</p>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/40 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">Launch QA hints</h2>
        </div>
        <ul className="space-y-2 px-5 py-4 text-sm leading-relaxed text-muted-foreground sm:px-6">
          <li>
            {model.billingReadinessStatus === "ready"
              ? "All billing env vars present — test checkout with 4242… then confirm rivet_purchases.status = paid."
              : "Complete missing env vars on Vercel, redeploy, then refresh this page."}
          </li>
          <li>
            {model.paywallEnforced
              ? "Unpaid users should redirect to /subscribe from /dashboard."
              : "Paywall is off — set Stripe + service role vars to enforce /subscribe."}
          </li>
          <li>
            {model.siteUrl
              ? `Checkout return URLs use ${model.siteUrl}/subscribe?billing=success&session_id={CHECKOUT_SESSION_ID}`
              : "Set NEXT_PUBLIC_SITE_URL to your production origin."}
          </li>
          <li>
            Webhook endpoint:{" "}
            <span className="font-mono text-xs">
              {model.siteUrl ? `${model.siteUrl}/api/stripe/webhook` : "/api/stripe/webhook"}
            </span>
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/subscribe" />}>
          Open /subscribe
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/internal/pilot" />}>
          Kasdan pilot
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/internal/metrics" />}>
          Case study metrics
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          Open /dashboard
        </Button>
        <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/settings" />}>
          Settings
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Quick read:{" "}
        {qaPass ? "Configuration looks launch-ready for a billing test." : "Resolve items above before charging customers."}
      </p>
    </div>
  )
}
