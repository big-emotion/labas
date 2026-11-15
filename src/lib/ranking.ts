import {
  CITIES,
  CRITERIA,
  livableLanguages,
  type City,
  type CriterionKey,
  type Language,
} from "./cities";
import { TRAITS } from "./city-temperament";
import { closenessOf, type Axis, type Closeness, type FactPull, type Pull } from "./fit";
import { portraitFor, type PortraitLine } from "./portrait";

/** The non-negotiables offered by the quiz (their values predate the sourced criteria). */
export type Priority =
  "safety" | "cost" | "healthAndSchools" | "career" | "diaspora" | "memory" | "flights";

/** A three-step stated preference: 0, 0.5 or 1. */
type Step = 0 | 0.5 | 1;

type QuizLanguage = Exclude<Language, "es" | "sw"> | "es" | "sw";
export type Landscape = "beach" | "water" | "nature" | "wildSpaces" | "urban" | "island";

/**
 * Every answer is optional: an unanswered question drops out of the score. The quick quiz and
 * the fuller questionnaire (/approfondir) fill the same profile.
 */
type Origin = City["zone"] | "ameriques";

export interface Answers {
  project?: "installer" | "pied" | "tester" | "investir" | "decouvrir";
  budget?: "serre" | "moyen" | "large";
  family?: "celib" | "couple" | "fonder" | "parents";
  job?: "cadre" | "entre" | "remote" | "crea" | "soin";
  /** Every language the reader can live in. */
  languages?: QuizLanguage[];
  size?: City["size"];
  /** Every landscape the reader wants nearby. */
  landscapes?: Landscape[];
  climate?: "hot" | "mild" | "dry";
  /** Ideal Saturday night: 1 out late with a crowd, 0.5 dinner with friends, 0 quiet at home. */
  saturday?: Step;
  /** Non-negotiables; only the first three count. */
  priorities?: Priority[];
  /**
   * Where the family comes from: African zones, or the Americas and the Caribbean. Several for a
   * mixed family; a single value is still accepted.
   */
  origin?: Origin | Origin[];
  /** The family's countries, among those of its African regions. */
  countries?: string[];
  /** Passports held: French or EU, or one giving free movement in an African zone. */
  passports?: ("eu" | "ecowas" | "cemac" | "eac" | "other")[];
  /** How much feeling at home among one's own matters: origin, culture, religion. */
  kin?: "much" | "some" | "none";
  /** The reader's faith, only weighed when feeling at home matters. */
  faith?: "muslim" | "christian" | "other" | "none" | "private";
  /** Going far from what one knows: rather not, why not, or that is the point. */
  adventure?: "familiar" | "open" | "seeking";
  /** Looking for one's roots, somewhere new, or both. */
  roots?: "rediscover" | "discover" | "both";
  profession?:
    | "finance"
    | "law"
    | "consulting"
    | "tech"
    | "health"
    | "teaching"
    | "ngo"
    | "admin"
    | "trade"
    | "culture"
    | "craft"
    | "student"
    | "retired";
  /** Where the reader lives today: their life to keep, or to leave. */
  currentCity?: "capital" | "bigcity" | "town" | "country" | "nomad";
  /** Over there: the same rhythm as today, calmer, more intense, or cut off from it all. */
  rhythm?: "same" | "calmer" | "more" | "unplug";
  /** How the reader gets around today. */
  mobility?: "walk" | "transit" | "bike" | "car";
  /** The reader's daily habits. */
  habits?: ("gym" | "cafes" | "culture" | "markets" | "nights" | "nature")[];
  /** The reader's neighbourhood today. */
  neighbourhood?: "central" | "residential" | "upscale" | "popular";
  /** With people: being invited and knowing the neighbours, keeping one's peace, or both. */
  people?: "invited" | "quiet" | "both";
  /** Where the reader grew up: a hint at the pace that suits them. */
  grewUp?: "city" | "town" | "country";

