import { labelForOwnerInterruptionKind } from "@/lib/owner-interruptions/kinds"
import { labelForIssueLinkKind } from "@/lib/issues/links/constants"
import type { IssueLinkView } from "@/lib/issues/links/types"
import type { IssueLinkKind, Tables } from "@/types/database"

export type IssueLinkResolveContext = {
  standards: Pick<Tables<"standards">, "id" | "title" | "status">[]
  modules: Pick<Tables<"training_modules">, "id" | "title">[]
  interruptions: Pick<Tables<"owner_interruptions">, "id" | "summary" | "kind" | "occurred_at">[]
  profiles: { id: string; full_name: string | null; role: string | null }[]
}

function resolveOne(
  link: Pick<Tables<"issue_links">, "id" | "kind" | "target_id">,
  ctx: IssueLinkResolveContext
): IssueLinkView {
  const base = {
    id: link.id,
    kind: link.kind,
    targetId: link.target_id,
  }

  switch (link.kind) {
    case "standard": {
      const s = ctx.standards.find((row) => row.id === link.target_id)
      return {
        ...base,
        title: s?.title ?? "Removed SOP",
        subtitle: s ? s.status.replace(/_/g, " ") : labelForIssueLinkKind("standard"),
        href: s ? `/sops/${s.id}` : null,
      }
    }
    case "training_module": {
      const m = ctx.modules.find((row) => row.id === link.target_id)
      return {
        ...base,
        title: m?.title ?? "Removed module",
        subtitle: labelForIssueLinkKind("training_module"),
        href: m ? `/training/modules/${m.id}` : null,
      }
    }
    case "owner_interruption": {
      const row = ctx.interruptions.find((r) => r.id === link.target_id)
      return {
        ...base,
        title: row?.summary ?? "Removed owner pull",
        subtitle: row ? labelForOwnerInterruptionKind(row.kind) : labelForIssueLinkKind("owner_interruption"),
        href: row ? "/interruptions" : null,
      }
    }
    case "staff_member": {
      const p = ctx.profiles.find((row) => row.id === link.target_id)
      const name = p?.full_name?.trim() || "Team member"
      return {
        ...base,
        title: name,
        subtitle: p?.role ?? labelForIssueLinkKind("staff_member"),
        href: p ? "/training" : null,
      }
    }
    default: {
      const kind = link.kind as IssueLinkKind
      return {
        ...base,
        kind,
        title: "Unknown link",
        subtitle: labelForIssueLinkKind(kind),
        href: null,
      }
    }
  }
}

export function resolveIssueLinks(
  links: Pick<Tables<"issue_links">, "id" | "bottleneck_id" | "kind" | "target_id">[],
  ctx: IssueLinkResolveContext
): IssueLinkView[] {
  return links.map((link) => resolveOne(link, ctx))
}

export function resolveIssueLinksByBottleneck(
  links: Pick<Tables<"issue_links">, "id" | "bottleneck_id" | "kind" | "target_id">[],
  ctx: IssueLinkResolveContext
): Map<string, IssueLinkView[]> {
  const byId = new Map<string, IssueLinkView[]>()
  for (const link of links) {
    const view = resolveOne(link, ctx)
    const list = byId.get(link.bottleneck_id) ?? []
    list.push(view)
    byId.set(link.bottleneck_id, list)
  }
  return byId
}
