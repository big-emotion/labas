import { describe, expect, it } from "vitest";
import { bestMatches, rankCities, type Answers } from "./ranking";

function scoreOf(cityName: string, answers: Answers): number {
  const match = rankCities(answers).find((m) => m.city.name === cityName);
  if (!match) throw new Error(`${cityName} is not in the catalogue`);
  return match.score;
}

function averageCost(answers: Answers, count: number): number {
  const top = bestMatches(answers, count);
  return top.reduce((sum, m) => sum + m.city.scores.cost, 0) / top.length;
}

describe("ranking the cities", () => {
  it("ranks every city, best first, with a score between 0 and 1", () => {
    const ranked = rankCities({});
    expect(ranked).toHaveLength(115);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
    for (const m of ranked) {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(1);
    }
  });

  it("never offers a conflict zone among the best matches", () => {
    const partyLover: Answers = { saturday: 1, landscape: "wildSpaces", language: "ar" };
    for (const m of bestMatches(partyLover, 10)) expect(m.city.unsafe, m.city.name).toBe(false);
  });

  it("puts a city where the reader can live in their language first", () => {
    const [first] = bestMatches({ language: "pt" }, 1);
    expect(first.city.languages).toContain("pt");
  });

  it("favours affordable cities on a tight budget", () => {
    expect(averageCost({ budget: "serre" }, 10)).toBeGreaterThan(
      averageCost({ budget: "large" }, 10),
    );
  });

  it("lets a safety priority lift a safe city above an unsafe-feeling one", () => {
    const answers: Answers = { priorities: ["safety"] };
    expect(scoreOf("Kigali", answers)).toBeGreaterThan(scoreOf("Lagos", answers));
  });

  it("matches a night owl with a lively city better than a homebody", () => {
    expect(scoreOf("Kinshasa", { saturday: 1 })).toBeGreaterThan(
      scoreOf("Kinshasa", { saturday: 0 }),
    );
  });

  it("explains a match in plain words", () => {
    const luanda = rankCities({ language: "pt" }).find((m) => m.city.name === "Luanda");
    expect(luanda?.reasons).toContain("On y vit en portugais");
  });

  it("names what holds a city back", () => {
    const lagos = rankCities({ language: "fr" }).find((m) => m.city.name === "Lagos");
    expect(lagos?.drawbacks).toContain("Langue du quotidien différente de votre souhait");
  });

  it("keeps at most three priorities", () => {
    const four: Answers = { priorities: ["safety", "cost", "career", "flights"] };
    const three: Answers = { priorities: ["safety", "cost", "career"] };
    expect(rankCities(four).map((m) => m.city.name)).toEqual(
      rankCities(three).map((m) => m.city.name),
    );
  });
});
