import { describe, expect, it } from "vitest";
import { CITIES, livableLanguages } from "./cities";
import { bestMatches, profileOf, rankCities, type Answers } from "./ranking";
import { closenessOf, fingerprint, type Pull } from "./fit";

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
  order: [0, 0.5, 1],
  together: [0, 0.5, 1],
  kin: ["much", "some", "none"],
  adventure: ["familiar", "open", "seeking"],
  faith: ["muslim", "christian", "other", "none"],
  // Each city's own country: the family country a diaspora would name.
  countries: [...new Set(CITIES.map((c) => c.country))].map((country) => [country]),
};
describe("the city a profile lands on", () => {
  const proposable = CITIES;

  // How far ahead of the best other proposable city a city is, for these answers.
  const lead = (answers: Answers, name: string) => {
    const ranked = rankCities(answers);
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
  it("has a combination of answers that puts each city first", async () => {
    const unreachable: string[] = [];
    for (const city of proposable) {
      // The climb is long: yield between cities so the test runner can still talk to its
      // worker (a synchronous half-minute made CI time out on « onTaskUpdate »).
      await new Promise((resolve) => setTimeout(resolve, 0));
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
    // About a minute on a laptop and twice that on CI since the temperament facts joined the
    // matching: a search over answer combinations, not something a reader waits for.
  }, 240_000);

  // Readers the site is made for, described the way they would answer (operator, 2026-11-15).
  // Random answers do not look like anyone, so concentration is judged on these instead.
  const READERS: Record<string, Answers> = {
    "French, Senegalese and Guinean parents, Muslim": {
      project: "installer",
      languages: ["fr"],
      origin: ["ouest"],
      kin: "much",
      adventure: "familiar",
      faith: "muslim",
      passports: ["eu"],
      profession: "finance",
    },
    "French-Cameroonian teacher, Christian, two children": {
      project: "installer",
      languages: ["fr", "en"],
      origin: ["centre"],
      kin: "much",
      adventure: "open",
      faith: "christian",
      family: "parents",
      profession: "teaching",
      budget: "moyen",
    },
    "French-Algerian developer, Muslim": {
      project: "pied",
      languages: ["fr", "ar"],
      origin: ["nord"],
      kin: "much",
      adventure: "familiar",
      faith: "muslim",
      profession: "tech",
      currentCity: "capital",
    },
    "Martinican remote worker after the sea": {
      project: "tester",
      languages: ["fr"],
      origin: ["ameriques"],
      kin: "some",
      adventure: "seeking",
      landscapes: ["beach", "island"],
      profession: "tech",
      budget: "moyen",
    },
    "French-Malian retiree on a small pension": {
      project: "installer",
      languages: ["fr"],
      origin: ["ouest"],
      kin: "much",
      adventure: "familiar",
      faith: "muslim",
      profession: "retired",
      budget: "serre",
      rhythm: "calmer",
      currentCity: "bigcity",
    },
    "Belgian-Congolese trader who loves the night": {
      project: "investir",
      languages: ["fr"],
      origin: ["centre"],
      kin: "some",
      adventure: "open",
      profession: "trade",
      saturday: 1,
      rhythm: "more",
    },
    "British-Nigerian banker": {
      project: "pied",
      languages: ["en"],
      origin: ["ouest"],
      kin: "much",
      adventure: "familiar",
      faith: "christian",
      profession: "finance",
      priorities: ["career"],
      passports: ["eu"],
    },
    "French-Ivorian student, tight budget, curious": {
      project: "tester",
      languages: ["fr"],
      origin: ["ouest"],
      kin: "none",
      adventure: "seeking",
      profession: "student",
      budget: "serre",
      saturday: 1,
      roots: "discover",
    },
    "French-Moroccan family with children": {
      project: "installer",
      languages: ["fr", "ar"],
      origin: ["nord"],
      kin: "much",
      adventure: "familiar",
      faith: "muslim",
      family: "parents",
      priorities: ["safety", "healthAndSchools"],
    },
    "Haitian-Canadian NGO worker who likes nature": {
      project: "tester",
      languages: ["fr", "en"],
      origin: ["ameriques"],
      kin: "some",
      adventure: "open",
      profession: "ngo",
      landscapes: ["nature"],
      climate: "mild",
    },
    "British-Kenyan engineer": {
      project: "installer",
      languages: ["en", "sw"],
      origin: ["est"],
      kin: "some",
      adventure: "open",
      profession: "tech",
      currentCity: "capital",
    },
    "French-Comorian nurse, Muslim, by the sea": {
      project: "installer",
      languages: ["fr"],
      origin: ["sud"],
      kin: "much",
      adventure: "familiar",
      faith: "muslim",
      profession: "health",
      landscapes: ["island"],
    },
    "Franco-Guadeloupean couple who want to unplug": {
      project: "tester",
      languages: ["fr"],
      origin: ["ameriques"],
      kin: "none",
      adventure: "seeking",
      family: "couple",
      rhythm: "unplug",
      friction: 1,
      landscapes: ["beach"],
    },
  };

  it("gives each reader cities where they can live in one of their languages", () => {
    for (const [reader, answers] of Object.entries(READERS)) {
      for (const m of bestMatches(answers, 3)) {
        const spoken = livableLanguages(m.city);
        expect(
          spoken.some((l) => (answers.languages ?? []).includes(l)),
          `${reader}: ${m.city.name}`,
        ).toBe(true);
      }
    }
  });

  it("sends different readers to different cities", () => {
    const firsts = Object.values(READERS).map((answers) => bestMatches(answers, 1)[0].city.name);
    const counts = new Map<string, number>();
    for (const name of firsts) counts.set(name, (counts.get(name) ?? 0) + 1);
    expect(counts.size, firsts.join(", ")).toBeGreaterThanOrEqual(9);
    for (const [name, count] of counts) expect(count, name).toBeLessThanOrEqual(2);
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
    // Measured as a gain, other answers (here the default reception rule) being equal.
    const gap = (answers: Answers) =>
      scoreOf(answers, "Johannesburg") - scoreOf(answers, "Saint-Louis");
    expect(gap({ profession: "finance" })).toBeGreaterThan(gap({}));
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

describe("feeling at home among one's own", () => {
  const zones = (answers: Answers, n = 3) => bestMatches(answers, n).map((m) => m.city.zone);
  // A French reader with Senegalese and Guinean parents, who already knows Dakar and Abidjan.
  const westAfrican: Answers = {
    project: "installer",
    languages: ["fr"],
    origin: "ouest",
    kin: "much",
    adventure: "familiar",
  };

  it("keeps a West African reader who wants to feel at home in sub-Saharan Africa", () => {
    expect(zones(westAfrican, 5)).not.toContain("nord");
  });

  it("keeps North Africa out of the first five even when other answers favour it", () => {
    // Played in the browser on 2026-11-15: the first choice of each adaptive question.
    const played = {
      ...westAfrican,
      faith: "muslim",
      profession: "finance",
      saturday: 1,
      rhythm: "same",
    } as Answers;
    const shown = bestMatches(played, 7).filter(
      (m) => m.city.name !== "Dakar" && m.city.name !== "Abidjan",
    );
    expect(shown.slice(0, 5).map((m) => `${m.city.name}:${m.city.zone}`)).not.toContainEqual(
      expect.stringMatching(/:nord$/),
    );
  });

  it("brings that reader closest to their family's region", () => {
    expect(zones(westAfrican).filter((z) => z === "ouest").length).toBeGreaterThanOrEqual(2);
  });

  it("brings a reader of North African origin to North Africa", () => {
    expect(zones({ ...westAfrican, origin: "nord" })).toEqual(["nord", "nord", "nord"]);
  });

  it("lets an adventurous reader go further from the family's region", () => {
    const home = zones(westAfrican, 10).filter((z) => z === "ouest").length;
    const away = zones({ ...westAfrican, adventure: "seeking" }, 10).filter(
      (z) => z === "ouest",
    ).length;
    expect(away).toBeLessThan(home);
  });

  it("sends an adventurous reader out of the family's region, not only to its opposite", () => {
    const away = zones({ ...westAfrican, adventure: "seeking" }, 5);
    expect(away.filter((z) => z !== "ouest" && z !== "nord").length).toBeGreaterThan(0);
  });

  it("brings a reader closer to where their faith is widely shared, when that matters", () => {
    const score = (answers: Answers, name: string) =>
      rankCities(answers).find((m) => m.city.name === name)!.score;
    const muslim: Answers = { kin: "much", faith: "muslim" };
    const christian: Answers = { kin: "much", faith: "christian" };
    expect(score(muslim, "Dakar")).toBeGreaterThan(score(muslim, "Accra"));
    expect(score(christian, "Accra")).toBeGreaterThan(score(christian, "Dakar"));
    const indifferent: Answers = { kin: "none", faith: "muslim" };
    expect(score(indifferent, "Dakar")).toBe(score(indifferent, "Accra"));
  });

  it("counts documented anti-Black racism against feeling at home, for a sub-Saharan family", () => {
    const { pulls, facts } = profileOf(westAfrican);
    const parts = (name: string) =>
      closenessOf(
        CITIES.find((c) => c.name === name)!,
        pulls,
        facts,
      ).find((p) => p.fact === "kin")!.value;
    // Same region on the map; the UN and HRW document anti-Black racism in Mauritania.
    expect(parts("Nouakchott")).toBeLessThan(parts("Dakar"));
  });

  it("feels at home wherever one side of a mixed family comes from", () => {
    const mixed = { ...westAfrican, origin: ["ouest", "nord"] } as Answers;
    const { pulls, facts } = profileOf(mixed);
    const kin = (name: string) =>
      closenessOf(
        CITIES.find((c) => c.name === name)!,
        pulls,
        facts,
      ).find((p) => p.fact === "kin")!.value;
    expect(kin("Dakar")).toBe(1);
    expect(kin("Casablanca")).toBe(1);
    expect(kin("Nairobi")).toBeLessThan(1);
  });

  it("brings a family back to its own country when it seeks its roots", () => {
    const sudanese = {
      origin: ["nord"],
      countries: ["Soudan"],
      roots: "rediscover",
      kin: "much",
      languages: ["ar"],
    } as Answers;
    const names = bestMatches(sudanese, 3).map((m) => m.city.country);
    expect(names).toContain("Soudan");
  });

  it("puts the family's own country first when feeling at home matters a lot", () => {
    // Played in the browser on 2026-11-15; roots was never asked.
    const played = {
      project: "installer",
      languages: ["ar"],
      origin: ["nord"],
      countries: ["Soudan"],
      kin: "much",
      adventure: "familiar",
      faith: "muslim",
      profession: "finance",
      rhythm: "same",
      landscapes: ["beach"],
      currentCity: "capital",
      habits: ["gym"],
    } as Answers;
    expect(bestMatches(played, 3).map((m) => m.city.country)).toContain("Soudan");
  });

  it("does not weigh the family's region when feeling at home does not matter to the reader", () => {
    // Origin still protects against documented racism; it no longer pulls towards the region.
    const indifferent = { ...westAfrican, kin: "none" } as Answers;
    expect(profileOf(indifferent).facts.map((f) => f.kind)).not.toContain("kin");
  });
});

describe("the reader's passport", () => {
  const scoreOf = (answers: Answers, name: string) =>
    rankCities(answers).find((m) => m.city.name === name)!.score;

  it("favours countries a European passport enters without a visa", () => {
    const eu: Answers = { passports: ["eu"] };
    expect(scoreOf(eu, "Tunis")).toBeGreaterThan(scoreOf(eu, "Alger"));
  });

  it("favours the free-movement zone of an African passport", () => {
    const ecowas: Answers = { passports: ["ecowas"] };
    expect(scoreOf(ecowas, "Accra")).toBeGreaterThan(scoreOf(ecowas, "Nairobi"));
  });

  it("counts the easier of two passports", () => {
    const both: Answers = { passports: ["eu", "ecowas"] };
    expect(scoreOf(both, "Accra")).toBeCloseTo(scoreOf(both, "Dakar"), 6);
  });
});

describe("never sending a reader where they would be badly received", () => {
  // Countries where the UN or a major rights organisation documents anti-Black racism.
  const hostile = new Set(
    CITIES.filter((c) => c.countryFacts?.racism?.kind === "anti-black").map((c) => c.country),
  );
  const countriesOf = (answers: Answers, n = 5) =>
    bestMatches(answers, n).map((m) => m.city.country);

  it("keeps an adventurous reader of West African family out of them", () => {
    const adventurous = {
      project: "tester",
      languages: ["fr", "ar"],
      origin: ["ouest"],
      kin: "none",
      adventure: "seeking",
      saturday: 1,
      landscapes: ["beach"],
    } as Answers;
    for (const country of countriesOf(adventurous))
      expect(hostile.has(country), country).toBe(false);
  });

  it("keeps a Caribbean reader after the sea out of them", () => {
    const martinican = {
      project: "tester",
      languages: ["fr"],
      origin: ["ameriques"],
      kin: "some",
      adventure: "seeking",
      landscapes: ["beach", "island"],
      profession: "tech",
    } as Answers;
    for (const country of countriesOf(martinican))
      expect(hostile.has(country), country).toBe(false);
  });

  it("keeps a reader who does not give their origin out of them too", () => {
    const silent = {
      project: "tester",
      languages: ["fr", "ar"],
      origin: [null],
      adventure: "seeking",
      saturday: 1,
      landscapes: ["beach"],
    } as unknown as Answers;
    for (const country of countriesOf(silent)) expect(hostile.has(country), country).toBe(false);
    const unasked = { ...silent, origin: undefined } as Answers;
    for (const country of countriesOf(unasked)) expect(hostile.has(country), country).toBe(false);
  });

  it("keeps a French-Senegalese reader out of them, as in the first field test", () => {
    // Field test of 2026-11-15: Senegalese father, French mother, never been to Tunisia.
    const ely = {
      project: "decouvrir",
      languages: ["fr"],
      origin: ["ouest"],
      countries: ["Sénégal"],
      kin: "some",
      adventure: "seeking",
      landscapes: ["beach", "island"],
      passports: ["eu"],
    } as Answers;
    for (const country of countriesOf(ely)) expect(hostile.has(country), country).toBe(false);
  });

  it("still offers North Africa to a reader of North African family", () => {
    const maghrebi = { languages: ["fr", "ar"], origin: ["nord"], kin: "much" } as Answers;
    expect(countriesOf(maghrebi, 3).some((c) => hostile.has(c))).toBe(true);
  });

  it("says why on the card, in the words of the source, with its name and year", () => {
    const reader = { origin: ["ouest"], languages: ["ar"] } as Answers;
    const tunis = rankCities(reader).find((m) => m.city.name === "Tunis")!;
    expect(tunis.drawbacks.map((d) => d.label)).toContain(
      "Propos racistes et violences contre les Africains noirs (ONU, 2023)",
    );
  });

  it("gives every documented case a short label that names its source and year", () => {
    for (const city of CITIES) {
      const racism = city.countryFacts?.racism;
      if (racism) expect(racism.label, city.country).toMatch(/\([^)]+, \d{4}\)$/);
    }
  });
});

describe("tensions between a family's country and a host country", () => {
  // The control swaps one family country for another that no source ties to the host, so the
  // family-country pull is the same size and only the documented tension differs.
  const scoreOf = (answers: Answers, name: string) =>
    rankCities(answers).find((m) => m.city.name === name)!.score;
  const family = (country: string): Answers => ({
    origin: ["centre", "est", "ouest"],
    countries: [country],
    kin: "none",
    adventure: "seeking",
  });
  const tensions = CITIES.flatMap((c) => c.countryFacts?.tensions ?? []);

  it("lowers Rwanda for a family from RD Congo, where the UN documents Rwanda's role in the war", () => {
    expect(scoreOf(family("RD Congo"), "Kigali")).toBeLessThan(scoreOf(family("Congo"), "Kigali"));
  });

  it("lowers RD Congo for a family from Rwanda", () => {
    expect(scoreOf(family("Rwanda"), "Kinshasa")).toBeLessThan(
      scoreOf(family("Burundi"), "Kinshasa"),
    );
  });

  it("never turns a family against one of its own countries", () => {
    // A family from both Rwanda and RD Congo is at home in each: the war between the two states
    // must not push it out of either.
    const mixed = { ...family("Rwanda"), countries: ["Rwanda", "RD Congo"] };
    const control = { ...family("Rwanda"), countries: ["Rwanda", "Congo"] };
    expect(scoreOf(mixed, "Kigali")).toBeCloseTo(scoreOf(control, "Kigali"), 2);
    const otherControl = { ...family("Burundi"), countries: ["Burundi", "RD Congo"] };
    expect(scoreOf(mixed, "Kinshasa")).toBeCloseTo(scoreOf(otherControl, "Kinshasa"), 2);
  });

  it("weighs a ban on small trade less than an armed conflict", () => {
    const conflict = scoreOf(family("Congo"), "Kigali") - scoreOf(family("RD Congo"), "Kigali");
    const restriction =
      scoreOf(family("Ghana"), "Libreville") - scoreOf(family("Nigeria"), "Libreville");
    expect(restriction).toBeGreaterThan(0);
    expect(conflict).toBeGreaterThan(restriction);
  });

  // A war between two peoples shown under « Ce qui joue contre elle », with a level, reads as a
  // verdict on the reader's family: it weighs in the score and is never written on a card
  // (operator, 2026-11-16).
  it("never writes a tension on a card, for the families it concerns or any other", () => {
    const labels = new Set(tensions.map((t) => t.label));
    for (const country of ["RD Congo", "Rwanda", "Nigeria", "Ghana"])
      for (const match of rankCities(family(country)))
        for (const line of [...match.reasons, ...match.drawbacks])
          expect(labels.has(line.label), `${country} → ${match.city.name}`).toBe(false);
  });

  it("gives every documented tension a source name and year, dated sources and real countries", () => {
    const countries = new Set(CITIES.map((c) => c.country));
    expect(tensions.length).toBeGreaterThan(0);
    for (const city of CITIES) {
      for (const t of city.countryFacts?.tensions ?? []) {
        expect(t.label, city.country).toMatch(/\([^)]+, \d{4}\)$/);
        expect(t.sources.length, t.label).toBeGreaterThan(0);
        for (const source of t.sources)
          expect(source.accessed, t.label).toMatch(/^\d{4}-\d{2}-\d{2}/);
        expect(t.from.length, t.label).toBeGreaterThan(0);
        for (const from of t.from) {
          expect(countries.has(from), from).toBe(true);
          expect(from, t.label).not.toBe(city.country);
        }
      }
    }
  });
});
