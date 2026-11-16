import { describe, expect, it } from "vitest";
import { revealFor, twinsOf } from "./carousel";
import { bestMatches, type Answers } from "./ranking";
import { CITIES } from "./cities";

describe("revealFor", () => {
  it("reveals the cities the quiz gives, in its order and with its percentages", () => {
    const answers: Answers = { order: 1, crowds: 0, saturday: 0 };

    const reveal = revealFor(answers, 3);

    expect(reveal).toEqual(
      bestMatches(answers, 3).map((m) => ({
        city: m.city.name,
        country: m.city.country,
        percent: Math.round(m.score * 100),
      })),
    );
  });

  it("keeps out the cities a filter of the questionnaire keeps out", () => {
    const answers: Answers = { saturday: 1, excludeCriminalising: true };

    const shown = revealFor(answers, 10).map((r) => r.city);

    expect(shown).toEqual(bestMatches(answers, 10).map((m) => m.city.name));
  });
});

describe("twinsOf", () => {
  const abidjan = CITIES.find((c) => c.slug === "abidjan")!;

  it("finds look-alikes in other countries only", () => {
    const twins = twinsOf("abidjan", ["nightlife"], 5);

    expect(twins).toHaveLength(5);
    for (const twin of twins) {
      const city = CITIES.find((c) => c.name === twin.city)!;
      expect(city.country).not.toBe(abidjan.country);
    }
  });

  it("orders them from the closest, on known levels only", () => {
    const twins = twinsOf("abidjan", ["nightlife", "culture"], 8);

    const gaps = twins.map((t) => t.gap);
    expect(gaps).toEqual([...gaps].sort((a, b) => a - b));
    for (const twin of twins) {
      for (const level of twin.levels) expect(level.level).not.toBeNull();
    }
  });

  it("refuses a city it does not know", () => {
    expect(() => twinsOf("atlantide", ["nightlife"], 3)).toThrow(/atlantide/);
  });
});
