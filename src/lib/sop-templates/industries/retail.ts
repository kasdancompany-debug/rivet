import { withIndustry } from "./_helpers"

export const RETAIL_INDUSTRY_TEMPLATES = withIndustry("retail", [
  {
    id: "ind-retail-store-open",
    title: "Retail store open — lights, float, floor, POS",
    shortDescription:
      "Opening counts, promo integrity, fitting rooms, and theft-prone zones before first sale.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 35,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Alarm & perimeter",
        instructions:
          "Disarm, quick perimeter walk, check for overnight break signs, then lock vestibule to traffic pattern.",
      },
      {
        title: "Registers & float",
        instructions:
          "Two-person float if policy; test scanners/card readers; receipt paper; promo codes active for today’s campaign.",
      },
      {
        title: "Floor & fitting rooms",
        instructions:
          "Size cubes stocked; hangers uniform; fitting room max items sign correct; 6” rule on folded tables per visual guide.",
      },
      {
        title: "High-shrink unlock",
        instructions:
          "Electronics/fragrance cases keyed per schedule; count sheet initialed when opened.",
      },
    ],
  },
  {
    id: "ind-retail-store-close",
    title: "Retail store close — pulls, z-rail, secure",
    shortDescription:
      "Deposits, returns audit, fitting room sweep, and no cash in drawers overnight.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 45,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "Returns & fraud flags",
        instructions:
          "Receipt match; manager code on no-receipt over threshold; note patterns for LP channel.",
      },
      {
        title: "Cash pulls & safe",
        instructions:
          "Pulls at scheduled bands; excess to safe; drawers left with opening baseline only.",
      },
      {
        title: "Floor sweep",
        instructions:
          "Fitting rooms empty; hangers recovered; strays back to zone; mannequins dressed to planogram photo.",
      },
      {
        title: "Secure",
        instructions:
          "Gates down; lights; alarm; no bags staged near exit “for morning”—looks like grab-and-go to cameras.",
      },
    ],
  },
  {
    id: "ind-retail-floor-quality",
    title: "Retail floor quality — signage, pricing, damages",
    shortDescription:
      "What “floor ready” means so markdowns are intentional not accidental.",
    category: "inventory",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 22,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Price integrity",
        instructions:
          "Shelf label matches gun; promo stack matches corporate file; mismatches fixed before doors.",
      },
      {
        title: "Damages",
        instructions:
          "Defective log with SKU photo; RTV bin separated; no sellable mixed with destroy.",
      },
      {
        title: "Visual props",
        instructions:
          "Signage straight; no safety trip on stacks; clearance zone capped height per fire rule.",
      },
    ],
  },
  {
    id: "ind-retail-service-floor",
    title: "Retail floor service — approach, carry, recovery",
    shortDescription:
      "Guest approach that respects browsing and a recovery script for sold-out hype SKUs.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 18,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Approach",
        instructions:
          "30-second rule after eye contact; open question; if “just looking,” offer water and zone map—no hover.",
      },
      {
        title: "Sold-out hype item",
        instructions:
          "Honest ETA or waitlist; never bait-switch to higher margin without guest opt-in.",
      },
      {
        title: "Line at cash",
        instructions:
          "Call for backup at 3+ waiting; single queue if policy says so—no side cutting.",
      },
    ],
  },
  {
    id: "ind-retail-hire-week-one",
    title: "Retail associate — week one",
    shortDescription:
      "Shadow sells, LP basics, and when they can run a register alone.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 160,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "Days 1–2: floor only",
        instructions:
          "Greet, fold, recovery, no refunds without coach.",
      },
      {
        title: "Days 3–4: assisted register",
        instructions:
          "Coach on every void/discount; explain LP why for high-shrink SKUs.",
      },
      {
        title: "Day 5+: solo register",
        instructions:
          "Only if cash variance clean and LP quiz passed—manager sign.",
      },
    ],
  },
  {
    id: "ind-retail-escalation-lp",
    title: "Retail escalation — theft, confrontation, injury",
    shortDescription:
      "Non-accusatory stops, when to disengage, and owner/LP loop same day.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 22,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "External theft",
        instructions:
          "Five-step greet if policy; never chase off property; call police per chart; witness statements.",
      },
      {
        title: "Internal suspicion",
        instructions:
          "Manager + LP only; no floor gossip; preserve footage chain—owner if pattern.",
      },
      {
        title: "Guest injury",
        instructions:
          "First aid; incident form; wet floor sign if relevant; owner if ambulance or lawyer talk likely.",
      },
    ],
  },
  {
    id: "ind-retail-role-expectations",
    title: "Retail roles — associate, key, manager",
    shortDescription:
      "Who can price-adjust, who opens cases, and who calls mall security.",
    category: "training",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 18,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Associate",
        instructions:
          "Guest experience, zone recovery, no case keys, no voids without key.",
      },
      {
        title: "Key holder",
        instructions:
          "Opens/closes checklist owner; limited comps; can run deposit with second person if required.",
      },
      {
        title: "Manager",
        instructions:
          "Schedules, coaching, LP closeout, owner ping on legal/safety—only role that signs vendor credits same day.",
      },
    ],
  },
  {
    id: "ind-retail-zone-recovery",
    title: "Retail zone recovery checklist",
    shortDescription:
      "Hourly on peak days: tables, denim wall, checkout impulse, and backstock not bleeding to floor.",
    category: "cleaning",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 12,
    walkthrough_minutes: 5,
    steps: [
      {
        title: "Tables & walls",
        instructions:
          "Faces full or intentionally zoned; size run gaps flagged for backstock pull.",
      },
      {
        title: "Checkout impulse",
        instructions:
          "Restock to par; dust; no expired consumables on mini fridge if you run one.",
      },
    ],
  },
  {
    id: "ind-retail-price-override",
    title: "Price override & mismatch",
    shortDescription: "Shelf vs POS disputes without calling the owner per ticket.",
    category: "operations",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 8,
    walkthrough_minutes: 3,
    steps: [
      { title: "Verify", instructions: "Scan shelf tag; if mismatch, honor lower for guest once, fix tag same day." },
    ],
  },
  {
    id: "ind-retail-shipment-receive",
    title: "Shipment receiving",
    shortDescription: "Cartons checked in without backroom pile-up.",
    category: "inventory",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 30,
    walkthrough_minutes: 8,
    steps: [
      { title: "Receive", instructions: "Count cartons vs ASN; damage noted on BOL before sign." },
      { title: "Backstock", instructions: "Ticketed and slotted same day; overstock dated." },
    ],
  },
  {
    id: "ind-retail-fitting-room",
    title: "Fitting room recovery",
    shortDescription: "Zones reset every hour during peak.",
    category: "cleaning",
    importance_level: 2,
    owner_dependency_level: 1,
    estimated_time_minutes: 10,
    walkthrough_minutes: 3,
    steps: [
      { title: "Sweep", instructions: "Clear rejects to rack; hangers faced; security tags on floor to LP log." },
    ],
  },
  {
    id: "ind-retail-bopis",
    title: "Buy online pickup in store",
    shortDescription: "Orders staged, verified, and handed off with initials.",
    category: "customer_experience",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 10,
    walkthrough_minutes: 4,
    steps: [
      { title: "Pick", instructions: "Scan each SKU to order; stage in labeled hold area." },
      { title: "Handoff", instructions: "ID check per policy; log pickup time in system." },
    ],
  },
])
