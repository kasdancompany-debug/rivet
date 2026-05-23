# Rivet — launch checklist

Use this as the gate between “works on my machine” and **charging real money**. Check boxes when done; don’t mark a section complete on faith—verify with a second account or a clean browser profile where it matters.

**QA runbooks (internal):**

- [docs/production-qa-checklist.md](docs/production-qa-checklist.md) — full test matrix (signup, billing, RLS, media, etc.)
- [docs/pre-live-stripe-manual-test-script.md](docs/pre-live-stripe-manual-test-script.md) — ~40 min script to run **before** enabling live Stripe keys

---

## 1. Supabase production setup

- [ ] **Project**: Production Supabase project created (separate from dev/staging—not the same DB as experiments).
- [ ] **Region**: Chosen to match your customers / privacy expectations (hard to change later).
- [ ] **Migrations**: All files under `supabase/migrations/` applied to production in order (use Supabase CLI `db push` / linked project, or paste SQL in dashboard—same result, no drift).
- [ ] **`rivet_purchases`**: Table exists; `status` check and unique `stripe_checkout_session_id` present; RLS enabled (see §8).
- [ ] **`standard-media` bucket**: Bucket exists **private** (`public = false`); matches migration `20260602120000_standard_media_storage_bucket.sql`.
- [ ] **Auth**: Email provider / templates acceptable for production (magic link vs password—whatever you ship).
- [ ] **Backups / PITR**: Enabled if your risk tolerance requires it (paid tier).
- [ ] **Support access**: Document who has Dashboard access; 2FA on Supabase org accounts.

---

## 2. Environment variables

Set on **Vercel** (Production) and nowhere client-exposed except `NEXT_PUBLIC_*`.

| Variable | Where | Notes |
|----------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Production project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Anon key only—never service role in browser bundles. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Required for Stripe webhook writing `rivet_purchases`. Missing ⇒ paywall logic in code may not enforce billing the way you expect. |
| `NEXT_PUBLIC_SITE_URL` | Server (Checkout URLs) | **Exact** production origin, `https://…`, no trailing slash inconsistency vs Stripe redirects. |
| `STRIPE_SECRET_KEY` | Server | Start with `sk_test_…`; live only after §5. |
| `STRIPE_WEBHOOK_SECRET` | Server | Per **endpoint** signing secret from Stripe Dashboard (`whsec_…`). |
| `STRIPE_RIVET_ONE_TIME_PRICE_ID` | Server | One-time **Price** id (`price_…`) for the SKU you sell (e.g. $799 CAD). Wrong id ⇒ wrong charge. |
| `STRIPE_ALLOW_LIVE_KEYS` | Server | Omitted or `false` until you intentionally allow `sk_live_…` (code guards live keys). |

**Do not set in production**

- `DEV_BYPASS_AUTH` — must be unset/false; code forces bypass off when `NODE_ENV=production`, but remove the env anyway so nobody “helpfully” enables it in a preview.

**Housekeeping**

- [ ] `.env.example` in repo updated if it still mentions old subscription envs (`STRIPE_PRICE_ID`); source of truth for billing gate is `STRIPE_RIVET_ONE_TIME_PRICE_ID` + `src/lib/billing/config.ts` (`isBillingEnforced()`).
- [ ] No service role key in client code, logs, or support screenshots.

---

## 3. Vercel deployment

- [ ] **Project** linked to the correct Git repo/branch (production deploys from `main` or your release branch).
- [ ] **Production URL** matches `NEXT_PUBLIC_SITE_URL` and Supabase auth redirect allow list (§6).
- [ ] **Environment**: All vars from §2 set for **Production** (not only Preview).
- [ ] **Preview deployments**: Either same Supabase as prod (risky) or separate Supabase + separate Stripe webhook/test keys—pick one and document it.
- [ ] **Function / route**: `/api/stripe/webhook` reachable from the internet (Stripe must not get 403 from Vercel auth experiments).
- [ ] **Build**: `npm run build` clean locally; fix warnings that imply runtime failure.

---

## 4. Stripe test mode

Complete **before** live keys touch production.

- [ ] **Product & Price**: One-time Price in **CAD** (or whatever you legally advertise); amount matches marketing and Checkout.
- [ ] **Checkout**: `mode: payment`; success/cancel URLs hit your real deployed host (not localhost) when testing staging.
- [ ] **Webhook (test)**: Endpoint `https://<your-domain>/api/stripe/webhook` — events at least `checkout.session.completed` (and `checkout.session.async_payment_succeeded` if you rely on delayed methods).
- [ ] **Signing secret**: Test-mode `whsec_…` in `STRIPE_WEBHOOK_SECRET` for that endpoint.
- [ ] **Test card**: Full flow: sign up → workspace → `/subscribe` → pay → redirect → **`rivet_purchases.status = 'paid'`** for that `business_id` within a minute (refresh if needed).
- [ ] **Idempotency**: Repeat webhook delivery (Stripe retries) does not duplicate rows or corrupt `paid` state—spot-check DB.
- [ ] **Unpaid path**: User with workspace but no paid row cannot open `/dashboard`; lands on `/subscribe` (middleware).

