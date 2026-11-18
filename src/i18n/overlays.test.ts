import { describe, expect, it } from "vitest";
import { CITIES, CRITERIA } from "../lib/cities";
import { cityCopy, criterionCopy } from "./city-copy";

// Small French words English never uses: a field left in French shows up here. Accents are not
// a sign, since place names keep theirs (Gorée, São Tomé).
const FRENCH = /(?<!\p{L})(les|des|une|est|et|avec|pour|dans|sur|très|ville|du)(?!\p{L})/iu;

describe("the English overlays", () => {
  it("give every city an English tagline, pitch, warning, languages and currency", () => {
    for (const city of CITIES) {
      const english = cityCopy(city, "en");
      for (const field of ["tagline", "pitch", "watch", "languageLabel", "currency"] as const) {
        expect(english[field], `${city.name} ${field}`).toBeTruthy();
        expect(english[field], `${city.name} ${field}`).not.toMatch(FRENCH);
      }
      // The naira is the naira in both languages, but no sentence reads the same.
      expect(english.pitch, city.name).not.toBe(city.pitch);
      expect(english.watch, city.name).not.toBe(city.watch);
    }
  });

  it("give every criterion an English label, meaning, limit and rubric", () => {
    for (const criterion of CRITERIA) {
      const english = criterionCopy(criterion, "en");
      for (const field of ["label", "means", "doesNotMean"] as const) {
        expect(english[field], `${criterion.key} ${field}`).toBeTruthy();
        expect(english[field], `${criterion.key} ${field}`).not.toMatch(FRENCH);
      }
      for (const step of ["1", "3", "5"] as const) {
        expect(english.rubric[step], `${criterion.key} ${step}`).toBeTruthy();
        expect(english.rubric[step], `${criterion.key} ${step}`).not.toBe(criterion.rubric[step]);
      }
    }
  });
});
