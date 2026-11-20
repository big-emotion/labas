import { describe, expect, it } from "vitest";
import { freeQuestions, nextFreeQuestion, nextQuestion } from "./adaptive";
import { DEEP_QUESTIONS } from "./deep-questions";
import {
  chapterName,
  keepInBank,
  keepInPath,
  QUESTIONS,
  visibleChoices,
  type Question,
} from "./questions";
import { bestMatches, type Answers } from "./ranking";

// « Pas pour moi » asked outright (operator, 2026-11-18): only in the full questionnaire, where
// the reader settles their constraints; the quick quiz keeps it as a gesture on the cities.
describe("the regions the reader does not want to live in", () => {
  const regions = () => DEEP_QUESTIONS.find((q) => q.id === "avoidRegions");

  it("are asked in the full questionnaire only, every region offered, none required", () => {
    expect(QUESTIONS.some((q) => q.id === "avoidRegions")).toBe(false);
    expect(regions()?.choices.map((c) => c.value)).toEqual([
      "ouest",
      "centre",
      "est",
      "sud",
      "nord",
      null,
    ]);
    expect(regions()?.max).toBeGreaterThanOrEqual(4);
  });

  it("are the same filter as the gesture: the cities of a region picked leave the best matches", () => {
    const answers = { project: "installer", avoidRegions: ["nord"] } as Answers;
    expect(nextQuestion(answers, Object.keys(answers))).not.toBe("avoidRegions");
    for (const m of bestMatches(answers, 30)) expect(m.city.zone).not.toBe("nord");
  });
});

// Coherent paths per project (operator, 2026-11-16).
const PROJECTS = ["installer", "pied", "tester", "investir", "decouvrir"] as const;
const question = (id: string): Question => QUESTIONS.find((q) => q.id === id)!;

/** Plays the quick quiz, taking the visible choice at `pick`, as a reader would. */
function play(project: (typeof PROJECTS)[number], pick: number, overrides: Answers = {}) {
  const answers: Record<string, unknown> = { project };
  const asked = ["project"];
  for (let id = nextFreeQuestion(answers as Answers, asked); id;) {
    const q = question(id);
    const given = overrides[id as keyof Answers];
    const choices = visibleChoices(q, answers as Answers);
    const choice = choices[(pick + asked.length) % choices.length];
    answers[id] = given !== undefined ? given : q.max ? [choice.value] : choice.value;
    asked.push(id);
    id = nextFreeQuestion(answers as Answers, asked);
  }
  return { answers: answers as Answers, asked };
}

describe("a path per project", () => {
  it("ends on the non-negotiables, whatever the path", () => {
    for (const project of PROJECTS)
      for (const pick of [0, 1, 2, 3]) {
        const { asked } = play(project, pick);
        expect(asked.at(-1), `${project} ${asked.join(",")}`).toBe("priorities");
      }
  });

  it("names the project questions after the path: the trip on holiday, the project otherwise", () => {
    const shown = (project: (typeof PROJECTS)[number]) => {
      const { answers, asked } = play(project, 0);
      return new Set(
        asked
          .filter((id) => id !== "project" && question(id).group === "Votre projet")
          .map((id) => chapterName(question(id), answers, "fr")),
      );
    };
    expect(shown("decouvrir")).toEqual(new Set(["Votre voyage"]));
    expect(shown("installer")).toEqual(new Set(["Votre projet"]));
  });

  it("asks a holidaymaker how long and what to live, never a job or a landscape", () => {
    const { asked } = play("decouvrir", 0);
    expect(asked).toContain("wants");
    for (const id of ["profession", "landscapes", "tripsHome"]) expect(asked).not.toContain(id);
  });

  it("asks both-feet readers how often they come back; investors nothing about daily life", () => {
    // Offered, not always asked: the path asks it only when it can still change the top three.
    expect(freeQuestions({ project: "pied" }).map((q) => q.id)).toContain("profession");
    const investor = play("investir", 0).asked;
    for (const id of ["saturday", "family", "budget", "duration", "tripsHome"])
      expect(investor).not.toContain(id);
  });
});

