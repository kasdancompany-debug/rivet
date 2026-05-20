/**
 * Future home of `DataRepository` — one interface, two implementations:
 * - Web: Supabase client (current)
 * - Desktop: SQLite / libsql + optional cloud sync adapter
 *
 * Do not route new features here until the interface is introduced; this file
 * anchors the seam for Tauri/Electron work.
 *
 * @see docs/architecture/desktop-local-first.md
 */
export const DATA_LAYER_PLACEHOLDER = true as const
