import Link from "next/link"

import { Button } from "@/components/ui/button"

export function DevBypassAuthNotice({
  next,
  supabaseConfigured,
}: {
  next: string
  supabaseConfigured: boolean
}) {
  return (
    <div className="mb-5 space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-foreground dark:bg-amber-500/[0.08]">
      <p className="font-medium text-amber-950 dark:text-amber-100">Development mode</p>
      <p className="leading-relaxed text-muted-foreground">
        {supabaseConfigured
          ? "DEV_BYPASS_AUTH is on — the app opens without a login screen. Use the form below only if you want a real Supabase session."
          : "DEV_BYPASS_AUTH is on — you can browse the app without Supabase keys. To save a workspace or use live data, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then open /login?signin=1."}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="h-9"
        nativeButton={false}
        render={<Link href={next} />}
      >
        Open app (dev bypass)
      </Button>
    </div>
  )
}
