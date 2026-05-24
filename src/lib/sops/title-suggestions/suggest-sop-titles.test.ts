import { describe, expect, it } from "vitest"

import { suggestSopTitles } from "./suggest-sop-titles"

describe("suggestSopTitles", () => {
  it("returns 3–5 category-aware titles from typed text", () => {
    const titles = suggestSopTitles({
      category: "closing",
      titleDraft: "freezer lock",
    })

    expect(titles.length).toBeGreaterThanOrEqual(3)
    expect(titles.length).toBeLessThanOrEqual(5)
    expect(titles.some((t) => /freezer lock/i.test(t))).toBe(true)
    expect(titles.some((t) => /close/i.test(t))).toBe(true)
  })

  it("uses context when the title field is still empty", () => {
    const titles = suggestSopTitles({
      category: "opening",
      titleDraft: "",
      contextText: "Ashley forgets to turn on the open sign",
    })

    expect(titles.length).toBeGreaterThanOrEqual(3)
    expect(titles.some((t) => /open sign/i.test(t))).toBe(true)
  })

  it("excludes an exact match to the current title", () => {
    const titles = suggestSopTitles({
      category: "closing",
      titleDraft: "Close — Freezer Lock",
    })

    expect(titles.every((t) => t.toLowerCase() !== "close — freezer lock")).toBe(true)
  })

  it("returns nothing when input is too short", () => {
    expect(suggestSopTitles({ category: "other", titleDraft: "ab" })).toEqual([])
  })
})
