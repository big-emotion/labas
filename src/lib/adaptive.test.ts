import { describe, expect, it } from "vitest";
import {
  closenessOf,
  freeQuestions,
  MAX_QUESTIONS,
  nextFreeQuestion,
  nextQuestion,
  topThreeSettled,
} from "./adaptive";
import { CHAPTER, QUESTIONS } from "./questions";
import { resultLength, topCities, type Answers } from "./ranking";

/** Answered already in the test that checks the choice of the next question. */
const ANSWERED = ["project", "languages", "origin"];
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

  it("asks the follow-ups of what was just answered before anything else", () => {
    const answers = { project: "installer", origin: ["ouest"], reach: "region" } as Answers;
    const next = nextQuestion(answers, ["project", "origin", "kin"]);
    expect(["faith", "countries"]).toContain(next);
  });

  it("stops when every question has been asked", () => {
    const asked = DEEP_QUESTIONS.map((q) => q.id);
    expect(nextQuestion({}, asked)).toBeUndefined();
  });
});

describe("the quick quiz, one question at a time", () => {
  // Plays the quiz as a reader who always takes the answer at `pick` (wrapping around).
  function play(pick: number) {
    const answers: Record<string, unknown> = {};
    const asked: string[] = [];
    for (let id = nextFreeQuestion({}, []); id; id = nextFreeQuestion(answers as Answers, asked)) {
      const question = DEEP_QUESTIONS.find((q) => q.id === id)!;
      const offered = question.choices.filter((c) => c.value !== null);
      const choice = offered[pick % offered.length];
      answers[id] = question.max ? [choice.value] : choice.value;
      asked.push(id);
    }
    return { answers: answers as Answers, asked };
  }

  // Operator, 2026-11-17: three fixed openers, then the path follows the answers, themes mixed.
  // Operator, 2026-11-20: one fixed question, then the answers decide, origin and languages too.
  it("opens on the life project alone, and still asks the languages and the family's origin", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { asked } = play(pick);
      expect(asked[0]).toBe("project");
      expect(asked).toEqual(expect.arrayContaining(["languages", "origin"]));
    }
  });

  it("lets the page choose among the questions as good as the best one, and only among them", () => {
    const answers = { project: "installer" } as Answers;
    const offered: string[][] = [];
    const last = nextFreeQuestion(answers, ["project"], (asGood) => {
      offered.push(asGood);
      return asGood.at(-1)!;
    });
    expect(offered).toHaveLength(1);
    expect(offered[0]).toContain(last);
    // The default takes the most decisive: the first of the same list.
    expect(nextFreeQuestion(answers, ["project"])).toBe(offered[0][0]);
  });

  it("says how near the quiz is: searching at the start, almost there at the end", () => {
    expect(closenessOf({ project: "installer" } as Answers, ["project"])).toBe("searching");
    const { answers, asked } = play(1);
    expect(closenessOf(answers, asked.slice(0, -1))).toBe("almost");
  });

  it("asks size and pace together, whichever comes first", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { asked } = play(pick);
      if (asked.includes("size") && asked.includes("pace"))
        expect(Math.abs(asked.indexOf("size") - asked.indexOf("pace")), String(pick)).toBe(1);
    }
  });

  it("asks a follow-up right after the question it follows", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { asked } = play(pick);
      if (asked.includes("countries"))
        expect(asked.indexOf("countries"), String(pick)).toBe(asked.indexOf("origin") + 1);
      if (asked.includes("faith"))
        expect(asked.indexOf("faith"), String(pick)).toBe(asked.indexOf("reach") + 1);
    }
  });

  it("after the first answers, asks the open question that changes the top three the most, whatever its theme", () => {
    const answers = { project: "installer", languages: ["fr"], origin: null } as unknown as Answers;
    const asked = [...ANSWERED];
    const before = new Set(topCities(answers, 3));
    const moved = (id: string) => {
      const question = DEEP_QUESTIONS.find((q) => q.id === id)!;
      const offered = question.choices.filter((c) => c.value !== null);
      const counts = offered.map((c) => {
        const tried = { ...answers, [id]: question.max ? [c.value] : c.value } as Answers;
        return topCities(tried, 3).filter((name) => !before.has(name)).length;
      });
      return counts.reduce((a, b) => a + b, 0) / counts.length;
    };
    const open = freeQuestions(answers).filter(
      (q) => !asked.includes(q.id) && q.id !== "priorities",
    );
    const best = Math.max(...open.map((q) => moved(q.id)));
    expect(moved(nextFreeQuestion(answers, asked)!)).toBe(best);
  });

  // Operator, 2026-11-20: a reader who named the family's country and said it mattered a lot had
  // a top three no further answer could change; the quiz ended after eight questions without
  // asking how they live. The temperament still orders the cities and fills their profile.
  it("always asks the whole temperament chapter, even when the top three is already settled", () => {
    const settled = {
      project: "installer",
      languages: ["fr"],
      origin: ["ouest"],
      countries: ["Sénégal"],
    } as Answers;
    const answers: Record<string, unknown> = { ...settled };
    const asked = Object.keys(settled);
    for (let id = nextFreeQuestion(answers as Answers, asked); id;) {
      const question = DEEP_QUESTIONS.find((q) => q.id === id)!;
      const choice = question.choices.filter((c) => c.value !== null)[0];
      answers[id] = question.max ? [choice.value] : choice.value;
      asked.push(id);
      id = nextFreeQuestion(answers as Answers, asked);
    }
    // « Aller vers l'inconnu » is told by « Jusqu'où aimeriez-vous aller ? » once an origin is named.
    const temperament = ["saturday", "order", "together", "friction"];
    expect(asked).toEqual(expect.arrayContaining(temperament));
    expect(asked).not.toContain("adventure");
    expect(asked.at(-1)).toBe("priorities");
  });

  // Operator, 2026-11-20: the one question on distance comes at the end, so the map keeps
  // showing unexpected cities until the reader settles it; the faith follows it.
  it("asks how far the reader would go just before the closing question, then the faith", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { asked, answers } = play(pick);
      if (!asked.includes("reach")) continue;
      const tail = asked.slice(asked.indexOf("reach"));
      // After « anywhere », the other side of the Sahara takes the faith's place.
      const across = QUESTIONS.find((q) => q.id === "acrossSahara")!;
      const followUp =
        answers.reach !== "anywhere" ? "faith" : across.when?.(answers) ? "acrossSahara" : null;
      expect(tail, String(pick)).toEqual(
        followUp ? ["reach", followUp, "priorities"] : ["reach", "priorities"],
      );
    }
  });

  it("asks « aller vers l'inconnu » itself only of a reader who named no origin", () => {
    const unnamed = { project: "installer", origin: [null] } as unknown as Answers;
    const named = { project: "installer", origin: ["ouest"] } as Answers;
    const offered = (answers: Answers) => freeQuestions(answers).map((q) => q.id);
    expect(offered(unnamed)).toContain("adventure");
    expect(offered(unnamed)).not.toContain("reach");
    expect(offered(named)).toContain("reach");
    expect(offered(named)).not.toContain("adventure");
    // Not before the origin was asked: the reader would answer the same thing twice.
    expect(offered({ project: "installer" } as Answers)).not.toContain("adventure");
  });

  it("stops once no open question could change the top three, short of the whole bank", () => {
    const lengths = [0, 1, 2, 3].map((pick) => {
      const { answers, asked } = play(pick);
      return { asked: asked.length, bank: freeQuestions(answers).length };
    });
    for (const { asked, bank } of lengths) expect(asked).toBeLessThanOrEqual(bank);
    expect(lengths.some(({ asked, bank }) => asked < bank)).toBe(true);
  });

  // Beta feedback, 2026-11-16: asked in the middle, « Ce qui compte le plus » read as a riddle;
  // asked last, it reads as « now, what will you not compromise on ».
  it("asks the non-negotiables last, just before the result", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { asked } = play(pick);
      if (asked.includes("priorities")) expect(asked.at(-1), String(pick)).toBe("priorities");
    }
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

  it("never asks a question twice", () => {
    for (const pick of [0, 1, 2, 3]) {
      const { asked } = play(pick);
      expect(new Set(asked).size).toBe(asked.length);
    }
  });
});

