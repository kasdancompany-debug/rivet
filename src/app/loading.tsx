import { Skeleton } from "@/components/ui/skeleton"

/** Default route loading — segment `loading.tsx` files override this where defined. */
export default function RootLoading() {
  return (
    <div
      className="flex min-h-svh flex-col bg-background px-4 py-12 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
