import { describe, expect, it } from "vitest";
import { nextFreeQuestion, nextQuestion } from "./adaptive";
import { DEEP_QUESTIONS } from "./deep-questions";
import { chapterName, keepInPath, QUESTIONS, visibleChoices, type Question } from "./questions";
import type { Answers } from "./ranking";

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
  it("asks the chapters in order, never interleaved, the non-negotiables last", () => {
    for (const project of PROJECTS)
      for (const pick of [0, 1, 2, 3]) {
        const { asked } = play(project, pick);
        const chapters = asked.map((id) => question(id).chapter);
        expect(chapters, `${project} ${asked.join(",")}`).toEqual([...chapters].sort());
        expect(asked.at(-1), project).toBe("priorities");
      }
  });

  it("names the second chapter after the path: the trip on holiday, the project otherwise", () => {
    const shown = (project: (typeof PROJECTS)[number]) => {
      const { answers, asked } = play(project, 0);
      return new Set(
        asked
          .filter((id) => question(id).chapter === 2)
          .map((id) => chapterName(question(id), answers)),
      );
    };
    expect(shown("decouvrir")).toEqual(new Set(["Votre voyage"]));
    expect(shown("installer")).toEqual(new Set(["Votre projet"]));
  });

  it("asks a holidaymaker how long and what to live, never a job or a landscape", () => {
    const { asked } = play("decouvrir", 0);
    expect(asked).toEqual(expect.arrayContaining(["duration", "wants"]));
    for (const id of ["profession", "landscapes", "tripsHome"]) expect(asked).not.toContain(id);
  });

  it("asks both-feet readers how often they come back; investors nothing about daily life", () => {
    expect(play("pied", 0).asked).toContain("tripsHome");
    const investor = play("investir", 0).asked;
    for (const id of ["saturday", "family", "budget", "duration", "tripsHome"])
      expect(investor).not.toContain(id);
  });
});

describe("questions and choices that fit what was said", () => {
  it("skips country, origins and faith when the reader would rather not say", () => {
    for (const project of PROJECTS) {
      const { asked } = play(project, 0, { origin: [null] as never });
      for (const id of ["countries", "kin", "faith"]) expect(asked, project).not.toContain(id);
    }
    const deep = { project: "installer", origin: [null], kin: undefined } as unknown as Answers;
    const asked = Object.keys(deep);
    for (let id = nextQuestion(deep, asked); id; id = nextQuestion(deep, asked)) {
      expect(["origin", "countries", "kin", "faith", "roots"]).not.toContain(id);
      asked.push(id);
    }
  });

  it("offers schools only with children, a career only when working there, repats not on holiday", () => {
    const priorities = (answers: Answers) =>
      visibleChoices(question("priorities"), answers).map((c) => c.value);
    expect(priorities({ project: "installer", family: "celib" })).not.toContain("healthAndSchools");
    expect(priorities({ project: "installer", family: "parents" })).toContain("healthAndSchools");
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
      kin: "much",
      faith: "muslim",
      family: "parents",
      priorities: ["healthAndSchools", "safety"],
      saturday: 1,
    };
    const after = keepInPath({ ...before, origin: [null] as never, family: "celib" });
    expect(after.countries).toBeUndefined();
    expect(after.kin).toBeUndefined();
    expect(after.faith).toBeUndefined();
    expect(after.priorities).toEqual(["safety"]);
    expect(after.saturday).toBe(1);
    expect(keepInPath({ ...before, project: "decouvrir" }).profession).toBeUndefined();
  });

  it("re-routes the rest of the path from the changed answer", () => {
    const { answers } = play("installer", 1);
    const changed = keepInPath({ ...answers, project: "decouvrir" });
    const asked = Object.keys(changed);
    const next = nextFreeQuestion(changed, asked);
    expect(["duration", "wants"]).toContain(next);
  });

  it("asks each question of the full questionnaire once", () => {
    const ids = DEEP_QUESTIONS.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});
