import { describe, expect, it } from "vitest";
import { CITIES, CRITERIA, CRITERION_KEYS, ZONES } from "./cities";

describe("the city catalogue", () => {
  it("covers all 54 countries of the continent with 115 cities", () => {
    expect(CITIES).toHaveLength(115);
    // « Somalie (Somaliland) » names a region inside a state: count the state.
    const states = CITIES.map((city) => city.country.replace(/ \(.*\)$/, ""));
    expect(new Set(states).size).toBe(54);
  });

  it("gives every city a unique name and address", () => {
    expect(new Set(CITIES.map((city) => city.name)).size).toBe(CITIES.length);
    expect(new Set(CITIES.map((city) => city.slug)).size).toBe(CITIES.length);
  });

  it("places every city on the African map", () => {
    for (const city of CITIES) {
      expect(city.lat, city.name).toBeGreaterThan(-36);
      expect(city.lat, city.name).toBeLessThan(38);
      expect(city.lon, city.name).toBeGreaterThan(-26);
      expect(city.lon, city.name).toBeLessThan(60);
    }
  });

  it("defines every criterion it scores, with a written rubric", () => {
    expect(CRITERIA.map((c) => c.key).sort()).toEqual([...CRITERION_KEYS].sort());
    for (const criterion of CRITERIA) {
      expect(criterion.rubric["1"], criterion.key).toBeTruthy();
      expect(criterion.rubric["3"], criterion.key).toBeTruthy();
      expect(criterion.rubric["5"], criterion.key).toBeTruthy();
    }
  });

  it("scores every criterion on the rubric, or says it does not know", () => {
    for (const city of CITIES) {
      for (const key of CRITERION_KEYS) {
        const score = city.scores[key];
        expect(score, `${city.name} ${key}`).toBeDefined();
        if (score.level !== null) {
          expect(Number.isInteger(score.level), `${city.name} ${key}`).toBe(true);
          expect(score.level, `${city.name} ${key}`).toBeGreaterThanOrEqual(0);
          expect(score.level, `${city.name} ${key}`).toBeLessThanOrEqual(5);
        }
        expect(score.justification.length, `${city.name} ${key}`).toBeGreaterThan(5);
      }
    }
  });

  it("backs every score that is not an estimate with a dated source", () => {
    for (const city of CITIES) {
      for (const key of CRITERION_KEYS) {
        const score = city.scores[key];
        if (score.level === null || score.confidence === "editorial") continue;
        expect(score.sources.length, `${city.name} ${key}`).toBeGreaterThan(0);
        for (const source of score.sources) {
          expect(source.url, `${city.name} ${key}`).toMatch(/^https?:\/\//);
          expect(source.accessed, `${city.name} ${key}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    }
  });

  it("sources the travel advice that decides whether a city is proposed", () => {
    for (const city of CITIES) {
      expect(city.facts.advisory.sources.length, city.name).toBeGreaterThan(0);
    }
    const advisedAgainst = (name: string) =>
      CITIES.find((city) => city.name === name)?.advisedAgainst;
    expect(advisedAgainst("Bamako")).toBe(true);
    expect(advisedAgainst("Dakar")).toBe(false);
  });

  it("knows the national facts of every city's country", () => {
    for (const city of CITIES) expect(city.countryFacts, city.name).toBeDefined();
  });

  it("files every city under a known zone and size", () => {
    for (const city of CITIES) {
      expect(Object.keys(ZONES), city.name).toContain(city.zone);
      expect([1, 2, 3], city.name).toContain(city.size);
    }
  });

  it("tells the reader what to watch out for in every city", () => {
    for (const city of CITIES) {
      expect(city.pitch.length, city.name).toBeGreaterThan(20);
      expect(city.watch.length, city.name).toBeGreaterThan(10);
    }
  });
});
