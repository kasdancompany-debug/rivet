import type { IssueLinkKind } from "@/types/database"

export type IssueLinkView = {
  id: string
  kind: IssueLinkKind
  targetId: string
  title: string
  subtitle: string | null
  href: string | null
}

export type IssueLinkPickerOptions = {
  standards: { id: string; title: string; status: string }[]
  modules: { id: string; title: string }[]
  interruptions: { id: string; summary: string; occurredAt: string }[]
  profiles: { id: string; full_name: string | null; role: string | null }[]
}
