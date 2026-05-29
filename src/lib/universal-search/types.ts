export type UniversalSearchKind =
  | "play"
  | "training"
  | "video"
  | "photo"
  | "ask_rivet"
  | "employee"
  | "certification"

export type UniversalSearchResult = {
  id: string
  kind: UniversalSearchKind
  title: string
  subtitle: string | null
  href: string
  score: number
}

export type UniversalSearchGroup = {
  kind: UniversalSearchKind
  label: string
  results: UniversalSearchResult[]
}

export type UniversalSearchResponse = {
  query: string
  groups: UniversalSearchGroup[]
  totalCount: number
}

export type UniversalSearchLabels = Record<UniversalSearchKind, string>

export const UNIVERSAL_SEARCH_KIND_ORDER: UniversalSearchKind[] = [
  "play",
  "training",
  "video",
  "photo",
  "ask_rivet",
  "employee",
  "certification",
]
