import { withIndustry } from "./_helpers"

export const CLEANING_INDUSTRY_TEMPLATES = withIndustry("cleaning", [
  {
    id: "ind-clean-opening-dispatch",
    title: "Cleaning crew — morning dispatch & keys",
    shortDescription:
      "Route sheet, chemical lockout, key control, and first-site arrival without improvising scope.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 30,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Van inventory & SDS",
        instructions:
          "Vacuum bags, mop heads, color-coded cloths present; SDS book in van; spill kit sealed; log any missing item before leaving yard.",
      },
      {
        title: "Key control",
        instructions:
          "Sign keys out in book or app; no photos of codes; return same day unless overnight route approved by lead.",
      },
      {
        title: "Route order & time boxes",
        instructions:
          "Optimize for access windows; if client window missed, notify dispatch before entering—no silent overruns.",
      },
      {
        title: "Scope read per site",
        instructions:
          "Open work order: rooms included, exclusions, chemicals allowed on surfaces—if mismatch, stop and call dispatch before spraying.",
      },
    ],
  },
  {
    id: "ind-clean-closing-van",
    title: "Cleaning crew — van close & chemical lock",
    shortDescription:
      "Soak tools, empty vacs, restock par, and lock chemicals—ready for tomorrow’s first job.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 35,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Tool soak & dry",
        instructions:
          "Mop heads and cloths laundered or bagged for wash; scrubbers rinsed; no damp closed tubs overnight—mildew is a rework.",
      },
      {
        title: "Chemical inventory",
        instructions:
          "Seal concentrates; secondary containment intact; empty bottles disposed per WHMIS/local rule—photo if anything leaked.",
      },
      {
        title: "Keys & client fobs",
        instructions:
          "All keys returned and initialed; fobs in Faraday pouch if policy requires—never leave in cupholder overnight.",
      },
      {
        title: "Restock par from warehouse list",
        instructions:
          "Mark low-stock flags for dispatch; note anything back-ordered so morning crew does not discover at first site.",
      },
    ],
  },
  {
    id: "ind-clean-quality-signoff",
    title: "Cleaning quality — touch-point & visual standard",
    shortDescription:
      "What “pass” looks like on bathrooms, kitchens, and offices—before photos go to the client.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 22,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "High-touch order",
        instructions:
          "Lightswitches, handles, rails, remotes, appliance fronts—wipe direction consistent, no streak on glass at knee height check.",
      },
      {
        title: "Floors & edges",
        instructions:
          "Corners and baseboards free of hair/debris; no mop lines on dark tile—dry buff if needed.",
      },
      {
        title: "Odour truth",
        instructions:
          "Bins empty, liners fresh; if odour persists, find source—do not mask with heavy fragrance on client request sites.",
      },
      {
        title: "Photo pack",
        instructions:
          "Required angles per work order; if client dispute later, photos timestamp before lock-up—lead reviews before upload.",
      },
    ],
  },
  {
    id: "ind-clean-client-touchpoints",
    title: "Cleaning client comms — access, pets, alarms",
    shortDescription:
      "Text tone, alarm codes, and pet rules so your crew does not learn on the doorstep.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 18,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Arrival text template",
        instructions:
          "“[Company] arriving in 10 at [address]. On-site lead [name].” Use approved template only—no personal numbers.",
      },
      {
        title: "Pets & access",
        instructions:
          "If dog home: crate or closed room per client note; if not documented, do not enter until client confirms.",
      },
      {
        title: "Alarm false-alarm prevention",
        instructions:
          "Disarm sequence on file; if alarm trips, follow client script and dispatch policy—document time and code used.",
      },
    ],
  },
  {
    id: "ind-clean-first-week-tech",
    title: "Cleaning new tech — first week on route",
    shortDescription:
      "Shadow days, solo limits, and when they are allowed to carry keys.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 200,
    walkthrough_minutes: 11,
    steps: [
      {
        title: "Days 1–2 shadow",
        instructions:
          "Observe only: chemicals, vacuums, client boundaries—no solo key sites.",
      },
      {
        title: "Days 3–4 assisted cleans",
        instructions:
          "Lead assigns rooms; tech signs each room checklist; corrections voiced immediately, not saved for “end of week.”",
      },
      {
        title: "Day 5 solo lite",
        instructions:
          "Residential lite only if lead signs off; commercial or alarmed sites wait until week two.",
      },
    ],
  },
  {
    id: "ind-clean-escalation-ladder",
    title: "Cleaning escalation — damage, complaints, unsafe site",
    shortDescription:
      "Broken item, missed scope fight, or hoarding—who stops work and who calls the owner.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 20,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Damage on site",
        instructions:
          "Photo before touch; do not admit fault on scene; notify dispatch; owner if >$policy or injury—preserve evidence.",
      },
      {
        title: "Client scope argument",
        instructions:
          "Refer to signed work order; offer paid add-on path; lead escalates if raised voices or recording—crew stays professional.",
      },
      {
        title: "Unsafe conditions",
        instructions:
          "Needles, pests, structural hazard: stop work, seal area, leave site, call dispatch + owner—no heroics.",
      },
    ],
  },
  {
    id: "ind-clean-roles-crews",
    title: "Cleaning roles — tech, lead, dispatch",
    shortDescription:
      "Who reroutes the day when a job runs long and who talks money with clients.",
    category: "training",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 18,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Tech",
        instructions:
          "Executes checklist, photos, notes—does not negotiate price or scope without lead on phone.",
      },
      {
        title: "Lead",
        instructions:
          "Quality sign-off, key sites, coach corrections, first client de-escalation—cash upsells only if on rate card.",
      },
      {
        title: "Dispatch",
        instructions:
          "Owns route changes, client comms on delays, and owner ping if legal/safety—crew does not thread DMs around dispatch.",
      },
    ],
  },
  {
    id: "ind-clean-site-exit-checklist",
    title: "Cleaning site exit — lock, lights, alarm, photos",
    shortDescription:
      "Last five minutes so you never get the 10 p.m. “door unlocked” text.",
    category: "inventory",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 12,
    walkthrough_minutes: 5,
    steps: [
      {
        title: "Windows & doors",
        instructions:
          "Perimeter check; secondary exits; patio—photo of locked handle if client requires proof pack.",
      },
      {
        title: "Lights & climate",
        instructions:
          "Restore thermostat to client note; all lights off except agreed night lights.",
      },
      {
        title: "Alarm arm",
        instructions:
          "Walk final arm sequence; if fail, stay on phone with client or monitoring—never leave ambiguous.",
      },
    ],
  },
  {
    id: "ind-clean-supply-restock",
    title: "Van supply restock",
    shortDescription: "Par levels before routes so crews do not improvise chemicals on site.",
    category: "inventory",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 20,
    walkthrough_minutes: 5,
    steps: [
      { title: "Par check", instructions: "Count against van par sheet; flag low stock to warehouse before dispatch." },
      { title: "SDS & labels", instructions: "Every bottle labeled; SDS binder current in van pocket." },
    ],
  },
  {
    id: "ind-clean-key-audit",
    title: "Client key audit",
    shortDescription: "Keys tagged, logged, and returned—no mystery rings.",
    category: "operations",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 15,
    walkthrough_minutes: 4,
    steps: [
      { title: "Sign out", instructions: "Key log initials, site, time out; photo of key tag if new client." },
      { title: "Return", instructions: "Same-day return to lockbox; manager notified if key not back by route end." },
    ],
  },
  {
    id: "ind-clean-weather-delay",
    title: "Weather delay client comms",
    shortDescription: "Proactive message when ice or storms shift the route.",
    category: "customer_experience",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 10,
    walkthrough_minutes: 3,
    steps: [
      { title: "Notify", instructions: "Use delay template before window closes; offer reschedule slots from dispatch." },
    ],
  },
  {
    id: "ind-clean-new-site-walk",
    title: "New site walk-through",
    shortDescription: "Scope, hazards, and client hot buttons before first clean.",
    category: "onboarding",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 30,
    walkthrough_minutes: 8,
    steps: [
      { title: "Scope photos", instructions: "Photo every room on scope list; note surfaces and exclusions." },
      { title: "Client rules", instructions: "Alarm, pets, chemicals banned, and contact path on site card." },
    ],
  },
])