  // The fuller questionnaire. Filters remove cities, and the page says how many and why.
  /** Only cities where one of the reader's languages is spoken day to day. */
  languageOnly?: boolean;
  /** Children to school in this curriculum. */
  schoolCurriculum?: "french" | "english" | "any";
  /** Needs regular care (treatment, pregnancy, elderly parent). */
  specialistCare?: boolean;
  /** Only countries a French passport enters without a visa. */
  visaFreeOnly?: boolean;
  /** Leave out countries that punish homosexuality. Opt-in, never inferred, never stored. */
  excludeCriminalising?: boolean;
  /** Noise and crowds: 1 give energy, 0.5 depends, 0 tire. */
  crowds?: Step;
  /** Power cuts, paperwork, the unexpected: 1 copes, 0.5 weighs on, 0 wants to avoid. */
  friction?: Step;
  /** Rules and organisation: 1 needs everything clear, 0 improvises (conscientiousness). */
  order?: Step;
  /** 1 moves forward with others, 0 makes their own way (agreeableness). */
  together?: Step;
  /** Bargaining over prices: 1 a game, 0.5 fine, 0 a chore. */
  bargaining?: Step;
  /** Trips back to Europe a year: 0 one or fewer, 0.5 two or three, 1 every month. */
  tripsHome?: Step;
  /** Cash available before moving in. */
  setupBudget?: "low" | "medium" | "high";
  /** Life over there: among other returnees, like the locals, or both. */
  belonging?: "returnees" | "locals" | "both";
  /** What the reader can give up. */
  renounce?: CriterionKey[];
}

export interface Rated {
  label: string;
  /** 1 to 5, the closeness behind the line. */
  level: number;
}

/** The answers read as temperament (inspired by the Big Five, one question per trait). */
export const TEMPERAMENT_KEYS = TRAITS;

export interface Match {
  city: City;
  /** 0 to 1: how close the city's fingerprint is to what the reader said. */
  score: number;
  /** 0 to 1: the share of the reader's weight backed by a known value (§4.2). */
  coverage: number;
  /** Why a filter of the fuller questionnaire keeps this city out, in plain French. */
  excludedBecause?: string;
  /** Up to five plain-language reasons the city fits, each rated 1 to 5. */
  reasons: Rated[];
  /** Up to three things that weigh against it for this reader, each rated 1 to 5. */
  drawbacks: Rated[];
  /** 0 to 1 on the five temperament answers alone; null before any of them. */
  temperament: number | null;
  /** 0 to 1 on every other answer. */
  practical: number;
  /** "Pourquoi vous" lines: what the reader said, met by what the city offers. */
  portrait: PortraitLine[];
}

const LANGUAGE_NAMES: Record<Language, string> = {
  fr: "français",
  en: "anglais",
  pt: "portugais",
  ar: "arabe",
  es: "espagnol",
  sw: "swahili",
};

const MAX_PRIORITIES = 3;
const pull = (axis: Axis, target: number, weight: number): Pull => ({ axis, target, weight });

