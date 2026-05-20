/**
 * Deployment target for branching storage, sync, and licensing.
 * Web build always returns `"web"` until a desktop shell wires detection.
 *
 * @see docs/architecture/desktop-local-first.md
 */
export type DeploymentRuntime = "web" | "desktop-shell"

export function getDeploymentRuntime(): DeploymentRuntime {
  if (typeof window === "undefined") return "web"
  // Future: `__TAURI_INTERNALS__` / `window.__TAURI__`, `window.electron`, etc.
  return "web"
}
