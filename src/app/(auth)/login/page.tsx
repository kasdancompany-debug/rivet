import { redirect } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"

import { DevBypassAuthNotice } from "@/components/auth/dev-bypass-auth-notice"
import { LoginForm } from "@/components/auth/login-form"
import { getSafeInternalNextPath } from "@/lib/auth/safe-next-path"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; signin?: string }>
}) {
  const { next: nextRaw, signin } = await searchParams
  const safeNext = getSafeInternalNextPath(nextRaw, "/dashboard")
  const bypass = isDevAuthBypassEnabled()
  const supabaseConfigured = isSupabaseConfigured()

  if (bypass && signin !== "1") {
    redirect(safeNext)
  }

  if (!bypass && supabaseConfigured) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect(safeNext)
  }

  return (
    <Card className="border-border/80 bg-card/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">Sign in to Rivet</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Use the email tied to your business so standards, training, and issues stay attached to the
          right operation—not a personal inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {bypass ? <DevBypassAuthNotice next={safeNext} supabaseConfigured={supabaseConfigured} /> : null}
        <Suspense
          fallback={<div className="h-48 animate-pulse rounded-lg bg-muted/40" />}
        >
          <LoginForm supabaseConfigured={supabaseConfigured} />
        </Suspense>
        <p className="text-center text-xs text-muted-foreground">
          New to Rivet?{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-xs font-medium"
            nativeButton={false}
            render={
              <Link
                href={safeNext === "/dashboard" ? "/signup" : `/signup?next=${encodeURIComponent(safeNext)}`}
              />
            }
          >
            Create an account
          </Button>
        </p>
      </CardContent>
    </Card>
  )
}
