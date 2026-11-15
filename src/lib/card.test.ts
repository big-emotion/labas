import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { costLabel, livingLines, regionName, sameCountry } from "./card";
import { rankCities } from "./ranking";

const city = (name: string) => CITIES.find((c) => c.name === name)!;

describe("what a city card says about living there", () => {
  it("rates cost, trips home and comfort from the sourced scores", () => {
    const lines = livingLines(city("Dakar"));
    expect(lines.map((l) => l.label)).toEqual([
      "Vivre avec un revenu européen",
      "Allers-retours vers l'Europe",
      "Confort : sécurité, soins, internet",
    ]);
    expect(lines[0].level).toBe(city("Dakar").scores.cost.level);
    expect(lines[1].level).toBe(city("Dakar").scores.flights.level);
  });

  it("leaves out a line no source rates", () => {
    const unrated = CITIES.find((c) => c.scores.cost.level === null)!;
    expect(livingLines(unrated).map((l) => l.label)).not.toContain("Vivre avec un revenu européen");
  });

  it("names the other cities of the same country, with their score, best first", () => {
    const ranked = rankCities({ languages: ["fr"] });
    const others = sameCountry(ranked, city("Dakar"));
    expect(others.map((o) => o.name).sort()).toEqual(["Saint-Louis", "Saly"]);
    expect(others[0].score).toBeGreaterThanOrEqual(others[1].score);
  });
});

describe("the short facts on a city card", () => {
  it("names the region and says the cost of living in words", () => {
    expect(regionName("ouest")).toBe("Afrique de l'Ouest");
    expect(costLabel(5)).toBe("Coût de vie très abordable");
    expect(costLabel(null)).toBeUndefined();
  });
});
