import { describe, expect, it } from "vitest";
import { CITIES } from "../lib/cities";
import { cityName, countryName, zoneName } from "./places";

describe("place names in English", () => {
  it("translates the names that differ and keeps the others", () => {
    expect(countryName("Sénégal", "en")).toBe("Senegal");
    expect(countryName("Sénégal", "fr")).toBe("Sénégal");
    expect(countryName("Kenya", "en")).toBe("Kenya");
    expect(cityName("Le Cap", "en")).toBe("Cape Town");
    expect(cityName("Dakar", "en")).toBe("Dakar");
    expect(zoneName("ouest", "en")).toBe("West Africa");
    expect(zoneName("ouest", "fr")).toBe("Afrique de l'Ouest");
  });

  it("leaves no French article or French spelling in an English country name", () => {
    for (const city of CITIES) {
      const english = countryName(city.country, "en");
      expect(english, city.country).not.toMatch(
        /^(Le|La|Les|L') |Guinée|Afrique|Soudan|Somalie|-et-|ie$/,
      );
    }
  });

  it("leaves no French article in an English city name", () => {
    for (const city of CITIES)
      expect(cityName(city.name, "en"), city.name).not.toMatch(/^(Le|La|Les) /);
  });
});
