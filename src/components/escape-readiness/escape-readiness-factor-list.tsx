"use client"

import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import type { EscapeReadinessFactor } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

function factorBarTone(percent: number | null): string {
  if (percent == null) return "bg-muted/50"
  if (percent >= 75) return "bg-emerald-600 dark:bg-emerald-500"
  if (percent >= 50) return "bg-sky-600 dark:bg-sky-500"
  if (percent >= 35) return "bg-amber-500"
  return "bg-rose-600 dark:bg-rose-500"
}

function FactorRow({
  factor,
  dark,
  compact,
  expanded,
  onToggle,
}: {
  factor: EscapeReadinessFactor
  dark?: boolean
  compact?: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const muted = dark ? "text-zinc-500" : "text-muted-foreground"
  const body = dark ? "text-zinc-300" : "text-muted-foreground"
  const title = dark ? "text-white" : "text-foreground"
  const panelId = `escape-factor-${factor.id}`

  return (
    <li className={cn("py-1", compact && "py-0.5")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={cn(
          "w-full rounded-xl px-1 py-3 text-left transition-colors sm:px-2",
          expanded
            ? dark
              ? "bg-white/[0.04]"
              : "bg-muted/20"
            : "hover:bg-muted/10 dark:hover:bg-white/[0.03]"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <ChevronDown
              className={cn(
                "mt-0.5 size-4 shrink-0 transition-transform",
                muted,
                expanded && "rotate-180"
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", title)}>{factor.label}</p>
              <p className={cn("mt-1 text-xs leading-relaxed", body)}>{factor.hint}</p>
            </div>
          </div>
          <p className={cn("shrink-0 text-lg font-semibold tabular-nums", title)}>
            {factor.percent == null ? "—" : `${factor.percent}%`}
          </p>
        </div>
        <div
          className={cn(
            "mt-3 h-1.5 overflow-hidden rounded-full",
            dark ? "bg-white/[0.08]" : "bg-muted/60"
          )}
        >
          <div
            className={cn("h-full rounded-full transition-[width]", factorBarTone(factor.percent))}
            style={{ width: factor.percent == null ? "0%" : `${factor.percent}%` }}
            role="presentation"
          />
        </div>
      </button>

      {expanded ? (
        <div
          id={panelId}
          className={cn(
            "mx-1 mb-2 rounded-xl border px-3 py-3 sm:mx-2 sm:px-4 sm:py-4",
            dark ? "border-white/[0.08] bg-black/20" : "border-border/60 bg-background/80"
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>
                What&apos;s complete
              </p>
              {factor.detail.whatsComplete.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {factor.detail.whatsComplete.map((line) => (
                    <li key={line} className="flex gap-2 text-sm leading-relaxed">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      <span className={body}>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn("mt-2 text-sm", body)}>Nothing scored yet—start with the suggested action below.</p>
              )}
            </div>
            <div>
              <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>
                What&apos;s missing
              </p>
              <ul className="mt-2 space-y-1.5">
                {factor.detail.whatsMissing.map((line) => (
                  <li key={line} className="flex gap-2 text-sm leading-relaxed">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    <span className={body}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className={cn(
              "mt-4 rounded-lg border px-3 py-3",
              dark ? "border-white/[0.06] bg-white/[0.03]" : "border-border/50 bg-muted/15"
            )}
          >
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", muted)}>
              Suggested action
            </p>
            <p className={cn("mt-1.5 text-sm leading-relaxed", body)}>{factor.detail.suggestedAction}</p>
          </div>

          <div className="mt-4">
            <Link
              href={factor.detail.fixCta.href}
              className={cn(buttonVariants({ size: "sm" }), "inline-flex w-full sm:w-auto")}
            >
              {factor.detail.fixCta.label}
            </Link>
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function EscapeReadinessFactorList({
  factors,
  dark = false,
  compact = false,
  className,
}: {
  factors: EscapeReadinessFactor[]
  dark?: boolean
  compact?: boolean
  className?: string
}) {
  const [expandedId, setExpandedId] = useState<EscapeReadinessFactor["id"] | null>(null)
  const muted = dark ? "text-zinc-500" : "text-muted-foreground"

  return (
    <div className={className}>
      <p className={cn("px-1 text-[11px] font-medium uppercase tracking-[0.08em]", muted, compact ? "px-0" : "sm:px-2")}>
        Readiness factors · tap to expand
      </p>
      <ul className="mt-2 list-none divide-y divide-border/40 p-0 dark:divide-white/[0.08]">
        {factors.map((factor) => (
          <FactorRow
            key={factor.id}
            factor={factor}
            dark={dark}
            compact={compact}
            expanded={expandedId === factor.id}
            onToggle={() => setExpandedId((current) => (current === factor.id ? null : factor.id))}
          />
        ))}
      </ul>
    </div>
  )
}