---

## 5. Stripe live mode

Only after §4 is boringly reliable.

- [ ] **Business verification**: Stripe account able to accept live charges in your region.
- [ ] **Live Price** created; **live** Price id copied to `STRIPE_RIVET_ONE_TIME_PRICE_ID` in Vercel Production.
- [ ] **Live keys**: `STRIPE_SECRET_KEY=sk_live_…` and set `STRIPE_ALLOW_LIVE_KEYS=true` on the server **only** when you mean it (code intentionally blocks live secret without this flag).
- [ ] **Live webhook**: New endpoint (or same URL with **live** signing secret); `STRIPE_WEBHOOK_SECRET` updated to live `whsec_…` for Production.
- [ ] **Tax / receipts**: Stripe Tax or invoices configured if you promised them in copy.
- [ ] **Smoke test**: One real small charge on a card you control, then **refund from Stripe** if policy allows—confirms money path and webhook in live mode.

---

## 6. Auth redirect URLs

In **Supabase Dashboard → Authentication → URL configuration**:

- [ ] **Site URL**: Production app origin (`https://…`).
- [ ] **Redirect URLs**: Include at least:
  - `https://<prod>/auth/callback`
  - `https://<prod>/auth/callback/**` if you use query variants
  - Any preview URLs you actually use for auth, or omit previews from prod Supabase.
- [ ] **Email confirmation / magic link**: `emailRedirectTo` in app must stay on an allowed origin (signup uses `/auth/callback?next=…`—confirm that pattern is allowed).
- [ ] **Local dev**: Keep localhost redirects on a **dev** Supabase project, not production.

---

## 7. Storage bucket policies

Bucket: **`standard-media`** (private). Path layout: `{business_id}/{standard_id}/{uuid}.{ext}`.

- [ ] **Bucket exists** in production with `public = false`.
- [ ] **Policies applied**: SELECT / INSERT / UPDATE / DELETE for `authenticated` scoped to `bucket_id = 'standard-media'` and first path segment = business the user can access (see migration `20260602120000_standard_media_storage_bucket.sql`).
- [ ] **Service role**: Webhook and server actions do **not** rely on Storage RLS for admin tasks you don’t have—confirm upload path uses user session + policies, or service role only where coded.
- [ ] **CORS**: If browser ever talks to Storage directly, CORS on bucket allows your origins; if all traffic is server/API signed URLs, confirm that path still works in prod.

---

## 8. RLS verification

Goal: **no table readable or writable cross-tenant** from a normal session.

- [ ] **`rivet_purchases`**: Authenticated users can **SELECT** only via `user_can_access_business(business_id)`; inserts/updates come from **service role** in webhook only (no client insert).
- [ ] **Core tables** (`businesses`, `profiles`, `sops`, standards capture, issues, training, etc.): Spot-check in SQL editor: second user in **different** business cannot `SELECT` or `UPDATE` the first’s rows.
- [ ] **`profiles.business_id`**: User cannot point their profile at someone else’s business (if your app assumes this—verify policy + app logic).
- [ ] **Storage** (§7): Object path prefix must match RLS; try uploading with wrong `business_id` prefix—must fail.

Use Supabase “RLS policies” view + one manual JWT test if you have tooling; minimum is two real accounts and honest clicking.

---

## 9. Payment gating QA

