import Link from "next/link"
import { AlertTriangle, Sparkles } from "lucide-react"

import type { DashboardViewModel } from "@/lib/dashboard/types"
import { COPY } from "@/lib/interface-copy"
import type { ProofOfTransferView } from "@/lib/proof-of-transfer/types"
import { TryAgainReload } from "@/components/route-reliability/try-again-reload"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function DashboardTrustGate({
  model,
  proof: _proof,
}: {
  model: DashboardViewModel
  proof: ProofOfTransferView
}) {
  const isError = model.source === "error"

  if (isError) {
    return (
      <div className="space-y-10 pb-12">
        <div className="rounded-lg border border-border/50 border-l-[3px] border-l-amber-500/40 bg-muted/15 px-4 py-3 sm:px-5 dark:bg-muted/10">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-sm leading-relaxed text-foreground">{COPY.dashboard.errorNextDesc}</p>
          </div>
        </div>

        <Card variant="quiet">
          <CardHeader>
            <CardTitle className="text-xl">{COPY.dashboard.errorNextTitle}</CardTitle>
            <CardDescription className="text-base leading-relaxed">{COPY.dashboard.setupGateBody}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button className="gap-2" nativeButton={false} render={<Link href="/settings" />}>
              {COPY.dashboard.setupGateCta}
            </Button>
            <Link
              href="/setup"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex h-10 items-center justify-center gap-2 px-4"
              )}
            >
              {COPY.dashboard.premiumSetupCta}
            </Link>
            <TryAgainReload />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden pb-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.18),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-lg space-y-8 pt-4">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <Sparkles className="size-7 text-primary" strokeWidth={1.5} aria-hidden />
          </div>
        </div>
        <div className="space-y-3 text-center">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {COPY.dashboard.premiumSetupEyebrow}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {COPY.dashboard.premiumSetupTitle}
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">{COPY.dashboard.premiumSetupBody}</p>
        </div>

        <Card className="border-border/60 shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_50px_rgba(15,23,42,0.06)]">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <Button size="lg" className="h-11 px-8" nativeButton={false} render={<Link href="/setup" />}>
              {COPY.dashboard.premiumSetupCta}
            </Button>
            <Link
              href="/settings"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              {COPY.dashboard.setupGateCta}
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">{COPY.dashboard.setupGateFootnote}</p>
      </div>
    </div>
  )
}
