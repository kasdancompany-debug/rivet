import Link from "next/link"

import { COPY } from "@/lib/interface-copy"
import type { ProofBucket, ProofOfTransferView, ProofSignal } from "@/lib/proof-of-transfer/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const BUCKET_META: Record<
  ProofBucket,
  { label: string; description: string; borderClass: string; labelClass: string }
> = {
  transferred: {
    label: COPY.proofPanel.bucketTransferred,
    description: COPY.proofPanel.bucketTransferredDesc,
    borderClass: "border-emerald-500/35 bg-emerald-500/[0.06]",
    labelClass: "text-emerald-900 dark:text-emerald-200/95",
  },
  fragile: {
    label: COPY.proofPanel.bucketFragile,
    description: COPY.proofPanel.bucketFragileDesc,
    borderClass: "border-amber-500/35 bg-amber-500/[0.06]",
    labelClass: "text-amber-950 dark:text-amber-200/95",
  },
  owner_only: {
    label: COPY.proofPanel.bucketOwner,
    description: COPY.proofPanel.bucketOwnerDesc,
    borderClass: "border-rose-500/35 bg-rose-500/[0.06]",
    labelClass: "text-rose-900 dark:text-rose-200/95",
  },
  newly_stable: {
    label: COPY.proofPanel.bucketStable,
    description: COPY.proofPanel.bucketStableDesc,
    borderClass: "border-sky-500/35 bg-sky-500/[0.06]",
    labelClass: "text-sky-950 dark:text-sky-200/95",
  },
}

const BUCKET_ORDER: ProofBucket[] = ["transferred", "fragile", "owner_only", "newly_stable"]

function SignalCard({ signal }: { signal: ProofSignal }) {
  const inner = (
    <>
      <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{signal.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{signal.body}</p>
      {signal.metric ? (
        <p className="mt-3 font-mono text-[0.65rem] text-muted-foreground tabular-nums">{signal.metric}</p>
      ) : null}
    </>
  )

  if (signal.href) {
    return (
      <Link
        href={signal.href}
        className="block rounded-lg border border-border/60 bg-card/80 p-4 shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/25"
      >
        {inner}
      </Link>
    )
  }

  return <div className="rounded-lg border border-border/60 bg-card/80 p-4 shadow-sm">{inner}</div>
}

function DistributionBar({ counts }: { counts: ProofOfTransferView["bucketCounts"] }) {
  const total = BUCKET_ORDER.reduce((s, k) => s + counts[k], 0)
  if (total === 0) return null

  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
      {BUCKET_ORDER.map((key) => {
        if (counts[key] === 0) return null
        const color =
          key === "transferred"
            ? "bg-emerald-600/85"
            : key === "fragile"
              ? "bg-amber-500/85"
              : key === "owner_only"
                ? "bg-rose-600/85"
                : "bg-sky-600/85"
        return (
          <div
            key={key}
            className={cn(color, "min-w-[6px]")}
            style={{ flexGrow: counts[key], flexBasis: 0 }}
          />
        )
      })}
    </div>
  )
}

export function ProofOfTransferPanel({ model }: { model: ProofOfTransferView }) {
  const totalSignals = BUCKET_ORDER.reduce((s, k) => s + model.bucketCounts[k], 0)

  return (
    <section
      className="rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/95 px-5 py-8 shadow-sm sm:px-8 sm:py-9"
      aria-labelledby="pot-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 max-w-2xl space-y-4">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {COPY.proofPanel.eyebrow}
          </p>
          <h2 id="pot-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {model.headline}
          </h2>
          <p className="text-sm font-medium leading-relaxed text-foreground/90 sm:text-base">{model.promise}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{COPY.proofPanel.introReceipts}</p>
          {model.source === "unlinked" ? (
            <div className="flex flex-wrap gap-2">
              <Button className="h-9 w-fit" nativeButton={false} render={<Link href="/settings" />}>
                {COPY.connect.cta}
              </Button>
              <Button variant="outline" className="h-9 w-fit" nativeButton={false} render={<Link href="/sops" />}>
                {COPY.proofPage.openStandards}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="w-full max-w-md shrink-0 space-y-2">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {COPY.proofPanel.signalMix} ({COPY.proofPanel.signals(totalSignals)})
          </p>
          <DistributionBar counts={model.bucketCounts} />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[0.65rem] text-muted-foreground">
            {BUCKET_ORDER.map((key) => (
              <li key={key}>
                <span className="font-medium text-foreground">{model.bucketCounts[key]}</span>{" "}
                {BUCKET_META[key].label.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {BUCKET_ORDER.map((bucket) => {
          const meta = BUCKET_META[bucket]
          const items = model.columns[bucket]
          return (
            <div
              key={bucket}
              className={cn("flex flex-col rounded-xl border p-4 sm:p-5", meta.borderClass)}
              aria-label={meta.label}
            >
              <h3 className={cn("text-sm font-semibold tracking-tight", meta.labelClass)}>{meta.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {items.length === 0 ? (
                  <li className="rounded-md border border-dashed border-border/60 bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
                    {COPY.proofPanel.bucketEmpty}
                  </li>
                ) : (
                  items.map((signal) => (
                    <li key={signal.id}>
                      <SignalCard signal={signal} />
                    </li>
                  ))
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
