import { describe, expect, it } from "vitest";
import { livableLanguages } from "./cities";
import { bestMatches, rankCities, topCities, type Answers } from "./ranking";

function scoreOf(cityName: string, answers: Answers): number {
  const match = rankCities(answers).find((m) => m.city.name === cityName);
  if (!match) throw new Error(`${cityName} is not in the catalogue`);
  return match.score;
}

function averageCost(answers: Answers, count: number): number {
  const top = bestMatches(answers, count);
  return top.reduce((sum, m) => sum + (m.city.scores.cost.level ?? 2.5), 0) / top.length;
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

  // Travel advice informs, it does not decide (operator, 2026-11-15): it is written for
  // visitors who have never been, while people live, work and come back there every day.
  it("offers a city the authorities advise against like any other, by its score", () => {
    const kinois: Answers = {
      languages: ["fr"],
      origin: ["centre"],
      kin: "much",
      adventure: "familiar",
      saturday: 1,
      currentCity: "capital",
      rhythm: "same",
    };
    const offered = bestMatches(kinois, 5);
    expect(offered.map((m) => m.city.name)).toContain("Kinshasa");
    expect(offered).toEqual(
      rankCities(kinois)
        .filter((m) => !m.excludedBecause)
        .slice(0, 5),
    );
  });

  it("puts a city where the reader can live in their language first", () => {
    const [first] = bestMatches({ language: "pt" }, 1);
    expect(livableLanguages(first.city)).toContain("pt");
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
    expect(luanda?.reasons.map((r) => r.label)).toContain("On y vit en portugais");
  });

  it("names what holds a city back", () => {
    const lagos = rankCities({ language: "fr" }).find((m) => m.city.name === "Lagos");
    expect(lagos?.drawbacks.map((r) => r.label)).toContain(
      "Langue du quotidien différente de votre souhait",
    );
  });

  it("writes no portrait before the reader has answered", () => {
    for (const m of rankCities({})) expect(m.portrait).toEqual([]);
  });

  it("ties each portrait line to what the reader said", () => {
    const nightOwl = rankCities({ saturday: 1 }).find((m) => m.city.name === "Lagos");
    expect(nightOwl?.portrait[0]).toMatchObject({
      said: "Du monde, de la musique, on rentre tard",
    });
    expect(nightOwl?.portrait[0].text).toContain("Lagos");
  });

  it("prefers a city's own sentence over the generic one", () => {
    const nairobi = rankCities({ saturday: 1 }).find((m) => m.city.name === "Nairobi");
    expect(nairobi?.portrait[0].text).toBe(
      "Vous aimez danser jusqu'au matin : Nairobi aussi. Le samedi, Westlands ne dort pas.",
    );
  });

  it("only claims what the city's scores support", () => {
    const homebody = rankCities({ saturday: 0 }).find((m) => m.city.name === "Lagos");
    expect(homebody?.portrait).toEqual([]);
  });

  it("keeps the portrait to three lines about preferences, never traits", () => {
    const busy: Answers = {
      saturday: 1,
      size: 3,
      climate: "hot",
      language: "en",
      job: "remote",
      landscape: "beach",
      priorities: ["career", "diaspora", "flights"],
    };
    for (const m of rankCities(busy)) {
      expect(m.portrait.length).toBeLessThanOrEqual(3);
      for (const line of m.portrait) {
        expect(line.text).not.toMatch(
          /personnalité|votre profil|vous êtes (quelqu|un |une |plutôt)|(?<![\p{L}'’])(tu|te|toi|ton|ta|tes)(?!\p{L})|(?<!\p{L})t['’](?=\p{L})/iu,
        );
      }
    }
  });

  it("says how much of each match rests on known values", () => {
    for (const m of rankCities({ priorities: ["diaspora"], job: "remote" })) {
      expect(m.coverage).toBeGreaterThanOrEqual(0);
      expect(m.coverage).toBeLessThanOrEqual(1);
    }
  });

  it("removes a city a stated constraint rules out, and says why", () => {
    const strict: Answers = { language: "fr", languageOnly: true };
    const lagos = rankCities(strict).find((m) => m.city.name === "Lagos");
    expect(lagos?.excludedBecause).toBe("On n'y vit pas en français");
    for (const m of bestMatches(strict, 20)) expect(m.excludedBecause).toBeUndefined();
  });

  it("only leaves out countries that punish homosexuality when the reader asks", () => {
    const criminalising = (answers: Answers) =>
      rankCities(answers).filter((m) => m.excludedBecause === "Le pays punit l'homosexualité");
    expect(criminalising({})).toHaveLength(0);
    expect(criminalising({ excludeCriminalising: true }).length).toBeGreaterThan(0);
  });

  it("keeps at most three priorities", () => {
    const four: Answers = { priorities: ["safety", "cost", "career", "flights"] };
    const three: Answers = { priorities: ["safety", "cost", "career"] };
    expect(rankCities(four).map((m) => m.city.name)).toEqual(
      rankCities(three).map((m) => m.city.name),
    );
  });
});

describe("the quick top used to choose the next question", () => {
  it("names the same cities as the full ranking", () => {
    const answers: Answers = { languages: ["fr"], saturday: 1, budget: "serre" };
    expect(topCities(answers, 5)).toEqual(bestMatches(answers, 5).map((m) => m.city.name));
  });
});
