import { describe, expect, it } from "vitest";
import { rankCities, type Answers } from "./ranking";
import { applyFilters, type Filters } from "./filters";
import { livableLanguages } from "./cities";

const reader: Answers = { project: "installer", languages: ["fr"], origin: "ouest", kin: "much" };
const ranked = rankCities(reader);
const names = (filters: Filters) => applyFilters(ranked, filters).map((m) => m.city.name);

describe("filtering the result", () => {
  it("keeps every city in score order when no filter is set", () => {
    expect(names({})).toEqual(ranked.map((m) => m.city.name));
  });

  it("removes the cities the reader already knows, and never reorders the rest", () => {
    const kept = names({ known: ["Dakar", "Abidjan"] });
    expect(kept).not.toContain("Dakar");
    expect(kept).not.toContain("Abidjan");
    expect(kept).toEqual(
      ranked.map((m) => m.city.name).filter((n) => n !== "Dakar" && n !== "Abidjan"),
    );
  });

  it("keeps only the chosen city sizes", () => {
    for (const m of applyFilters(ranked, { sizes: [1] })) expect(m.city.size).toBe(1);
  });

  it("keeps cities where one of the chosen languages is lived in daily", () => {
    for (const m of applyFilters(ranked, { languages: ["pt", "es"] }))
      expect(
        livableLanguages(m.city).some((l) => l === "pt" || l === "es"),
        m.city.name,
      ).toBe(true);
  });

  it("keeps cities by the sea or on an island", () => {
    for (const m of applyFilters(ranked, { water: ["island"] }))
      expect(m.city.facts.settings).toContain("island");
    for (const m of applyFilters(ranked, { water: ["sea"] }))
      expect(m.city.facts.settings).toContain("ocean");
  });

  it("keeps cities of the chosen regions", () => {
    for (const m of applyFilters(ranked, { regions: ["est", "sud"] }))
      expect(["est", "sud"]).toContain(m.city.zone);
  });

  it("keeps countries where the chosen faith is the majority", () => {
    const kept = applyFilters(ranked, { faiths: ["christian"] });
    expect(kept.length).toBeGreaterThan(0);
    for (const m of kept) expect(m.city.countryFacts!.religion!.christian).toBeGreaterThan(50);
  });

  it("removes countries that punish same-sex relations", () => {
    for (const m of applyFilters(ranked, { excludeCriminalising: true }))
      expect(m.city.countryFacts!.sameSexRelations.status).not.toMatch(/^criminalised/);
  });

  it("keeps cities within a tight budget, and those whose cost nobody has measured", () => {
    const kept = applyFilters(ranked, { budget: "serre" });
    for (const m of kept) {
      const level = m.city.scores.cost.level;
      expect(level === null || level >= 4, m.city.name).toBe(true);
    }
    expect(kept.some((m) => m.city.scores.cost.level === null)).toBe(true);
  });

  it("combines filters: a city must pass all of them", () => {
    for (const m of applyFilters(ranked, { sizes: [1], regions: ["ouest"] })) {
      expect(m.city.size).toBe(1);
      expect(m.city.zone).toBe("ouest");
    }
  });
});
