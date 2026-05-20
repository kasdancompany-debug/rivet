import { Clock, ListOrdered, Sparkles } from "lucide-react"

import { formatSopCategory } from "@/lib/sops/categories"
import { INDUSTRY_PACKS } from "@/lib/sop-templates/industries"
import type { SopStarterTemplate } from "@/lib/sop-templates/types"
import { InstallTemplateButton } from "@/components/sops/install-template-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function TemplateStarterCard({ template }: { template: SopStarterTemplate }) {
  const stepPreview = template.steps[0]?.instructions.slice(0, 120)
  const preview =
    stepPreview && template.steps[0]!.instructions.length > 120
      ? `${stepPreview}…`
      : stepPreview

  const industryLabel = template.industryId
    ? INDUSTRY_PACKS.find((p) => p.id === template.industryId)?.name ?? template.industryId
    : null

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-border/60 bg-card/80 py-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-[box-shadow,transform,border-color] hover:border-border hover:shadow-[0_10px_36px_rgba(15,23,42,0.08)]"
      )}
    >
      <CardHeader className="space-y-3 border-b border-border/40 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/[0.06] text-[0.65rem] font-semibold uppercase tracking-widest text-primary"
          >
            <Sparkles className="mr-1 size-3" aria-hidden />
            {industryLabel ? `${industryLabel} pack` : "Starter system"}
          </Badge>
          <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
            {formatSopCategory(template.category)}
          </p>
        </div>
        <CardTitle className="text-lg leading-snug">{template.title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {template.shortDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ListOrdered className="size-3.5 shrink-0 opacity-70" aria-hidden />
            {template.steps.length} steps
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 shrink-0 opacity-70" aria-hidden />
            ~{template.estimated_time_minutes} min run · ~{template.walkthrough_minutes}{" "}
            min read
          </span>
        </div>
        {preview ? (
          <p className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">First step — </span>
            {preview}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto flex-col items-stretch gap-2 border-t border-border/40 px-5 py-4">
        <InstallTemplateButton templateId={template.id} className="w-full" size="lg" />
        <p className="text-center text-[0.7rem] text-muted-foreground">
          Opens in edit mode as a draft—tailor wording, times, and photos before you go live.
        </p>
      </CardFooter>
    </Card>
  )
}
