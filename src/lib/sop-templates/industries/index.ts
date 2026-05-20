import { AUTO_DEALERSHIP_INDUSTRY_TEMPLATES } from "./auto_dealership"
import { BAKERY_INDUSTRY_TEMPLATES } from "./bakeries"
import { CAFE_INDUSTRY_TEMPLATES } from "./cafes"
import { CLEANING_INDUSTRY_TEMPLATES } from "./cleaning"
import { CONTRACTOR_INDUSTRY_TEMPLATES } from "./contractors"
import { OFFICE_INDUSTRY_TEMPLATES } from "./office"
import { RESTAURANT_INDUSTRY_TEMPLATES } from "./restaurant"
import { RETAIL_INDUSTRY_TEMPLATES } from "./retail"
import { SALON_INDUSTRY_TEMPLATES } from "./salons"
import { SERVICE_INDUSTRY_TEMPLATES } from "./service"
import type { SopStarterTemplate } from "../types"

export { INDUSTRY_PACKS, getIndustryPack } from "./packs"

export const INDUSTRY_STARTER_TEMPLATES: SopStarterTemplate[] = [
  ...CAFE_INDUSTRY_TEMPLATES,
  ...RESTAURANT_INDUSTRY_TEMPLATES,
  ...CLEANING_INDUSTRY_TEMPLATES,
  ...BAKERY_INDUSTRY_TEMPLATES,
  ...SALON_INDUSTRY_TEMPLATES,
  ...RETAIL_INDUSTRY_TEMPLATES,
  ...SERVICE_INDUSTRY_TEMPLATES,
  ...CONTRACTOR_INDUSTRY_TEMPLATES,
  ...AUTO_DEALERSHIP_INDUSTRY_TEMPLATES,
  ...OFFICE_INDUSTRY_TEMPLATES,
]
