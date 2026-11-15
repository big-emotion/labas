import { describe, expect, it } from "vitest";
import { nextQuestion } from "./adaptive";
import { DEEP_QUESTIONS, PROFILE_QUESTIONS } from "./deep-questions";
import { rankCities, type Answers } from "./ranking";

// docs/criteria/adaptive-questions.md, validated by the operator on 2026-11-15.
const HOLIDAY_NIGHT: Answers = { project: "decouvrir", saturday: 1, adventure: "open" };
const SETTLER_REFUGE: Answers = { project: "installer", saturday: 0, order: 1, friction: 0 };

const order = (answers: Answers) => rankCities(answers).map((m) => m.city.name);
const ids = (answers: Answers) =>
  PROFILE_QUESTIONS.filter((q) => q.when?.(answers) ?? true).map((q) => q.id);

describe("questions that follow the reader's profile", () => {
  it("asks a reader on holiday who goes out about nights and days, not about work", () => {
    expect(ids(HOLIDAY_NIGHT)).toEqual(expect.arrayContaining(["nightOut", "daytime"]));
    expect(ids(HOLIDAY_NIGHT)).not.toEqual(
      expect.arrayContaining(["afterWork", "quietStay", "evenings"]),
    );
  });

  it("asks a calm, orderly settler about evenings and what must work, not about nights out", () => {
    expect(ids(SETTLER_REFUGE)).toEqual(expect.arrayContaining(["evenings", "mustWork"]));
    expect(ids(SETTLER_REFUGE)).not.toEqual(expect.arrayContaining(["nightOut", "daytime"]));
  });

  it("asks the profile questions before the general ones", () => {
    for (const answers of [HOLIDAY_NIGHT, SETTLER_REFUGE]) {
      const next = nextQuestion(answers, Object.keys(answers));
      expect(ids(answers), JSON.stringify(answers)).toContain(next);
    }
  });

  it("goes on with the general questions once the profile ones are answered or skipped", () => {
    const asked = [...Object.keys(HOLIDAY_NIGHT), ...ids(HOLIDAY_NIGHT)];
    const next = nextQuestion(HOLIDAY_NIGHT, asked);
    expect(next).toBeDefined();
    expect(PROFILE_QUESTIONS.map((q) => q.id)).not.toContain(next);
  });

  it("is part of the full questionnaire, each question once", () => {
    for (const q of PROFILE_QUESTIONS)
      expect(DEEP_QUESTIONS.filter((d) => d.id === q.id)).toHaveLength(1);
  });

  // A question whose answer moves no city is not worth the reader's time.
  it("moves the ranking with every answer of every profile question", () => {
    for (const question of PROFILE_QUESTIONS) {
      for (const choice of question.choices) {
        const base: Answers = { project: "installer", saturday: 0.5 };
        const value = question.max ? [choice.value] : choice.value;
        const answered = { ...base, [question.id]: value } as Answers;
        expect(order(answered), `${question.id}: ${choice.label}`).not.toEqual(order(base));
      }
    }
  });

  it("draws a reader who wants only the beach towards the sea", () => {
    const beach = (answers: Answers) =>
      rankCities(answers)
        .slice(0, 10)
        .filter((m) => m.city.facts.settings.some((s) => s === "ocean" || s === "island")).length;
    const calm: Answers = { project: "decouvrir", saturday: 0 };
    expect(beach({ ...calm, quietStay: "beach" })).toBeGreaterThan(beach(calm));
  });
});
