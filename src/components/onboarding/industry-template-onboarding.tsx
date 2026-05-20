"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"

import { installIndustryTemplateBundle } from "@/app/actions/industry-templates"
import { RIVET_INDUSTRY_CARDS } from "@/lib/industry-templates"
import type { IndustryTemplateInstallCounts, RivetIndustryTemplateId } from "@/lib/industry-templates"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Phase = "pick" | "installing" | "done"

export function IndustryTemplateOnboarding({ businessName }: { businessName: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("pick")
  const [selected, setSelected] = useState<RivetIndustryTemplateId | null>(null)
  const [counts, setCounts] = useState<IndustryTemplateInstallCounts | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function runInstall(industryId: RivetIndustryTemplateId) {
    setError(null)
    setPhase("installing")
    startTransition(async () => {
      const res = await installIndustryTemplateBundle(industryId)
      if (!res.ok) {
        setError(res.message)
        setPhase("pick")
        return
      }
      setCounts(res.counts)
      setPhase("done")
      router.refresh()
    })
  }

  function onContinueFromPick() {
    if (!selected) {
      setError("Choose the type that best matches your business.")
      return
    }
    runInstall(selected)
  }

  if (phase === "installing" || pending) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-16 text-center">
        <Loader2 className="size-10 animate-spin text-muted-foreground" aria-hidden />
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Step 2 · Install
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Installing your foundation…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Standards, training modules, and workflows for {businessName}.
          </p>
        </div>
      </div>
    )
  }

  if (phase === "done" && counts) {
    return (
      <div className="mx-auto max-w-lg space-y-8 py-6">
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Step 3 · Installed
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Your business foundation has been installed.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {businessName} is ready with a full starter library—not an empty workspace.
          </p>
        </div>

        <ul className="space-y-3 rounded-xl border border-emerald-600/20 bg-emerald-500/[0.06] px-5 py-5 dark:bg-emerald-950/20">
          <InstallLine n={counts.sops} label="SOPs added" />
          <InstallLine n={counts.trainingModules} label="training modules" />
          <InstallLine n={counts.interruptionWorkflows} label="interruption workflows" />
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="h-11 flex-1"
            onClick={() => router.push("/onboarding?phase=reality-check")}
          >
            Continue — 2 min reality check
          </Button>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 sm:flex-1")}
          >
            Skip to overview
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-28">
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Step 1 · Template
        </p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          What kind of business do you run?
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pick one—we&apos;ll preload standards, training, and workflows for{" "}
          <span className="font-medium text-foreground">{businessName}</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {RIVET_INDUSTRY_CARDS.map((card) => {
          const Icon = card.icon
          const on = selected === card.id
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setSelected(card.id)
                setError(null)
              }}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all",
                on
                  ? "border-foreground/25 bg-foreground/[0.06] shadow-sm ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "border-border/70 bg-card hover:border-foreground/15 hover:bg-muted/25"
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg border",
                  on ? "border-foreground/20 bg-background" : "border-border/60 bg-muted/40"
                )}
              >
                <Icon className="size-5 text-foreground/80" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{card.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{card.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>

      {error ? (
        <p
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl justify-end">
          <Button
            type="button"
            size="lg"
            className="h-11 min-w-[12rem] px-8"
            disabled={!selected}
            onClick={onContinueFromPick}
          >
            Install foundation
          </Button>
        </div>
      </div>
    </div>
  )
}

function InstallLine({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="font-medium text-foreground">
        {n} {label}
      </span>
    </li>
  )
}