// Each answer is a set of pulls: where it wants the city on an axis (0 to 1, relative to the
// 115 cities), and how much that counts. A reading of the answer, written down so it can be
// argued with: "Danser jusqu'au matin" wants a city at the lively end of nightlife.
// Each answer is read against every one of the 16 criteria (docs/criteria/weights.md): a pull
// says where the answer wants the city (0 to 1, relative to the 115 cities) and how much that
// counts; a criterion left out is unrelated to the answer on purpose. Everyday basics (safety,
// power, water and care) count wherever a European-based reader would check them first.
const PROJECT: Record<NonNullable<Answers["project"]>, Pull[]> = {
  installer: [
    pull("safety", 0.9, 2),
    pull("comfort", 0.85, 2),
    pull("paperwork", 0.85, 1.5),
    pull("jobs", 0.7, 1),
    pull("returnees", 0.7, 1),
    pull("internet", 0.7, 0.5),
    pull("schools", 0.6, 0.5),
    pull("flights", 0.6, 0.5),
    pull("cheap", 0.6, 0.5),
    pull("easySetup", 0.6, 0.5),
  ],
  pied: [
    pull("flights", 0.95, 3),
    pull("internet", 0.85, 1.5),
    pull("safety", 0.8, 1),
    pull("comfort", 0.75, 1),
    pull("paperwork", 0.8, 1),
    pull("easySetup", 0.7, 0.5),
    pull("returnees", 0.7, 0.5),
  ],
  tester: [
    pull("easySetup", 0.9, 2),
    pull("safety", 0.8, 1.5),
    pull("returnees", 0.8, 1.5),
    pull("cheap", 0.7, 1),
    pull("comfort", 0.75, 1),
    pull("internet", 0.75, 1),
    pull("paperwork", 0.75, 1),
    pull("flights", 0.7, 0.5),
  ],
  investir: [
    pull("business", 0.95, 3),
    pull("paperwork", 0.85, 2),
    pull("jobs", 0.7, 1),
    pull("safety", 0.75, 1),
    pull("flights", 0.7, 1),
    pull("internet", 0.7, 0.5),
  ],
  decouvrir: [
    pull("safety", 0.9, 2),
    pull("comfort", 0.8, 1.5),
    pull("culture", 0.8, 1.5),
    pull("history", 0.8, 1.5),
    pull("flights", 0.8, 1.5),
    pull("nightlife", 0.65, 0.5),
    pull("cheap", 0.6, 0.5),
  ],
};
const SATURDAY: Record<Step, Pull[]> = {
  1: [
    pull("nightlife", 1, 3),
    pull("pace", 0.8, 1),
    pull("culture", 0.7, 0.5),
    pull("safety", 0.7, 0.5),
  ],
  0.5: [pull("nightlife", 0.55, 2), pull("culture", 0.6, 0.5)],
  0: [pull("nightlife", 0.1, 2.5), pull("pace", 0.2, 1.5), pull("safety", 0.8, 0.5)],
};
const BUDGET: Record<NonNullable<Answers["budget"]>, Pull[]> = {
  serre: [pull("cheap", 1, 3), pull("easySetup", 0.85, 1.5), pull("bargaining", 0.6, 0.5)],
  moyen: [pull("cheap", 0.65, 1.5), pull("easySetup", 0.6, 0.5)],
  large: [pull("comfort", 0.85, 1), pull("safety", 0.8, 0.5)],
};
const FAMILY: Record<NonNullable<Answers["family"]>, Pull[]> = {
  celib: [pull("returnees", 0.7, 1), pull("nightlife", 0.7, 0.5), pull("culture", 0.65, 0.5)],
  couple: [pull("safety", 0.75, 0.5), pull("culture", 0.65, 0.5), pull("nightlife", 0.6, 0.5)],
  fonder: [
    pull("schools", 0.9, 2.5),
    pull("safety", 0.9, 2),
    pull("comfort", 0.85, 2),
    pull("cheap", 0.6, 0.5),
    pull("pace", 0.45, 0.5),
  ],
  parents: [
    pull("schools", 1, 3),
    pull("safety", 0.95, 2.5),
    pull("comfort", 0.9, 2),
    pull("pace", 0.4, 0.5),
  ],
};
const JOB: Record<NonNullable<Answers["job"]>, Pull[]> = {
  cadre: [pull("jobs", 0.95, 3), pull("internet", 0.6, 0.5), pull("flights", 0.6, 0.5)],
  entre: [
    pull("business", 0.95, 3),
    pull("paperwork", 0.8, 1.5),
    pull("internet", 0.7, 1),
    pull("jobs", 0.6, 0.5),
    pull("bargaining", 0.6, 0.5),
  ],
  remote: [
    pull("internet", 1, 3),
    pull("comfort", 0.85, 2),
    pull("flights", 0.7, 1),
    pull("cheap", 0.6, 0.5),
  ],
  crea: [pull("culture", 1, 3), pull("nightlife", 0.7, 1), pull("history", 0.65, 0.5)],
  soin: [
    pull("jobs", 0.7, 1),
    pull("comfort", 0.75, 1),
    pull("schools", 0.7, 1),
    pull("cheap", 0.6, 0.5),
  ],
};
const SIZE: Record<City["size"], Pull[]> = {
  3: [pull("pace", 0.95, 2.5), pull("nightlife", 0.7, 0.5)],
  2: [pull("pace", 0.5, 2.5)],
  1: [pull("pace", 0.1, 2.5), pull("nightlife", 0.3, 0.5)],
};
const GREW_UP: Record<NonNullable<Answers["grewUp"]>, Pull[]> = {
  city: [pull("pace", 0.8, 1)],
  town: [pull("pace", 0.45, 1)],
  country: [pull("pace", 0.15, 1)],
};
const PRIORITY: Record<Priority, Pull[]> = {
  safety: [pull("safety", 1, 3)],
  cost: [pull("cheap", 1, 3), pull("easySetup", 0.8, 1)],
  healthAndSchools: [pull("comfort", 1, 2), pull("schools", 1, 2)],
  career: [pull("jobs", 1, 3), pull("business", 0.7, 1)],
  diaspora: [pull("returnees", 1, 3)],
  memory: [pull("history", 1, 3), pull("culture", 0.7, 0.5)],
  flights: [pull("flights", 1, 3)],
};
// A profession meets the fields that hire in a city (src/data/city-life.json), plus pulls.
const PROFESSION: Record<
  NonNullable<Answers["profession"]>,
  { fields: string[]; pulls: Pull[] }
