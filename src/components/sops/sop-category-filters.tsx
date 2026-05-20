import Link from "next/link"

import { LEGACY_SOP_CATEGORY_OPTIONS, SOP_CATEGORIES } from "@/lib/sops/categories"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function SopCategoryFilters({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!active ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-9 rounded-full px-4",
          !active ? "" : "border-border/80 bg-background/80"
        )}
        nativeButton={false}
        render={<Link href="/sops" />}
      >
        All
      </Button>
      {[...SOP_CATEGORIES, ...LEGACY_SOP_CATEGORY_OPTIONS].map((c) => (
        <Button
          key={c.value}
          variant={active === c.value ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 rounded-full px-4",
            active === c.value ? "" : "border-border/80 bg-background/80"
          )}
          nativeButton={false}
          render={<Link href={`/sops?category=${encodeURIComponent(c.value)}`} />}
        >
          {c.label}
        </Button>
      ))}
    </div>
  )
}