Billing enforced when **all** of: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_RIVET_ONE_TIME_PRICE_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` are set (`isBillingEnforced()`).

- [ ] **Unpaid + workspace**: Any non-exempt app route → redirect to `/subscribe`.
- [ ] **Exempt routes**: `/setup`, `/onboarding`, `/subscribe`, `/settings`, `/login`, `/auth/*` still reachable as designed.
- [ ] **No workspace**: User not stuck in paywall before `/setup` (middleware allows setup path).
- [ ] **Paid**: After webhook `paid`, same user reaches `/dashboard` without `/subscribe` loop.
- [ ] **Read failure**: If `rivet_purchases` query errors, middleware treats as unpaid (fail closed)—ensure migration is applied so you don’t false-block paying customers.
- [ ] **Client trust**: Never grant access based on query params alone; paid state always from DB/server.

---

## 10. SOP capture QA

- [ ] **Create flow**: `/sops/capture` (and deep links) work on production build.
- [ ] **Save**: Standard persists; appears under `/sops` (or expected list).
- [ ] **Edit / view**: Open SOP detail, edit, print if you ship print—no 404.
- [ ] **Permissions**: User without business or without access cannot see others’ SOPs (§8).
- [ ] **Templates**: `/sops/templates` loads; applying a template doesn’t corrupt `business_id`.

---

## 11. Media upload QA

- [ ] **Upload**: Attach media to a standard; file lands under `standard-media/{business_id}/{standard_id}/…`.
- [ ] **View / download**: Signed URL or `/api/standard-media/[id]` path works for owner; fails for other tenant.
- [ ] **Size / type limits**: Enforced where you coded them; ugly errors replaced with human copy if you promised polish.
- [ ] **Delete** (if implemented): Object removed or orphaned per product decision; DB row consistent.

---

## 12. Dashboard QA

- [ ] **Cold load**: `/dashboard` without stale cookies; loading states acceptable.
- [ ] **Trust / degraded**: If Supabase partial failure, user sees `DashboardTrustGate` (or equivalent)—no silent blank.
- [ ] **Post-pay**: `?billing=success` shows confirmation banner once; dismiss clears to clean URL.
- [ ] **Deep links**: Sidebar routes (`/issues`, `/training`, `/interruptions`, etc.) load for paid workspace.
- [ ] **Print / export**: Any shipped export paths work in prod (timeouts, large data).

---

## 13. Legal / support pages

- [ ] **Routes live**: `/terms`, `/privacy`, `/refund-policy`, `/support` return 200 on production.
- [ ] **Footer links**: Marketing home + auth pages + 404 link to all four (or your chosen subset—must match what you advertise at checkout).
- [ ] **Email placeholder**: Replace `support@yourdomain.com` in `src/lib/legal-support-pages-content.ts` (or env-driven later) with a monitored inbox.
- [ ] **Counsel review**: Replace placeholder legal copy; remove or relax `robots: noindex` on those pages when real policies ship.
- [ ] **Checkout / emails**: Stripe receipt and product description don’t contradict `/refund-policy`.

---

## 14. Soft launch checklist

Do this with **3–5 trusted operators**, not friends-and-family only.

- [ ] **Script**: “Sign up → setup → reality check → pay (test or small live) → daily workflow you care about.”
- [ ] **Support channel**: One person watching the support inbox for 48h.
- [ ] **Rollback**: How you disable paywall fast (unset billing envs **or** feature flag—document which).
- [ ] **Monitoring**: Stripe dashboard + Supabase logs + Vercel logs for webhook 4xx/5xx.
- [ ] **Incident**: Write down “who can refund / cancel subs” and Stripe account owner.

---

## 15. Known risks (explicit)

| Risk | Mitigation |
|------|------------|
| **Placeholder legal text** | Not binding; customers may still sue. Ship counsel-reviewed terms + privacy + refund before scale. |
| **`rivet_purchases` missing / RLS wrong** | Paywall false negatives or webhook insert failures—block launch until §1/§4/§8 green. |
| **Webhook secret / URL mismatch** | Paid in Stripe, never `paid` in DB—user angry, chargebacks. Rotate secret only with deploy coordination. |
| **Service role key leak** | Full DB bypass—treat like root password; rotate if exposed. |
| **`NEXT_PUBLIC_SITE_URL` wrong** | Checkout return loops, broken `next` redirects. |
| **Preview env using prod Stripe** | Accidental live charges or polluted data—separate projects or strict env discipline. |
| **Storage path bugs** | Cross-tenant file read is a severity-1 incident—test §7/§11 with two businesses. |
| **Async payment methods** | If you ever enable methods that complete after redirect, confirm `async_payment_succeeded` handling and UX copy. |
| **Legacy `STRIPE_PRICE_ID` in docs** | Old subscription docs confuse ops—grep repo and internal runbooks. |

---

## Definition of done (charging real customers)

You are cleared to send a **live** checkout link to strangers when:

1. Production Supabase has all migrations and **verified** RLS + storage policies.  
2. Vercel Production has correct envs; **no** dev bypass; `NEXT_PUBLIC_SITE_URL` matches reality.  
3. Stripe **live** webhook delivered at least one successful event you can point to in Stripe + matching `rivet_purchases` row.  
4. Two-account QA passed for paywall, SOP capture, media, and dashboard.  
5. Legal/support pages and contact email are what you’re willing to defend in a dispute—not placeholders.

Anything above unchecked is **launch debt**—track it in an issue list with owners and dates.