> = {
  finance: { fields: ["finance"], pulls: [pull("business", 0.8, 1), pull("flights", 0.7, 0.5)] },
  law: { fields: ["law", "consulting-project"], pulls: [pull("business", 0.7, 1)] },
  consulting: {
    fields: ["consulting-project", "ngo-international"],
    pulls: [pull("business", 0.7, 1), pull("flights", 0.7, 0.5)],
  },
  tech: {
    fields: ["tech"],
    pulls: [pull("internet", 0.9, 1.5), pull("business", 0.8, 1), pull("comfort", 0.75, 0.5)],
  },
  health: { fields: ["health"], pulls: [pull("comfort", 0.8, 1)] },
  teaching: { fields: ["education"], pulls: [pull("schools", 0.8, 1)] },
  ngo: { fields: ["ngo-international"], pulls: [pull("flights", 0.7, 0.5)] },
  admin: { fields: ["public-admin", "ngo-international"], pulls: [pull("paperwork", 0.7, 0.5)] },
  trade: {
    fields: ["trade", "logistics-port"],
    pulls: [pull("business", 0.8, 1), pull("bargaining", 0.8, 0.5)],
  },
  culture: {
    fields: ["media-arts", "tourism-hospitality"],
    pulls: [pull("culture", 1, 1.5), pull("nightlife", 0.65, 0.5)],
  },
  craft: {
    fields: ["construction-realestate", "agriculture-agrifood", "trade"],
    pulls: [pull("cheap", 0.7, 1), pull("bargaining", 0.7, 0.5)],
  },
  student: {
    fields: [],
    pulls: [pull("cheap", 0.9, 1.5), pull("culture", 0.7, 1), pull("nightlife", 0.65, 0.5)],
  },
  retired: {
    fields: [],
    pulls: [
      pull("comfort", 0.9, 2),
      pull("safety", 0.9, 1.5),
      pull("pace", 0.3, 1),
      pull("flights", 0.7, 0.5),
    ],
  },
};
// Life today: what a reader would find again over there, unless they want a change of rhythm.
const CURRENT_CITY: Record<NonNullable<Answers["currentCity"]>, Pull[]> = {
  capital: [pull("pace", 0.8, 1.5), pull("walkable", 0.8, 1.5), pull("leisure", 0.8, 1.5)],
  bigcity: [pull("pace", 0.65, 1.5), pull("walkable", 0.7, 1), pull("leisure", 0.7, 1)],
  town: [pull("pace", 0.4, 1.5), pull("walkable", 0.5, 0.5)],
  country: [pull("pace", 0.15, 1.5)],
  nomad: [pull("flights", 0.9, 2), pull("internet", 0.9, 1.5), pull("easySetup", 0.8, 1)],
};
const MOBILITY: Record<NonNullable<Answers["mobility"]>, Pull[]> = {
  walk: [pull("walkable", 0.9, 2)],
  transit: [pull("walkable", 0.75, 1.5)],
  bike: [pull("walkable", 0.6, 1), pull("pace", 0.4, 0.5)],
  car: [],
};
const HABITS: Record<NonNullable<Answers["habits"]>[number], Pull[]> = {
  gym: [pull("leisure", 0.8, 1)],
  cafes: [pull("leisure", 0.8, 1), pull("nightlife", 0.6, 0.5)],
  culture: [pull("culture", 0.9, 1.5), pull("leisure", 0.7, 0.5)],
  markets: [pull("walkable", 0.7, 1), pull("bargaining", 0.6, 0.5)],
  nights: [pull("nightlife", 0.9, 1.5)],
  nature: [],
};
const NEIGHBOURHOOD: Record<NonNullable<Answers["neighbourhood"]>, Pull[]> = {
  central: [pull("walkable", 0.85, 1), pull("pace", 0.7, 1)],
  residential: [pull("pace", 0.4, 1)],
  upscale: [pull("comfort", 0.8, 1)],
  popular: [pull("cheap", 0.7, 1), pull("bargaining", 0.7, 0.5)],
};
const PEOPLE: Record<NonNullable<Answers["people"]>, Pull[]> = {
  invited: [pull("welcome", 0.9, 2.5)],
  quiet: [pull("pace", 0.4, 0.5)],
  both: [pull("welcome", 0.7, 1)],
};
const ORDER: Record<Step, Pull[]> = {
  1: [pull("paperwork", 0.85, 1.5), pull("comfort", 0.8, 1), pull("safety", 0.8, 1)],
  0.5: [pull("paperwork", 0.6, 1)],
  0: [pull("bargaining", 0.8, 1.5)],
};
const TOGETHER: Record<Step, Pull[]> = {
  1: [pull("welcome", 0.85, 2)],
  0.5: [pull("welcome", 0.6, 1)],
  0: [pull("business", 0.85, 1.5), pull("jobs", 0.8, 1)],
};
const STEP_PULLS = {
  crowds: (s: Step) => [pull("pace", 0.1 + 0.9 * s, 2)],
  friction: (s: Step) => [
    pull("comfort", 1 - 0.6 * s, 2 * (1 - s)),
    pull("paperwork", 0.85, 1.5 * (1 - s)),
    pull("easySetup", 0.85, 1 - s),
  ],
  bargaining: (s: Step) => [pull("bargaining", 0.1 + 0.9 * s, 1.5)],
  tripsHome: (s: Step) => [pull("flights", 0.4 + 0.6 * s, 1 + 3 * s)],
};
const SETUP: Record<NonNullable<Answers["setupBudget"]>, Pull[]> = {
  low: [pull("easySetup", 0.85, 3)],
  medium: [pull("easySetup", 0.7, 1.5)],
  high: [],
};
const BELONGING: Record<NonNullable<Answers["belonging"]>, Pull[]> = {
  returnees: [pull("returnees", 0.85, 2)],
  locals: [pull("returnees", 0.2, 1.5)],
  both: [pull("returnees", 0.7, 1)],
};
const RECEPTION_WEIGHT = 8;
const KIN_WEIGHT = { much: 8, some: 3.5 } as const;
const ADVENTURE_SCALE = { familiar: 1, open: 0.5, seeking: 0.15 } as const;
const ADVENTURE_LEVEL = { familiar: 0, open: 0.5, seeking: 1 } as const;
// As much as the strongest pull of a temperament answer on the city's practical criteria.
const TEMPERAMENT_WEIGHT = 2;
const COPED_WITH: Axis[] = ["comfort", "paperwork", "easySetup"];
const RENOUNCE_AXIS: Partial<Record<CriterionKey, Axis>> = {
  culture: "culture",
  internet: "internet",
  flights: "flights",
  history: "history",
  jobs: "jobs",
};

