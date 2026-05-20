"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { INDUSTRY_PACKS } from "@/lib/sop-templates/industries"
import type { IndustryId } from "@/lib/sop-templates/types"
import { cn } from "@/lib/utils"

export function TemplateIndustryTabs({
  activeIndustry,
}: {
  activeIndustry: IndustryId | "legacy" | "all" | undefined
}) {
  const searchParams = useSearchParams()
  const category = searchParams.get("category")

  function hrefForIndustry(id: IndustryId | "legacy" | "all") {
    const p = new URLSearchParams()
    if (id !== "all") {
      p.set("industry", id)
    }
    if (category) p.set("category", category)
    const q = p.toString()
    return q ? `/sops/templates?${q}` : "/sops/templates"
  }

  const current = activeIndustry ?? "all"

  const tabs: { id: IndustryId | "legacy" | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "legacy", label: "Classic starters" },
    ...INDUSTRY_PACKS.map((pack) => ({ id: pack.id, label: pack.name })),
  ]

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Industry">
      {tabs.map((t) => {
        const on = current === t.id
        return (
          <Link
            key={t.id}
            href={hrefForIndustry(t.id)}
            scroll={false}
            role="tab"
            aria-selected={on}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              on
                ? "border-foreground/25 bg-foreground/[0.07] text-foreground"
                : "border-border/70 bg-card text-muted-foreground hover:border-foreground/15 hover:bg-muted/40"
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
