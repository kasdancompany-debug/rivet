import { compactSop } from "./_compact"
import { withIndustry } from "./_helpers"

export const AUTO_DEALERSHIP_INDUSTRY_TEMPLATES = withIndustry("auto_dealership", [
  compactSop(
    "ind-auto-opening",
    "Dealership opening — lot & showroom",
    "Keys, lot line, showroom lights, and service lane ready for first appointment.",
    "opening",
    [
      { title: "Lot & keys", instructions: "Unlock gates, verify key box, walk lot for damage or missing units—log before first test drive." },
      { title: "Showroom & F&I", instructions: "Lights, music, brochures stocked, desk PCs logged in, appointment board matches CRM." },
      { title: "Service lane", instructions: "Bay doors up, lifts inspected, advisor desk stocked with RO folders and loaner keys." },
    ],
    { importance: 5, ownerDep: 4, minutes: 45 }
  ),
  compactSop(
    "ind-auto-closing",
    "Dealership closing — secure inventory & cash",
    "Lot lock, deal jackets filed, and service bay shutdown.",
    "closing",
    [
      { title: "Lot secure", instructions: "All units locked, gates down, test drive keys returned and counted." },
      { title: "Deals & cash", instructions: "Deposits in safe, deal jackets to finance tray, variances noted on close sheet." },
      { title: "Service close", instructions: "ROs parked, keys on board, bay tools stored, alarms set per location card." },
    ],
    { importance: 5, ownerDep: 4, minutes: 55 }
  ),
  compactSop(
    "ind-auto-test-drive",
    "Test drive authorization",
    "License, insurance, route, and vehicle condition before keys leave.",
    "customer_experience",
    [
      { title: "ID & insurance", instructions: "Scan license, verify insurance card, log mileage out on test drive form." },
      { title: "Vehicle walk", instructions: "Note existing damage with guest initials; fuel level and return time set." },
    ]
  ),
  compactSop(
    "ind-auto-trade-appraisal",
    "Trade appraisal handoff",
    "Consistent appraisal notes from lot to desk without owner repricing every deal.",
    "customer_experience",
    [
      { title: "Lot inspection", instructions: "Photos, Carfax, recondition estimate attached before desk quote." },
      { title: "Desk rules", instructions: "Appraisal valid 7 days; manager sign-off if over ACV band on sheet." },
    ]
  ),
  compactSop(
    "ind-auto-bdc-followup",
    "BDC lead follow-up cadence",
    "Speed-to-lead and appointment setting without owner texting every lead.",
    "training",
    [
      { title: "5-minute rule", instructions: "New internet lead contacted in 5 minutes during hours; voicemail + text if no answer." },
      { title: "Appointment lock", instructions: "Book on CRM, send confirmation text template, manager notified on no-shows." },
    ]
  ),
  compactSop(
    "ind-auto-service-advisor",
    "Service advisor write-up standard",
    "RO accuracy, customer approval, and time quotes the shop can hit.",
    "training",
    [
      { title: "Walk-around", instructions: "Document concerns with customer; no mystery upsells without green-light items." },
      { title: "Promise time", instructions: "Quote from shop foreman card; call if slip >30 minutes before promise." },
    ]
  ),
  compactSop(
    "ind-auto-escalation",
    "Dealership escalation ladder",
    "When sales manager vs GM vs owner for complaints and compliance.",
    "other",
    [
      { title: "Sales manager", instructions: "Pricing disputes, delivery delays, accessory issues—manager owns first fix." },
      { title: "GM / owner", instructions: "Regulatory complaints, safety recalls on lot, fraud suspicion, or media inquiry." },
    ]
  ),
  compactSop(
    "ind-auto-roles",
    "Sales & service role clarity",
    "Who owns desk, BDC, F&I, and service lane handoffs.",
    "other",
    [
      { title: "Sales floor", instructions: "Up system honored; greeter to BDC to closer path posted at door." },
      { title: "Service", instructions: "Advisor owns customer comms; tech owns diagnosis—no advisor promising parts without parts desk." },
    ]
  ),
  compactSop(
    "ind-auto-lot-audit",
    "Weekly lot audit",
    "Sticker accuracy, keys, and aged inventory flags.",
    "cleaning",
    [
      { title: "Window stickers", instructions: "Price, mileage, and features match system; fix before Saturday traffic." },
      { title: "Aged units", instructions: "60+ day units flagged for photo refresh and manager pricing review." },
    ]
  ),
  compactSop(
    "ind-auto-delivery",
    "Vehicle delivery checklist",
    "Detail, docs, and feature tour before keys to buyer.",
    "customer_experience",
    [
      { title: "Detail & fuel", instructions: "Full tank policy, wash, and remove all prior buyer stickers." },
      { title: "Docs & tour", instructions: "Sign delivery checklist, pair phone to CarPlay if requested, schedule first service." },
    ]
  ),
  compactSop(
    "ind-auto-parts-hold",
    "Parts hold & special order",
    "Customer comms when parts delay RO completion.",
    "other",
    [
      { title: "Order status", instructions: "Log ETA from parts; call customer before ETA slips." },
      { title: "Storage", instructions: "Label parts to RO; charge storage fee per policy after 5 days." },
    ]
  ),
  compactSop(
    "ind-auto-compliance",
    "Advertising & compliance guardrails",
    "Payment quotes and disclosure language that protect the store.",
    "other",
    [
      { title: "Payment quotes", instructions: "Use approved calculator only; no verbal payments that aren't OTD sheet." },
      { title: "Ad review", instructions: "Marketing posts manager-approved; remove sold units same day." },
    ]
  ),
])