/** Turns answers into pulls on axes and facts to match. */
export function profileOf(answers: Answers): { pulls: Pull[]; facts: FactPull[] } {
  // No default pull: with no answer every city is equal, and only answers rank them.
  const pulls: Pull[] = [];
  const facts: FactPull[] = [];
  const add = (more: Pull[] | undefined) => more && pulls.push(...more);
  if (answers.project) add(PROJECT[answers.project]);
  if (answers.saturday !== undefined) add(SATURDAY[answers.saturday]);
  if (answers.budget) add(BUDGET[answers.budget]);
  if (answers.family) add(FAMILY[answers.family]);
  if (answers.job) add(JOB[answers.job]);
  if (answers.size) add(SIZE[answers.size]);
  if (answers.grewUp) add(GREW_UP[answers.grewUp]);
  for (const priority of (answers.priorities ?? []).slice(0, MAX_PRIORITIES))
    add(PRIORITY[priority]);
  if (answers.profession) {
    const { fields, pulls: more } = PROFESSION[answers.profession];
    add(more);
    if (fields.length) facts.push({ kind: "professions", values: fields, weight: 2.5 });
  }
  if (answers.currentCity) {
    // Keeping the same rhythm doubles down on today's life; a change moves the pace target.
    const shift =
      answers.rhythm === "calmer" || answers.rhythm === "unplug"
        ? -0.4
        : answers.rhythm === "more"
          ? 0.3
          : 0;
    const boost = answers.rhythm === "same" ? 1.5 : answers.rhythm ? 0.6 : 1;
    add(
      CURRENT_CITY[answers.currentCity].map((p) => ({
        ...p,
        target: p.axis === "pace" ? Math.min(1, Math.max(0.05, p.target + shift)) : p.target,
        weight: p.weight * boost,
      })),
    );
  } else if (answers.rhythm === "calmer") {
    add([pull("pace", 0.25, 1.5)]);
  } else if (answers.rhythm === "more") {
    add([pull("pace", 0.85, 1.5)]);
  }
  if (answers.rhythm === "unplug") {
    add([pull("remote", 0.85, 2.5), pull("pace", 0.05, 1.5), pull("nightlife", 0.05, 1)]);
  }
  if (answers.mobility) add(MOBILITY[answers.mobility]);
  for (const habit of answers.habits ?? []) add(HABITS[habit]);
  if (answers.habits?.includes("nature"))
    facts.push({ kind: "settings", values: ["nature"], weight: 1.5 });
  if (answers.neighbourhood) add(NEIGHBOURHOOD[answers.neighbourhood]);
  if (answers.neighbourhood === "upscale") facts.push({ kind: "upscale", values: [], weight: 2 });
  if (answers.people) add(PEOPLE[answers.people]);
  if (answers.crowds !== undefined) add(STEP_PULLS.crowds(answers.crowds));
  if (answers.friction !== undefined) add(STEP_PULLS.friction(answers.friction));
  if (answers.order !== undefined) add(ORDER[answers.order]);
  if (answers.together !== undefined) add(TOGETHER[answers.together]);
  // Each temperament answer is also matched against the city's neighbourhoods, so a calm reader
  // is drawn to a city that is mostly calm, not only to one with little nightlife on paper.
  for (const trait of TRAITS) {
    const value =
      trait === "adventure"
        ? answers.adventure && ADVENTURE_LEVEL[answers.adventure]
        : answers[trait];
    if (value === undefined) continue;
    facts.push({ kind: "temperament", trait, value, weight: TEMPERAMENT_WEIGHT });
  }
  if (answers.bargaining !== undefined) add(STEP_PULLS.bargaining(answers.bargaining));
  if (answers.tripsHome !== undefined) add(STEP_PULLS.tripsHome(answers.tripsHome));
  if (answers.setupBudget) add(SETUP[answers.setupBudget]);
  if (answers.belonging) add(BELONGING[answers.belonging]);

  const languages = languagesOf(answers);
  if (languages.length) facts.push({ kind: "languages", values: languages, weight: 6 });
  const landscapes = landscapesOf(answers);
  const natural = landscapes.filter((l) => l !== "urban");
  if (natural.length) facts.push({ kind: "settings", values: natural, weight: 2.5 });
  if (landscapes.includes("urban")) {
    add([pull("culture", 0.8, 1.5), pull("pace", 0.7, 0.5), pull("nightlife", 0.65, 0.5)]);
  }
  if (answers.climate) facts.push({ kind: "climates", values: [answers.climate], weight: 2 });
  // Roots bring the family's regions closer.
  const origins = originsOf(answers);
  const africanOrigins = origins.filter((o) => o !== "ameriques");
  if (africanOrigins.length && (answers.roots === "rediscover" || answers.roots === "both")) {
    const weight = answers.roots === "rediscover" ? 3 : 1.5;
    facts.push({ kind: "zone", values: africanOrigins, weight });
  }

  const passports = (answers.passports ?? []).filter((p) => p !== "other");
  if (passports.length) facts.push({ kind: "entry", values: passports, weight: 1.5 });
  // Feeling at home weighs with how little the reader wants the unknown (§ belonging).
  if (origins.length && answers.kin && answers.kin !== "none") {
    const weight = KIN_WEIGHT[answers.kin] * ADVENTURE_SCALE[answers.adventure ?? "open"];
    facts.push({ kind: "kin", origins, weight });
  }
  // Faith counts the same way; a reader without one is not sent towards secular countries.
  const faith = answers.faith;
  if (
    answers.kin &&
    answers.kin !== "none" &&
    (faith === "muslim" || faith === "christian" || faith === "other")
  ) {
    const weight = 0.6 * KIN_WEIGHT[answers.kin] * ADVENTURE_SCALE[answers.adventure ?? "open"];
    facts.push({ kind: "faith", value: faith, weight });
  }
  // The family's own country: what draws a diaspora back to a city no other answer reaches.
  // It is more precise than the region, so it weighs at least as much.
  const countries = (answers.countries ?? []).filter(Boolean);
  if (countries.length) {
    const roots = answers.roots === "rediscover" ? 4 : answers.roots === "both" ? 2 : 0;
    const kin =
      answers.kin === "much" || answers.kin === "some"
        ? KIN_WEIGHT[answers.kin] * ADVENTURE_SCALE[answers.adventure ?? "open"]
        : 0;
    facts.push({ kind: "homeCountry", values: countries, weight: Math.max(2, roots + kin) });
  }
  // A reader is never sent where anti-Black racism is documented, adventure or not: being badly
  // received is a failure of the quiz, not a taste (operator, 2026-11-15). Only a family from
  // North Africa alone lifts it; a reader who keeps their origin to themselves stays protected.
  const northOnly =
    origins.length > 0 &&
    origins.every((o) => o === "nord") &&
    !(answers.countries ?? []).includes("Soudan");
  const black = !northOnly;
  if (black) facts.push({ kind: "reception", weight: RECEPTION_WEIGHT });
  // « Découvrir ailleurs » and an appetite for the unknown both lean away from the family's region.
  const away = (answers.adventure === "seeking" ? 1.5 : 0) + (answers.roots === "discover" ? 1 : 0);
  if (origins.length && away > 0) {
    facts.push({ kind: "elsewhere", origins, weight: away });
  }

  const renounced = new Set<Axis>(
    (answers.renounce ?? [])
      .map((key) => RENOUNCE_AXIS[key])
      .filter((axis): axis is Axis => Boolean(axis)),
  );
  // "Je fais avec": outages and paperwork stop counting, whatever other answers asked for.
  if (answers.friction === 1) for (const axis of COPED_WITH) renounced.add(axis);
  return { pulls: pulls.filter((p) => !renounced.has(p.axis)), facts };
}

