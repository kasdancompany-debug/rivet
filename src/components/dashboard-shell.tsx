"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { LogOut, Menu } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { COPY } from "@/lib/interface-copy"
import { Logo } from "@/components/logo"
import { UniversalSearchBar } from "@/components/universal-search/universal-search-bar"
import { RouteIntentStrip } from "@/components/route-intent-strip"
import { SidebarNav } from "@/components/sidebar-nav"
import type { NavItem } from "@/lib/nav"
import { WORKSPACE_ROLE_LABELS, type WorkspaceRole } from "@/lib/ops/workspace-role-types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function initialsFromUser(user: User) {
  const meta = user.user_metadata as { full_name?: string } | undefined
  const name = meta?.full_name?.trim() || user.email?.split("@")[0] || "?"
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function AccountMenu({ user }: { user: User }) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-11 shrink-0 rounded-full border-border/50 bg-card shadow-none"
        )}
      >
        <Avatar className="size-8 border border-border/40">
          <AvatarFallback className="bg-muted text-xs font-medium">
            {initialsFromUser(user)}
          </AvatarFallback>
        </Avatar>
        <span className="sr-only">{COPY.shell.accountMenu}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="min-w-52">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          {COPY.shell.settings}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOut className="size-4" />
          {COPY.shell.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardShell({
  user,
  hasWorkspace,
  navItems,
  workspaceRole,
  children,
}: {
  user: User
  hasWorkspace: boolean
  navItems?: NavItem[]
  workspaceRole?: WorkspaceRole
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex min-h-svh w-full bg-background">
      <aside className="sticky top-0 hidden h-svh w-[17.25rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-9 print:hidden lg:flex">
        <div className="mb-8 px-2">
          <Logo href="/dashboard" />
          <p className="mt-3 max-w-[14rem] text-[12px] leading-snug text-muted-foreground">
            {COPY.shell.tagline}
          </p>
        </div>
        <SidebarNav items={navItems} />
        <div className="mt-auto border-t border-sidebar-border pt-5">
          <p className="px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {COPY.shell.signedIn}
          </p>
          <p className="mt-1.5 truncate px-3 text-xs leading-snug text-muted-foreground">{user.email}</p>
          {workspaceRole ? (
            <p className="mt-1 truncate px-3 text-[11px] text-muted-foreground">
              {WORKSPACE_ROLE_LABELS[workspaceRole]}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md print:hidden">
          <div className="flex h-14 items-center gap-3 px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "shrink-0"
              )}
            >
              <Menu className="size-5 text-muted-foreground" />
              <span className="sr-only">{COPY.shell.openMenu}</span>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex h-[100dvh] max-h-[100dvh] w-[min(100%,20rem)] flex-col border-border/50 p-0"
            >
              <SheetHeader className="shrink-0 border-b border-border/50 px-4 py-4 text-left">
                <SheetTitle className="sr-only">{COPY.shell.navigation}</SheetTitle>
                <Logo href="/dashboard" />
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
                <SidebarNav
                  items={navItems}
                  onNavigate={() => setMobileOpen(false)}
                  scrollAreaClassName="h-full max-h-full min-h-0 flex-1 pr-2"
                />
              </div>
            </SheetContent>
          </Sheet>
          <Logo href="/dashboard" className="min-w-0 lg:hidden" />
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "rounded-full"
                )}
              >
                <Avatar className="size-8 border border-border/60">
                  <AvatarFallback className="bg-muted text-xs font-medium">
                    {initialsFromUser(user)}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">{COPY.shell.accountMenu}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  {COPY.shell.settings}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={signOut}>
                  <LogOut className="size-4" />
                  {COPY.shell.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
          {hasWorkspace ? (
            <div className="border-t border-border/40 px-4 py-2.5 lg:px-8">
              <UniversalSearchBar variant="compact" className="mx-auto w-full max-w-xl lg:max-w-2xl" />
            </div>
          ) : null}
        </header>

        <main className="flex-1 px-5 pb-28 pt-10 sm:px-8 sm:pb-24 sm:pt-12 lg:px-12 lg:pb-20 lg:pt-14 print:px-4 print:pb-6 print:pt-4">
          <div className="mx-auto w-full max-w-[68rem]">
            <div className="print:hidden">
              <RouteIntentStrip />
            </div>
            {children}
          </div>
        </main>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-30 hidden print:hidden lg:block">
        <div className="pointer-events-auto">
          <AccountMenu user={user} />
        </div>
      </div>
    </div>
  )
}
