import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { bestMatches, rankCities, type Answers } from "./ranking";

// A deterministic stream of random numbers, so the audit gives the same result every run.
function randomStream(seed: number) {
  let state = seed;
  return () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
}

const SPACE: Record<string, unknown[]> = {
  project: ["installer", "pied", "tester", "investir", "decouvrir"],
  saturday: [0, 0.5, 1],
  budget: ["serre", "moyen", "large"],
  family: ["celib", "couple", "fonder", "parents"],
  job: ["cadre", "entre", "remote", "crea", "soin"],
  size: [1, 2, 3],
  climate: ["hot", "mild", "dry"],
  grewUp: ["city", "town", "country"],
  roots: ["rediscover", "discover", "both"],
  origin: ["ouest", "centre", "est", "sud", "nord", "ameriques"],
  profession: [
    "tech",
    "trade",
    "health",
    "teaching",
    "culture",
    "admin",
    "craft",
    "student",
    "retired",
  ],
};
const MULTI: Record<string, unknown[]> = {
  languages: ["fr", "en", "pt", "ar"],
  landscapes: ["beach", "water", "nature", "wildSpaces", "urban"],
  priorities: ["safety", "cost", "healthAndSchools", "career", "diaspora", "memory", "flights"],
};

function randomProfile(random: () => number): Answers {
  const answers: Record<string, unknown> = {};
  for (const [id, values] of Object.entries(SPACE)) {
    if (random() < 0.85) answers[id] = values[Math.floor(random() * values.length)];
  }
  for (const [id, values] of Object.entries(MULTI)) {
    const picked = values.filter(() => random() < 0.35);
    answers[id] = picked.length
      ? picked.slice(0, 3)
      : [values[Math.floor(random() * values.length)]];
  }
  return answers as Answers;
}

describe("the city a profile lands on", () => {
  const proposable = CITIES.filter((city) => !city.unsafe);

  // How far ahead of the best other proposable city a city is, for these answers.
  const lead = (answers: Answers, name: string) => {
    const ranked = rankCities(answers).filter((m) => !m.city.unsafe);
    const own = ranked.find((m) => m.city.name === name)!;
    const rival = ranked.find((m) => m.city.name !== name)!;
    return own.score - rival.score;
  };
  const OPTIONS: Record<string, unknown[]> = {
    ...SPACE,
    languages: [["fr"], ["en"], ["pt"], ["ar"], ["fr", "en"]],
    landscapes: [["beach"], ["water"], ["nature"], ["wildSpaces"], ["urban"], ["beach", "nature"]],
    priorities: [
      ["safety"],
      ["cost"],
      ["healthAndSchools"],
      ["career"],
      ["diaspora"],
      ["memory"],
      ["flights"],
      ["cost", "memory"],
    ],
  };

  it("has a combination of answers that puts each city first", () => {
    const unreachable: string[] = [];
    for (const city of proposable) {
      // Climb answer by answer towards the profile that favours this city most.
      let answers: Record<string, unknown> = {};
      let best = lead(answers as Answers, city.name);
      for (let pass = 0; pass < 2; pass++) {
        for (const [id, values] of Object.entries(OPTIONS)) {
          for (const value of [undefined, ...values]) {
            const tried = { ...answers, [id]: value };
            const gain = lead(tried as Answers, city.name);
            if (gain > best + 1e-9) {
              best = gain;
              answers = tried;
            }
          }
        }
      }
      if (best <= 0) unreachable.push(city.name);
    }
    expect(unreachable.length, unreachable.join(", ")).toBeLessThanOrEqual(
      Math.round(proposable.length * 0.15),
    );
  });

  it("spreads French speakers across many cities rather than a few", () => {
    const random = randomStream(7);
    const RUNS = 3000;
    const wins = new Map<string, number>();
    for (let i = 0; i < RUNS; i++) {
      const profile = { ...randomProfile(random), languages: ["fr"] } as Answers;
      const [first] = bestMatches(profile, 1);
      wins.set(first.city.name, (wins.get(first.city.name) ?? 0) + 1);
    }
    for (const [name, count] of wins) expect(count / RUNS, name).toBeLessThan(0.08);
  });

  const topThree = (answers: Answers) => bestMatches(answers, 3).map((m) => m.city.name);

  it("sends a calm, river-loving history buff on a small budget towards Saint-Louis", () => {
    expect(
      topThree({
        saturday: 0,
        size: 1,
        budget: "serre",
        languages: ["fr"],
        landscapes: ["water"],
        climate: "dry",
        priorities: ["memory", "cost"],
        project: "decouvrir",
      }),
    ).toContain("Saint-Louis");
  });

  it("sends a French-speaking night owl after a career by the lagoon towards Abidjan", () => {
    expect(
      topThree({
        saturday: 1,
        size: 3,
        languages: ["fr"],
        job: "cadre",
        landscapes: ["beach", "water"],
        climate: "hot",
        priorities: ["career", "diaspora"],
        origin: "ouest",
        roots: "rediscover",
        profession: "trade",
      }),
    ).toContain("Abidjan");
  });

  it("counts every language the reader can live in", () => {
    const both = bestMatches({ languages: ["fr", "en"] }, 10);
    const spoken = (m: (typeof both)[number]) =>
      m.city.facts.languages.filter((l) => l.use !== "limited").map((l) => l.language);
    for (const m of both) {
      expect(
        spoken(m).some((l) => l === "fr" || l === "en"),
        m.city.name,
      ).toBe(true);
    }
  });
});
