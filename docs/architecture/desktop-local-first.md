# Desktop packaging & local-first (architecture)

This document records **decisions and seams** for a future downloadable Rivet client (Tauri or Electron).  
The **current product remains a Supabase-backed web app**; nothing here requires migrating off cloud yet.

## 1. Runtime shell (Tauri vs Electron)

| Option | Notes |
|--------|--------|
| **Tauri** | Smaller binaries, Rust sidecar for file/DB access, strong fit for “local vault + optional sync.” |
| **Electron** | Mature ecosystem; heavier; same JS bundle as today with a `preload` bridge. |

**Decision:** Keep **Next.js UI in the browser layer** of the shell. The shell’s job is: secure storage, file pickers, optional SQLite, auto-update, and (later) license checks—not re‑implementing React routes.

**Code seam:** `src/lib/platform/runtime.ts` — central place to branch `web` vs `desktop` when we add detection (`__TAURI__`, `process.versions.electron`).

## 2. Data layer abstraction (Supabase today, local-first later)

**Today:** All persistence goes through Supabase clients (`src/lib/supabase/*`) and RLS.

**Later:** Introduce a thin **`DataRepository`** interface (names only for now; no full migration):

- `getSession()`, `getBusiness()`, `querySops()`, `mutateIssue()`, etc.
- **Web implementation:** delegates to Supabase (current code paths).
- **Desktop implementation:** SQLite (or libsql) + same JSON shapes as export where possible.

**Decision:** **Export format (`founderos.business_export` v1)** is the **contract** between cloud and local: a full import should be able to hydrate a blank local DB. Schema version bumps when tables break compatibility.

## 3. Backup / export file format

- **`format`:** `founderos.business_export` (stable string ID).
- **`schemaVersion`:** integer; bump when adding/removing/renaming export sections.
- **`exportedAt`:** ISO-8601 UTC.
- **`business`:** single `businesses` row (by `id`).
- **`dataset`:** keyed sections mirroring logical tables (`profiles`, `sops`, `sop_steps`, …).

**Not included in v1 (document explicitly):**

- Large binaries (e.g. future SOP attachment blobs) — add `mediaManifest` + sidecar files in a future **`.founderos` bundle** (zip with `manifest.json` + `media/*`).
- Auth secrets, Supabase service keys, refresh tokens.

**Encryption (future):** Optional password-wrapped export (AES-GCM) for desktop; web export stays **plain JSON over HTTPS** unless we add client-side encryption.

## 4. Export / import flows

| Flow | Web (now) | Desktop (later) |
|------|-----------|-----------------|
| Export | `GET /api/export/business-data` → JSON download | Same builder; write via Tauri `save` dialog |
| Import | Placeholder UI + future `POST` / file drop | Validate schema → transactional SQLite apply + id remap |

**Id remapping:** Imports into a **new** business must regenerate UUIDs and rewrite foreign keys (`sop_id`, `plan_id`, …). Keep a deterministic `idMap` in memory during import (documented in import spec when built).

## 5. Offline SOP access

**Decision:** Offline is **read-optimized**: ship the last exported **SOP + steps** (and optional rendered HTML/Markdown snapshot) into local storage. Writes queue until online or explicit “sync.”

**Future:** “Offline pack” sub-object inside export or a derived `sop_snapshots[]` with denormalized steps for fast mobile/offline render without joining.

## 6. Optional cloud sync (later)

**Model:** Local DB is **source of truth** on device; cloud is **optional remote** with last-write-wins or version vectors per row (to be chosen when sync ships).

**Seams:** `sync_state` table (local) with `{ entity, id, rev, deleted_at }`; push/pull adapters for Supabase REST or Edge Functions.

**Not in scope now** — only hooks and docs.

## 7. License key activation (later)

**Decision:** Desktop builds gate **write** features (or full app) on activation; web stays subscription/auth as today.

**Seam:** `src/lib/platform/licensing.ts` (stub) — `assertLicensed()` no-op on web; on desktop calls shell IPC.

**Privacy:** License checks should avoid PII; machine id + product sku only.

## 8. Security & RLS

- Web export uses **session + RLS** — only rows visible to the user are exportable.
- Desktop must re‑apply **equivalent authorization** locally (role-based) — document parity matrix when `DataRepository` lands.
