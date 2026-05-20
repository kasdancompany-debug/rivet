"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { NAV_SECTION_LABEL, mainNav } from "@/lib/nav"
import { resolveActiveNavHref } from "@/lib/route-reliability/active-nav"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export function SidebarNav({
  onNavigate,
  scrollAreaClassName,
}: {
  onNavigate?: () => void
  /** Override scroll viewport height (e.g. mobile drawer). */
  scrollAreaClassName?: string
}) {
  const pathname = usePathname()
  const items = mainNav
  const activeHref = resolveActiveNavHref(pathname, items)

  return (
    <ScrollArea className={scrollAreaClassName ?? "h-[calc(100vh-5.5rem)] pr-2"}>
      <nav className="flex flex-col gap-0.5 pb-6">
        {items.map((item, index) => {
          const active = activeHref === item.href
          const Icon = item.icon
          const prev = index > 0 ? items[index - 1] : null
          const showSectionLabel = !prev || prev.section !== item.section

          const sectionHeading = NAV_SECTION_LABEL[item.section].trim()

          return (
            <div key={item.href}>
              {showSectionLabel && sectionHeading ? (
                <p className="mb-2 mt-6 px-3 rivet-section-label first:mt-0">
                  {sectionHeading}
                </p>
              ) : null}
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-muted/70 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-[1.125rem] shrink-0",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                  strokeWidth={1.75}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            </div>
          )
        })}
      </nav>
    </ScrollArea>
  )
}
