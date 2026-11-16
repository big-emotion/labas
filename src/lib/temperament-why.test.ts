import { describe, expect, it } from "vitest";
import { temperamentOf } from "./city-temperament";
import { rankCities, type Answers } from "./ranking";

const entriesOf = (cityName: string, answers: Answers) =>
  rankCities(answers).find((m) => m.city.name === cityName)!.temperamentLines;
const linesOf = (cityName: string, answers: Answers) =>
  entriesOf(cityName, answers).map((line) => line.text);

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
    const dakar = temperamentOf("Dakar")!;
    const smooth = dakar.friction[0] + dakar.friction[1];
    expect(smooth).toBeGreaterThan(1);
    expect(linesOf("Dakar", { friction: 0.5 })).toEqual([
      `Peu d'imprévus : ${smooth} quartiers sur ${dakar.areas}`,
    ]);
    // Lagos has none: the line says so (all its neighbourhoods demand composure).
    expect(linesOf("Lagos", { friction: 0.5 })).toEqual(["Peu d'imprévus : aucun quartier"]);
  });

  it("says nothing about friction to a reader whom it amuses: every city suits them", () => {
    expect(linesOf("Lagos", { friction: 1 })).toEqual([]);
  });

  it("says when a city was rated as a whole, without neighbourhoods", () => {
    const whole = temperamentOf("Bamako")!;
    expect(whole.editorial).toBe(true);
    expect(linesOf("Bamako", { saturday: 0 })[0]).toMatch(/estimation pour la ville$/);
  });

  // Operator, 2026-11-16: keep the lines that count nothing, readable and last.
  it("says « aucun quartier » when none fits, marks it against the city and puts it last", () => {
    expect(temperamentOf("Grand-Bassam")!.saturday[2]).toBe(0);
    const lines = entriesOf("Grand-Bassam", { saturday: 1, order: 0.5 });
    expect(lines.at(-1)).toEqual({ text: "On sort tard : aucun quartier", weak: true });
    expect(lines[0].weak).toBe(false);
  });
});
