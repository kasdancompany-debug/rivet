"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { mapAuthErrorToMessage } from "@/lib/auth/error-messages"
import { getSafeInternalNextPath } from "@/lib/auth/safe-next-path"
import {
  isSupabaseConfiguredClient,
  supabaseNotConfiguredMessage,
} from "@/lib/supabase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({ supabaseConfigured }: { supabaseConfigured?: boolean }) {
  const searchParams = useSearchParams()
  const next = getSafeInternalNextPath(searchParams.get("next"), "/dashboard")
  const configured = supabaseConfigured ?? isSupabaseConfiguredClient()

  const urlError = useMemo(() => {
    switch (searchParams.get("error")) {
      case "auth":
        return "That sign-in link is invalid or has expired."
      case "missing_config":
        return supabaseNotConfiguredMessage(true)
      case "invalid_invite":
        return "That invite link is invalid or has expired."
      default:
        return null
    }
  }, [searchParams])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(
    configured ? null : supabaseNotConfiguredMessage(true)
  )
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!configured) {
      setError(supabaseNotConfiguredMessage(true))
      return
    }
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signError) {
        setError(mapAuthErrorToMessage(signError.message))
        return
      }
      // Full navigation so session cookies are sent on the next request (middleware + RSC).
      window.location.assign(next)
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const banner = error ?? urlError

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {banner ? (
        <p
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {banner}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!configured}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={!configured}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
        />
      </div>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={loading || !configured}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
