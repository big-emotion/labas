import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { goingThere } from "./going";

// Since 2026-11-15 the site says « vous »: no « tu ».
const TU = /(?<![\p{L}'’])(tu|te|toi|ton|ta|tes)(?!\p{L})|(?<!\p{L})t['’](?=\p{L})/iu;
const proposable = CITIES.filter((city) => !city.advisedAgainst);
const advisedAgainst = CITIES.filter((city) => city.advisedAgainst);
const dakar = CITIES.find((city) => city.name === "Dakar");

describe("the « Y aller » links of a city", () => {
  it("opens with flights to the city's airport, then lodging in the city", () => {
    const [flights, lodging] = goingThere(dakar!) ?? [];
    expect(flights.title).toBe("Vols vers Dakar (Google Flights)");
    expect(flights.url).toContain("DSS");
    expect(lodging.title).toBe("Logement à Dakar (Booking)");
    expect(decodeURIComponent(lodging.url)).toContain("Dakar, Sénégal");
  });

  it("names the flights and lodging in English for an English reader", () => {
    const [flights, lodging] = goingThere(dakar!, "en") ?? [];
    expect(flights.title).toBe("Flights to Dakar (Google Flights)");
    expect(flights.url).toContain("hl=en-GB");
    expect(lodging.title).toBe("Places to stay in Dakar (Booking)");
    expect(decodeURIComponent(lodging.url)).toContain("Dakar, Senegal");
  });

  it("gives every proposable city its flights, its lodging and one to three local links", () => {
    for (const city of proposable) {
      const links = goingThere(city);
      expect(links, city.name).toBeDefined();
      const local = links!.slice(2);
      expect(local.length, city.name).toBeGreaterThanOrEqual(1);
      expect(local.length, city.name).toBeLessThanOrEqual(3);
    }
  });

  it("points every link at a secure address and names it in « vous » French", () => {
    for (const city of proposable) {
      for (const link of goingThere(city) ?? []) {
        expect(link.url, city.name).toMatch(/^https:\/\/[^\s]+$/);
        expect(link.title.trim().length, city.name).toBeGreaterThan(3);
        expect(link.title, city.name).not.toMatch(TU);
      }
    }
  });

  // Operator, 2026-11-15: the site never sends a reader on a trip the authorities advise against.
  it("offers no way there to a city travel advice warns against", () => {
    expect(advisedAgainst.length).toBeGreaterThan(0);
    for (const city of advisedAgainst) expect(goingThere(city), city.name).toBeUndefined();
  });
});

describe("the « Y aller » links in English", () => {
  it("names flights and lodging in English and keeps the same places", () => {
    const [flights, lodging] = goingThere(dakar!, "en") ?? [];
    expect(flights.title).toBe("Flights to Dakar (Google Flights)");
    expect(flights.url).toContain("hl=en");
    expect(lodging.title).toBe("Places to stay in Dakar (Booking)");
    expect(decodeURIComponent(lodging.url)).toContain("Dakar, Senegal");
  });
});
