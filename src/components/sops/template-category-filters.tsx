import Link from "next/link"

import { formatSopCategory, SOP_CATEGORIES, type SopCategoryValue } from "@/lib/sops/categories"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  active: SopCategoryValue | undefined
  /** If set, only these category chips are shown (plus “All”). */
  categoriesInOrder?: SopCategoryValue[]
  /** Preserve `?industry=` when switching category. */
  industryParam?: string
}

function templatesHref(opts: { category?: string; industry?: string }) {
  const p = new URLSearchParams()
  if (opts.industry) p.set("industry", opts.industry)
  if (opts.category) p.set("category", opts.category)
  const q = p.toString()
  return q ? `/sops/templates?${q}` : "/sops/templates"
}

export function TemplateCategoryFilters({ active, categoriesInOrder, industryParam }: Props) {
  const chips =
    categoriesInOrder?.map((value) => ({
      value,
      label: formatSopCategory(value),
    })) ?? SOP_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={active ? "outline" : "default"}
        className={cn(!active && "shadow-sm")}
        nativeButton={false}
        render={<Link href={templatesHref({ industry: industryParam })} />}
      >
        All templates
      </Button>
      {chips.map((c) => (
        <Button
          key={c.value}
          size="sm"
          variant={active === c.value ? "default" : "outline"}
          className={cn(active === c.value && "shadow-sm")}
          nativeButton={false}
          render={
            <Link href={templatesHref({ category: c.value, industry: industryParam })} />
          }
        >
          {c.label}
        </Button>
      ))}
    </div>
  )
}
