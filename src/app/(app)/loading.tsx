import { Skeleton } from "@/components/ui/skeleton"

export default function AppLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-10"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  )
}
