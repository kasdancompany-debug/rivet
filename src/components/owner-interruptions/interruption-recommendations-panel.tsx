import Link from "next/link"
import { ArrowRight, BookOpen, GraduationCap, MessageCircleQuestion, Plus, Video } from "lucide-react"

import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export function InterruptionRecommendationsPanel({
  plan,
}: {
  plan: InterruptionActionPlanView
}) {
  const { recommendations, repeatCount } = plan
  const items: { icon: typeof BookOpen; label: string; show: boolean; href?: string }[] = [
    {
      icon: BookOpen,
      label: plan.relatedStandard
        ? COPY.interruptions.recMatchedPlay(plan.relatedStandard.title)
        : COPY.interruptions.recCreatePlay,
      show: true,
      href: plan.relatedStandard
        ? plan.relatedStandard.status === "draft"
          ? `/sops/capture/${plan.relatedStandard.id}`
          : `/sops/${plan.relatedStandard.id}`
        : plan.draftEditHref ?? "/sops/capture",
    },
    {
      icon: Video,
      label: COPY.interruptions.recAddMedia,
      show: recommendations.suggestMedia,
      href: plan.relatedStandard
        ? plan.relatedStandard.status === "draft"
          ? `/sops/capture/${plan.relatedStandard.id}`
          : `/sops/${plan.relatedStandard.id}`
        : plan.draftEditHref ?? "/sops/capture",
    },
    {
      icon: GraduationCap,
      label: plan.relatedModule
        ? COPY.interruptions.recMatchedTraining(plan.relatedModule.title)
        : COPY.interruptions.recAssignTraining(repeatCount),
      show: recommendations.suggestTraining,
      href: plan.relatedModule
        ? `/training/modules/${plan.relatedModule.id}`
        : plan.draftModuleId
          ? `/training/modules/${plan.draftModuleId}`
          : "/training/modules/new",
    },
    {
      icon: MessageCircleQuestion,
      label:
        plan.askMatchCount > 0
          ? COPY.interruptions.recAskRivetMatch(plan.askMatchCount)
          : COPY.interruptions.recAskRivet,
      show: recommendations.suggestAskRivet,
      href: "/ask",
    },
  ].filter((item) => item.show)

  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {COPY.interruptions.recTitle}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const content = (
            <>
              <Icon className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">{item.label}</span>
              {item.href ? (
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <Plus className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </>
          )
          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/80 px-3 py-2.5",
                    "transition-colors hover:border-primary/30 hover:bg-background"
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
