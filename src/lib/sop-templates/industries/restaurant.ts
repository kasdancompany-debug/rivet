import { compactSop } from "./_compact"
import { withIndustry } from "./_helpers"

export const RESTAURANT_INDUSTRY_TEMPLATES = withIndustry("restaurant", [
  compactSop(
    "ind-restaurant-opening",
    "Restaurant opening — dining room & kitchen",
    "Lights, line check, reservation board, and first-cover readiness.",
    "opening",
    [
      { title: "Building & safety", instructions: "Disarm, lights on, walk floor for hazards, verify hood and gas per startup card." },
      { title: "Kitchen line check", instructions: "Walk-in temps logged, prep list posted, proteins dated, fryer oil tested if applicable." },
      { title: "FOH setup", instructions: "Tables set to spec, POS open, reservation system matches physical book, 86 board blank or updated." },
    ],
    { importance: 5, ownerDep: 4, minutes: 50 }
  ),
  compactSop(
    "ind-restaurant-closing",
    "Restaurant closing — cash, kitchen, secure",
    "Last seating through alarm: shutdown, cash, and food safety close.",
    "closing",
    [
      { title: "Kitchen shutdown", instructions: "Cooling logs, line breakdown, hood off per schedule, trash out, floors sanitized." },
      { title: "Cash & tips", instructions: "Close POS, server checkout, tip pool documented, variances flagged before anyone leaves." },
      { title: "Secure", instructions: "Doors locked, alcohol secured, alarm set, only manager key for late vendor." },
    ],
    { importance: 5, ownerDep: 4, minutes: 60 }
  ),
  compactSop(
    "ind-restaurant-dining-quality",
    "Dining room quality standard",
    "Table touch, pacing, and recovery when service drifts.",
    "quality",
    [
      { title: "Table touch rhythm", instructions: "Water, check-back after first bite, clear before dessert—use floor chart zones." },
      { title: "Recovery script", instructions: "Listen, fix fast, manager comp per card, log on shift notes for repeat issues." },
    ]
  ),
  compactSop(
    "ind-restaurant-guest-recovery",
    "Guest complaint & recovery",
    "De-escalate, fix, and document without owner as default answer.",
    "guest_experience",
    [
      { title: "Hear & repeat", instructions: "Repeat the issue in plain language; never argue with the table." },
      { title: "Fix & follow-up", instructions: "Offer remedy from recovery menu; manager initials on log if comp exceeds threshold." },
    ]
  ),
  compactSop(
    "ind-restaurant-server-week-one",
    "Server week one — floor basics",
    "Shadow sections, sidework, and POS competence before solo tables.",
    "onboarding",
    [
      { title: "Shadow shifts", instructions: "Minimum two peak shadows with checklist signed by trainer." },
      { title: "Sidework mastery", instructions: "Roll silver, stock stations, and run one mock close with trainer sign-off." },
    ]
  ),
  compactSop(
    "ind-restaurant-escalation",
    "Incident escalation ladder",
    "When to pull the manager vs owner for safety, comps, and walkouts.",
    "escalation",
    [
      { title: "Manager first", instructions: "Allergen uncertainty, intoxicated guest, kitchen delay >20 min—manager owns first response." },
      { title: "Owner triggers", instructions: "Injury, threat, health inspector on site, or cash shortage over policy limit." },
    ]
  ),
  compactSop(
    "ind-restaurant-roles",
    "FOH & BOH role expectations",
    "Who owns expo, who runs the door, and how handoffs work.",
    "roles",
    [
      { title: "Shift lead", instructions: "Runs pre-shift, assigns sidework, approves comps to limit, communicates 86 to FOH." },
      { title: "Expo / door", instructions: "Expo owns ticket timing; host owns wait list and quote times—no double ownership." },
    ]
  ),
  compactSop(
    "ind-restaurant-midshift-audit",
    "Mid-service floor audit",
    "Peak reset: sanitizer, bus tubs, and line-of-sight before the rush.",
    "cleaning",
    [
      { title: "Sanitizer & stations", instructions: "Test strips, refill bus tubs, reset expo with clean towels." },
      { title: "Guest path", instructions: "Clear paths, high chairs stable, restrooms checked on cadence card." },
    ]
  ),
  compactSop(
    "ind-restaurant-reservation-overflow",
    "Reservation overflow & wait list",
    "Quote times, pacing kitchen, and no silent overbooks.",
    "operations",
    [
      { title: "Wait quotes", instructions: "Use quote chart; update guests every 10 minutes; offer bar wait area." },
      { title: "Kitchen pacing", instructions: "Expo confirms fire times with kitchen before seating large parties." },
    ]
  ),
  compactSop(
    "ind-restaurant-walk-in-temp",
    "Walk-in & holding temps",
    "Log, correct, and discard—no guessing on protein safety.",
    "quality",
    [
      { title: "Log temps", instructions: "AM/PM log on walk-in and hot holding; photo if out of band." },
      { title: "Corrective action", instructions: "Move product, re-check in 30 min, discard if still out of spec—initial every step." },
    ]
  ),
  compactSop(
    "ind-restaurant-bar-spill",
    "Bar spill & slip response",
    "Guest-safe cleanup and incident note when alcohol hits the floor.",
    "operations",
    [
      { title: "Cone & dry", instructions: "Block area, dry mop, sanitizer pass, reopen only when dry." },
      { title: "Incident", instructions: "If guest injured, manager + incident form—do not admit fault on the floor." },
    ]
  ),
  compactSop(
    "ind-restaurant-takeout-handoff",
    "Takeout & delivery handoff",
    "Bag labels, seals, and hot/cold separation before driver pickup.",
    "guest_experience",
    [
      { title: "Label check", instructions: "Name, time, items, utensils, allergy flags on every bag." },
      { title: "Seal & temp", instructions: "Sticker seal intact; hot and cold separated; log late pickups." },
    ]
  ),
])
