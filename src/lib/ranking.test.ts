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
      reach: "country",
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

// The field test of 2026-11-17 kept Kigali in the top three of a West African reader who had
// answered « Beaucoup » and « terrain connu ». The operator reversed it on 2026-11-20: once the
// reader says their own matter, the family's region comes first, and the temperament orders the
// cities inside it.
describe("an origin that leads without deciding alone", () => {
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
    reach: "region",
    priorities: ["safety"],
  };
  const topThree = (answers: Answers) => bestMatches(answers, 3).map((m) => m.city);

  it("keeps the top three in the family's region", () => {
    expect(topThree(fieldTest).map((city) => city.zone)).toEqual(["ouest", "ouest", "ouest"]);
  });

  it("lets the temperament choose which cities of that region", () => {
    const quiet: Answers = { ...fieldTest, size: 1, saturday: 0, landscapes: ["beach"] };
    expect(topThree(quiet).map((city) => city.name)).not.toEqual(
      topThree(fieldTest).map((city) => city.name),
    );
  });
});

/** A reader who has answered the whole quick quiz, bar what the family says of itself. */
const settled: Answers = {
  project: "installer",
  languages: ["fr"],
  family: "couple",
  size: 3,
  pace: 0.5,
  landscapes: ["beach"],
  climate: "mild",
  saturday: 0.5,
  order: 1,
  together: 0.5,
  friction: 0,
  priorities: ["safety", "health"],
};

// Operator, 2026-11-20: what a reader says of their own (region, country, faith) was diluted by
// the twelve other answers of a quick quiz. « Jusqu'où aimeriez-vous aller ? » now gives it a
// share of the final score, by the reader's own word.
describe("how far the reader would go from their own", () => {
  const top = (answers: Answers, count = 3) => bestMatches(answers, count).map((m) => m.city);
  const rankOf = (name: string, answers: Answers) =>
    bestMatches(answers, 115).findIndex((m) => m.city.name === name);
  const REGIONS = ["ouest", "centre", "est", "sud", "nord"] as const;

  it("« the same region »: puts the family's region first, whatever else they answered", () => {
    for (const origin of REGIONS) {
      const zones = top({ ...settled, origin: [origin], reach: "region" }).map((c) => c.zone);
      expect(zones.filter((zone) => zone === origin).length, origin).toBeGreaterThanOrEqual(2);
      expect(zones[0], origin).toBe(origin);
    }
  });

  it("« my family's country »: brings that country into the top three", () => {
    for (const [origin, country] of [
      ["centre", "RD Congo"],
      ["centre", "Cameroun"],
      ["ouest", "Sénégal"],
      ["ouest", "Bénin"],
      ["nord", "Maroc"],
    ] as const) {
      const answers: Answers = {
        ...settled,
        origin: [origin],
        countries: [country],
        reach: "country",
      };
      expect(
        top(answers).map((c) => c.country),
        country,
      ).toContain(country);
    }
  });

  // The point of the site is to show cities the reader did not think of: naming a country does
  // not lock the list to it unless the reader asks for that country.
  it("« the same region »: gives the family's country no advantage, so its neighbours show", () => {
    const family: Answers = { ...settled, origin: ["ouest"], countries: ["Sénégal"] };
    const inCountry = (answers: Answers) =>
      top(answers, 5).filter((city) => city.country === "Sénégal").length;
    expect(inCountry({ ...family, reach: "region" })).toBeLessThan(
      inCountry({ ...family, reach: "country" }),
    );
    expect(
      new Set(top({ ...family, reach: "region" }, 5).map((c) => c.country)).size,
    ).toBeGreaterThan(1);
  });

  it("« a culture alike »: mixes the regions, and keeps the other side of the Sahara back", () => {
    for (const origin of ["ouest", "centre", "est", "sud"] as const) {
      const zones = top({ ...settled, origin: [origin], reach: "alike" }, 5).map((c) => c.zone);
      expect(zones, origin).not.toContain("nord");
    }
    const west = top({ ...settled, origin: ["ouest"], reach: "alike" }, 10).map((c) => c.zone);
    expect(new Set(west).size).toBeGreaterThan(1);
    const north = top({ ...settled, origin: ["nord"], reach: "alike" }, 5).map((c) => c.zone);
    expect(new Set(north)).toEqual(new Set(["nord"]));
  });

  it("« anywhere »: the origin weighs nothing, only the taste for the unknown it tells", () => {
    const surprised: Answers = { ...settled, origin: ["centre"], reach: "anywhere" };
    const noOrigin: Answers = { ...settled, adventure: "seeking" };
    expect(top(surprised, 5).map((c) => c.name)).toEqual(top(noOrigin, 5).map((c) => c.name));
  });

  // The surprise readers reported most (operator, 2026-11-20): North African cities named on the
  // map to readers from every other region, before they had said anything about distance.
  it("before the answer: the origin weighs without deciding", () => {
    const unsaid = top({ ...settled, origin: ["ouest"] }, 10).map((c) => c.zone);
    expect(unsaid.slice(0, 3)).not.toContain("nord");
    expect(new Set(unsaid).size).toBeGreaterThan(1);
  });

  it("brings the reader closer to where their faith is widely shared", () => {
    const reader: Answers = { ...settled, origin: ["ameriques"], reach: "region" };
    const muslim: Answers = { ...reader, faith: "muslim" };
    const christian: Answers = { ...reader, faith: "christian" };
    expect(rankOf("Dakar", muslim)).toBeLessThan(rankOf("Lomé", muslim));
    expect(rankOf("Lomé", christian)).toBeLessThan(rankOf("Dakar", christian));
    expect(rankOf("Dakar", muslim)).toBeLessThan(rankOf("Dakar", reader));
  });
});

