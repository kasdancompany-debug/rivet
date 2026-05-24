/** Concrete copy for UI previews — labeled as examples, not live data. */

export const DEMO_OPENING_LINES = [
  { id: "1", text: "Safe combo verified; cash drawer baseline counted", done: true },
  { id: "2", text: "Espresso grinder dial & burr check (photo if adjusted)", done: true },
  { id: "3", text: "Pastry case temps logged — corrective action if out of band", done: false },
  { id: "4", text: "First-hour line-of-sight: floor dry, mats secure, spill kit stocked", done: false },
  { id: "5", text: "Open Things still chasing you — log anything that blocked open", done: false },
] as const

export const DEMO_QUALITY_AUDIT = [
  { check: "Espresso TDS / taste strip (house recipe)", result: "pass" as const },
  { check: "Milk steam wand purge & temp spot-check", result: "pass" as const },
  { check: "Guest recovery script posted at register", result: "watch" as const },
  { check: "86 list synced POS ↔ line", result: "pass" as const },
  { check: "Hand-wash / glove compliance (random 3 staff)", result: "fail" as const },
] as const

export const DEMO_BOTTLENECK_EXAMPLES = [
  { title: "Blast chiller cycle fault — breakfast prep delayed", severity: "High" },
  { title: "Vendor shorted dairy; subs need owner sign-off", severity: "Medium" },
  { title: "Repeat complaint: wait time >12m at peak", severity: "Medium" },
] as const

export const DEMO_TRAINING_MODULES = [
  { title: "Opening solo — bar", pct: 72 },
  { title: "Cash & safe — lead", pct: 45 },
  { title: "Guest recovery — all roles", pct: 100 },
] as const

export const DEMO_READINESS_EMPLOYEE = {
  name: "Jordan M.",
  role: "Shift lead · bar",
  aggregatePct: 68,
  badges: [
    { q: "Open alone", v: "ready_with_support" as const },
    { q: "Close alone", v: "learning" as const },
    { q: "Train others", v: "not_ready" as const },
    { q: "Handle complaints", v: "ready_with_support" as const },
  ],
}
