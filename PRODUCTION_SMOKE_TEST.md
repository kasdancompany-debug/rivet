# Production smoke test

**Purpose:** Confirm the full signup → paywall → Stripe → unlock flow works on your **deployed** environment before you charge real customers.

**Time:** ~30–40 minutes  
**Browser:** Chrome/Edge incognito (or a clean profile with no saved Rivet sessions)

**Related docs:** [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) · [docs/production-qa-checklist.md](./docs/production-qa-checklist.md)

---

## Before you start

Write these down at the top of your notes:

| Item | Your value |
|------|------------|
| Production URL | `https://________________` |
| User A email | `qa+user1@________________` |
| User B email | `qa+user2@________________` |
| Stripe mode | ☐ Test (`sk_test_…`) · ☐ Live (`sk_live_…` + `STRIPE_ALLOW_LIVE_KEYS=true`) |

**Pre-flight (2 min)**

- [ ] `DEV_BYPASS_AUTH` is **not** set on Production.
- [ ] All five billing env vars are set: `STRIPE_SECRET_KEY`, `STRIPE_RIVET_ONE_TIME_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
- [ ] `NEXT_PUBLIC_SITE_URL` matches your production origin exactly (e.g. `https://rivet-tan.vercel.app`).
- [ ] Stripe webhook endpoint points to `{NEXT_PUBLIC_SITE_URL}/api/stripe/webhook` and listens for `checkout.session.completed` (and `checkout.session.async_payment_succeeded` if listed).
- [ ] You can access email for both test accounts (inbox or `+` alias on your domain).

**Stop immediately if:** `/subscribe` shows an amber “billing not configured” banner and checkout is disabled — fix env vars and redeploy first.

---

## Steps

### 1. Create new user in incognito

- [ ] Open a **new incognito window**.
- [ ] Go to `{production URL}/signup`.
- [ ] Sign up as **User A** using your User A email and a strong password.
- [ ] **Pass:** Account is created; you are signed in or prompted for email confirmation.

---

### 2. Confirm email

- [ ] Open the confirmation email from Supabase (check spam).
- [ ] Click the confirm link.
- [ ] **Pass:** You land in the app (usually `/setup` or `/dashboard`).

> If your project skips email confirmation in dev, note that and confirm it is **enabled** in production Supabase → Authentication → Providers.

---

### 3. Complete setup

- [ ] If redirected to `/setup`, enter a **unique business name** (e.g. `QA Smoke Test Co A`).
- [ ] Submit setup.
- [ ] **Pass:** Setup completes without errors; you proceed toward onboarding.

---

### 4. Complete onboarding

- [ ] On `/onboarding`, pick an **industry template** and install the foundation pack.
- [ ] Finish the **Reality Check** step (answer the prompts and submit).
- [ ] **Pass:** Onboarding completes; you are not stuck in a redirect loop.

---

### 5. Try to access dashboard while unpaid

- [ ] In the address bar, go to `{production URL}/dashboard`.
- [ ] **Pass:** You do **not** get full paid dashboard access (you should not see a fully unlocked workspace as if you had paid).

---

### 6. Confirm redirect to `/subscribe`

- [ ] After step 5, confirm the URL is **`/subscribe`** (or you are sent there when navigating to protected routes).
- [ ] **Pass:** Subscribe page loads with “Unlock your Rivet workspace” and your User A email shown.

---

### 7. Start Stripe checkout

- [ ] On `/subscribe`, click **Continue to Stripe Checkout**.
- [ ] **Pass:** Browser redirects to **checkout.stripe.com** (not an error on the subscribe page).

> If checkout is blocked with an amber message, open `/internal/billing-check` (dev or admin email only) and verify all billing vars show **Present**.

---

### 8. Pay with Stripe test card

Use Stripe **test mode** for this step unless you intentionally run a small live charge.

| Field | Value |
|-------|--------|
| Card | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g. `12/34`) |
| CVC | Any 3 digits (e.g. `123`) |
| ZIP | Any valid format |

- [ ] Complete payment on Stripe Checkout.
- [ ] **Pass:** Stripe shows success; browser redirects back to the app.

---

### 9. Return to dashboard

- [ ] After payment, confirm you land on **`/dashboard?billing=success`** (or `/dashboard` shortly after).
- [ ] **Pass:** Dashboard loads without sending you back to `/subscribe`.

---

### 10. Confirm `rivet_purchases` row is paid

**Option A — Supabase Dashboard**

- [ ] Supabase → **Table Editor** → `rivet_purchases`.
- [ ] Find the row for User A’s workspace (`business_id` matches User A’s business).
- [ ] **Pass:** `status = paid`, `purchased_at` is set, `stripe_checkout_session_id` starts with `cs_`.

