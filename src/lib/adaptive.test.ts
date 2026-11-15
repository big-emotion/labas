import { describe, expect, it } from "vitest";
import { freeQuestions, nextFreeQuestion, nextQuestion } from "./adaptive";
import { QUESTIONS } from "./questions";
import { topCities, type Answers } from "./ranking";
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
    for (let id = nextFreeQuestion({}, []); id; id = nextFreeQuestion(answers as Answers, asked)) {
      const question = QUESTIONS.find((q) => q.id === id)!;
      const offered = question.choices.filter((c) => c.value !== null);
      const choice = offered[pick % offered.length];
      answers[id] = question.max ? [choice.value] : choice.value;
      asked.push(id);
    }
    return { answers: answers as Answers, asked };
  }

  it("asks every question this reader can see, each once", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { answers, asked } = play(pick);
      expect([...asked].sort()).toEqual(
        freeQuestions(answers)
          .map((q) => q.id)
          .sort(),
      );
    }
  });

  it("asks next the open question whose answers change the top five the most", () => {
    const answers = { project: "installer", languages: ["fr"] } as Answers;
    const asked = ["project", "languages"];
    const before = new Set(topCities(answers, 5));
    const moved = (id: string) => {
      const question = QUESTIONS.find((q) => q.id === id)!;
      const offered = question.choices.filter((c) => c.value !== null);
      const counts = offered.map((c) => {
        const tried = { ...answers, [id]: question.max ? [c.value] : c.value } as Answers;
        return topCities(tried, 5).filter((name) => !before.has(name)).length;
      });
      return counts.reduce((a, b) => a + b, 0) / counts.length;
    };
    const open = freeQuestions(answers).filter((q) => !asked.includes(q.id));
    const best = Math.max(...open.map((q) => moved(q.id)));
    expect(moved(nextFreeQuestion(answers, asked)!)).toBe(best);
  });

  it("opens on the life project: with no answer every city ties, so nothing else can be weighed", () => {
    expect(nextFreeQuestion({}, [])).toBe("project");
  });

  it("lets each answer choose the next question", () => {
    const orders = [0, 1, 2, 3].map((pick) => play(pick).asked.join(","));
    expect(new Set(orders).size).toBeGreaterThan(1);
  });

  it("asks a conditional question only once its condition holds", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { asked } = play(pick);
      if (asked.includes("faith"))
        expect(asked.indexOf("faith")).toBeGreaterThan(asked.indexOf("kin"));
      if (asked.includes("countries"))
        expect(asked.indexOf("countries")).toBeGreaterThan(asked.indexOf("origin"));
    }
  });

  it("stops after the last question", () => {
    const { answers, asked } = play(0);
    expect(nextFreeQuestion(answers, asked)).toBeUndefined();
  });
});
