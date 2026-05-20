import { withIndustry } from "./_helpers"

export const CONTRACTOR_INDUSTRY_TEMPLATES = withIndustry("contractors", [
  {
    id: "ind-contract-site-start",
    title: "Contractor site start — safety, scope, permits",
    shortDescription:
      "JSAs, permit board, utility locates, and homeowner walk—before noise or dust starts.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 40,
    walkthrough_minutes: 11,
    steps: [
      {
        title: "Permit & signage",
        instructions:
          "Permit card posted; parking cones; neighbor notice if HOA requires; emergency contacts on board.",
      },
      {
        title: "Utilities & lockout",
        instructions:
          "Locate ticket valid today; lockout/tagout if panel work; photo unknown wires before touch.",
      },
      {
        title: "JSA with crew",
        instructions:
          "Each trade line on hazards; PPE check; escape paths; who owns fire extinguisher station.",
      },
      {
        title: "Homeowner scope read",
        instructions:
          "Walk areas in/out of scope; photo existing damage; sign daily access window—no verbal add-ons.",
      },
    ],
  },
  {
    id: "ind-contract-site-secure",
    title: "Contractor site secure — tools, temp power, lock-up",
    shortDescription:
      "So the house does not sit open and the client does not find your extension cord in the rain.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 35,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Tool cage & inventory",
        instructions:
          "High-value tools caged or off-site; quick inventory against list—flag losses before tomorrow’s start.",
      },
      {
        title: "Temp power & dust",
        instructions:
          "Temp lights down safely; plastic barriers taped; dehumidifiers on schedule if drying phase.",
      },
      {
        title: "Lock-up",
        instructions:
          "Windows/doors; if client keeps key, log who has copy; set alarm if installed phase allows.",
      },
    ],
  },
  {
    id: "ind-contract-workmanship-qa",
    title: "Contractor workmanship QA — level, plumb, finish",
    shortDescription:
      "Trade-specific tolerances and who signs punch before invoice.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 30,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "Rough-in photos",
        instructions:
          "Before close walls: plumbing slope, nail plate, wire stapling—photo set per spec sheet.",
      },
      {
        title: "Finish tolerance",
        instructions:
          "Reveal lines, caulk joints, paint holidays checked with light rake—foreman initials pass.",
      },
      {
        title: "Punch discipline",
        instructions:
          "Owner/client punch within 48h of milestone; fixes scheduled—not “we’ll catch it later.”",
      },
    ],
  },
  {
    id: "ind-contract-homeowner-comms",
    title: "Contractor homeowner comms — dust, noise, kids, pets",
    shortDescription:
      "Daily text rhythm and change-order clarity so trust does not erode mid-job.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 20,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Daily update template",
        instructions:
          "What happened, what’s next, any noise tomorrow before 8—use approved template only.",
      },
      {
        title: "Change orders",
        instructions:
          "Written CO with price/time impact; homeowner sign before work proceeds—no “while we’re here” without it.",
      },
      {
        title: "Kids/pets",
        instructions:
          "Barriers and off-limits zones; if unsafe, stop and reschedule supervised access.",
      },
    ],
  },
  {
    id: "ind-contract-probation-week",
    title: "Contractor new hire — probation week on site",
    shortDescription:
      "PPE, ladder rules, and when they are allowed on a roof or in a trench.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 200,
    walkthrough_minutes: 11,
    steps: [
      {
        title: "Days 1–2 ground only",
        instructions:
          "Material handling, sweep, demo bag-out under eyes—no heights.",
      },
      {
        title: "Days 3–4 assisted heights",
        instructions:
          "100% tie-off coaching; tool tethering; stop if guardrail missing—foreman owns fix.",
      },
      {
        title: "Trench & excavation gate",
        instructions:
          "No entry without protective system class + competent person on site per regulation.",
      },
    ],
  },
  {
    id: "ind-contract-escalation-rfi",
    title: "Contractor escalation — RFI, stop-work, injury",
    shortDescription:
      "When to issue RFI vs pick up the phone to the owner—same shift, not next Monday.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 22,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Unknown condition",
        instructions:
          "Stop in place of conflict; photo + RFI; do not bury in extra work—owner if schedule risk.",
      },
      {
        title: "Injury",
        instructions:
          "911 if required; scene safe; preserve PPE as evidence if failed; report to authority per law.",
      },
      {
        title: "Neighbor dispute",
        instructions:
          "Foreman only; de-escalate; document; owner if legal threat—crew does not argue property lines.",
      },
    ],
  },
  {
    id: "ind-contract-roles-crew",
    title: "Contractor roles — apprentice, journeyman, foreman, PM",
    shortDescription:
      "Who can sign daily logs and who talks to inspectors alone.",
    category: "training",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 20,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Apprentice / laborer",
        instructions:
          "Tasks on card only; no directing subs; stop if instruction conflicts with safety.",
      },
      {
        title: "Foreman",
        instructions:
          "Crew assignments, quality first pass, inspector walk-along—signs daily log.",
      },
      {
        title: "PM / owner",
        instructions:
          "Schedule, COs, lien waivers, owner-only pricing on change—foreman escalates, does not discount.",
      },
    ],
  },
  {
    id: "ind-contract-eod-site-audit",
    title: "Contractor end-of-day site audit",
    shortDescription:
      "Trip hazards, nails, combustibles, and client dog paths—before you drive away.",
    category: "cleaning",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 14,
    walkthrough_minutes: 6,
    steps: [
      {
        title: "Nail sweep & magnet",
        instructions:
          "High-traffic paths and driveway; magnet roll on demo days.",
      },
      {
        title: "Combustibles",
        instructions:
          "Sawdust bags sealed; solvents in fire cabinet; no rags in closed buckets unless metal can rule followed.",
      },
      {
        title: "Client path",
        instructions:
          "Stairs usable; handrail secure; temp lighting on if night work tomorrow.",
      },
    ],
  },
  {
    id: "ind-contract-weather-stop",
    title: "Weather stop-work",
    shortDescription: "When ice, lightning, or heat index pauses the site.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 10,
    walkthrough_minutes: 3,
    steps: [
      { title: "Stop", instructions: "Secure tools, cover openings, notify homeowner and PM with photo." },
    ],
  },
  {
    id: "ind-contract-material-shortage",
    title: "Material shortage on site",
    shortDescription: "No silent day lost—escalate before crew idles.",
    category: "inventory",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 15,
    walkthrough_minutes: 4,
    steps: [
      { title: "Log", instructions: "Note SKU, qty, and impact on schedule; PM orders or pivots task same day." },
    ],
  },
  {
    id: "ind-contract-change-order",
    title: "Field change order capture",
    shortDescription: "Scope changes signed before extra work.",
    category: "operations",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 20,
    walkthrough_minutes: 5,
    steps: [
      { title: "Document", instructions: "Photo, description, price band from sheet; homeowner sign or stop work." },
    ],
  },
  {
    id: "ind-contract-sub-vendor",
    title: "Subcontractor check-in",
    shortDescription: "Insurance, scope, and site rules before they start.",
    category: "onboarding",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 25,
    walkthrough_minutes: 6,
    steps: [
      { title: "Verify", instructions: "COI on file, scope card signed, safety orientation logged." },
    ],
  },
])
