# Rivet — production QA checklist

Internal QA reference for staging/production. Use with a **clean browser profile** (or incognito) unless a step says otherwise. Pair with the runnable script in [pre-live-stripe-manual-test-script.md](./pre-live-stripe-manual-test-script.md).

**Related:** [LAUNCH_CHECKLIST.md](../LAUNCH_CHECKLIST.md) (infra, env, RLS, legal).

---

## Before you start

| Item | Requirement |
|------|-------------|
| Target environment | Staging or production URL (not `DEV_BYPASS_AUTH`) |
| Supabase | All migrations applied; Auth redirect URLs include `https://<host>/auth/callback` |
| Billing (paywall tests) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_RIVET_ONE_TIME_PRICE_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` set — see `isBillingEnforced()` in `src/lib/billing/config.ts` |
| Stripe mode | **Test keys** (`sk_test_…`, test `price_…`, test webhook `whsec_…`) until live checklist in LAUNCH_CHECKLIST §5 |
| Two accounts | **User A** and **User B** with different emails for isolation tests |
| Stripe CLI (optional) | `stripe listen --forward-to localhost:3000/api/stripe/webhook` for local webhook debugging |

**Record for each run:** date, deploy URL, git SHA, tester name, pass/fail per section.

---

## 1. Signup

| # | Step | Expected | Pass |
|---|------|----------|------|
| 1.1 | Open `/signup` while logged out | Signup form (email + password) | ☐ |
| 1.2 | Submit with invalid email | Validation or clear error | ☐ |
| 1.3 | Submit with new valid email + strong password | Success message or redirect (see §2 if confirmation required) | ☐ |
| 1.4 | Attempt duplicate signup with same email | Sensible error (already registered) | ☐ |
| 1.5 | Confirm `DEV_BYPASS_AUTH` is **not** set in this environment | Middleware requires real session | ☐ |

**Notes:** Signup uses `emailRedirectTo` → `/auth/callback?next=/setup` when email confirmation is enabled (`src/components/auth/signup-form.tsx`).

---

## 2. Email confirmation

| # | Step | Expected | Pass |
|---|------|----------|------|
| 2.1 | Complete signup with a **new** inbox you control | “Check your email” (or immediate session if confirmations disabled in Supabase) | ☐ |
| 2.2 | Open confirmation link from email | Lands on `/auth/callback` then continues to `next` path (default `/setup`) | ☐ |
| 2.3 | Try `/login` **before** confirming (if confirmations on) | Error mentions unconfirmed email | ☐ |
| 2.4 | After confirm, sign in at `/login` | Session established; not stuck on login | ☐ |
| 2.5 | Supabase Auth → URL configuration | Production Site URL + redirect allow list include your host + `/auth/callback` | ☐ |

---

## 3. Setup (workspace link)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 3.1 | Signed-in user with **no** `profiles.business_id` visits `/dashboard` | Redirect to `/setup` | ☐ |
| 3.2 | Complete guided setup (business name, etc.) | `profiles.business_id` set; row in `businesses` | ☐ |
| 3.3 | After setup, visit `/setup` again | Allowed (billing-exempt path) | ☐ |
| 3.4 | DB check: `profiles` for user shows correct `business_id` | Matches created business | ☐ |

---

## 4. Onboarding (industry + reality check)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 4.1 | User with business but `template_installed_at` IS NULL visits `/dashboard` | Redirect to `/onboarding` | ☐ |
| 4.2 | Pick industry card and install foundation | Success UI; `businesses.template_installed_at` set; `industry_template_id` set | ☐ |
| 4.3 | After install, continue to reality check (`/onboarding?phase=reality-check`) | Wizard loads | ☐ |
| 4.4 | Complete reality check | Row in `reality_checks` for `business_id` | ☐ |
| 4.5 | Visit `/dashboard` after reality check | Overview loads (may still hit paywall if unpaid — §7) | ☐ |
| 4.6 | First-day checklist on overview (if live data) | Shows progress; dismiss works; does not block navigation | ☐ |

---

## 5. Template install (verify data)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 5.1 | `businesses.template_installed_at` | Non-null timestamp | ☐ |
| 5.2 | Standards count | At least foundation SOP count (5) for chosen vertical | ☐ |
| 5.3 | Training modules | Foundation modules present under `/training` | ☐ |
| 5.4 | `/sops` list | Starter plays visible; descriptions include “Installed from Rivet starter templates” footer | ☐ |
| 5.5 | Re-run install (if UI allows) | Idempotent — no duplicate chaos or hard error | ☐ |

---

## 6. Rivet Scan (public)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 6.1 | Logged out, open `/scan` | Scan flow loads (no auth required) | ☐ |
| 6.2 | Complete all questions with test data | Results: Owner Dependency Score, severity, cost stats, recommended fixes | ☐ |
| 6.3 | Escape Readiness block on results | Example-style panel (from scan answers), not live workspace | ☐ |
| 6.4 | Optional: submit email / save lead | Success note if configured; row in `scan_leads` (if migration applied) | ☐ |
| 6.5 | CTAs | Signup / install paths work; no auth loop on marketing routes | ☐ |
| 6.6 | Print / email actions | No console errors; mailto body reasonable | ☐ |

---

## 7. Unpaid user → `/subscribe`

Requires billing enforced (see Prerequisites).

| # | Step | Expected | Pass |
|---|------|----------|------|
| 7.1 | User A: workspace + onboarding complete, **no** `rivet_purchases` with `status = 'paid'` | — | ☐ |
| 7.2 | Visit `/dashboard`, `/sops`, `/issues`, `/training` | Redirect to `/subscribe` | ☐ |
| 7.3 | Visit `/subscribe` | Checkout CTA; signed-in email shown | ☐ |
| 7.4 | Visit `/setup`, `/onboarding`, `/settings` | Still reachable (billing-exempt) | ☐ |
| 7.5 | Visit `/login`, `/signup` | Public/auth exempt; no redirect loop | ☐ |

---

## 8. Paid user → dashboard

| # | Step | Expected | Pass |
|---|------|----------|------|
| 8.1 | From `/subscribe`, start Stripe Checkout (**test card** `4242 4242 4242 4242`) | Stripe Checkout completes | ☐ |
| 8.2 | Return URL | Lands on `/dashboard?billing=success` (or success URL from `createCheckoutSession`) | ☐ |
| 8.3 | Within ~60s, refresh `/dashboard` | Overview loads; **no** redirect to `/subscribe` | ☐ |
| 8.4 | Post-checkout banner | Shown once; dismissible | ☐ |
| 8.5 | Sidebar routes | `/sops`, `/interruptions`, `/training`, `/issues`, `/escape-plan` load | ☐ |
| 8.6 | At a glance + Escape Readiness | Tiles/panel show data (or honest empty states) | ☐ |

---

## 9. Stripe webhook → `rivet_purchases`

| # | Step | Expected | Pass |
|---|------|----------|------|
| 9.1 | Stripe Dashboard → Webhooks (test mode) | Endpoint `https://<host>/api/stripe/webhook`; events include `checkout.session.completed` | ☐ |
| 9.2 | After test payment, webhook delivery | Recent event **200** (not 4xx/5xx) | ☐ |
| 9.3 | Supabase → `rivet_purchases` | Row for User A’s `business_id`: `status = 'paid'`, `stripe_checkout_session_id` set, `purchased_at` set | ☐ |
| 9.4 | Metadata | `business_id` and user id present on Checkout session (webhook uses `metadata.business_id`, `metadata.supabase_user_id` or `client_reference_id`) | ☐ |
| 9.5 | Replay safety | Stripe “Resend” same event → still one logical paid row (unique on `stripe_checkout_session_id`) | ☐ |
| 9.6 | Wrong signature | `POST /api/stripe/webhook` without valid `stripe-signature` → **400** | ☐ |
| 9.7 | Live keys guard | Without `STRIPE_ALLOW_LIVE_KEYS`, `sk_live_…` rejected by server (503 / blocked) | ☐ |

