import { describe, expect, it } from "vitest";
import { freeQuestions, nextFreeQuestion, nextQuestion } from "./adaptive";
import { QUESTIONS } from "./questions";
import type { Answers } from "./ranking";
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
  it("opens on the life project and follows the bank's order", () => {
    expect(nextFreeQuestion({}, [])).toBe("project");
    expect(nextFreeQuestion({ project: "installer" }, ["project"])).toBe("origin");
  });

  it("skips a question whose condition does not hold", () => {
    // No African region picked: no country question; feeling at home does not matter: no faith.
    const answers = { origin: ["ameriques"], kin: "none" } as Answers;
    expect(nextFreeQuestion(answers, ["project", "origin"])).toBe("kin");
    expect(nextFreeQuestion(answers, ["project", "origin", "kin"])).toBe("saturday");
  });

  it("counts the questions this reader will see", () => {
    expect(freeQuestions({}).length).toBe(16);
    expect(freeQuestions({ origin: ["ouest"], kin: "much" } as Answers).length).toBe(18);
  });

  it("stops after the last question", () => {
    expect(
      nextFreeQuestion(
        {},
        QUESTIONS.map((q) => q.id),
      ),
    ).toBeUndefined();
  });
});
