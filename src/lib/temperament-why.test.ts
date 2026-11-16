import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { neighbourhoodLine, temperamentOf, TRAITS } from "./city-temperament";
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
    const answers: Answers = { saturday: 1, adventure: "seeking", together: 0.5 };
    expect(linesOf("Dakar", answers)).toHaveLength(3);
    expect(linesOf("Dakar", { project: "installer" })).toEqual([]);
  });

  it("says when a city was rated as a whole, without neighbourhoods", () => {
    const whole = temperamentOf("Bamako")!;
    expect(whole.editorial).toBe(true);
    expect(linesOf("Bamako", { saturday: 0 })[0]).toMatch(/selon notre estimation$/);
  });

  // Operator, 2026-11-16: keep the lines that count nothing, readable and last.
  it("says « aucun quartier » when none fits, marks it against the city and puts it last", () => {
    expect(temperamentOf("Grand-Bassam")!.saturday[2]).toBe(0);
    const lines = entriesOf("Grand-Bassam", { saturday: 1, together: 0.5, order: 0.5 });
    expect(lines.at(-1)).toEqual({
      text: "Aucun quartier où l'on sort tard, selon nos sources",
      weak: true,
    });
    expect(lines[0].weak).toBe(false);
  });

  // « Tout fonctionne comme prévu : aucun quartier » read as if things worked, and « aucun » is a
  // claim on our notes, not on the city: it says so (operator, 2026-11-16).
  it("writes a line that counts nothing as a sentence, for every axis and level", () => {
    let seen = 0;
    for (const city of CITIES)
      for (const trait of TRAITS)
        for (const reader of [0, 0.5, 1]) {
          const line = neighbourhoodLine(city.name, trait, reader);
          if (!line?.weak) continue;
          expect(line.text, `${city.name} ${trait} ${reader}`).toMatch(
            temperamentOf(city.name)!.editorial
              ? /^Pas une ville \S.*, selon notre estimation$/
              : /^Aucun quartier \S.*, selon nos sources$/,
          );
          expect(line.text).not.toContain(" : ");
          seen++;
        }
    expect(seen).toBeGreaterThan(0);
  });
});

// Operator, 2026-11-16: no city can be said to « work as planned », not even Paris. Organisation
// and friction become one gauge of how many surprises to plan for, like the criteria gauges.
describe("the gauge of surprises to plan for", () => {
  const gaugeOf = (cityName: string, answers: Answers) =>
    entriesOf(cityName, answers).filter((line) => line.gauge);

  it("shows one « Prévoir des imprévus » gauge for either answer, never two lines", () => {
    for (const answers of [
      { order: 1 },
      { friction: 0 },
      { friction: 1 },
      { order: 0, friction: 0.5 },
    ]) {
      const lines = entriesOf("Dakar", answers as Answers);
      expect(lines, JSON.stringify(answers)).toHaveLength(1);
      expect(lines[0].gauge!.level).toBeGreaterThanOrEqual(1);
      expect(lines[0].gauge!.level).toBeLessThanOrEqual(5);
      expect(lines[0].text).toBe(`Prévoir des imprévus : ${lines[0].gauge!.level} sur 5`);
    }
    expect(gaugeOf("Dakar", { saturday: 1 })).toEqual([]);
  });

  it("asks to plan for more surprises where people improvise than where it is orderly", () => {
    const level = (name: string) => gaugeOf(name, { order: 1 })[0].gauge!.level;
    expect(level("Lagos")).toBeGreaterThan(level("Kigali"));
  });

  it("marks the gauge of a city rated as a whole as an estimate", () => {
    const [line] = gaugeOf("Bamako", { friction: 0.5 });
    expect(line.gauge!.estimate).toBe(true);
    expect(line.text).toMatch(/, estimation$/);
    expect(gaugeOf("Dakar", { friction: 0.5 })[0].gauge!.estimate).toBe(false);
  });

  it("sits after the lines that fit and before those that count nothing, never against the city", () => {
    const lines = entriesOf("Grand-Bassam", { saturday: 1, together: 0.5, order: 0.5 });
    const at = lines.findIndex((line) => line.gauge);
    expect(lines[at].weak).toBe(false);
    expect(lines.slice(0, at).every((line) => !line.weak && !line.gauge)).toBe(true);
    expect(lines.slice(at + 1).every((line) => line.weak)).toBe(true);
  });

  it("never says a city works as planned", () => {
    for (const city of CITIES)
      for (const line of entriesOf(city.name, { order: 1, friction: 0, saturday: 1 }))
        expect(line.text, city.name).not.toMatch(/comme prévu/);
  });
});
