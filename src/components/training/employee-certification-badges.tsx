import { Award } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import type { CertificationBadge } from "@/lib/training/certifications/build-views"
import { Badge } from "@/components/ui/badge"

export function EmployeeCertificationBadges({ badges }: { badges: CertificationBadge[] }) {
  if (badges.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">{COPY.certifications.profileEmpty}</p>
    )
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <li key={badge.moduleId}>
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-500/30 bg-amber-500/[0.08] px-2.5 py-1 font-normal text-foreground"
            title={COPY.certifications.badgeTitle(badge.label, badge.certifiedAt)}
          >
            <Award className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            {badge.label}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
