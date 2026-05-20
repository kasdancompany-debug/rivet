import { RouteReliabilityDebug } from "@/components/route-reliability/route-reliability-debug"
import type { RouteFetchLine } from "@/lib/route-reliability/types"

/**
 * Wraps dashboard page content and attaches a dev-only diagnostics panel.
 * Prevents “silent blank” pages by making fetch health visible during development.
 */
export function DashboardRouteShell({
  routePath,
  fetchLines = [],
  children,
}: {
  routePath: string
  fetchLines?: RouteFetchLine[]
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <RouteReliabilityDebug routePath={routePath} fetchLines={fetchLines} />
    </>
  )
}