function originsOf(answers: Answers): Origin[] {
  const origin = answers.origin;
  return (Array.isArray(origin) ? origin : origin ? [origin] : []).filter(Boolean);
}

function languagesOf(answers: Answers): string[] {
  return answers.languages ?? [];
}
function landscapesOf(answers: Answers): Landscape[] {
  return answers.landscapes ?? [];
}

const CRITERION_OF: Partial<Record<Axis, CriterionKey>> = {
  easySetup: "setupCost",
  safety: "safety",
  internet: "internet",
  schools: "schools",
  jobs: "jobs",
  business: "business",
  flights: "flights",
  culture: "culture",
  history: "history",
  returnees: "returnees",
};
const LABELS = Object.fromEntries(CRITERIA.map((c) => [c.key, c.label])) as Record<
  CriterionKey,
  string
>;

function labelOf(part: Closeness, city: City, answers: Answers, good: boolean): string | undefined {
  if (part.fact === "languages") {
    const spoken = livableLanguages(city).filter((l) => languagesOf(answers).includes(l));
    return good
      ? `On y vit en ${spoken.map((l) => LANGUAGE_NAMES[l]).join(" et ")}`
      : "Langue du quotidien différente de votre souhait";
  }
  if (part.fact === "settings")
    return good ? "Le paysage que vous cherchez, tout près" : "Paysage différent de votre souhait";
  if (part.fact === "climates")
    return good ? "Le climat que vous cherchez" : "Climat différent de votre souhait";
  if (part.fact === "zone") return good ? "Dans la région de votre famille" : undefined;
  if (part.fact === "sectors")
    return good ? "Votre secteur y recrute" : "Votre secteur y recrute peu";
  if (part.fact === "professions")
    return good ? "Votre métier y recrute" : "Votre métier y recrute peu";
  if (part.fact === "entry")
    return good ? "Facile d'y entrer avec votre passeport" : "Un visa à demander à l'ambassade";
  if (part.fact === "faith")
    return good ? "Votre foi y est largement partagée" : "Votre foi y est minoritaire";
  // Only what the sources say, in their words (operator, 2026-11-15).
  if (part.fact === "reception") return good ? undefined : city.countryFacts?.racism?.label;
  if (part.fact === "homeCountry") return good ? "Le pays de votre famille" : undefined;
  if (part.fact === "kin")
    return good ? "Près de chez les vôtres" : "Loin de la région de votre famille";
  if (part.fact === "elsewhere")
    return good ? "Un ailleurs à découvrir, loin de ce que vous connaissez" : undefined;
  if (part.fact === "upscale") return good ? "Des quartiers comme le vôtre" : undefined;
  switch (part.axis) {
    case "pace":
      return good
        ? "Le rythme de ville que vous cherchez"
        : "Un rythme éloigné de ce que vous cherchez";
    case "nightlife":
      return good ? "Une ambiance à votre mesure" : "Une ambiance décalée par rapport à vous";
    case "cheap":
      return good ? "Une vie à votre budget" : "Plus cher que votre budget";
    case "comfort":
      return good ? "Courant, eau et soins à la hauteur" : "Courant, eau et soins en retrait";
    case "bargaining":
      return good
        ? "Des prix comme vous les aimez"
        : "Des prix qui se négocient plus ou moins que vous ne le voudriez";
    case "welcome":
      return good
        ? "Des habitants ouverts aux nouveaux venus (enquête Afrobaromètre)"
        : "Une ouverture aux nouveaux venus plus réservée (enquête Afrobaromètre)";
    case "walkable":
      return good
        ? "Beaucoup de choses à faire à pied"
        : "Une ville où l'on se déplace surtout en voiture";
    case "leisure":
      return good
        ? "Votre quotidien à portée : sport, cafés, culture"
        : "Moins de lieux du quotidien à portée";
    case "paperwork":
      return good ? "Démarches simples" : "Démarches plus lourdes";
    case "remote":
      return good
        ? "Loin de l'agitation, comme vous le voulez"
        : "Plus fréquentée que vous ne le voudriez";
    default: {
      const key = part.axis ? CRITERION_OF[part.axis] : undefined;
      if (!key) return undefined;
      return good ? LABELS[key] : `${LABELS[key]} : en retrait`;
    }
  }
}

