"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { mapAuthErrorToMessage } from "@/lib/auth/error-messages"
import { isSupabaseConfiguredClient } from "@/lib/supabase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MISSING_SUPABASE_MSG =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart npm run dev."

export function SignupForm({ supabaseConfigured }: { supabaseConfigured?: boolean }) {
  const configured = supabaseConfigured ?? isSupabaseConfiguredClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(configured ? null : MISSING_SUPABASE_MSG)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const origin =
        typeof window !== "undefined" ? window.location.origin : ""
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/setup")}`,
        },
      })
      if (signError) {
        setError(mapAuthErrorToMessage(signError.message))
        return
      }
      if (data.session) {
        window.location.assign("/setup")
        return
      }
      setInfo("Check your email to confirm your account, then sign in.")
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <p
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {info}{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="signup-email">Work email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!configured}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@bakery.co"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={!configured}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters. Use a unique passphrase for this account.
        </p>
      </div>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={loading || !configured}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  )
}