**Option B — Internal diagnostics (if configured)**

- [ ] As an admin (or in dev), open `{production URL}/internal/billing-check`.
- [ ] **Pass:** “Has paid rivet_purchases row” = **Yes**, last purchase status = **paid**.

---

### 11. Log out and back in

- [ ] Sign out (Settings or account menu → log out).
- [ ] Confirm `/dashboard` redirects to **login** when logged out.
- [ ] Sign in again as **User A**.
- [ ] **Pass:** Login succeeds without errors.

---

### 12. Confirm paid access persists

- [ ] Go to `/dashboard` — loads without `/subscribe` redirect.
- [ ] Open `/sops` — seeded templates from onboarding are visible.
- [ ] **Pass:** User A still has paid access; data from onboarding is still there.

---

### 13. Create second user

- [ ] Open a **second incognito window** (keep User A’s window open for comparison).
- [ ] Go to `{production URL}/signup` and create **User B** with your User B email.
- [ ] Confirm email → complete **setup** (different business name, e.g. `QA Smoke Test Co B`) → complete **onboarding**.

---

### 14. Confirm second user cannot see first user's data

While signed in as **User B only**:

- [ ] Open `/sops` — **must not** show User A’s business name or custom SOP titles User A created.
- [ ] Open `/issues` — **must not** show User A’s issues.
- [ ] Open `/settings` — business name should be **User B’s** workspace only.
- [ ] **Pass:** No cross-tenant data visible (RLS isolation working).

> Optional cross-check: In User A’s window, create a uniquely named SOP; confirm User B never sees that title.

---

### 15. Confirm media upload works

Signed in as **User A** (paid workspace):

- [ ] Go to `/sops/capture` (or open an existing standard from `/sops`).
- [ ] Add a **title** and **save a draft** if the form requires it before uploads.
- [ ] Upload a **small image** (JPG/PNG/WebP, under a few MB) via **Upload photos**.
- [ ] Wait for the upload to finish (no error banner).
- [ ] **Pass:** Thumbnail/preview appears in the standard’s media section.

---

### 16. Confirm webhook event shows 200 in Stripe

- [ ] Stripe Dashboard → **Developers** → **Webhooks** → select your production endpoint.
- [ ] Open **Recent deliveries** (or **Event deliveries**).
- [ ] Find the latest **`checkout.session.completed`** event from your test payment.
- [ ] **Pass:** Response code **200**, body includes `"received": true`.

> If the event shows **400** `missing_checkout_metadata`, checkout session metadata is wrong — redeploy after fixing `createCheckoutSession`.  
> If **503** `billing_not_configured` or `live_keys_blocked`, fix server env vars and redeploy.

---

## Results summary

| # | Step | Pass |
|---|------|------|
| 1 | New user in incognito | ☐ |
| 2 | Email confirmed | ☐ |
| 3 | Setup complete | ☐ |
| 4 | Onboarding complete | ☐ |
| 5 | Dashboard blocked while unpaid | ☐ |
| 6 | Redirect to `/subscribe` | ☐ |
| 7 | Stripe checkout starts | ☐ |
| 8 | Test card payment succeeds | ☐ |
| 9 | Return to dashboard | ☐ |
| 10 | `rivet_purchases.status = paid` | ☐ |
| 11 | Log out / log in | ☐ |
| 12 | Paid access persists | ☐ |
| 13 | Second user created | ☐ |
| 14 | No cross-user data leak | ☐ |
| 15 | Media upload works | ☐ |
| 16 | Stripe webhook **200** | ☐ |

**All 16 must pass** before switching to live Stripe keys or announcing paid launch.

---

## Quick troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Never redirected to `/subscribe` | Billing env incomplete → paywall off; check `/internal/billing-check` |
| Checkout button disabled (amber banner) | Missing billing env var; redeploy after fixing Vercel env |
| Paid in Stripe but still on `/subscribe` | Webhook failed — check Stripe delivery log + Vercel function logs |
| Webhook **400** missing metadata | Old deploy; ensure checkout sends `user_id` + `workspace_id` in session metadata |
| Webhook **503** | `STRIPE_WEBHOOK_SECRET`, service role key, or live-key guard misconfigured |
| User B sees User A data | **Stop launch** — RLS/migrations issue; do not go live |
| Upload fails | `standard-media` bucket missing or not private; check Supabase Storage |

---

## After a successful run

- [ ] Record date, tester name, and production URL in your launch notes.
- [ ] Keep User A/B test workspaces or delete them per your data policy.
- [ ] When ready for real charges: rotate to `sk_live_…`, live `price_…`, live webhook secret, set `STRIPE_ALLOW_LIVE_KEYS=true`, redeploy, and run this script **once more** with a real card (optional small amount) before marketing launch.
