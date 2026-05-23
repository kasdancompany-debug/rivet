# Pre–live Stripe manual test script

**Time:** ~35–45 minutes  
**Mode:** Stripe **test** keys only (`sk_test_…`, test `price_…`, test webhook secret)  
**Browser:** One clean profile (incognito). Keep a second profile ready for § “Two-user isolation” (5 min).

Full checklist detail: [production-qa-checklist.md](./production-qa-checklist.md).

---

## Setup (2 min)

1. Confirm deploy URL: `https://________________` (write it down).
2. Confirm env on that deploy:
   - `NEXT_PUBLIC_SITE_URL` = same origin
   - `DEV_BYPASS_AUTH` **unset**
   - All five billing vars set (see `.env.example` / `isBillingEnforced()`)
3. Open Stripe Dashboard → **Test mode** → Webhooks → latest `checkout.session.completed` should be empty before you start.

**Stop if** paywall never appears when you expect it — billing env is misconfigured.

---

## Path A — New owner (25 min)

Use a **fresh email** you have never used on Rivet: `qa+test1@________________`

| Step | Do this | Pass? |
|------|---------|-------|
| A1 | `/signup` → create account | ☐ |
| A2 | Confirm email if Supabase requires it → land on `/setup` | ☐ |
| A3 | Complete **setup** (business name) | ☐ |
| A4 | **Onboarding:** pick industry → install templates → finish **reality check** | ☐ |
| A5 | Try `/dashboard` → should redirect to **`/subscribe`** (unpaid) | ☐ |
| A6 | **`/subscribe`** → “Continue to Stripe Checkout” | ☐ |
| A7 | Pay with test card **`4242 4242 4242 4242`**, any future expiry, any CVC | ☐ |
| A8 | Return to app → **`/dashboard`** loads (not subscribe loop) | ☐ |
| A9 | **Supabase** → `rivet_purchases` → one row, `status = paid` for your `business_id` | ☐ |
| A10 | **Stripe** → Webhook → last event **200** for `checkout.session.completed` | ☐ |
| A11 | Overview: first-day checklist visible → complete or **dismiss** | ☐ |
| A12 | `/sops/capture` → save one short procedure (your words, not only templates) | ☐ |
| A13 | `/interruptions` → log **one** interruption | ☐ |
| A14 | Scroll to **Escape Readiness** on overview (or `/escape-plan`) | ☐ |
| A15 | `/sops/capture` → **upload** one small image to a standard → preview works | ☐ |
| A16 | **Sign out** → `/dashboard` sends you to login → **sign in** again → data still there | ☐ |

**Optional public path (3 min):** Logged out → `/scan` → finish → results + Escape panel → no login required.

---

## Path B — Second user isolation (5 min)

Fresh email: `qa+test2@________________`

| Step | Do this | Pass? |
|------|---------|-------|
| B1 | Signup → setup → onboarding (can skip pay if you want faster test) | ☐ |
| B2 | Open `/sops` and `/issues` | ☐ |
| B3 | **Must not** see User A’s business name, SOP titles, or issues | ☐ |

*(If B skips pay, that’s fine — isolation is about data, not billing.)*

---

## Quick results table

| Area | Pass |
|------|------|
| Signup + email confirm | ☐ |
| Setup + onboarding + templates | ☐ |
| Scan (public) | ☐ |
| Unpaid → `/subscribe` | ☐ |
| Paid → `/dashboard` | ☐ |
| Webhook → `rivet_purchases.paid` | ☐ |
| User A ≠ User B data | ☐ |
| Media upload | ☐ |
| Logout / login | ☐ |

**All must be ☐ checked before live Stripe.**

---

## Gate before live keys

Do **not** flip to live until:

- [ ] Path A steps A1–A16 pass on **production** (or release) URL with **test** Stripe.
- [ ] Path B passes.
- [ ] [production-qa-checklist.md](./production-qa-checklist.md) §7–§10 reviewed; no open Sev-1.
- [ ] [LAUNCH_CHECKLIST.md](../LAUNCH_CHECKLIST.md) §1–§4 and §6–§8 complete.
- [ ] You have a **live** webhook endpoint and **live** `whsec_…` ready but **not** deployed until deliberate cutover.
- [ ] `STRIPE_ALLOW_LIVE_KEYS=true` only when you intentionally deploy `sk_live_…`.
- [ ] One controlled **live** micro-charge plan documented (who refunds, which Stripe account).

---

## Live cutover (after gate — not part of test script)

1. Create **live** Price; set `STRIPE_RIVET_ONE_TIME_PRICE_ID` in Vercel **Production**.
2. Replace `STRIPE_SECRET_KEY` with `sk_live_…`; set `STRIPE_ALLOW_LIVE_KEYS=true`.
3. Update `STRIPE_WEBHOOK_SECRET` to **live** endpoint signing secret.
4. Run **one** real charge on a card you control; verify `rivet_purchases` + dashboard access.
5. Refund from Stripe if policy allows; note in support runbook.

---

## Troubleshooting cheatsheet

| Symptom | Likely cause |
|---------|----------------|
| Paid in Stripe, still `/subscribe` | Webhook 4xx/5xx, wrong `whsec_`, or missing `SUPABASE_SERVICE_ROLE_KEY` |
| Webhook 503 `billing_not_configured` | Missing Stripe or service role env on server |
| Webhook 503 `live_keys_blocked` | `sk_live_` without `STRIPE_ALLOW_LIVE_KEYS` |
| Email link loops or 404 | Supabase redirect URLs / `NEXT_PUBLIC_SITE_URL` mismatch |
| Always on dashboard without pay | Billing not enforced (missing one of five env vars) |
| Upload fails | `standard-media` bucket or RLS policies missing in Supabase |

---

*Tester: ________________  Date: ________________  Deploy SHA: ________________*
