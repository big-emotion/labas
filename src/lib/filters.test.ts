import { describe, expect, it } from "vitest";
import { rankCities, type Answers } from "./ranking";
import { applyFilters, FILTER_MENU, filterMenu, filtersFrom, type Filters } from "./filters";
import { looksFrench } from "../i18n/looks-french";
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

  // Beta feedback (2026-11-18): one region to leave out took four ticks when the filter kept.
  it("removes the cities of the regions the reader takes out", () => {
    const kept = applyFilters(ranked, { regions: ["nord"] });
    expect(kept.length).toBe(ranked.length - 14);
    for (const m of kept) expect(m.city.zone).not.toBe("nord");
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
      expect(m.city.zone).not.toBe("ouest");
    }
  });
});

describe("the filter menu", () => {
  it("offers the filters of the approved mockup, in its order", () => {
    expect(FILTER_MENU.map((f) => f.label)).toEqual([
      "Villes que vous connaissez déjà",
      "Taille de la ville",
      "Langue",
      "Budget",
      "Mer ou île",
      "Région",
      "Religion majoritaire",
      "Lois sur l'homosexualité",
    ]);
  });

  it("lists every city, alphabetically, among the ones the reader may know", () => {
    const known = FILTER_MENU.find((f) => f.key === "known")!;
    const labels = known.options.map((o) => o.label);
    expect(labels).toHaveLength(115);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "fr")));
  });

  it("reads in English for an English reader, with the same keys and values", () => {
    const english = filterMenu("en");
    expect(english.map((f) => f.key)).toEqual(FILTER_MENU.map((f) => f.key));
    for (const entry of english)
      for (const text of [entry.label, entry.hint, ...entry.options.map((o) => o.label)])
        expect(looksFrench(text), text).toBe(false);
    const known = english.find((f) => f.key === "known")!.options.map((o) => o.label);
    expect(known).toContain("Addis Ababa");
    expect(known).toEqual([...known].sort((a, b) => a.localeCompare(b, "en-GB")));
  });

  it("builds filters the result understands from the options picked", () => {
    const sizes = FILTER_MENU.find((f) => f.key === "sizes")!;
    const filters = filtersFrom({ sizes: [sizes.options[2].value] });
    for (const m of applyFilters(ranked, filters)) expect(m.city.size).toBe(1);
  });
});
