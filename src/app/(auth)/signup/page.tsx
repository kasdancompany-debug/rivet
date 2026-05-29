import { redirect } from "next/navigation"
import Link from "next/link"

import { SignupForm } from "@/components/auth/signup-form"
import { getSafeInternalNextPath } from "@/lib/auth/safe-next-path"
import { DevBypassAuthNotice } from "@/components/auth/dev-bypass-auth-notice"
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

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; signin?: string; email?: string }>
}) {
  const { next: nextRaw, signin, email: emailRaw } = await searchParams
  const safeNext = getSafeInternalNextPath(nextRaw, "/setup")
  const initialEmail = emailRaw?.trim() ?? ""

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
        <CardTitle className="text-xl font-semibold tracking-tight">Create your Rivet account</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Built for owner-operators moving from “you carry everything” to “the business runs on
          systems”—standards, training, and shift evidence in one calm layer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {bypass ? (
          <DevBypassAuthNotice next={safeNext} supabaseConfigured={supabaseConfigured} />
        ) : null}
        <SignupForm
          supabaseConfigured={supabaseConfigured}
          safeNext={safeNext}
          initialEmail={initialEmail}
        />
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-xs font-medium"
            nativeButton={false}
            render={
              <Link
                href={safeNext === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(safeNext)}`}
              />
            }
          >
            Sign in
          </Button>
        </p>
      </CardContent>
    </Card>
  )
}
