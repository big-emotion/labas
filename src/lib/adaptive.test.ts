import { describe, expect, it } from "vitest";
import { closenessOf, freeQuestions, nextFreeQuestion, nextQuestion } from "./adaptive";
import { chapterName, visibleChoices } from "./questions";
import { rankCities, type Answers } from "./ranking";
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

// Operator, 2026-11-27: the quiz drawn from the whole questionnaire, at random among questions as
// good as each other, read as haphazard. Each path now has a short core, asked theme by theme in
// an order that does not depend on the reader.
describe("the quick quiz, a short core per path", () => {
  const PROJECTS = ["installer", "pied", "tester", "decouvrir"] as const;
  type Project = (typeof PROJECTS)[number];
  const LONGEST = 14;
  /** The family's origin as readers give it: a region, the Americas, or not said. */
  const ORIGINS = [["ouest"], ["nord"], ["ameriques"], [null]] as unknown as Answers["origin"][];
  const REACHES = ["country", "region", "alike", "anywhere"] as const;

  /** Plays the quiz as a reader who takes the visible choice at `pick`, unless told otherwise. */
  function play(project: Project | "investir", pick: number, told: Answers = {}) {
    const answers: Record<string, unknown> = { project };
    const asked = ["project"];
    for (let id = nextFreeQuestion(answers as Answers, asked); id;) {
      const question = DEEP_QUESTIONS.find((q) => q.id === id)!;
      const choices = visibleChoices(question, answers as Answers).filter((c) => c.value !== null);
      const choice = choices[pick % choices.length];
      const given = told[id as keyof Answers];
      answers[id] = given !== undefined ? given : question.max ? [choice.value] : choice.value;
      asked.push(id);
      id = nextFreeQuestion(answers as Answers, asked);
    }
    return { answers: answers as Answers, asked };
  }
  const WEST = { origin: ["ouest"], reach: "region" } as Answers;
  const WAY_OF_LIVING = ["saturday", "order", "together", "friction"];
  const STORY = ["origin", "countries", "reach", "faith"];

  it("opens on the life project: with no answer every city ties", () => {
    expect(nextFreeQuestion({}, [])).toBe("project");
  });

  it("asks each path its own questions, then how the reader lives, then their story", () => {
    const own: Record<Project, string[]> = {
      installer: ["languages", "profession", "budget", "climate"],
      pied: ["languages", "profession", "tripsHome", "climate"],
      tester: ["languages", "workThere", "size", "climate"],
      decouvrir: ["wants", "season", "languages", "passports"],
    };
    for (const project of PROJECTS)
      expect(play(project, 0, WEST).asked, project).toEqual([
        "project",
        ...own[project],
        ...WAY_OF_LIVING,
        ...STORY,
        "priorities",
      ]);
  });

  it(`never asks more than ${LONGEST} questions, whatever the path and the answers`, () => {
    for (const project of PROJECTS)
      for (const origin of ORIGINS)
        for (const reach of REACHES)
          for (const pick of [0, 1, 2]) {
            const { asked } = play(project, pick, { origin, reach } as Answers);
            expect(asked.length, `${project} ${origin} ${reach}`).toBeLessThanOrEqual(LONGEST);
            expect(new Set(asked).size).toBe(asked.length);
            expect(asked.at(-1)).toBe("priorities");
          }
  });

  it("asks the same questions in the same order whatever the answers, bar those a condition opens", () => {
    for (const project of PROJECTS) {
      const [first, ...others] = [0, 1, 2, 3].map((pick) => play(project, pick, WEST).asked);
      for (const asked of others) expect(asked, project).toEqual(first);
    }
  });

  it("finishes a theme before the next one: no chapter is left and taken up again", () => {
    for (const project of PROJECTS)
      for (const origin of ORIGINS) {
        const { answers, asked } = play(project, 0, { origin, reach: "anywhere" } as Answers);
        const chapters = asked.map((id) =>
          chapterName(
            freeQuestions(answers).find((q) => q.id === id)!,
            answers,
            "fr",
          ),
        );
        const visited = chapters.filter((chapter, i) => chapter !== chapters[i - 1]);
        expect(new Set(visited).size, `${project} ${origin}: ${visited.join(" > ")}`).toBe(
          visited.length,
        );
      }
  });

  // Operator, 2026-11-20: the one question on distance comes at the end, so the map keeps
  // showing unexpected cities until the reader settles it.
  it("asks how far the reader would go just before the closing question, then the faith or the Sahara", () => {
    expect(play("installer", 0, WEST).asked.slice(-3)).toEqual(["reach", "faith", "priorities"]);
    const anywhere = play("installer", 0, { origin: ["ameriques"], reach: "anywhere" } as Answers);
    expect(anywhere.asked.slice(-3)).toEqual(["reach", "acrossSahara", "priorities"]);
    expect(anywhere.asked).not.toContain("countries");
  });

  it("asks a reader who names no origin which regions draw them, never how far from their own", () => {
    for (const project of PROJECTS) {
      const { asked } = play(project, 0, { origin: [null] } as unknown as Answers);
      expect(asked.slice(-4), project).toEqual(["origin", "drawnTo", "adventure", "priorities"]);
      for (const id of ["countries", "reach", "faith"]) expect(asked, project).not.toContain(id);
    }
  });

  it("does not ask a holidaymaker about their job, nor a settler about their holiday", () => {
    expect(play("decouvrir", 0).asked).not.toContain("profession");
    for (const id of ["wants", "season"]) expect(play("installer", 0).asked).not.toContain(id);
  });

  // Web research, 2026-11-27: music was never seen as a reason for choosing a city.
  it("leaves the music, the profile questions and the filters to the full questionnaire", () => {
    const full = (answers: Answers) => {
      const asked = Object.keys(answers);
      const seen: string[] = [];
      for (let id = nextQuestion(answers, asked); id; id = nextQuestion(answers, asked)) {
        seen.push(id);
        asked.push(id);
      }
      return seen;
    };
    for (const project of PROJECTS) {
      const { answers, asked } = play(project, 0, WEST);
      for (const id of ["music", "family", "pace", "avoidRegions", "languageOnly"])
        expect(asked, `${project} ${id}`).not.toContain(id);
      // What the quick quiz leaves out is still asked of a reader who goes further.
      expect(full(answers), project).toEqual(expect.arrayContaining(["family", "pace"]));
    }
    // The music follows a Saturday night out.
    expect(full(play("installer", 0, { ...WEST, saturday: 1 }).answers)).toContain("music");
  }, 30_000);

  it("still ranks a journey saved with the project the site no longer offers", () => {
    const { answers, asked } = play("investir", 0, WEST);
    expect(asked.length).toBeLessThanOrEqual(LONGEST);
    expect(asked.at(-1)).toBe("priorities");
    expect(rankCities(answers).length).toBeGreaterThan(0);
  });

  it("lists the questions a reader will meet, for the progress stitches", () => {
    const { answers, asked } = play("tester", 0, WEST);
    expect(freeQuestions(answers).map((q) => q.id)).toEqual(asked);
  });

  it("says how near the quiz is: searching at the start, almost there at the end", () => {
    const { answers, asked } = play("installer", 1, WEST);
    const words = asked.map((_, i) => closenessOf(answers, asked.slice(0, i)));
    // One word per theme: the reader's plan, how they live, then their story and the end.
    const at = (id: string) => words[asked.indexOf(id)];
    for (const id of ["languages", "climate"]) expect(at(id), id).toBe("searching");
    for (const id of ["saturday", "friction"]) expect(at(id), id).toBe("closer");
    for (const id of ["origin", "priorities"]) expect(at(id), id).toBe("almost");
    // Never back from « presque trouvé » to « on cherche ».
    const rank = { searching: 0, closer: 1, almost: 2 };
    for (let i = 1; i < words.length; i++)
      expect(rank[words[i]]).toBeGreaterThanOrEqual(rank[words[i - 1]]);
  });
});
