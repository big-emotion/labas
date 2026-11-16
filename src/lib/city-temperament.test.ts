import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { TRAITS, temperamentFit, temperamentOf } from "./city-temperament";
import { rankCities, type Answers } from "./ranking";

function temperamentPart(cityName: string, answers: Answers): number {
  const match = rankCities(answers).find((m) => m.city.name === cityName);
  if (match?.temperament === null || match?.temperament === undefined)
    throw new Error(`${cityName} has no temperament part`);
  return match.temperament;
}

describe("the temperament of each city, neighbourhood by neighbourhood", () => {
  it("gives every city a share of neighbourhoods at each level of every axis", () => {
    for (const city of CITIES) {
      const profile = temperamentOf(city.name);
      expect(profile, city.name).toBeDefined();
      expect(profile!.areas, city.name).toBeGreaterThan(0);
      for (const trait of TRAITS) {
        const counts = profile![trait];
        expect(counts, `${city.name} ${trait}`).toHaveLength(3);
        expect(
          counts.reduce((sum, n) => sum + n, 0),
          `${city.name} ${trait}`,
        ).toBe(profile!.areas);
      }
    }
  });

  // Operator, 2026-11-15: a calm reader can live in Abidjan, but Kigali suits them better.
  it("fits a calm reader to Kigali more than to Abidjan, and in part to Abidjan too", () => {
    const calm: Answers = { saturday: 0 };
    expect(temperamentPart("Kigali", calm)).toBeGreaterThan(temperamentPart("Abidjan", calm));
    expect(temperamentPart("Abidjan", calm)).toBeGreaterThan(0);
    // On the neighbourhoods alone too, not only through the city's nightlife score: ratings
    // share one scale across cities.
    expect(temperamentFit("Kigali", "saturday", 0)).toBeGreaterThan(
      temperamentFit("Abidjan", "saturday", 0)!,
    );
    expect(temperamentFit("Abidjan", "saturday", 0)).toBeGreaterThan(0);
  });

  it("fits a reader who goes out late to Abidjan more than to Kigali", () => {
    const night: Answers = { saturday: 1 };
    expect(temperamentPart("Abidjan", night)).toBeGreaterThan(temperamentPart("Kigali", night));
  });

  // Someone whom outages amuse is not put off by a city where everything works.
  it("fits every neighbourhood of every city to a reader whom the unexpected amuses", () => {
    for (const city of CITIES) expect(temperamentFit(city.name, "friction", 1), city.name).toBe(1);
  });

  it("fits a reader worn out by the unexpected better where daily life is smooth", () => {
    const tired: Answers = { friction: 0 };
    const demanding = (name: string) =>
      temperamentOf(name)!.friction[2] / temperamentOf(name)!.areas;
    const [smoothest, roughest] = [...CITIES]
      .map((city) => city.name)
      .sort((a, b) => demanding(a) - demanding(b))
      .filter((_, i, all) => i === 0 || i === all.length - 1);
    expect(temperamentPart(smoothest, tired)).toBeGreaterThan(temperamentPart(roughest, tired));
  });
});
