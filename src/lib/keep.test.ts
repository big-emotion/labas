import { describe, expect, it } from "vitest";
import { GOALS, finishedEvent } from "./analytics";
import { nextQuestion } from "./adaptive";
import { DEEP_QUESTIONS } from "./deep-questions";
import { loadAnswers, mailtoFor, resultsText, saveAnswers } from "./keep";
import { QUESTIONS } from "./questions";
import { bestMatches, type Answers } from "./ranking";

/** A browser's localStorage, as far as Là-bas uses it. */
function memoryStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

const QUICK: Answers = { project: "installer", saturday: 0, budget: "moyen", family: "couple" };

describe("the full questionnaire picks up where the quick quiz stopped", () => {
  // Beta feedback, 2026-11-15: « certaines mêmes questions revenaient à plusieurs reprises ».
  it("asks each question once", () => {
    const ids = DEEP_QUESTIONS.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("gets back the quick quiz's answers and never asks them again", () => {
    const storage = memoryStorage();
    saveAnswers(storage, QUICK);
    const answers = loadAnswers(storage);
    expect(answers).toEqual(QUICK);
    const next = nextQuestion(answers, Object.keys(answers));
    expect(Object.keys(QUICK)).not.toContain(next);
  });

  it("drops what no question asks or no choice offers, and survives a broken store", () => {
    const storage = memoryStorage();
    storage.setItem("labas.answers", JSON.stringify({ project: "lune", saturday: 0, nope: 1 }));
    expect(loadAnswers(storage)).toEqual({ saturday: 0 });
    storage.setItem("labas.answers", "{not json");
    expect(loadAnswers(storage)).toEqual({});
    expect(loadAnswers(undefined)).toEqual({});
  });
});

describe("keeping or sharing the result", () => {
  const top = bestMatches(QUICK, 3);

  it("writes the cities with their percentage and an invitation, never the answers", () => {
    const text = resultsText(top);
    for (const [i, m] of top.entries()) {
      expect(text).toContain(`${i + 1}. ${m.city.name}`);
      expect(text).toContain(`${Math.round(m.score * 100)}\u202f%`);
    }
    expect(text).toContain("https://labas.africa/");
    for (const question of QUESTIONS) expect(text).not.toContain(question.title);
  });

  it("opens the reader's own mail with the result, addressed to nobody", () => {
    const link = mailtoFor(resultsText(top));
    expect(link.startsWith("mailto:?")).toBe(true);
    expect(decodeURIComponent(link)).toContain(top[0].city.name);
  });
});

describe("the audience funnel", () => {
  it("names only goals declared in Plausible", () => {
    for (const name of ["Questionnaire 1 terminé", "Questionnaire complet terminé"] as const)
      expect(GOALS).toContain(finishedEvent(name).name);
  });
});
