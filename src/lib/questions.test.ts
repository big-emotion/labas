import { describe, expect, it } from "vitest";
import { LATER, QUESTIONS, visibleChoices } from "./questions";
import { CITIES } from "./cities";
import { profileOf, rankCities, type Answers } from "./ranking";

const NEUTRAL = new Set([
  "mobility:car",
  "passports:other",
  "faith:none",
  "kin:none",
  "adventure:open",
  // A month or more away asks nothing of the flights.
  "duration:month",
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

  // Quiz paths audit, 2026-11-16: the bank is ordered by chapter; each path takes its share.
  it("lists the questions chapter by chapter", () => {
    expect(QUESTIONS.map((q) => q.id)).toEqual([
      "project",
      "wants",
      "season",
      "profession",
      "family",
      "languages",
      "size",
      "landscapes",
      "saturday",
      "adventure",
      "order",
      "together",
      "friction",
      "origin",
      "kin",
      "priorities",
    ]);
    const chapters = QUESTIONS.map((q) => q.chapter!);
    expect(chapters).toEqual([...chapters].sort());
    expect([...new Set(QUESTIONS.map((q) => q.group))]).toEqual([
      "Votre projet",
      "Votre voyage",
      "Votre tempérament",
      "Votre histoire avec l'Afrique",
      "Pour finir",
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
    for (const question of [...QUESTIONS, ...LATER]) {
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

  // The language weighs heavily, so a reader who would rather not choose must be able to say so.
  it("lets a reader leave the language open", () => {
    const languages = QUESTIONS.find((q) => q.id === "languages")!;
    expect(languages.choices.some((c) => c.value === null)).toBe(true);
  });

  it("asks about faith only when feeling at home among one's own matters", () => {
    const faith = LATER.find((q) => q.id === "faith")!;
    expect(faith.when?.({ kin: "much" })).toBe(true);
    expect(faith.when?.({ kin: "none" })).toBe(false);
    expect(faith.when?.({})).toBe(false);
  });

  it("asks for the family's country only after an African region, offering every country", () => {
    const countries = LATER.find((q) => q.id === "countries")!;
    expect(countries.when?.({ origin: ["ouest"] })).toBe(true);
    expect(countries.when?.({ origin: ["ameriques"] })).toBe(false);
    expect(countries.when?.({})).toBe(false);
    const offered = countries.choices.filter((c) => c.value !== null).map((c) => c.value);
    expect(new Set(offered)).toEqual(new Set(CITIES.map((c) => c.country)));
    // Each country is offered only once its region is picked.
    const west = visibleChoices(countries, { origin: ["ouest"] }).map((c) => c.value);
    expect(west).toContain("Sénégal");
    expect(west).not.toContain("Kenya");
  });
});
