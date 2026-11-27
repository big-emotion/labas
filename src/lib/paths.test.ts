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
const PROJECTS = ["installer", "pied", "tester", "decouvrir"] as const;
const question = (id: string): Question => DEEP_QUESTIONS.find((q) => q.id === id)!;

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

  it("asks both-feet readers their job and how often they come back", () => {
    const { asked } = play("pied", 0);
    expect(asked).toEqual(expect.arrayContaining(["profession", "tripsHome"]));
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
    // The first question of the holiday's own that was not asked yet.
    expect(next).toBe("wants");
  });

  // Operator, 2026-11-20: what the family says of itself is asked in one go, wherever the path
  // comes to the origin.
  it("asks for the family's country right after the origin, and the distance at the end", () => {
    const african = play("installer", 0, { origin: ["ouest"], reach: "region" }).asked;
    expect(african[african.indexOf("origin") + 1]).toBe("countries");
    expect(african.slice(-3)).toEqual(["reach", "faith", "priorities"]);
    const caribbean = play("installer", 0, { origin: ["ameriques"], reach: "anywhere" }).asked;
    // « Anywhere » from one side of the Sahara asks about the other side (operator, 2026-11-22).
    expect(caribbean.slice(-3)).toEqual(["reach", "acrossSahara", "priorities"]);
    expect(caribbean).not.toContain("countries");
    expect(caribbean).not.toContain("faith");
    const unsaid = play("installer", 0, { origin: [null] } as unknown as Answers).asked;
    expect(unsaid).not.toContain("reach");
  }, 30_000);

  it("asks each question of the full questionnaire once", () => {
    const ids = DEEP_QUESTIONS.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  // Operator, 2026-11-26: the practical questions have their data filled city by city.
  // Operator, 2026-11-27: the quick quiz asks each path the one that is its own; the full
  // questionnaire asks the others, where they fit.
  it("asks each path its practical question in the quick quiz, the others in the full one", () => {
    const offered = (answers: Answers) => freeQuestions(answers).map((q) => q.id);
    expect(offered({ project: "installer" })).toContain("budget");
    expect(offered({ project: "pied" })).toContain("tripsHome");
    expect(offered({ project: "tester" })).toContain("workThere");
    expect(offered({ project: "tester" })).not.toContain("visaFreeOnly");
    expect(offered({ project: "decouvrir" })).toContain("passports");
    expect(offered({ project: "installer" })).not.toContain("setupBudget");
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

// Operator, 2026-11-26: no city-level data exists on land security or rental yield, so the site
// cannot rank cities for an investment; the path is no longer offered. A journey saved with it
// still ranks (accounts, shared links), but a reader cannot pick it.
describe("the investing path", () => {
  it("is no longer offered, in the quick quiz or the full questionnaire", () => {
    const offered = (bank: Question[]) =>
      bank.find((q) => q.id === "project")!.choices.map((c) => c.value);
    expect(offered(QUESTIONS)).not.toContain("investir");
    expect(offered(DEEP_QUESTIONS)).not.toContain("investir");
    expect(offered(QUESTIONS)).toEqual(["installer", "pied", "tester", "decouvrir"]);
  });

  it("drops from a saved journey, so the reader picks a project again", () => {
    expect(
      keepInPath({ project: "investir", languages: ["fr"] } as Answers).project,
    ).toBeUndefined();
  });

  it("still ranks a journey saved with it before, without breaking", () => {
    expect(bestMatches({ project: "investir", languages: ["fr"] } as Answers, 3)).toHaveLength(3);
  });
});

// Operator, 2026-11-27: « Tester quelques mois » had no question of its own. The research on the
// paths found working from there the first worry of a trial stay, and the connection and the
// power cuts are scored city by city.
describe("the question « Tester quelques mois » alone is asked: working during the stay", () => {
  const TRIAL = { project: "tester", languages: ["fr"] } as Answers;
  const top = (answers: Answers, count: number) => bestMatches(answers, count);
  const level = (answers: Answers, key: "internet" | "utilities" | "jobs") => {
    const levels = top(answers, 10).map((m) => m.city.scores[key].level ?? 0);
    return levels.reduce((sum, l) => sum + l, 0) / levels.length;
  };

  it("is asked in the quick quiz of that path, and of no other", () => {
    const offered = (project: string) =>
      freeQuestions({ project } as Answers).map((q) => q.id as string);
    expect(offered("tester")).toContain("workThere");
    for (const project of ["installer", "pied", "decouvrir"]) {
      expect(offered(project), project).not.toContain("workThere");
      expect(question("workThere").when?.({ project } as Answers), project).toBe(false);
    }
  });

  it("keeps that path at fourteen questions or fewer", () => {
    for (const pick of [0, 1, 2, 3])
      expect(
        play("tester", pick, { origin: ["ouest"] } as Answers).asked.length,
      ).toBeLessThanOrEqual(14);
  });

  it("draws a reader who works online to the cities with the better connection and power", () => {
    const online = { ...TRIAL, workThere: "remote" } as Answers;
    expect(level(online, "internet")).toBeGreaterThan(level(TRIAL, "internet"));
    expect(level(online, "utilities")).toBeGreaterThanOrEqual(level(TRIAL, "utilities"));
  });

  it("draws a reader who looks for work on the spot to the cities that hire", () => {
    const hired = { ...TRIAL, workThere: "local" } as Answers;
    expect(level(hired, "jobs")).toBeGreaterThan(level(TRIAL, "jobs"));
  });

  it("moves the first five cities with each answer that states a need, and none with the one that states none", () => {
    const names = (answers: Answers) => top(answers, 5).map((m) => m.city.name);
    for (const value of ["remote", "local"] as const)
      expect(names({ ...TRIAL, workThere: value }), value).not.toEqual(names(TRIAL));
    expect(names({ ...TRIAL, workThere: "none" })).toEqual(names(TRIAL));
    const unsaid = question("workThere").choices.find((c) => c.value === "none")!;
    expect(unsaid.label).toMatch(/ne compte pas/);
  });
});
