import { describe, expect, it } from "vitest";
import { gauge, isSettled, nextFreeQuestion, nextQuestion } from "./adaptive";
import { QUESTIONS } from "./questions";
import { bestMatches, type Answers } from "./ranking";
import { DEEP_QUESTIONS } from "./deep-questions";

describe("choosing the next question", () => {
  it("starts with the life project", () => {
    expect(nextQuestion({}, [])).toBe("project");
  });

  it("never asks again a question already answered or skipped", () => {
    const asked = ["project", "saturday", "budget"];
    const next = nextQuestion({ project: "tester", saturday: 1 }, asked);
    expect(next).toBeDefined();
    expect(asked).not.toContain(next);
  });

  it("stops when every question has been asked", () => {
    const asked = DEEP_QUESTIONS.map((q) => q.id);
    expect(nextQuestion({}, asked)).toBeUndefined();
  });
});

describe("the free quiz, one question at a time", () => {
  // Plays the quiz as a reader who always takes the answer at `pick` (wrapping around).
  function play(pick: number) {
    const answers: Record<string, unknown> = {};
    const asked: string[] = [];
    const tops: string[][] = [];
    for (;;) {
      const id = nextFreeQuestion(answers as Answers, asked);
      if (!id || isSettled(asked.length, tops)) break;
      const question = QUESTIONS.find((q) => q.id === id)!;
      const choice = question.choices[pick % question.choices.length];
      answers[id] = question.max ? [choice.value] : choice.value;
      asked.push(id);
      tops.push(bestMatches(answers as Answers, 3).map((m) => m.city.name));
    }
    return { answers, asked };
  }

  it("opens on the life project", () => {
    expect(nextFreeQuestion({}, [])).toBe("project");
  });

  it("asks about faith only when feeling at home among one's own matters", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { answers, asked } = play(pick);
      if (asked.includes("faith")) expect(["much", "some"]).toContain(answers.kin);
    }
  });

  it("settles after 8 to 12 questions, never asking one twice", () => {
    for (const pick of [0, 1, 2, 3, 4]) {
      const { asked } = play(pick);
      expect(asked.length, `pick ${pick}`).toBeGreaterThanOrEqual(8);
      expect(asked.length, `pick ${pick}`).toBeLessThanOrEqual(12);
      expect(new Set(asked).size).toBe(asked.length);
    }
  });

  it("fills the gauge as answers come in, and fills it once settled", () => {
    expect(gauge(0, false)).toBe(0);
    expect(gauge(4, false)).toBeGreaterThan(gauge(2, false));
    expect(gauge(9, false)).toBeLessThan(1);
    expect(gauge(9, true)).toBe(1);
  });
});
