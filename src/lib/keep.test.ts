import { describe, expect, it } from "vitest";
import { GOALS, finishedEvent } from "./analytics";
import { nextQuestion } from "./adaptive";
import { DEEP_QUESTIONS } from "./deep-questions";
import {
  canShowResultAgain,
  forgetAnswers,
  forgetResult,
  loadAnswers,
  mailtoFor,
  rememberResult,
  saveAnswers,
  withoutSensitive,
} from "./keep";
import { shareText } from "./shared-result";
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

describe("the places the reader set aside", () => {
  it("come back after a reload, only those the catalogue knows", () => {
    const storage = memoryStorage();
    storage.setItem(
      "labas.answers",
      JSON.stringify({
        avoidCities: ["Oran", "Atlantis"],
        avoidCountries: ["Algérie", "Narnia"],
        avoidRegions: ["nord", "lune"],
      }),
    );
    expect(loadAnswers(storage)).toEqual({
      avoidCities: ["Oran"],
      avoidCountries: ["Algérie"],
      avoidRegions: ["nord"],
    });
  });

  // Setting a region aside can say something about the reader: kept only with the sensitive box.
  it("are kept in a space only with the box for sensitive answers", () => {
    const answers: Answers = { ...QUICK, avoidCities: ["Oran"], avoidRegions: ["nord"] };
    expect(withoutSensitive(answers)).toEqual(QUICK);
  });

  // Crossing the Sahara or not says where the family is from.
  it("treats the other side of the Sahara as a sensitive answer", () => {
    const answers: Answers = { ...QUICK, origin: "ouest", reach: "anywhere", acrossSahara: "no" };
    expect(withoutSensitive(answers)).toEqual(QUICK);
  });
});

describe("keeping the result by mail", () => {
  it("opens the reader's own mail with the shared message, addressed to nobody", () => {
    const top = bestMatches(QUICK, 3);
    const link = mailtoFor(shareText(QUICK, top, "fr"), "fr");
    expect(link.startsWith("mailto:?")).toBe(true);
    expect(decodeURIComponent(link)).toContain(top[0].city.name);
  });

  it("writes the subject in English for an English reader", () => {
    const link = mailtoFor("text", "en");
    expect(decodeURIComponent(link)).toContain("subject=My African cities on Over There");
  });
});

describe("the audience funnel", () => {
  it("names only goals declared in Plausible", () => {
    for (const name of ["Questionnaire 1 terminé", "Questionnaire complet terminé"] as const)
      expect(GOALS).toContain(finishedEvent(name, "installer").name);
  });
});

describe("a reader who left the result can see it again", () => {
  // Reader feedback, 2026-11-26: a button at the end of the quiz took them off the page.
  it("has nothing to go back to before the result has been shown", () => {
    const storage = memoryStorage();
    saveAnswers(storage, QUICK);
    expect(canShowResultAgain(storage)).toBe(false);
  });

  it("finds it again once it has been shown, from the answers kept", () => {
    const storage = memoryStorage();
    saveAnswers(storage, QUICK);
    rememberResult(storage);
    expect(canShowResultAgain(storage)).toBe(true);
  });

  it("loses it when the reader starts the quiz over", () => {
    const storage = memoryStorage();
    saveAnswers(storage, QUICK);
    rememberResult(storage);
    forgetResult(storage);
    expect(canShowResultAgain(storage)).toBe(false);
  });

  it("loses it when the answers are erased", () => {
    const storage = memoryStorage();
    saveAnswers(storage, QUICK);
    rememberResult(storage);
    forgetAnswers(storage);
    expect(canShowResultAgain(storage)).toBe(false);
  });

  it("offers nothing when the browser keeps nothing", () => {
    expect(canShowResultAgain(undefined)).toBe(false);
  });
});