// Operator, 2026-11-20: the site is there to show cities the reader did not think of; those
// outside what the family knows are labelled, and the order is left alone.
describe("the cities marked « à découvrir »", () => {
  const marked = (answers: Answers) =>
    bestMatches(answers, 115)
      .filter((m) => m.toDiscover)
      .map((m) => m.city);

  it("marks the cities outside the family's countries, once a country is named", () => {
    const cities = marked({ ...settled, origin: ["ouest"], countries: ["Sénégal"] });
    expect(cities.map((c) => c.country)).not.toContain("Sénégal");
    expect(cities.map((c) => c.country)).toContain("Côte d'Ivoire");
  });

  it("marks the cities outside the family's regions when no country is named", () => {
    const zones = new Set(marked({ ...settled, origin: ["ouest", "centre"] }).map((c) => c.zone));
    expect(zones).toEqual(new Set(["est", "sud", "nord"]));
  });

  it("marks nothing for a reader who named no African origin", () => {
    expect(marked(settled)).toEqual([]);
    expect(marked({ ...settled, origin: ["ameriques"] })).toEqual([]);
  });

  it("never changes the order", () => {
    const answers: Answers = { ...settled, origin: ["ouest"], countries: ["Sénégal"] };
    const scores = bestMatches(answers, 115).map((m) => m.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

// The guard for a reader who would rather not name an origin (operator, 2026-11-20).
describe("the regions a reader says draw them", () => {
  const zones = (answers: Answers, count: number) =>
    bestMatches(answers, count).map((m) => m.city.zone);

  it("brings those regions first, and removes no city", () => {
    const drawn: Answers = { ...settled, drawnTo: ["est", "sud"] };
    expect(zones(settled, 3)).toContain("nord");
    for (const zone of zones(drawn, 3)) expect(["est", "sud"]).toContain(zone);
    expect(bestMatches(drawn, 115)).toHaveLength(115);
  });

  it("changes nothing when the reader names none", () => {
    const names = (answers: Answers) => bestMatches(answers, 5).map((m) => m.city.name);
    expect(names({ ...settled, drawnTo: [] })).toEqual(names(settled));
  });
});

// Beta feedback, 2026-11-19: a reader from the Caribbean who wanted to live near their own was
// sent to North Africa, and the family's region counted for less with every further answer.
describe("the divide between North Africa and the rest of the continent", () => {
  const southward: Answers = {
    project: "installer",
    languages: ["fr", "en"],
    family: "celib",
    size: 3,
    pace: 1,
    landscapes: ["beach"],
    climate: "hot",
    saturday: 1,
    order: 0,
    together: 1,
    friction: 1,
    budget: "serre",
    priorities: ["career", "diaspora"],
  };
  const zonesOfTop = (answers: Answers, count: number) =>
    bestMatches(answers, count).map((m) => m.city.zone);

  it("keeps North Africa out of the top five of a Caribbean reader who wants to stay near their own", () => {
    for (const nearOnesOwn of [
      { reach: "country" },
      { reach: "region" },
      { reach: "alike" },
    ] as Answers[]) {
      const zones = zonesOfTop({ ...settled, origin: ["ameriques"], ...nearOnesOwn }, 5);
      expect(zones, JSON.stringify(nearOnesOwn)).not.toContain("nord");
    }
  });

  it("works the other way: a North African reader who wants to stay near their own stays north", () => {
    const zones = zonesOfTop({ ...southward, origin: ["nord"], reach: "country" }, 5);
    expect(new Set(zones)).toEqual(new Set(["nord"]));
  });

  it("lets North Africa back in as soon as the reader says « anywhere »", () => {
    const zones = zonesOfTop({ ...settled, origin: ["ameriques"], reach: "anywhere" }, 5);
    expect(zones).toContain("nord");
  });

  it("lowers a city across the divide without ever removing it", () => {
    const answers: Answers = {
      ...settled,
      origin: ["ameriques"],
      reach: "country",
    };
    expect(bestMatches(answers, 115)).toHaveLength(115);
    expect(scoreOf("Casablanca", answers)).toBeGreaterThan(0.2);
  });

  it("leaves a mixed family at home on both sides", () => {
    const zones = zonesOfTop({ ...settled, origin: ["ameriques", "nord"], reach: "country" }, 5);
    expect(zones).toContain("nord");
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
    reach: "region",
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
