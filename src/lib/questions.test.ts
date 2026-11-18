import { describe, expect, it } from "vitest";
import { chapterName, LATER, QUESTIONS, questionIn, visibleChoices } from "./questions";
import { DEEP_QUESTIONS } from "./deep-questions";
import { CITIES } from "./cities";
import { looksFrench } from "../i18n/looks-french";
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

  // The bank is a pool: the path, not its order, decides what comes next (operator, 2026-11-17).
  it("offers each question once, with distinct answers", () => {
    expect([...QUESTIONS.map((q) => q.id)].sort()).toEqual(
      [
        "project",
        "wants",
        "season",
        "profession",
        "family",
        "languages",
        "size",
        "pace",
        "landscapes",
        "saturday",
        "adventure",
        "order",
        "together",
        "friction",
        "origin",
        "kin",
        "priorities",
      ].sort(),
    );
    expect(new Set(QUESTIONS.map((q) => q.group))).toEqual(
      new Set([
        "Votre projet",
        "Votre voyage",
        "Votre tempérament",
        "Votre histoire avec l'Afrique",
        "Pour finir",
      ]),
    );
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

describe("the question bank in English", () => {
  it("has every title, hint, answer and sub-line in English", () => {
    for (const french of DEEP_QUESTIONS) {
      const english = questionIn(french, "en");
      expect(Boolean(english.hint), french.id).toBe(Boolean(french.hint));
      const texts = [english.title, english.hint ?? ""];
      expect(english.choices.map((c) => c.value).sort()).toEqual(
        french.choices.map((c) => c.value).sort(),
      );
      english.choices.forEach((choice) => {
        const source = french.choices.find((c) => c.value === choice.value)!;
        expect(Boolean(choice.sub), `${french.id}: ${choice.label}`).toBe(Boolean(source.sub));
        texts.push(choice.label, choice.sub ?? "");
      });
      for (const text of texts) expect(looksFrench(text), `${french.id}: ${text}`).toBe(false);
    }
  });

  it("keeps the French bank as it is", () => {
    expect(questionIn(QUESTIONS[0], "fr")).toBe(QUESTIONS[0]);
  });

  it("names the chapters in English", () => {
    const project = QUESTIONS.find((q) => q.id === "family")!;
    expect(chapterName(project, { project: "decouvrir" }, "en")).toBe("Your trip");
    expect(chapterName(project, { project: "installer" }, "fr")).toBe("Votre projet");
  });

  it("sorts the family's countries in English", () => {
    const countries = questionIn(
      LATER.find((q) => q.id === "countries")!,
      "en",
    );
    const labels = countries.choices.filter((c) => c.value !== null).map((c) => c.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "en-GB")));
    expect(labels).toContain("Senegal");
  });
});