function exclusionFor(city: City, answers: Answers): string | undefined {
  const country = city.countryFacts;
  const languages = languagesOf(answers);
  if (answers.languageOnly && languages.length) {
    if (!livableLanguages(city).some((l) => languages.includes(l))) {
      return `On n'y vit pas en ${languages.map((l) => LANGUAGE_NAMES[l as Language]).join(" ni en ")}`;
    }
  }
  if (answers.schoolCurriculum) {
    const curricula = city.facts.schoolCurricula;
    const fits =
      answers.schoolCurriculum === "any"
        ? curricula.length > 0
        : curricula.includes(answers.schoolCurriculum);
    // A school score nobody checked keeps the city, marked "à vérifier" (§4.2).
    if (!fits && city.scores.schools.level !== null) return "Pas d'école du programme souhaité";
  }
  if (answers.specialistCare) {
    const level = city.scores.healthcare.level;
    if (level !== null && level < 3) return "Les soins suivis demandent d'aller ailleurs";
  }
  if (answers.visaFreeOnly && country?.visaFreeDaysFrenchPassport === 0) {
    return "Visa nécessaire avec un passeport français";
  }
  if (answers.excludeCriminalising) {
    const status = country?.sameSexRelations.status;
    if (status === "criminalised" || status === "criminalised-not-enforced") {
      return "Le pays punit l'homosexualité";
    }
  }
  return undefined;
}

