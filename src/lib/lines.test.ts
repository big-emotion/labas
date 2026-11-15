import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { linesFor } from "./lines";

// Wording the site never uses about the reader (docs/criteria/architecture.md §A.7).
const TRAIT_WORDS = /personnalité|ton profil|tu es (quelqu|un |une |plutôt)|\bvous\b|\bvotre\b/i;
const proposable = CITIES;

describe("the level-1 lines of each city", () => {
  it("gives every proposable city a reputation and a surprise", () => {
    for (const city of proposable) {
      const lines = linesFor(city.name);
      expect(lines?.reputation, city.name).toBeTruthy();
      expect(lines?.surprise, city.name).toBeTruthy();
    }
  });

  it("introduces a reputation as hearsay, never as a measurement", () => {
    for (const city of proposable) {
      expect(linesFor(city.name)?.reputation ?? "", city.name).toMatch(/^On (dit|connaît)/);
    }
  });

  it("backs every city's lines with at least one dated source", () => {
    for (const city of proposable) {
      const sources = linesFor(city.name)?.sources ?? [];
      expect(sources.length, city.name).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.url, city.name).toMatch(/^https:\/\//);
        expect(source.accessed, city.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("speaks to the reader with « tu » and never names a trait", () => {
    for (const city of proposable) {
      const lines = linesFor(city.name);
      const texts = [
        lines?.reputation,
        lines?.surprise,
        ...Object.values(lines?.why ?? {}),
        ...(lines?.neighbourhoods ?? []).map((n) => n.text),
      ];
      for (const text of texts) expect(text ?? "", city.name).not.toMatch(TRAIT_WORDS);
    }
  });

  it("knows nothing about a city that is not in the catalogue", () => {
    expect(linesFor("Atlantide")).toBeUndefined();
  });
});
