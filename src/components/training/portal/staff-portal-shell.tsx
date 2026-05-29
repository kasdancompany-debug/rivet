"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Award, BookOpen, GraduationCap, Home, MessageCircleQuestion } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

const PORTAL_RESERVED = new Set(["training", "ask", "plays", "certifications", "join"])

function isPortalTrainingPath(pathname: string): boolean {
  if (pathname === "/learn/training") return true
  if (!pathname.startsWith("/learn/")) return false
  const segment = pathname.slice("/learn/".length).split("/")[0]
  return Boolean(segment && !PORTAL_RESERVED.has(segment))
}

const TABS = [
  { href: "/learn", label: COPY.staffPortal.navHome, icon: Home, match: (p: string) => p === "/learn" },
  {
    href: "/learn/training",
    label: COPY.staffPortal.navTrain,
    icon: GraduationCap,
    match: (p: string) => isPortalTrainingPath(p),
  },
  {
    href: "/learn/ask",
    label: COPY.staffPortal.navAsk,
    icon: MessageCircleQuestion,
    match: (p: string) => p.startsWith("/learn/ask"),
  },
  {
    href: "/learn/plays",
    label: COPY.staffPortal.navPlays,
    icon: BookOpen,
    match: (p: string) => p.startsWith("/learn/plays"),
  },
  {
    href: "/learn/certifications",
    label: COPY.staffPortal.navCerts,
    icon: Award,
    match: (p: string) => p.startsWith("/learn/certifications"),
  },
] as const

export function StaffPortalNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md supports-[backdrop-filter]:bg-background/88"
      aria-label={COPY.staffPortal.navAria}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          const Icon = tab.icon
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex min-h-[3.35rem] flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[0.58rem] font-medium leading-tight transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon
                  className={cn("size-[1.35rem]", active && "stroke-[2.5]")}
                  aria-hidden
                />
                <span className="max-w-[4.5rem] truncate">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function StaffPortalShell({
  children,
  businessName,
  title,
  subtitle,
  hideNav = false,
}: {
  children: React.ReactNode
  businessName?: string
  title?: string
  subtitle?: string
  /** Hide bottom tab bar for focused flows (module player, play reader). */
  hideNav?: boolean
}) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/92 backdrop-blur-md print:hidden">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3.5">
          <Link href="/learn" className="min-w-0 flex-1">
            {title ? (
              <div>
                <p className="truncate text-base font-semibold text-foreground">{title}</p>
                {subtitle ? (
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                ) : businessName ? (
                  <p className="truncate text-xs text-muted-foreground">{businessName}</p>
                ) : null}
              </div>
            ) : (
              <div>
                <p className="text-base font-bold tracking-tight text-foreground">
                  {COPY.staffPortal.brandTitle}
                </p>
                {businessName ? (
                  <p className="truncate text-xs text-muted-foreground">{businessName}</p>
                ) : null}
              </div>
            )}
          </Link>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-lg flex-1 px-4 py-5", hideNav ? "pb-8" : "pb-[5.5rem]")}>
        {children}
      </main>
      {!hideNav ? <StaffPortalNav /> : null}
    </div>
  )
}
