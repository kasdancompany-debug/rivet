import type { SopStarterTemplate } from "./types"
import { INDUSTRY_STARTER_TEMPLATES } from "./industries"

/** Legacy cross-industry starters plus industry packs. Installed as editable drafts. */
const LEGACY_STARTER_SOP_TEMPLATES: SopStarterTemplate[] = [
  {
    id: "opening-cafe",
    title: "Opening the cafe",
    shortDescription:
      "Lights, safe, equipment, prep, and front-of-house so the first guest walks into a ready shop.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 45,
    walkthrough_minutes: 12,
    steps: [
      {
        title: "Arrive & disarm",
        instructions:
          "Enter through the designated door, disarm the alarm per your location’s code card, and log the open time in the shift log or POS notes.",
      },
      {
        title: "Lights, music, climate",
        instructions:
          "Turn on floor and case lighting, start approved playlist at low volume, and set HVAC to the day profile (summer/winter sheet at the desk).",
      },
      {
        title: "Safety walk",
        instructions:
          "Walk the floor: clear trip hazards, check for leaks or odd smells, verify fire exits are unobstructed, and note anything unusual for the owner log.",
      },
      {
        title: "Equipment power-up",
        instructions:
          "Switch on registers, display case, espresso machine (follow the dedicated startup SOP), and any proofers or ovens scheduled for morning bakes.",
      },
      {
        title: "Sanitize high-touch surfaces",
        instructions:
          "Wipe door handles, POS screens, condiment bar, and pickup counter with food-safe sanitizer. Replace bar towels with fresh sets.",
      },
      {
        title: "Pastry & case staging",
        instructions:
          "Pull overnight items from walk-in as needed, complete glazing/filling per product SOPs, and stock the display case using FIFO labels.",
        requires_photo_confirmation: true,
      },
      {
        title: "Brew batch & samples",
        instructions:
          "Start drip and batch brew to spec; taste batch within 15 minutes of finish and record on the tasting sheet.",
      },
      {
        title: "Front door & signage",
        instructions:
          "Flip open signs, set A-frame if permitted, unlock patio furniture, and confirm hours on the door match Google and the website.",
      },
    ],
  },
  {
    id: "closing-cafe",
    title: "Closing the cafe",
    shortDescription:
      "Cash handling prep, deep clean zones, equipment shutdown, and secure the building without leaving surprises for openers.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 60,
    walkthrough_minutes: 14,
    steps: [
      {
        title: "Last-call checklist",
        instructions:
          "Announce last call 30 minutes before close, pull unsold samples, and mark any write-downs in the waste log with initials.",
      },
      {
        title: "Espresso bar shutdown",
        instructions:
          "Purge groups, backflush if on schedule, empty knock box, wipe steam wands, and leave machine in overnight standby per manufacturer sheet.",
      },
      {
        title: "Dish & three-compartment",
        instructions:
          "Run final rack, drain and refill sanitizer if PPM is low, scrub sinks, and leave drying racks clear for morning.",
      },
      {
        title: "Floors & trash",
        instructions:
          "Sweep high-traffic zones, spot-mop spills, empty all interior bins, and roll dumpsters only if that is tonight’s task on the chore chart.",
      },
      {
        title: "Case & pastry wrap",
        instructions:
          "Cover or wrap overnight product, label with date, transfer to walk-in list, and wipe case glass inside and out.",
        requires_photo_confirmation: true,
      },
      {
        title: "Registers & cash prep",
        instructions:
          "Close out POS per end-of-day cash SOP, print Z/X reports if required, and secure drops in the safe with two-person rule if policy applies.",
      },
      {
        title: "Lights, equipment, alarm",
        instructions:
          "Power down non-essential equipment, set case to night mode, turn off music, set alarm, and exit through the designated door—never prop open.",
      },
    ],
  },
  {
    id: "espresso-machine-startup",
    title: "Espresso machine startup",
    shortDescription:
      "Warm-up, water checks, and hygiene so every shot starts from a stable, clean baseline.",
    category: "coffee",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 25,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Visual & leak check",
        instructions:
          "Inspect machine, hoses, and drain tray for overnight leaks or pest signs. If anything looks off, tag machine out and notify a lead.",
      },
      {
        title: "Reservoir & filtration",
        instructions:
          "Confirm water line is on (plumbed) or tank is filled (reservoir). Note filter change date—replace if due this week.",
      },
      {
        title: "Power & warm-up",
        instructions:
          "Switch main power on; allow full heat saturation (usually 20–30 minutes). Do not pull shots until brew boiler is at green/setpoint.",
      },
      {
        title: "Purge & rinse",
        instructions:
          "Run water through each group with portafilter locked to flush stale water. Rinse portafilters and baskets with hot water only.",
      },
      {
        title: "Steam wand hygiene",
        instructions:
          "Purge each wand for 3 seconds, wipe with a dedicated steam cloth, and confirm no milk buildup in tips—replace tips if blocked.",
      },
      {
        title: "Dial-in handshake",
        instructions:
          "Pull one test shot on the house blend; if outside recipe window, follow the Espresso Dialing SOP before service.",
      },
    ],
  },
  {
    id: "espresso-dialing",
    title: "Espresso dialing",
    shortDescription:
      "Adjust grind, dose, and yield to hit your shop’s target TDS and taste balance for the active coffee lot.",
    category: "coffee",
    importance_level: 4,
    owner_dependency_level: 4,
    estimated_time_minutes: 20,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "Confirm recipe card",
        instructions:
          "Use the printed recipe: target dose (g), yield (g), shot time window, and water temp if adjustable. Note the roast date on the bag.",
      },
      {
        title: "Purge grinder",
        instructions:
          "Discard ~20g through the chute after any grind change. Wipe burr chamber access if your model allows quick cleaning.",
      },
      {
        title: "Adjust grind for time",
        instructions:
          "If shot runs fast, fine slightly; if slow, coarse slightly. Move in micro steps (1–2 clicks) and purge between changes.",
      },
      {
        title: "Taste & balance",
        instructions:
          "Evaluate sour vs. bitter vs. hollow. Adjust yield slightly (2–3g) before large grind moves once you are close to time window.",
      },
      {
        title: "Lock settings",
        instructions:
          "Record grinder setting, dose, yield, and time on the dial-in log. Initial and time-stamp; notify next shift if still drifting.",
      },
    ],
  },
  {
    id: "milk-steaming-standards",
    title: "Milk steaming standards",
    shortDescription:
      "Texture, temperature, and hygiene for dairy and alternatives—consistent latte art canvas and safe service.",
    category: "coffee",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 15,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Pitcher & milk",
        instructions:
          "Use correct pitcher volume for drink size. Pour cold milk to the guideline etched or marked on the pitcher—never re-steam milk.",
      },
      {
        title: "Purge & wand prep",
        instructions:
          "Purge wand, fold cloth for a dry wipe, and confirm steam tip is clear before introducing milk.",
      },
      {
        title: "Stretch & texture",
        instructions:
          "Introduce air until body temperature (~100°F / hand-hot), then bury tip for vortex until glossy microfoam—no visible bubbles.",
      },
      {
        title: "Target temperature",
        instructions:
          "Stop at shop spec (e.g., 135–145°F dairy, lower for some alternatives). Use thermometer until calibrated hands pass a skills check.",
      },
      {
        title: "Post-pour hygiene",
        instructions:
          "Wipe wand immediately, purge 2 seconds, polish pitcher spout, and discard any milk left in pitcher to drain—never back into jug.",
      },
    ],
  },
  {
    id: "cold-brew-preparation",
    title: "Cold brew preparation",
    shortDescription:
      "Ratio, grind, steep time, and dilution for a consistent concentrate batch.",
    category: "coffee",
    importance_level: 3,
    owner_dependency_level: 3,
    estimated_time_minutes: 30,
    walkthrough_minutes: 6,
    steps: [
      {
        title: "Sanitize vessel",
        instructions:
          "Clean Toddy or keg with approved cleaner, rinse thoroughly, and air-dry or towel-dry only with lint-free towels.",
      },
      {
        title: "Weigh coffee & water",
        instructions:
          "Use the shop ratio (e.g., 1:8 concentrate). Weigh beans, grind coarse (French press–like), add water in stages while stirring gently.",
      },
      {
        title: "Steep environment",
        instructions:
          "Cover, label with start date/time and initials, and steep refrigerated or ambient per recipe—do not mix methods batch-to-batch.",
      },
      {
        title: "Filter & yield",
        instructions:
          "At hour 16–24 (per recipe), drain without pressing grounds excessively. Measure yield and log; investigate if yield is off >10%.",
      },
      {
        title: "Dilute & serve spec",
        instructions:
          "Cut concentrate to service strength in a separate container, taste with ice, and update the flavor tag if the lot tastes different.",
        requires_photo_confirmation: true,
      },
    ],
  },
  {
    id: "donut-glazing-standards",
    title: "Donut glazing standards",
    shortDescription:
      "Temperature, viscosity, and finish so every ring or yeast donut looks and sets the same.",
    category: "donuts",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 25,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Glaze prep",
        instructions:
          "Warm glaze to the temperature on the batch sheet, strain if crystallized, and adjust viscosity with approved thinner—never water alone unless spec says so.",
      },
      {
        title: "Donut baseline temp",
        instructions:
          "Yeast donuts slightly warm; cake donuts fully cool. Too hot melts glaze; too cold causes uneven pick-up.",
      },
      {
        title: "Dip technique",
        instructions:
          "Dip top surface only unless product is full-dip; allow excess to run off 3 seconds; scrape bottom once on rack edge to avoid pooling feet.",
      },
      {
        title: "Toppings window",
        instructions:
          "Apply sprinkles/nuts within 60 seconds while tacky; gently press if needed, then move to a ventilated drying rack.",
      },
      {
        title: "Quality snapshot",
        instructions:
          "Check sheen, even coverage, and feet. Reject doubles that stick together—rework or crumb them per waste policy.",
        requires_photo_confirmation: true,
      },
    ],
  },
  {
    id: "donut-filling-standards",
    title: "Donut filling standards",
    shortDescription:
      "Puncture, fill weight, and sealing for jelly, cream, and custard products without blowouts.",
    category: "donuts",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 20,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Piping bag & tip",
        instructions:
          "Use color-coded bag for allergen (dairy vs. non-dairy). Select tip length to reach center mass without piercing through the shell.",
      },
      {
        title: "Puncture point",
        instructions:
          "Create a clean entry on the seam or designated X; wiggle tip slightly to create cavity without tearing exterior glaze.",
      },
      {
        title: "Fill weight",
        instructions:
          "Use scale spot-checks: target grams per SKU on the sheet. Underfill reads hollow; overfill risks seam burst.",
      },
      {
        title: "Finish & dust",
        instructions:
          "Wipe entry hole if needed, dust with powdered sugar or crumb per SKU card, and place in tray facing the same direction for case.",
      },
      {
        title: "Allergen & label",
        instructions:
          "If introducing a new filling that week, update case allergen card and POS modifier notes before selling.",
      },
    ],
  },
  {
    id: "display-case-setup",
    title: "Display case setup",
    shortDescription:
      "Temperatures, heights, labels, and rotation so the case sells hard and stays safe.",
    category: "donuts",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 20,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Case temperature",
        instructions:
          "Confirm case is at setpoint before loading. Pre-cool empty for 15 minutes if it was off overnight.",
      },
      {
        title: "Shelves & heights",
        instructions:
          "Arrange tallest items back, shortest forward. No packaging blocking airflow vents. Use risers only where stable.",
      },
      {
        title: "Labels & pricing",
        instructions:
          "Every SKU has name, price, and allergen flag matching POS. Date dots on trays for anything unpackaged.",
        requires_photo_confirmation: true,
      },
      {
        title: "FIFO & discard",
        instructions:
          "Pull yesterday’s carryovers forward only if quality still passes; otherwise mark waste with reason code.",
      },
      {
        title: "Glass & lighting",
        instructions:
          "Clean customer-facing glass streak-free; replace any burnt case bulbs and wipe fingerprints from handles.",
      },
    ],
  },
  {
    id: "cleaning-washrooms",
    title: "Cleaning washrooms",
    shortDescription:
      "Guest and team restrooms on a cadence that matches health expectations and your brand.",
    category: "cleaning",
    importance_level: 3,
    owner_dependency_level: 1,
    estimated_time_minutes: 15,
    walkthrough_minutes: 5,
    steps: [
      {
        title: "Knock & sign",
        instructions:
          "Post wet-floor sign, knock, and enter with gloves and dedicated restroom cart—never food-prep towels here.",
      },
      {
        title: "Surfaces & mirrors",
        instructions:
          "Spray and wipe sinks, counters, mirrors, and stall partitions with restroom-grade disinfectant. Restock soap, paper, and seat covers.",
      },
      {
        title: "Fixtures",
        instructions:
          "Scrub toilets/urinals, flush, and wipe seats dry. Check plumbing for slow drains—log maintenance if needed.",
      },
      {
        title: "Floors",
        instructions:
          "Sweep debris, mop with correct dilution, and allow dry time before removing signs.",
      },
      {
        title: "Checklist initial",
        instructions:
          "Initial the restroom log with time; note supply lows on the manager sheet.",
      },
    ],
  },
  {
    id: "end-of-day-cash-out",
    title: "End-of-day cash out",
    shortDescription:
      "Drawer counts, variances, deposits, and documentation that keep finance and staff aligned.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 5,
    estimated_time_minutes: 25,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "POS closeout",
        instructions:
          "Run system close, reconcile card batches, and print/email reports per owner settings. Attach tips payout note if applicable.",
      },
      {
        title: "Cash drawer count",
        instructions:
          "Count bills/coins to the closing sheet; two-person count if over threshold. Do not move personal wallets near count zone.",
      },
      {
        title: "Variances",
        instructions:
          "Document any over/short with likely cause (miscounted change, comp not entered). Escalate large variances same night.",
      },
      {
        title: "Deposit prep",
        instructions:
          "Strap cash per bank spec, seal bag with tamper-evident seal, log bag number, and secure in safe or night-drop per policy.",
      },
      {
        title: "Next-shift packet",
        instructions:
          "Leave envelope for opener with change fund needs; photo receipt of deposit slip if scanned to shared drive.",
        requires_photo_confirmation: true,
      },
    ],
  },
  {
    id: "customer-complaint-handling",
    title: "Customer complaint handling",
    shortDescription:
      "Listen, fix fast, document, and recover loyalty without arguing at the counter.",
    category: "customer_service",
    importance_level: 5,
    owner_dependency_level: 2,
    estimated_time_minutes: 10,
    walkthrough_minutes: 6,
    steps: [
      {
        title: "Acknowledge & tone",
        instructions:
          "Make eye contact, thank them for telling you, and lower your voice. Never interrupt the first 20 seconds of their story.",
      },
      {
        title: "Clarify facts",
        instructions:
          "Repeat back the issue in one sentence, confirm order number or item, and check prep notes or camera time window if available.",
      },
      {
        title: "Fix in the moment",
        instructions:
          "Offer the smallest generous fix that matches severity (remake, refund, coupon). Follow remake policy for food safety items.",
      },
      {
        title: "Document",
        instructions:
          "Log in complaint book or CRM: date, name if given, item, resolution, staff initials. Flag allergens or injury immediately to owner.",
      },
      {
        title: "Recover",
        instructions:
          "Invite them back with a specific offer if appropriate, and ensure the next visit gets a quiet thank-you from the shift lead.",
      },
    ],
  },
  {
    id: "product-remake-policy",
    title: "Product remake policy",
    shortDescription:
      "When remakes are free, when they are not, and how to stay consistent and safe.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 10,
    walkthrough_minutes: 5,
    steps: [
      {
        title: "Quality failures",
        instructions:
          "Remake no charge if off-spec (wrong milk, underextracted, burnt milk, wrong donut, stale case item found before guest leaves).",
      },
      {
        title: "Preference changes",
        instructions:
          "If the guest simply changed their mind after accepting the drink, charge for the new item unless lead approves goodwill.",
      },
      {
        title: "Allergy & cross-contact",
        instructions:
          "Never remake into a “safe” version without full allergen workflow—when in doubt, refund and recommend a safe SKU.",
      },
      {
        title: "Waste tagging",
        instructions:
          "Ring comp reason accurately; photograph remakes over $10 if policy requires; initial waste log.",
      },
      {
        title: "Line communication",
        instructions:
          "Call out remakes loudly enough for bar only, not guests—avoid shame language.",
      },
    ],
  },
  {
    id: "inventory-count",
    title: "Inventory count",
    shortDescription:
      "Accurate counts for COGS, ordering, and theft signals—without shutting down service longer than needed.",
    category: "inventory",
    importance_level: 4,
    owner_dependency_level: 4,
    estimated_time_minutes: 45,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Scope & sheets",
        instructions:
          "Print or open digital count sheets for today’s zones (dry, cold, bar). Put on gloves for open food areas.",
      },
      {
        title: "Count method",
        instructions:
          "Count each SKU at eye level; weigh random high-value items if weight-based. Do not move product between zones mid-count.",
      },
      {
        title: "Zeros & negatives",
        instructions:
          "If system shows stock but shelf is empty, mark zero and flag for shrink review. Note near-expiry separately.",
      },
      {
        title: "Submit & lock",
        instructions:
          "Double-enter critical SKUs, submit in inventory tool, and lock the period so sales don’t corrupt the snapshot.",
      },
      {
        title: "Order triggers",
        instructions:
          "Generate suggested POs for anything below par; attach photos of odd variances for the owner thread.",
        requires_photo_confirmation: true,
      },
    ],
  },
  {
    id: "supplier-ordering",
    title: "Supplier ordering",
    shortDescription:
      "Cutoff times, minimums, and receiving prep so you never 86 milk on a Saturday.",
    category: "inventory",
    importance_level: 4,
    owner_dependency_level: 4,
    estimated_time_minutes: 20,
    walkthrough_minutes: 6,
    steps: [
      {
        title: "Par review",
        instructions:
          "Compare on-hand to par levels for dairy, paper, beans, and disposables. Account for promos or catering pulls this week.",
      },
      {
        title: "Cutoff clocks",
        instructions:
          "Confirm vendor cutoffs (dairy vs. broadline). Place dairy orders first if earlier cutoff.",
      },
      {
        title: "Build cart",
        instructions:
          "Add line items with correct pack size (case vs. each). Attach notes for substitutions allowed.",
      },
      {
        title: "Approve & send",
        instructions:
          "Manager approves over threshold; send PO and save confirmation number in the orders channel.",
      },
      {
        title: "Receiving plan",
        instructions:
          "Print expected delivery windows for tomorrow’s opener; clear dock/fridge space for pallets.",
      },
    ],
  },
  {
    id: "new-employee-first-shift",
    title: "New employee first shift",
    shortDescription:
      "Tour, introductions, shadowing, and micro-wins so day one feels structured—not sink-or-swim.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 240,
    walkthrough_minutes: 15,
    steps: [
      {
        title: "Welcome packet",
        instructions:
          "Hand uniform/name tag, handbook, allergy overview, and Wi-Fi/guest bathroom codes. Complete I-9 and tax if HR scheduled today.",
      },
      {
        title: "Tour with stories",
        instructions:
          "Walk BOH/FOH with stop points: where to wash hands, where not to store personal drinks, and where breaks happen.",
      },
      {
        title: "Shadow pair",
        instructions:
          "Assign a peer trainer for the full shift. New hire observes only for first 90 minutes unless assisting with low-risk tasks.",
      },
      {
        title: "Guided tasks",
        instructions:
          "Let them greet guests, bus tables, and rinse dishes with coaching. No solo espresso until bar cert—read policy card.",
      },
      {
        title: "Close-out debrief",
        instructions:
          "15-minute recap: what went well, one improvement, tomorrow’s schedule. Trainer initials onboarding checklist.",
      },
    ],
  },
]

export const STARTER_SOP_TEMPLATES: SopStarterTemplate[] = [
  ...LEGACY_STARTER_SOP_TEMPLATES,
  ...INDUSTRY_STARTER_TEMPLATES,
]

export function getStarterTemplateById(id: string): SopStarterTemplate | undefined {
  return STARTER_SOP_TEMPLATES.find((t) => t.id === id)
}

export type StarterTemplateGalleryFilters = {
  category?: string
  /** `legacy` = templates without `industryId` (original gallery). */
  industryId?: string | "legacy"
}

export function getStarterTemplatesByFilters(filters: StarterTemplateGalleryFilters): SopStarterTemplate[] {
  let list = STARTER_SOP_TEMPLATES
  if (filters.industryId === "legacy") {
    list = list.filter((t) => !t.industryId)
  } else if (filters.industryId) {
    list = list.filter((t) => t.industryId === filters.industryId)
  }
  if (filters.category) {
    list = list.filter((t) => t.category === filters.category)
  }
  return list
}

export function getStarterTemplatesByCategory(category: string | undefined): SopStarterTemplate[] {
  return getStarterTemplatesByFilters({ category })
}