describe("questions and choices that fit what was said", () => {
  it("skips country, origins and faith when the reader would rather not say", () => {
    for (const project of PROJECTS) {
      const { asked } = play(project, 0, { origin: [null] as never });
      for (const id of ["countries", "reach", "faith"]) expect(asked, project).not.toContain(id);
    }
    const deep = { project: "installer", origin: [null], kin: undefined } as unknown as Answers;
    const asked = Object.keys(deep);
    for (let id = nextQuestion(deep, asked); id; id = nextQuestion(deep, asked)) {
      expect(["origin", "countries", "kin", "faith", "roots"]).not.toContain(id);
      asked.push(id);
    }
  });

  it("offers health to everyone, schools only with children, a career only when working there, repats not on holiday", () => {
    const priorities = (answers: Answers) =>
      visibleChoices(question("priorities"), answers).map((c) => c.value);
    expect(priorities({ project: "installer", family: "celib" })).toContain("health");
    expect(priorities({ project: "decouvrir", family: "couple" })).toContain("health");
    expect(priorities({ project: "installer", family: "celib" })).not.toContain("schools");
    expect(priorities({ project: "installer", family: "parents" })).toContain("schools");
    expect(priorities({ project: "decouvrir", family: "couple" })).not.toContain("career");
    expect(priorities({ project: "decouvrir", family: "couple" })).not.toContain("diaspora");
    expect(priorities({ project: "investir" })).not.toContain("career");
    expect(
      visibleChoices(question("family"), { project: "decouvrir" }).map((c) => c.value),
    ).not.toContain("fonder");
  });

  it("keeps the full questionnaire to what fits the project", () => {
    const deepAsked = (answers: Answers) => {
      const asked = Object.keys(answers);
      const seen: string[] = [];
      for (let id = nextQuestion(answers, asked); id; id = nextQuestion(answers, asked)) {
        seen.push(id);
        asked.push(id);
      }
      return seen;
    };
    const solo = deepAsked({ project: "decouvrir", family: "celib", origin: [null] as never });
    for (const id of ["schoolCurriculum", "setupBudget", "tripsHome"])
      expect(solo).not.toContain(id);
    const investor = deepAsked({ project: "investir", origin: [null] as never });
    for (const id of ["afterWork", "mobility", "habits", "neighbourhood", "schoolCurriculum"])
      expect(investor).not.toContain(id);
  });
});

describe("going back and changing an answer", () => {
  it("drops the answers that no longer fit, and keeps the others", () => {
    const before: Answers = {
      project: "installer",
      origin: ["ouest"],
      countries: ["Sénégal"],
      reach: "region",
      faith: "muslim",
      family: "parents",
      priorities: ["schools", "safety"],
      saturday: 1,
    };
    // The full questionnaire holds country and faith: its bank drops them too.
    const after = keepInBank(DEEP_QUESTIONS, {
      ...before,
      origin: [null] as never,
      family: "celib",
    });
    expect(after.countries).toBeUndefined();
    expect(after.reach).toBeUndefined();
    expect(after.faith).toBeUndefined();
    expect(after.priorities).toEqual(["safety"]);
    expect(after.saturday).toBe(1);
    expect(keepInPath({ ...before, project: "decouvrir" }).profession).toBeUndefined();
  });

  it("re-routes the rest of the path from the changed answer", () => {
    const { answers } = play("installer", 1);
    // Going back to the project takes the later answers off the « asked » list, the closing one too.
    const changed = keepInPath({ ...answers, project: "decouvrir", priorities: undefined });
    const asked = Object.keys(changed).filter((id) => changed[id as keyof Answers] !== undefined);
    expect(asked).not.toContain("profession");
    const next = nextFreeQuestion(changed, asked);
    // What the trip opens (« wants », « season ») when it can still move the top three, or the
    // closing question once nothing can.
    expect(["wants", "season", "priorities"]).toContain(next);
  });

  // Operator, 2026-11-20: what the family says of itself is asked in one go, wherever the path
  // comes to the origin.
  it("asks for the family's country right after the origin, and the distance at the end", () => {
    const african = play("installer", 0, { origin: ["ouest"], reach: "region" }).asked;
    expect(african[african.indexOf("origin") + 1]).toBe("countries");
    expect(african.slice(-3)).toEqual(["reach", "faith", "priorities"]);
    const caribbean = play("installer", 0, { origin: ["ameriques"], reach: "anywhere" }).asked;
    expect(caribbean.slice(-2)).toEqual(["reach", "priorities"]);
    expect(caribbean).not.toContain("countries");
    expect(caribbean).not.toContain("faith");
    const unsaid = play("installer", 0, { origin: [null] } as unknown as Answers).asked;
    expect(unsaid).not.toContain("reach");
  }, 30_000);

  it("asks each question of the full questionnaire once", () => {
    const ids = DEEP_QUESTIONS.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  // Operator, 2026-11-16: the questions that move the top five least go to the full
  // questionnaire, so the quick quiz stays quick; they are still asked there, where they fit.
  // The family's country and the faith came back to the quick quiz on 2026-11-20.
  it("keeps the questions that move the result least for the full questionnaire", () => {
    const moved = ["budget", "passports", "duration", "tripsHome"];
    for (const project of PROJECTS)
      for (const pick of [0, 1, 2])
        for (const id of moved)
          expect(play(project, pick).asked, `${project} ${id}`).not.toContain(id);
    const deep = (answers: Answers) => {
      const asked = Object.keys(answers);
      const seen: string[] = [];
      for (let id = nextQuestion(answers, asked); id; id = nextQuestion(answers, asked)) {
        seen.push(id);
        asked.push(id);
      }
      return seen;
    };
    const holiday = deep({ project: "decouvrir", origin: ["ouest"], reach: "region" } as Answers);
    expect(holiday).toEqual(expect.arrayContaining(["duration", "budget", "passports"]));
    expect(deep({ project: "pied", origin: [null] } as unknown as Answers)).toContain("tripsHome");
    // Plays about fifteen whole quizzes: slower than the others on CI.
  }, 30_000);
});
