import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";

describe("the ten questions", () => {
  it("speaks to the reader with « tu », never « vous »", () => {
    for (const question of QUESTIONS) {
      const texts = [question.title, ...question.choices.map((choice) => choice.label)];
      for (const text of texts)
        expect(text, question.id).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
    }
  });

  it("keeps ten questions with unique answers", () => {
    expect(QUESTIONS).toHaveLength(10);
    for (const question of QUESTIONS) {
      const values = question.choices.map((choice) => JSON.stringify(choice.value));
      expect(new Set(values).size, question.id).toBe(values.length);
    }
  });
});