describe("a path that fits the project", () => {
  const ids = (answers: Answers) => freeQuestions(answers).map((q) => q.id);
  const LIFE_THERE = [
    "saturday",
    "adventure",
    "order",
    "together",
    "friction",
    "family",
    "landscapes",
    "profession",
  ];

  it("does not ask a holidaymaker about their job", () => {
    const visitor = ids({ project: "decouvrir" } as Answers);
    expect(visitor).not.toContain("profession");
    expect(visitor).toContain("family");
  });

  it("asks everything of a reader who comes to live", () => {
    for (const project of ["installer", "pied", "tester"])
      for (const id of LIFE_THERE)
        // « Aller vers l'inconnu » is offered once the reader has declined to name an origin.
        expect(
          ids({ project, origin: [null] } as unknown as Answers),
          `${project} ${id}`,
        ).toContain(id);
  });
});

// Operator, 2026-11-25: a longer quick quiz that draws from the whole questionnaire until the
// list it shows is settled, the full questionnaire being rarely opened (9 of 171 readers).
describe("the longer quick quiz", () => {
  const FILTERS = [
    "avoidRegions",
    "languageOnly",
    "schoolCurriculum",
    "specialistCare",
    "excludeCriminalising",
  ];
  function play(pick: number) {
    const answers: Record<string, unknown> = {};
    const asked: string[] = [];
    const settledAt: number[] = [];
    for (let id = nextFreeQuestion({}, []); id; id = nextFreeQuestion(answers as Answers, asked)) {
      const question = DEEP_QUESTIONS.find((q) => q.id === id)!;
      const offered = question.choices.filter((c) => c.value !== null);
      const choice = offered[pick % offered.length];
      answers[id] = question.max ? [choice.value] : choice.value;
      asked.push(id);
      if (topThreeSettled(answers as Answers, asked)) settledAt.push(asked.length);
    }
    return { answers: answers as Answers, asked, settledAt };
  }
  const plays = [0, 1, 2, 3].map(play);

  it("draws from the full questionnaire, not only the quick one", () => {
    const quick = new Set<string>(QUESTIONS.map((q) => q.id));
    expect(plays.some(({ asked }) => asked.some((id) => !quick.has(id)))).toBe(true);
  });

  it("never asks a filter that takes cities off the list", () => {
    for (const { asked } of plays) for (const id of FILTERS) expect(asked).not.toContain(id);
  });

  it("asks the visa of a reader who comes to try or for a holiday", () => {
    const answers = { project: "tester", languages: ["fr"] } as Answers;
    expect(freeQuestions(answers).map((q) => q.id)).toContain("visaFreeOnly");
  });

  it(`never asks more than ${MAX_QUESTIONS} questions`, () => {
    for (const { asked } of plays) expect(asked.length).toBeLessThanOrEqual(MAX_QUESTIONS);
  });

  it("asks only questions that could change the cities the result would show", () => {
    for (const pick of [0, 1, 2, 3]) {
      const answers: Record<string, unknown> = {};
      const asked: string[] = [];
      for (
        let id = nextFreeQuestion({}, []);
        id;
        id = nextFreeQuestion(answers as Answers, asked)
      ) {
        const question = DEEP_QUESTIONS.find((q) => q.id === id)!;
        const offered = question.choices.filter((c) => c.value !== null);
        const owed =
          question.after ||
          question.group === CHAPTER.temperament ||
          ["origin", "reach", "priorities"].includes(id);
        if (asked.length >= 1 && !owed) {
          const length = resultLength(answers as Answers);
          const before = new Set(topCities(answers as Answers, length));
          const changes = offered.some((c) =>
            topCities(
              { ...answers, [id]: question.max ? [c.value] : c.value } as Answers,
              length,
            ).some((name) => !before.has(name)),
          );
          expect(changes, `${pick} ${id}`).toBe(true);
        }
        const choice = offered[pick % offered.length];
        answers[id] = question.max ? [choice.value] : choice.value;
        asked.push(id);
      }
    }
  });

  it("says when the top three can no longer move, so the cities can be seen before the end", () => {
    expect(topThreeSettled({ project: "installer" } as Answers, ["project"])).toBe(false);
    expect(
      plays.some(({ asked, settledAt }) => settledAt.length && settledAt[0] < asked.length),
    ).toBe(true);
  });
});
