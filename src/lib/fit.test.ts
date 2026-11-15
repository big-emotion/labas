import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { bestMatches, rankCities, type Answers } from "./ranking";
import { closenessOf, fingerprint, type Pull } from "./fit";

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
    "finance",
    "law",
    "consulting",
    "tech",
    "health",
    "teaching",
    "ngo",
    "admin",
    "trade",
    "culture",
    "craft",
    "student",
    "retired",
  ],
  currentCity: ["capital", "bigcity", "town", "country", "nomad"],
  rhythm: ["same", "calmer", "more", "unplug"],
  mobility: ["walk", "transit", "bike", "car"],
  neighbourhood: ["central", "residential", "upscale", "popular"],
  people: ["invited", "quiet", "both"],
  belonging: ["returnees", "locals", "both"],
  friction: [0, 0.5, 1],
};
const MULTI: Record<string, unknown[]> = {
  languages: ["fr", "en", "pt", "ar"],
  landscapes: ["beach", "water", "nature", "wildSpaces", "urban", "island"],
  priorities: ["safety", "cost", "healthAndSchools", "career", "diaspora", "memory", "flights"],
  habits: ["gym", "cafes", "culture", "markets", "nights", "nature"],
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
    languages: [["fr"], ["en"], ["pt"], ["ar"], ["es"], ["sw"], ["fr", "en"]],
    landscapes: [
      ["beach"],
      ["water"],
      ["nature"],
      ["wildSpaces"],
      ["urban"],
      ["island"],
      ["beach", "nature"],
    ],
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
    habits: [
      ["gym"],
      ["cafes"],
      ["culture"],
      ["markets"],
      ["nights"],
      ["nature"],
      ["markets", "culture"],
    ],
  };

  // People live in each of these cities and like it there: if no answers put a city first,
  // the measure is missing what they like about it, not the city.
  it("has a combination of answers that puts each city first", () => {
    const unreachable: string[] = [];
    for (const city of proposable) {
      let best = -Infinity;
      // The quiz always opens on the project; climb from each of its answers, question by
      // question, keeping whichever answer widens this city's lead the most.
      for (const project of OPTIONS.project) {
        let answers: Record<string, unknown> = { project };
        let lead_ = lead(answers as Answers, city.name);
        for (let pass = 0; pass < 3; pass++) {
          for (const [id, values] of Object.entries(OPTIONS)) {
            if (id === "project") continue;
            for (const value of [undefined, ...values]) {
              const tried = { ...answers, [id]: value };
              const gain = lead(tried as Answers, city.name);
              if (gain > lead_ + 1e-9) [lead_, answers] = [gain, tried];
            }
          }
        }
        best = Math.max(best, lead_);
        if (best > 0) break;
      }
      if (best <= 0) unreachable.push(`${city.name} (${best.toFixed(3)})`);
    }
    expect(unreachable, unreachable.join(", ")).toEqual([]);
  }, 120_000);

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

  it("sends someone who dreams of island life to islands", () => {
    for (const m of bestMatches({ landscapes: ["island"] }, 10))
      expect(m.city.facts.settings, m.city.name).toContain("island");
  });

  it("gives someone after a small town small towns", () => {
    for (const m of bestMatches({ size: 1 }, 10)) expect(m.city.size, m.city.name).toBe(1);
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

describe("what the reader's life today brings to the match", () => {
  const scoreOf = (answers: Answers, name: string) =>
    rankCities(answers).find((m) => m.city.name === name)!.score;

  it("brings those who like being invited towards countries whose residents trust and welcome", () => {
    const invited: Answers = { people: "invited" };
    // Afrobarometer Round 9: Benin among the most open, South Africa the least open to foreigners.
    expect(scoreOf(invited, "Cotonou")).toBeGreaterThan(scoreOf(invited, "Johannesburg"));
  });

  it("matches a profession with the cities where it hires", () => {
    const banker: Answers = { profession: "finance" };
    expect(scoreOf(banker, "Johannesburg")).toBeGreaterThan(scoreOf(banker, "Saint-Louis"));
  });

  it("points someone from an upscale area to cities that have one", () => {
    const chic: Answers = { neighbourhood: "upscale" };
    expect(scoreOf(chic, "Abidjan")).toBeGreaterThan(scoreOf(chic, "Bo"));
  });

  it("lets a capital-dweller who wants a calmer life lean towards calmer cities", () => {
    const same: Answers = { currentCity: "capital", rhythm: "same" };
    const calmer: Answers = { currentCity: "capital", rhythm: "calmer" };
    expect(scoreOf(calmer, "Saint-Louis") - scoreOf(calmer, "Lagos")).toBeGreaterThan(
      scoreOf(same, "Saint-Louis") - scoreOf(same, "Lagos"),
    );
  });

  it("leans those who want to live among locals towards cities few returnees settle in", () => {
    const locals: Answers = { belonging: "locals" };
    // Saint-Louis draws few returnees, Ouidah many (city-scores.json, returnees).
    expect(scoreOf(locals, "Saint-Louis")).toBeGreaterThan(scoreOf(locals, "Ouidah"));
  });

  it("does not hold outages and paperwork against a city when the reader copes with them", () => {
    const gap = (answers: Answers) => scoreOf(answers, "Bubaque") - scoreOf(answers, "Kpalimé");
    expect(gap({ project: "installer", friction: 1 })).toBeGreaterThan(
      gap({ project: "installer" }),
    );
  });

  it("takes someone who wants to unplug far from the busy hubs", () => {
    const unplug: Answers = { rhythm: "unplug" };
    expect(scoreOf(unplug, "Bubaque")).toBeGreaterThan(scoreOf(unplug, "Mindelo"));
  });

  it("keeps a frequent traveller close to flights and a good connection", () => {
    const nomad: Answers = { currentCity: "nomad" };
    expect(scoreOf(nomad, "Nairobi")).toBeGreaterThan(scoreOf(nomad, "Bubaque"));
  });
});

describe("a value no source gives", () => {
  it("scores what a typical city scores on the same pull, neither winning nor losing", () => {
    const pulls: Pull[] = [{ axis: "easySetup", target: 0.9, weight: 1 }];
    const unknown = CITIES.find((city) => fingerprint(city, "easySetup") === null)!;
    const known = CITIES.filter((city) => fingerprint(city, "easySetup") !== null);
    const typical =
      known.map((city) => closenessOf(city, pulls, [])[0].value).reduce((a, b) => a + b, 0) /
      known.length;
    const [part] = closenessOf(unknown, pulls, []);
    expect(part.known).toBe(false);
    expect(part.value).toBeCloseTo(typical, 6);
  });
});