type Profile = ReturnType<typeof profileOf>;

const levelOf = (value: number) => Math.round(1 + 4 * value);

/** The weighted closeness of a city to some pulls and facts; null when nothing was asked. */
function closeness(city: City, profile: Profile): number | null {
  const parts = closenessOf(city, profile.pulls, profile.facts);
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  return total ? parts.reduce((sum, p) => sum + p.weight * p.value, 0) / total : null;
}

function evaluate(
  city: City,
  answers: Answers,
  profiles: { all: Profile; temperament: Profile | null; practical: Profile },
): Match {
  const profile = profiles.all;
  const parts = closenessOf(city, profile.pulls, profile.facts);
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  const earned = parts.reduce((sum, p) => sum + p.weight * p.value, 0);
  const known = parts.filter((p) => p.known).reduce((sum, p) => sum + p.weight, 0);
  // A missing value is never cited for or against a city.
  const cited = parts.filter((p) => p.known);
  const rated = (list: Closeness[], good: boolean): Rated[] =>
    list.flatMap((p) => {
      const label = labelOf(p, city, answers, good);
      return label ? [{ label, level: levelOf(p.value) }] : [];
    });
  const reasons = rated(
    cited
      .filter((p) => p.weight >= 1 && p.value >= 0.75)
      .sort((a, b) => b.weight * b.value - a.weight * a.value),
    true,
  ).slice(0, 5);
  const drawbacks = rated(
    cited
      .filter((p) => p.weight >= 2 && p.value <= 0.35)
      .sort((a, b) => b.weight * (1 - b.value) - a.weight * (1 - a.value)),
    false,
  ).slice(0, 3);
  return {
    city,
    score: total ? earned / total : 0,
    coverage: total ? known / total : 1,
    excludedBecause: exclusionFor(city, answers),
    reasons,
    drawbacks,
    temperament: profiles.temperament ? closeness(city, profiles.temperament) : null,
    practical: closeness(city, profiles.practical) ?? 0,
    portrait: portraitFor(city, answers),
  };
}

export function rankCities(answers: Answers): Match[] {
  // The same matching, run on the temperament answers alone and on all the others, gives the
  // two parts of the score shown on a card.
  const temperamentAnswers: Answers = { origin: answers.origin };
  const practicalAnswers: Answers = { ...answers };
  for (const key of TEMPERAMENT_KEYS) {
    (temperamentAnswers as Record<string, unknown>)[key] = answers[key];
    delete (practicalAnswers as Record<string, unknown>)[key];
  }
  const asked = TEMPERAMENT_KEYS.some((key) => answers[key] !== undefined);
  const profiles = {
    all: profileOf(answers),
    temperament: asked ? profileOf(temperamentAnswers) : null,
    practical: profileOf(practicalAnswers),
  };
  return CITIES.map((city) => evaluate(city, answers, profiles)).sort((a, b) => b.score - a.score);
}

/**
 * The names of the first cities, as bestMatches orders them, without building reasons or the
 * temperament part: cheap enough to try every answer of every open question on a phone.
 */
export function topCities(answers: Answers, count: number): string[] {
  const profile = profileOf(answers);
  return CITIES.map((city) => ({ city, score: closeness(city, profile) ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .filter(({ city }) => !exclusionFor(city, answers))
    .slice(0, count)
    .map(({ city }) => city.name);
}

/**
 * The cities to offer the reader. Only a filter of the fuller questionnaire removes a city.
 * Travel advice does not: it is shown with the city as dated information, because it is written
 * for visitors who have never been there (operator, 2026-11-15).
 */
export function bestMatches(answers: Answers, count: number): Match[] {
  return rankCities(answers)
    .filter((m) => !m.excludedBecause)
    .slice(0, count);
}
