import { describe, expect, it } from "vitest";
import { temperamentOf } from "./city-temperament";
import { rankCities, type Answers } from "./ranking";

const linesOf = (cityName: string, answers: Answers) =>
  rankCities(answers).find((m) => m.city.name === cityName)!.temperamentLines;

// Operator, 2026-11-15: beside each percentage, why this city gets it for this profile.
describe("why a city fits the reader's temperament, neighbourhood by neighbourhood", () => {
  it("counts the neighbourhoods at the reader's level", () => {
    const kigali = temperamentOf("Kigali")!;
    expect(linesOf("Kigali", { saturday: 0 })).toEqual([
      `Calme le soir : ${kigali.saturday[0]} quartiers sur ${kigali.areas}`,
    ]);
  });

  it("gives one line per temperament answer, and none before any", () => {
    const answers: Answers = { saturday: 1, order: 1, together: 0.5 };
    expect(linesOf("Dakar", answers)).toHaveLength(3);
    expect(linesOf("Dakar", { project: "installer" })).toEqual([]);
  });

  it("counts calm and occasional friction together for a reader whom it weighs on", () => {
    const lagos = temperamentOf("Lagos")!;
    expect(linesOf("Lagos", { friction: 0.5 })).toEqual([
      `Peu d'imprévus : ${lagos.friction[0] + lagos.friction[1]} quartier${lagos.friction[0] + lagos.friction[1] > 1 ? "s" : ""} sur ${lagos.areas}`,
    ]);
  });

  it("says nothing about friction to a reader whom it amuses: every city suits them", () => {
    expect(linesOf("Lagos", { friction: 1 })).toEqual([]);
  });

  it("says when a city was rated as a whole, without neighbourhoods", () => {
    const whole = temperamentOf("Bamako")!;
    expect(whole.editorial).toBe(true);
    expect(linesOf("Bamako", { saturday: 0 })[0]).toMatch(/estimation pour la ville$/);
  });
});
