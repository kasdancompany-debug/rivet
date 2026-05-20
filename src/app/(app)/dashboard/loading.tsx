export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10 sm:px-6">
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-28 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-28 animate-pulse rounded-lg bg-muted/50" />
      </div>
      <div className="h-36 animate-pulse rounded-xl bg-muted/40" />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border/40 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse bg-card" />
        ))}
      </div>
    </div>
  )
}
