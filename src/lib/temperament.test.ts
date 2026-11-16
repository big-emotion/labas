import { describe, expect, it } from "vitest";
import { archetypeOf } from "./temperament";
import { bestMatches, type Answers } from "./ranking";

const all = (
  saturday: number,
  adventure: string,
  order: number,
  together: number,
  friction: number,
) => ({ saturday, adventure, order, together, friction }) as Answers;

describe("the reader's temperament", () => {
  it("waits for the five temperament answers before naming anything", () => {
    expect(archetypeOf({ saturday: 1, adventure: "seeking" })).toBeUndefined();
  });

  it("names the closest of five archetypes, in « vous » and as preferences", () => {
    const social = archetypeOf(all(1, "open", 0.5, 1, 0.5))!;
    expect(social.name).toBe("Lien");
    expect(social.text).toMatch(/^Vous aimez/);
    expect(archetypeOf(all(0, "familiar", 1, 1, 0))!.name).toBe("Refuge");
    expect(archetypeOf(all(1, "open", 0, 0, 1))!.name).toBe("Conquête");
  });

  // Operator, 2026-11-16: no city « works as planned », not even Paris; a reader who needs order
  // likes simple, predictable procedures.
  it("never promises a city that works as planned", () => {
    const orderly = archetypeOf(all(0.5, "open", 1, 0.5, 0.5))!;
    expect(orderly.name).toBe("Fondation");
    expect(orderly.text).not.toMatch(/comme prévu/);
    expect(orderly.text).toMatch(/prévisibles/);
  });

  it("gives the five traits on a 0 to 1 scale", () => {
    const traits = archetypeOf(all(1, "seeking", 0, 0.5, 1))!.traits;
    expect(traits.map((t) => t.name)).toEqual([
      "Extraversion",
      "Ouverture",
      "Conscience",
      "Agréabilité",
      "Stabilité",
    ]);
    expect(traits.map((t) => t.value)).toEqual([1, 1, 0, 0.5, 1]);
  });
});

describe("the two parts of a city's score", () => {
  const reader = {
    ...all(1, "open", 0.5, 1, 0.5),
    languages: ["fr"],
    budget: "moyen",
  } as Answers;

  it("splits the score into temperament and practical life", () => {
    const [first] = bestMatches(reader, 1);
    expect(first.temperament).toBeGreaterThan(0);
    expect(first.temperament).toBeLessThanOrEqual(1);
    expect(first.practical).toBeGreaterThan(0);
  });

  it("has no temperament part before a temperament answer", () => {
    const [first] = bestMatches({ languages: ["fr"] }, 1);
    expect(first.temperament).toBeNull();
  });

  it("rates each reason from 1 to 5", () => {
    const [first] = bestMatches(reader, 1);
    expect(first.reasons.length).toBeGreaterThan(0);
    for (const r of [...first.reasons, ...first.drawbacks]) {
      expect(r.label).toBeTruthy();
      expect(r.level).toBeGreaterThanOrEqual(1);
      expect(r.level).toBeLessThanOrEqual(5);
    }
  });
});
