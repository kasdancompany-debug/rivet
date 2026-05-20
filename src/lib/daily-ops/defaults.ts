import type { TablesInsert } from "@/types/database"

type Item = Pick<
  TablesInsert<"daily_checklist_items">,
  "text" | "required_photo" | "sort_order"
>

export const DEFAULT_OPENING_CHECKLIST_ITEMS: Item[] = [
  {
    sort_order: 0,
    text: "Lights on, music low, case powered — shop feels ready before the door opens.",
    required_photo: false,
  },
  {
    sort_order: 1,
    text: "Espresso machine warmed and dialed; first batch tasted and logged.",
    required_photo: false,
  },
  {
    sort_order: 2,
    text: "Display case stocked with today’s dates; anything borderline pulled from sale.",
    required_photo: true,
  },
  {
    sort_order: 3,
    text: "Sanitizer buckets fresh; towels swapped at bar and sink.",
    required_photo: false,
  },
  {
    sort_order: 4,
    text: "Open sign out; hours match the door and Google.",
    required_photo: false,
  },
]

export const DEFAULT_CLOSING_CHECKLIST_ITEMS: Item[] = [
  {
    sort_order: 0,
    text: "Espresso bar rinsed, knock box emptied, machine in overnight standby.",
    required_photo: false,
  },
  {
    sort_order: 1,
    text: "Case wrapped or dated for tomorrow; walk-in transfers logged.",
    required_photo: true,
  },
  {
    sort_order: 2,
    text: "Cash closed per policy; drawer counts in range or noted for manager.",
    required_photo: false,
  },
  {
    sort_order: 3,
    text: "Trash out, floors swept, dishes through last rack.",
    required_photo: false,
  },
  {
    sort_order: 4,
    text: "Alarm set; doors locked; no equipment left running that should not be.",
    required_photo: false,
  },
]
