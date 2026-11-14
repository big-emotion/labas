import { describe, expect, it } from "vitest";
import { CITIES, PRACTICAL_CRITERIA, CHARACTER_CRITERIA, ZONES } from "./cities";

describe("the city catalogue", () => {
  it("covers all 54 countries of the continent with 115 cities", () => {
    expect(CITIES).toHaveLength(115);
    // « Somalie (Somaliland) » names a region inside a state: count the state.
    const states = CITIES.map((city) => city.country.replace(/ \(.*\)$/, ""));
    expect(new Set(states).size).toBe(54);
  });

  it("gives every city a unique name", () => {
    expect(new Set(CITIES.map((city) => city.name)).size).toBe(CITIES.length);
  });

  it("places every city on the African map", () => {
    for (const city of CITIES) {
      expect(city.lat, city.name).toBeGreaterThan(-36);
      expect(city.lat, city.name).toBeLessThan(38);
      expect(city.lon, city.name).toBeGreaterThan(-26);
      expect(city.lon, city.name).toBeLessThan(60);
    }
  });

  it("scores every criterion from 0 to 5", () => {
    for (const city of CITIES) {
      for (const criterion of [...PRACTICAL_CRITERIA, ...CHARACTER_CRITERIA]) {
        const score = city.scores[criterion];
        expect(Number.isInteger(score), `${city.name} ${criterion}`).toBe(true);
        expect(score, `${city.name} ${criterion}`).toBeGreaterThanOrEqual(0);
        expect(score, `${city.name} ${criterion}`).toBeLessThanOrEqual(5);
      }
    }
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
