"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Building2 } from "lucide-react"

import { createWorkspaceForCurrentUser } from "@/app/actions/workspace"
import { COPY } from "@/lib/interface-copy"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Props = {
  /**
   * False when the browser has no Supabase session cookie (common with DEV_BYPASS_AUTH).
   * Server actions cannot run as your user until you sign in for real.
   */
  sessionReady: boolean
  /** Shown when sessionReady is false — set from server (bypass vs generic). */
  noSessionExplanation: string
}

export function WorkspaceSetupCard({ sessionReady, noSessionExplanation }: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createWorkspaceForCurrentUser(name)
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <Card className="mt-8 border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground">
            <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{COPY.settingsWorkspace.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {COPY.settingsWorkspace.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {!sessionReady ? (
        <CardContent className="space-y-4 border-t border-border/50 pt-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{noSessionExplanation}</p>
          <Link href="/login" className={cn(buttonVariants({ variant: "default" }), "inline-flex h-10 items-center px-4")}>
            {COPY.settingsWorkspace.signInToContinue}
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="workspace-name">{COPY.settingsWorkspace.nameLabel}</Label>
              <Input
                id="workspace-name"
                name="businessName"
                autoComplete="organization"
                placeholder={COPY.settingsWorkspace.namePlaceholder}
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                required
                minLength={2}
                maxLength={120}
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">{COPY.settingsWorkspace.nameHelper}</p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 pt-6">
            <Button type="submit" disabled={pending}>
              {pending ? COPY.settingsWorkspace.working : COPY.settingsWorkspace.submit}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
