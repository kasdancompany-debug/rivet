# Rivet v1 — product scope (authoritative)

Everything in the shipped app must map to one of these capabilities. Anything else is out of scope for v1 and must not appear in navigation or as a routable surface.

## In scope (15)

1. **Auth** — Email/password sign-in and sign-up; session via Supabase; `/auth/callback` for email links.
2. **Business workspace** — Create/link a business for the signed-in user (`/settings` workspace card; `profiles.business_id` + `businesses`).
3. **Reality check** — Owner onboarding wizard and persistence to `dependency_assessments` (`/onboarding`).
4. **Overview / Rivet Index** — Executive dashboard with live Rivet Index and owner-load signals (`/dashboard`).
5. **How the business runs** — Standards library: list, filters, starter templates, new SOP (`/sops`, `/sops/templates`, `/sops/new`).
6. **Capture a standard** — Standards capture pipeline with structured intake (`/sops/capture`).
7. **Standard detail & edit** — View and edit a single SOP (`/sops/[id]`, `/sops/[id]/edit`).
8. **Media upload** — Photos/videos for standards via Supabase Storage (`sop-media` bucket) from capture (and linked URLs in steps).
9. **Team readiness basics** — Training modules, assignments, progress (`/training`, module routes under `/training/...`).
10. **Owner interruptions** — Log and review owner pulls (`/interruptions`, `/interruptions/log`).
11. **Bottlenecks** — Issues list and detail (`/issues`, `/issues/new`, `/issues/[id]`).
12. **Path off your plate** — Owner escape plan journey (`/escape-plan`).
13. **Settings** — Workspace, account context, data export (`/settings`; API `/api/export/business-data`).
14. **SOP export / print** — Print-friendly layout and Markdown download on the standard detail page.
15. **Stripe payment gating** — When `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, and `SUPABASE_SERVICE_ROLE_KEY` are set, only users with an **active** or **trialing** subscription (see `profiles.subscription_status`) may use the app beyond `/subscribe` and `/settings`. Checkout lives at `/subscribe`.

## Explicitly out of scope for v1 (removed from nav / redirected)

- **Execution proof** full-page board (`/proof-of-transfer`) — superseded by Overview signals; no standalone route.
- **Shift / daily execution UI** (`/operations`) — not in v1; daily-run data may still exist in the database from earlier builds but there is no product surface.
- **Team roster page** (`/team`) — not in v1.
- **Outside read / coach** (`/coach`) — not in v1.

Legacy URLs above redirect to `/dashboard` via `next.config.ts`.

## Marketing

Landing and public scan flows (`/`, `/scan`) remain for acquisition only; they are not part of the authenticated v1 app scope.
