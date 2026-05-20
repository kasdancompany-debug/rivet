import { withIndustry } from "./_helpers"

export const SERVICE_INDUSTRY_TEMPLATES = withIndustry("service", [
  {
    id: "ind-svc-day-start",
    title: "Service business — day start & dispatch",
    shortDescription:
      "Truck stock, job pack PDF, access codes, and first client text so techs do not improvise scope.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 30,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Job pack QA",
        instructions:
          "Scope, photos, hazards, parts on truck vs BOM; if mismatch, call dispatch before leaving yard.",
      },
      {
        title: "PPE & tools",
        instructions:
          "Task-specific PPE on body; lockout kit if electrical; ladders inspected sticker current.",
      },
      {
        title: "Client ping",
        instructions:
          "Approved “on the way” template with ETA window—no personal cell unless on-call rotation says so.",
      },
    ],
  },
  {
    id: "ind-svc-day-end",
    title: "Service business — day end & truck close",
    shortDescription:
      "Photos uploaded, parts used logged, haz waste tagged, and truck ready for tomorrow’s first job.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 35,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Job close-out in app",
        instructions:
          "Before/after photos, materials list, customer sign where required—no “I’ll upload tomorrow.”",
      },
      {
        title: "Haz & batteries",
        instructions:
          "Used bulbs/batteries in sealed haz bin; MSDS accessible; spills neutralized per sheet.",
      },
      {
        title: "Truck restock",
        instructions:
          "Par list tick; low flags to warehouse; lock box and inventory seal if policy uses.",
      },
    ],
  },
  {
    id: "ind-svc-deliverable-qa",
    title: "Service deliverable QA — what “done” means",
    shortDescription:
      "Checklist tied to trade: HVAC, plumbing, IT—so callbacks are rare and documented.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 28,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Functional test",
        instructions:
          "Run system through load case in SOP; log readings; photo serial plates if warranty applies.",
      },
      {
        title: "Customer education",
        instructions:
          "Show filter reset, breaker map, or maintenance app—customer initials “trained” line if required.",
      },
      {
        title: "Warranty packet",
        instructions:
          "Stickers, registration QR, and what is not covered—never verbal-only warranty.",
      },
    ],
  },
  {
    id: "ind-svc-client-comms",
    title: "Service client comms — upsells, delays, tough news",
    shortDescription:
      "Change-order script, delay notice, and “not safe to continue” language that protects the tech.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 20,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Change orders",
        instructions:
          "Written addendum before extra work; photo of hidden condition; customer sign or decline—no handshake scope.",
      },
      {
        title: "Delay",
        instructions:
          "Dispatch sends delay template; tech does not promise return time dispatch cannot resource.",
      },
      {
        title: "Stop work",
        instructions:
          "If unsafe or out of license class: stop, explain, document—owner loop same day for path.",
      },
    ],
  },
  {
    id: "ind-svc-shadow-week",
    title: "Service tech — shadow week",
    shortDescription:
      "Ride-along rules, first solo job cap, and when they touch gas or electrical.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 200,
    walkthrough_minutes: 11,
    steps: [
      {
        title: "Days 1–3 ride only",
        instructions:
          "Tools staged by coach; tech narrates safety checks aloud.",
      },
      {
        title: "Days 4–5 assisted primary",
        instructions:
          "Tech leads with coach silent unless safety—coach signs daily card.",
      },
      {
        title: "License gate",
        instructions:
          "No regulated work solo until license copy on file + lead sign.",
      },
    ],
  },
  {
    id: "ind-svc-escalation-scope",
    title: "Service escalation — RFI, injury, property damage",
    shortDescription:
      "Stop-work triggers and who talks to the customer about money.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 22,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Property damage",
        instructions:
          "Photos before move; do not fix cosmetically to hide; owner if structural or >threshold.",
      },
      {
        title: "Injury",
        instructions:
          "911 if needed; WSIB/OSHA style reporting per locale; truck secured before scene chaos.",
      },
      {
        title: "Scope fight",
        instructions:
          "Dispatch + lead only on price; tech stays factual on what was found—no DMs with customer.",
      },
    ],
  },
  {
    id: "ind-svc-role-lead-tech",
    title: "Service roles — apprentice, tech, lead, dispatch",
    shortDescription:
      "Who owns truck stock counts and who approves overtime on a job.",
    category: "training",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 18,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Tech",
        instructions:
          "Executes SOP, photos, notes—does not discount labor without lead.",
      },
      {
        title: "Lead",
        instructions:
          "Quality sign-off, coach, second eyes on high-risk tasks—owns truck audit weekly.",
      },
      {
        title: "Dispatch",
        instructions:
          "Owns schedule truth, parts orders, customer money talk pre-approval—tech stays in field.",
      },
    ],
  },
  {
    id: "ind-svc-truck-tool-readiness",
    title: "Service truck & tool readiness checklist",
    shortDescription:
      "Morning once-over: fluids, tires, ladder rack, and specialty tools for today’s ticket mix.",
    category: "inventory",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 12,
    walkthrough_minutes: 5,
    steps: [
      {
        title: "Vehicle",
        instructions:
          "Tire tread quick check, lights, registration copy in cab, first aid kit sealed.",
      },
      {
        title: "Job-specific tools",
        instructions:
          "Leak detector, gauges, laptop dongle—if missing, swap trucks before leaving, do not “make do.”",
      },
    ],
  },
  {
    id: "ind-svc-parts-run",
    title: "Parts run mid-day",
    shortDescription: "Keep techs billing instead of driving without a plan.",
    category: "inventory",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 20,
    walkthrough_minutes: 5,
    steps: [
      { title: "Batch", instructions: "Dispatch batches parts runs by zone; tech confirms ETA before leaving site." },
    ],
  },
  {
    id: "ind-svc-no-access",
    title: "No-access service call",
    shortDescription: "Document, fee, and reschedule without owner texting every homeowner.",
    category: "customer_experience",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 10,
    walkthrough_minutes: 3,
    steps: [
      { title: "Document", instructions: "Photo door, time stamp, call attempt logged; fee per policy card." },
    ],
  },
  {
    id: "ind-svc-warranty-call",
    title: "Warranty callback",
    shortDescription: "Separate warranty RO from billable work.",
    category: "operations",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 15,
    walkthrough_minutes: 4,
    steps: [
      { title: "Verify", instructions: "Confirm warranty window and prior RO; manager approves free return visit." },
    ],
  },
  {
    id: "ind-svc-safety-stop",
    title: "Field safety stop",
    shortDescription: "Gas leak, electrical, or structural—stop and escalate.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 10,
    walkthrough_minutes: 3,
    steps: [
      { title: "Stop work", instructions: "Tag out, evacuate if needed, call utility or owner per emergency card." },
    ],
  },
])
