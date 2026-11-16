import { describe, expect, it } from "vitest";
import { nextQuestion } from "./adaptive";
import { CITIES } from "./cities";
import { PROFILE_QUESTIONS } from "./deep-questions";
import { MUSIC } from "./music";
import { rankCities, type Answers } from "./ranking";

// Operator, 2026-11-16: « La musique qui vous fait bouger ? », each genre sourced.
describe("the music question", () => {
  it("links each genre to countries the site covers, with dated https sources", () => {
    const countries = new Set(CITIES.map((c) => c.country));
    for (const genre of MUSIC) {
      expect(genre.countries.length, genre.value).toBeGreaterThan(0);
      for (const country of genre.countries) expect(countries, genre.value).toContain(country);
      expect(genre.sources.length, genre.value).toBeGreaterThan(0);
      for (const source of genre.sources) {
        expect(source.url, genre.value).toMatch(/^https:\/\//);
        expect(source.accessed, genre.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("is asked in the full questionnaire to readers who go out, and only to them", () => {
    const music = PROFILE_QUESTIONS.find((q) => q.id === "music")!;
    expect(music.when?.({ project: "decouvrir", saturday: 1 })).toBe(true);
    expect(music.when?.({ project: "installer", saturday: 1 })).toBe(true);
    expect(music.when?.({ project: "installer", saturday: 0 })).toBe(false);
    const answers: Answers = { project: "decouvrir", saturday: 1 };
    const asked = Object.keys(answers);
    const seen: string[] = [];
    for (let id = nextQuestion(answers, asked); id; id = nextQuestion(answers, asked)) {
      seen.push(id);
      asked.push(id);
    }
    expect(seen).toContain("music");
  });

  it("brings the cities where that music plays closer, and says why", () => {
    const base: Answers = { project: "decouvrir", saturday: 1 };
    const score = (answers: Answers, name: string) =>
      rankCities(answers).find((m) => m.city.name === name)!;
    const before = score(base, "Johannesburg").score;
    const after = score({ ...base, music: ["amapiano"] }, "Johannesburg");
    expect(after.score).toBeGreaterThan(before);
    // With little else said, it shows among the reasons.
    const alone = score({ saturday: 1, music: ["amapiano"] }, "Johannesburg");
    expect(alone.reasons.map((r) => r.label)).toContain("Votre musique y fait danser");
  });
});
