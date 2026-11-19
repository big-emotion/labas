import { describe, expect, it } from "vitest";
import { livableLanguages } from "./cities";
import { bestMatches, rankCities, topCities, type Answers } from "./ranking";
import { looksFrench } from "../i18n/looks-french";

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
    const [first] = bestMatches({ languages: ["pt"] }, 1);
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
    const luanda = rankCities({ languages: ["pt"] }).find((m) => m.city.name === "Luanda");
    expect(luanda?.reasons.map((r) => r.label)).toContain("On y vit en portugais");
  });

  it("names what holds a city back", () => {
    const lagos = rankCities({ languages: ["fr"] }).find((m) => m.city.name === "Lagos");
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
      languages: ["en"],
      job: "remote",
      landscapes: ["beach"],
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
    const strict: Answers = { languages: ["fr"], languageOnly: true };
    const lagos = rankCities(strict).find((m) => m.city.name === "Lagos");
    expect(lagos?.excludedBecause).toBe("On n'y vit pas en français");
    for (const m of bestMatches(strict, 20)) expect(m.excludedBecause).toBeUndefined();
  });

  // « Pas pour moi » (beta feedback, 2026-11-18): a place the reader sets aside is gone, it
  // does not merely fall back.
  describe("a place the reader sets aside", () => {
    const base: Answers = { project: "installer", languages: ["fr"] };
    const top = (answers: Answers) => bestMatches(answers, 10).map((m) => m.city.name);

    it("takes a whole region out of the best matches, and says why", () => {
      const answers: Answers = { ...base, avoidRegions: ["nord"] };
      for (const m of bestMatches(answers, 30)) expect(m.city.zone).not.toBe("nord");
      const tunis = rankCities(answers).find((m) => m.city.name === "Tunis");
      expect(tunis?.excludedBecause).toBe("Vous avez écarté cette région");
      expect(rankCities(answers, "en").find((m) => m.city.name === "Tunis")?.excludedBecause).toBe(
        "You left out this region",
      );
    });

    it("takes out a country or a single city the same way", () => {
      const noAlgeria = rankCities({ ...base, avoidCountries: ["Algérie"] });
      expect(
        noAlgeria.filter((m) => m.city.country === "Algérie").map((m) => m.excludedBecause),
      ).toEqual(["Vous avez écarté ce pays", "Vous avez écarté ce pays"]);
      const noOran = rankCities({ ...base, avoidCities: ["Oran"] });
      expect(noOran.find((m) => m.city.name === "Oran")?.excludedBecause).toBe(
        "Vous avez écarté cette ville",
      );
      expect(noOran.find((m) => m.city.name === "Alger")?.excludedBecause).toBeUndefined();
    });

    it("leaves the order of every other city as it was", () => {
      const before = top(base).filter((name) => name !== "Tunis" && name !== "Casablanca");
      const after = top({ ...base, avoidCities: ["Tunis", "Casablanca"] });
      expect(after.slice(0, before.length)).toEqual(before);
    });
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

// The site promises the city that resembles the reader (operator, 2026-11-16): practical criteria
// the reader did not choose are a floor, not a ranking, and the temperament is matched against the
// city's neighbourhoods, never read as a demand for comfort.
describe("ranking on resemblance first", () => {
  const PRACTICAL_REASONS = [
    "Sécurité au quotidien",
    "Courant, eau et soins à la hauteur",
    "Démarches simples",
  ];
  const citingPractical = (answers: Answers) =>
    bestMatches(answers, 10).filter((m) =>
      m.reasons.some((r) => PRACTICAL_REASONS.includes(r.label)),
    );
  const explorer: Answers = {
    project: "installer",
    languages: ["fr"],
    saturday: 0.5,
    adventure: "seeking",
    order: 0,
    together: 0.5,
    friction: 1,
  };

  it("reads an orderly, calm temperament as a taste, not as a demand for safety", () => {
    expect(citingPractical({ order: 1, friction: 0, saturday: 0 })).toEqual([]);
  });

  it("does not sell a reader on safety, power or paperwork no answer asked about", () => {
    expect(citingPractical({ languages: ["fr"], size: 2, saturday: 0.5 })).toEqual([]);
  });

  // The project is an answer like the others (operator, 2026-11-16): settling asks for safety.
  it("lets a settler's project rank on safety", () => {
    const meanSafety = (answers: Answers) => {
      const top = bestMatches(answers, 10);
      return top.reduce((sum, m) => sum + (m.city.scores.safety.level ?? 2.5), 0) / top.length;
    };
    expect(meanSafety({ project: "installer" })).toBeGreaterThan(
      meanSafety({ project: "investir" }),
    );
  });

  it("ranks and explains on safety once the reader makes it a non-negotiable", () => {
    const meanSafety = (answers: Answers) => {
      const top = bestMatches(answers, 5);
      return top.reduce((sum, m) => sum + (m.city.scores.safety.level ?? 2.5), 0) / top.length;
    };
    const safe: Answers = { ...explorer, priorities: ["safety"] };
    expect(meanSafety(safe)).toBeGreaterThan(meanSafety(explorer));
    expect(bestMatches(safe, 1)[0].reasons.map((r) => r.label)).toContain("Sécurité au quotidien");
  });

  // Beta feedback (2026-11-18): healthcare matters without children too.
  it("lifts well-equipped cities for a reader without children who makes health a non-negotiable", () => {
    const meanCare = (answers: Answers) => {
      const top = bestMatches(answers, 5);
      return top.reduce((sum, m) => sum + (m.city.scores.healthcare.level ?? 2.5), 0) / top.length;
    };
    const single: Answers = { ...explorer, family: "celib" };
    expect(meanCare({ ...single, priorities: ["health"] })).toBeGreaterThan(meanCare(single));
  });

  it("lifts cities with good schools for parents who make schooling a non-negotiable", () => {
    const meanSchools = (answers: Answers) => {
      const top = bestMatches(answers, 5);
      return top.reduce((sum, m) => sum + (m.city.scores.schools.level ?? 2.5), 0) / top.length;
    };
    const parents: Answers = { ...explorer, family: "parents" };
    expect(meanSchools({ ...parents, priorities: ["schools"] })).toBeGreaterThan(
      meanSchools(parents),
    );
  });

  it("still ranks a journey saved with the former « La santé et l'école » choice", () => {
    const saved = { ...explorer, priorities: ["healthAndSchools"] } as unknown as Answers;
    expect(rankCities(saved)).toHaveLength(rankCities(explorer).length);
  });
});

// Like a guessing game (operator, 2026-11-16): every answer is one piece of evidence and the
// pieces multiply, so the thirteenth answer still turns the list over when it should.
describe("each answer orients the list", () => {
  const speaks = (language: string) => (m: { city: Parameters<typeof livableLanguages>[0] }) =>
    livableLanguages(m.city).includes(language as never);
  const thirteen: Answers = {
    project: "tester",
    profession: "tech",
    family: "celib",
    size: 3,
    landscapes: ["beach"],
    saturday: 0.5,
    adventure: "open",
    order: 0.5,
    together: 1,
    friction: 0.5,
    origin: ["ouest"],
    kin: "some",
    priorities: ["safety"],
  };

  it("ties every city before the first answer", () => {
    const scores = new Set(rankCities({}).map((m) => m.score));
    expect(scores.size).toBe(1);
  });

  it("puts Arabic-speaking cities first for a reader who lives in Arabic", () => {
    const top = bestMatches({ project: "tester", profession: "tech", languages: ["ar"] }, 3);
    expect(top.every(speaks("ar")), top.map((m) => m.city.name).join(", ")).toBe(true);
  });

  it("turns the top three and most of the list over when Arabic comes at the thirteenth answer", () => {
    const french = bestMatches({ ...thirteen, languages: ["fr"] }, 10);
    const arabic = bestMatches({ ...thirteen, languages: ["ar"] }, 10);
    expect(arabic.slice(0, 3).every(speaks("ar"))).toBe(true);
    const kept = arabic.filter((m) => french.some((f) => f.city.name === m.city.name));
    expect(kept.length).toBeLessThanOrEqual(3);
  });

  it("assumes nothing from an origin the reader keeps to themselves", () => {
    // The language is the only answer, so every city where one lives in Arabic scores the same.
    const arabic = rankCities({ languages: ["ar"] }).filter(speaks("ar"));
    expect(new Set(arabic.map((m) => m.score)).size).toBe(1);
  });

  it("lets the project alone change the list", () => {
    const names = (answers: Answers) => bestMatches(answers, 5).map((m) => m.city.name);
    const settle = names({ project: "installer" });
    const holiday = names({ project: "decouvrir" });
    expect(settle.filter((n) => holiday.includes(n)).length).toBeLessThanOrEqual(2);
  });

  it("lets the origin alone bring the family's region closer", () => {
    const top = bestMatches({ origin: ["est"] }, 5);
    expect(top.every((m) => m.city.zone === "est")).toBe(true);
  });

  it("weighs the origin more for a reader settling than for one on holiday", () => {
    const inRegion = (answers: Answers) =>
      bestMatches(answers, 20).filter((m) => m.city.zone === "ouest").length;
    const settle = inRegion({ project: "installer", origin: ["ouest"], languages: ["fr"] });
    const holiday = inRegion({ project: "decouvrir", origin: ["ouest"], languages: ["fr"] });
    expect(settle).toBeGreaterThan(holiday);
  });
});

// Operator, 2026-11-17: « Une grande ville » was read as a lively one, and a small town could
// pass for a big city. Size and pace are now two questions.
describe("the size of the city and its pace", () => {
  it("matches the city's real size", () => {
    for (const size of [1, 2, 3] as const)
      for (const m of bestMatches({ size }, 10)) expect(m.city.size, m.city.name).toBe(size);
  });

  it("matches the pace apart from the size", () => {
    const lively = bestMatches({ pace: 1 }, 10).map((m) => m.city.name);
    const calm = bestMatches({ pace: 0 }, 10).map((m) => m.city.name);
    expect(lively.filter((n) => calm.includes(n))).toEqual([]);
  });
});

// The family's region weighs like a non-negotiable at most, so the temperament can still decide.
describe("an origin that weighs without deciding alone", () => {
  it("leaves room for the temperament: the field test of 2026-11-17 keeps Kigali in the top three", () => {
    const fieldTest: Answers = {
      project: "pied",
      profession: "consulting",
      family: "celib",
      languages: ["fr", "en"],
      size: 3,
      landscapes: ["nature", "urban"],
      saturday: 1,
      adventure: "familiar",
      order: 1,
      together: 0,
      friction: 0,
      origin: ["ouest"],
      kin: "much",
      priorities: ["safety"],
    };
    expect(bestMatches(fieldTest, 3).map((m) => m.city.name)).toContain("Kigali");
  });
});

describe("the quick top used to choose the next question", () => {
  it("names the same cities as the full ranking", () => {
    const answers: Answers = { languages: ["fr"], saturday: 1, budget: "serre" };
    expect(topCities(answers, 5)).toEqual(bestMatches(answers, 5).map((m) => m.city.name));
  });
});

describe("ranking the cities for an English reader", () => {
  // A reader who answered a bit of everything, so most kinds of line come up somewhere.
  const answers: Answers = {
    project: "installer",
    languages: ["pt", "en"],
    origin: ["ouest"],
    kin: "much",
    faith: "muslim",
    saturday: 1,
    adventure: "seeking",
    order: 1,
    together: 0,
    friction: 0,
    size: 3,
    climate: "hot",
    landscapes: ["beach"],
    priorities: ["safety", "cost", "flights"],
    languageOnly: true,
    visaFreeOnly: true,
    excludeCriminalising: true,
  };

  it("explains a match in English", () => {
    const luanda = rankCities({ languages: ["pt"] }, "en").find((m) => m.city.name === "Luanda");
    expect(luanda?.reasons.map((r) => r.label)).toContain("Daily life happens in Portuguese there");
  });

  it("writes every reason, drawback, filter and portrait line in English", () => {
    for (const m of rankCities(answers, "en")) {
      const texts = [
        ...m.reasons.map((r) => r.label),
        ...m.drawbacks.map((r) => r.label),
        ...m.temperamentLines.map((l) => l.text),
        ...m.portrait.flatMap((l) => [l.said, l.text]),
        m.excludedBecause ?? "",
      ];
      for (const text of texts) expect(looksFrench(text), `${m.city.name}: ${text}`).toBe(false);
    }
  });

  it("ranks the same way in both languages", () => {
    const names = (locale: "fr" | "en") => rankCities(answers, locale).map((m) => m.city.name);
    expect(names("en")).toEqual(names("fr"));
  });
});
