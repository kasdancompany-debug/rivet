import Link from "next/link"

import { formatSopCategory } from "@/lib/sops/categories"
import { dependencyLabel, importanceLabel, statusLabel } from "@/lib/sops/labels"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Tables } from "@/types/database"

function statusBadgeClass(status: Tables<"standards">["status"]) {
  switch (status) {
    case "active":
      return "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-950 dark:text-emerald-300/95"
    case "archived":
      return "border-border/80 bg-muted/50 text-muted-foreground"
    default:
      return "border-amber-500/25 bg-amber-500/[0.06] text-amber-950 dark:text-amber-300/95"
  }
}

export function SopCard({ sop }: { sop: Tables<"standards"> }) {
  const updated = new Date(sop.updated_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link href={`/sops/${sop.id}`} className="group block outline-none">
      <Card
        className={cn(
          "h-full py-0 transition-colors",
          "hover:border-border/80 hover:bg-muted/[0.2]",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2"
        )}
      >
        <CardHeader className="space-y-3 border-b border-border/50 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
              {formatSopCategory(sop.category)}
            </p>
            <Badge
              variant="outline"
              className={cn("rounded-full text-[0.65rem] font-medium", statusBadgeClass(sop.status))}
            >
              {statusLabel(sop.status)}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground group-hover:underline group-hover:decoration-border group-hover:underline-offset-4 sm:text-xl">
            {sop.title}
          </h2>
        </CardHeader>
        <CardContent className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                Importance
              </p>
              <p className="mt-0.5 font-medium text-foreground">
                {sop.importance_level}/5 · {importanceLabel(sop.importance_level)}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                Depends on you
              </p>
              <p className="mt-0.5 font-medium text-foreground">
                {sop.owner_dependency_level}/5
              </p>
              <p className="text-xs text-muted-foreground">
                {dependencyLabel(sop.owner_dependency_level)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Last updated {updated}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
