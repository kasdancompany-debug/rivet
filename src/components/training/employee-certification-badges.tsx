import { COPY } from "@/lib/interface-copy"
import type { CertificationBadge } from "@/lib/training/certifications/build-views"
import { CertificationBadgeTile } from "@/components/training/certification-badge-tile"

export function EmployeeCertificationBadges({
  badges,
  hrefForModule,
  layout = "tiles",
}: {
  badges: CertificationBadge[]
  /** When set, each badge links to its certificate page. */
  hrefForModule?: (moduleId: string) => string
  layout?: "tiles" | "compact"
}) {
  if (badges.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">{COPY.certifications.profileEmpty}</p>
    )
  }

  if (layout === "compact") {
    return (
      <ul className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <li key={badge.moduleId} className="max-w-[11rem] flex-1">
            <CertificationBadgeTile
              badge={badge}
              href={hrefForModule?.(badge.moduleId)}
              className="min-h-[4.5rem] py-2.5"
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {badges.map((badge) => (
        <li key={badge.moduleId}>
          <CertificationBadgeTile badge={badge} href={hrefForModule?.(badge.moduleId)} />
        </li>
      ))}
    </ul>
  )
}
