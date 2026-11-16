import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { ACTIVITY_TAGS, HOLIDAYS, holidayOf, SEASONS } from "./holiday";
import { QUESTIONS } from "./questions";
import { rankCities, type Answers } from "./ranking";

// Holiday mode (operator, 2026-11-16): what to do, when to go, where to escape, all sourced.
const score = (answers: Answers, name: string) =>
  rankCities(answers).find((m) => m.city.name === name)!;
const HOLIDAY: Answers = { project: "decouvrir" };

describe("the holiday data of each city", () => {
  it("covers cities the site has, with valid tags, months and https dated sources", () => {
    const names = new Set(CITIES.map((c) => c.name));
    expect(HOLIDAYS.length).toBeGreaterThan(50);
    for (const h of HOLIDAYS) {
      expect(names, h.name).toContain(h.name);
      for (const a of h.activities) {
        expect(ACTIVITY_TAGS, `${h.name} ${a.tag}`).toContain(a.tag);
        expect(a.source.url, h.name).toMatch(/^https:\/\//);
      }
      for (const m of [...h.bestMonths, ...h.rainyMonths]) {
        expect(m, h.name).toBeGreaterThanOrEqual(1);
        expect(m, h.name).toBeLessThanOrEqual(12);
      }
      for (const e of h.escapes) expect(e.source.url, `${h.name} ${e.name}`).toMatch(/^https:\/\//);
    }
  });
});

describe("holiday questions move the cities that fit", () => {
  it("asks a holidaymaker when they leave", () => {
    const when = QUESTIONS.find((q) => q.id === "season")!;
    expect(when.when?.(HOLIDAY)).toBe(true);
    expect(when.when?.({ project: "installer" })).toBe(false);
  });

  it("prefers a city in its good season over the same city in its rains", () => {
    const city = HOLIDAYS.find((h) => h.bestMonths.length && h.rainyMonths.length)!;
    const of = (month: number) =>
      SEASONS.find((s) => (s.months as readonly number[]).includes(month))!.value;
    const good = score({ ...HOLIDAY, season: of(city.bestMonths[0]) }, city.name);
    const rainy = score({ ...HOLIDAY, season: of(city.rainyMonths[0]) }, city.name);
    expect(good.score).toBeGreaterThan(rainy.score);
  });

  it("brings a city with a safari nearby closer to a reader who wants one", () => {
    const withSafari = HOLIDAYS.find((h) => h.activities.some((a) => a.tag === "safari"))!;
    const before = score(HOLIDAY, withSafari.name).score;
    const after = score({ ...HOLIDAY, wants: ["safari"] }, withSafari.name).score;
    expect(after).toBeGreaterThan(before);
  });

  it("knows a city without holiday data is unknown, not bad", () => {
    expect(holidayOf("Mogadiscio")).toBeUndefined();
  });
});
