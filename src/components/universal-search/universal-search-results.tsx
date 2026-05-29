"use client"

import Link from "next/link"
import {
  Award,
  BookOpen,
  Camera,
  GraduationCap,
  MessageCircleQuestion,
  UserRound,
  Video,
} from "lucide-react"

import type { UniversalSearchGroup, UniversalSearchKind } from "@/lib/universal-search/types"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<UniversalSearchKind, typeof BookOpen> = {
  play: BookOpen,
  training: GraduationCap,
  video: Video,
  photo: Camera,
  ask_rivet: MessageCircleQuestion,
  employee: UserRound,
  certification: Award,
}

type UniversalSearchResultsProps = {
  groups: UniversalSearchGroup[]
  onNavigate?: () => void
  className?: string
}

export function UniversalSearchResults({ groups, onNavigate, className }: UniversalSearchResultsProps) {
  if (groups.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      {groups.map((group) => {
        const Icon = KIND_ICON[group.kind]
        return (
          <section key={group.kind}>
            <h3 className="mb-1.5 flex items-center gap-1.5 px-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
              {group.label}
            </h3>
            <ul className="space-y-0.5">
              {group.results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    href={r.href}
                    onClick={onNavigate}
                    className="block rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <p className="text-sm font-medium leading-snug text-foreground">{r.title}</p>
                    {r.subtitle ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.subtitle}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
