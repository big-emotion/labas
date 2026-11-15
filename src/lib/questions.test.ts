import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { CITIES } from "./cities";
import { profileOf, rankCities, type Answers } from "./ranking";

const NEUTRAL = new Set([
  "mobility:car",
  "passports:other",
  "faith:none",
  "kin:none",
  "adventure:open",
]);

describe("the question bank", () => {
  it("speaks to the reader with « vous », never « tu »", () => {
    for (const question of QUESTIONS) {
      const texts = [question.title, ...question.choices.map((choice) => choice.label)];
      for (const text of texts)
        expect(text, question.id).not.toMatch(
          /(?<![\p{L}'’])(tu|te|toi|ton|ta|tes)(?!\p{L})|(?<!\p{L})t['’](?=\p{L})/iu,
        );
    }
  });

  it("asks the 18 questions of the approved mockup in chapter order", () => {
    expect(QUESTIONS.map((q) => q.id)).toEqual([
      "project",
      "origin",
      "countries",
      "kin",
      "faith",
      "saturday",
      "adventure",
      "order",
      "together",
      "friction",
      "profession",
      "budget",
      "family",
      "passports",
      "languages",
      "size",
      "landscapes",
      "priorities",
    ]);
    expect([...new Set(QUESTIONS.map((q) => q.group))]).toEqual([
      "Votre histoire avec l'Afrique",
      "Votre tempérament",
      "Votre projet de vie",
      "Votre quotidien",
    ]);
    for (const question of QUESTIONS) {
      const values = question.choices.map((choice) => JSON.stringify(choice.value));
      expect(new Set(values).size, question.id).toBe(values.length);
    }
  });

  it("asks each question as a direct question", () => {
    for (const question of QUESTIONS) expect(question.title, question.id).toMatch(/ \?$/);
  });

  it("says in one short sentence what each answer changes", () => {
    for (const question of QUESTIONS) {
      expect(question.hint, question.id).toBeTruthy();
      expect(question.hint!.length, question.id).toBeLessThanOrEqual(120);
    }
  });

  it("opens on the life project", () => {
    expect(QUESTIONS[0].id).toBe("project");
  });

  it("lets every answer move the match", () => {
    for (const question of QUESTIONS) {
      for (const choice of question.choices) {
        // « Rather not say », and answers that ask nothing of a city, leave the match as it is.
        if (choice.value === null || NEUTRAL.has(`${question.id}:${choice.value}`)) continue;
        const value = question.max ? [choice.value] : choice.value;
        const answers = { [question.id]: value } as Answers;
        // Some answers only count together with another one (faith with feeling at home).
        const context = {
          project: "installer",
          origin: "ouest",
          kin: "much",
          currentCity: "capital",
        } as Answers;
        delete (context as Record<string, unknown>)[question.id];
        const profile = profileOf({ ...context, ...answers });
        const base = profileOf(context);
        const moved =
          JSON.stringify(profile) !== JSON.stringify(base) ||
          JSON.stringify(rankCities({ ...context, ...answers }).slice(0, 5)) !==
            JSON.stringify(rankCities(context).slice(0, 5));
        expect(moved, `${question.id}: ${choice.label}`).toBe(true);
      }
    }
  });

  it("asks about faith only when feeling at home among one's own matters", () => {
    const faith = QUESTIONS.find((q) => q.id === "faith")!;
    expect(faith.when?.({ kin: "much" })).toBe(true);
    expect(faith.when?.({ kin: "none" })).toBe(false);
    expect(faith.when?.({})).toBe(false);
  });

  it("asks for the family's country only after an African region, offering every country", () => {
    const countries = QUESTIONS.find((q) => q.id === "countries")!;
    expect(countries.when?.({ origin: ["ouest"] })).toBe(true);
    expect(countries.when?.({ origin: ["ameriques"] })).toBe(false);
    expect(countries.when?.({})).toBe(false);
    const offered = countries.choices.filter((c) => c.value !== null).map((c) => c.value);
    expect(new Set(offered)).toEqual(new Set(CITIES.map((c) => c.country)));
    for (const choice of countries.choices)
      if (choice.value !== null) expect(choice.zone, String(choice.value)).toBeTruthy();
  });
});