**SQL (Supabase SQL editor):**

```sql
select id, business_id, status, amount, currency, stripe_checkout_session_id, purchased_at
from rivet_purchases
where business_id = '<user-a-business-id>'
order by created_at desc;
```

---

## 10. User A cannot see User B data (RLS / isolation)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 10.1 | User B: separate signup → setup → own business | Distinct `business_id` | ☐ |
| 10.2 | User A creates SOP + issue + interruption | Visible to A | ☐ |
| 10.3 | User B: `/sops`, `/issues`, `/interruptions` | Does **not** show A’s titles/rows | ☐ |
| 10.4 | User B: direct URL to A’s SOP id (if guessable UUID) | 404, empty, or access denied — not A’s content | ☐ |
| 10.5 | User B: Supabase client cannot `select` A’s rows (optional JWT test) | RLS blocks | ☐ |
| 10.6 | `rivet_purchases` | B cannot read A’s purchase row via anon/authenticated client | ☐ |

---

## 11. Media upload

| # | Step | Expected | Pass |
|---|------|----------|------|
| 11.1 | Paid user: `/sops/capture` or edit existing SOP | Upload control available | ☐ |
| 11.2 | Upload small image or short video (within app limits) | Progress UI; completes without error | ☐ |
| 11.3 | Storage bucket `standard-media` | Object under `{business_id}/{standard_id}/…` | ☐ |
| 11.4 | View SOP after save | Media preview/play via signed URL or API route | ☐ |
| 11.5 | User B cannot open A’s media URL / API id | Denied or broken for wrong tenant | ☐ |
| 11.6 | Oversized or wrong MIME (if tested) | Human-readable error, not silent fail | ☐ |

---

## 12. Logout / login

| # | Step | Expected | Pass |
|---|------|----------|------|
| 12.1 | Sign out from shell menu | Session cleared; protected routes redirect to `/login` | ☐ |
| 12.2 | `/dashboard` while logged out | Redirect to `/login?next=…` | ☐ |
| 12.3 | Sign in again as same user | Returns to app; data intact | ☐ |
| 12.4 | `/login?next=/subscribe` after logout | After login, lands on subscribe (safe internal path only) | ☐ |
| 12.5 | Stale tab after logout | Refresh does not show paid dashboard without login | ☐ |

---

## 13. Regression smoke (quick)

| # | Area | Pass |
|---|------|------|
| 13.1 | Marketing `/` loads; scan CTA works | ☐ |
| 13.2 | Legal routes: `/terms`, `/privacy`, `/refund-policy`, `/support` | ☐ |
| 13.3 | Log one owner interruption at `/interruptions` | ☐ |
| 13.4 | Export / settings portability card (if enabled) | ☐ |
| 13.5 | Mobile width: overview + checklist usable | ☐ |

---

## Sign-off

| Role | Name | Date | Environment | Result |
|------|------|------|-------------|--------|
| QA | | | | ☐ Pass ☐ Fail |
| Eng | | | | ☐ Pass ☐ Fail |

**Fail criteria:** Any ☐ in §7–§10 or §9.3 blocks paid launch. §6 can fail only if scan is part of your launch marketing funnel.

**After test-mode pass:** Complete [pre-live-stripe-manual-test-script.md](./pre-live-stripe-manual-test-script.md) § “Gate before live keys”, then LAUNCH_CHECKLIST §5 for live Stripe.
