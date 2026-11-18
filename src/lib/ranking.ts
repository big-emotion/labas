import {
  CITIES,
  CRITERIA,
  livableLanguages,
  type City,
  type CriterionDefinition,
  type CriterionKey,
  type Language,
} from "./cities";
import type { Bilingual, Locale } from "../i18n/locale";
import { criterionCopy } from "../i18n/city-copy";
import { TRAITS, temperamentLinesFor, type TemperamentLine } from "./city-temperament";
import { closenessOf, type Axis, type Closeness, type FactPull, type Pull } from "./fit";
import { portraitFor, type PortraitLine } from "./portrait";
import { profileEffects, type ProfileAnswers } from "./profile-pulls";

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

export interface Answers extends ProfileAnswers {
  project?: "installer" | "pied" | "tester" | "investir" | "decouvrir";
  budget?: "serre" | "moyen" | "large";
  family?: "celib" | "couple" | "fonder" | "parents";
  job?: "cadre" | "entre" | "remote" | "crea" | "soin";
  /** Every language the reader can live in. */
  languages?: QuizLanguage[];
  /** The city's size: 3 a big city, 2 a mid-sized one, 1 a small town. */
  size?: City["size"];
  /** The pace wanted, apart from the size: 1 lively day and night, 0.5 lively enough, 0 calm. */
  pace?: Step;
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
const TEMPERAMENT_KEYS = TRAITS;

export interface Match {
  city: City;
  /** 0 to 1: how close the city's fingerprint is to what the reader said. */
  score: number;
  /** 0 to 1: the share of the reader's weight backed by a known value (§4.2). */
  coverage: number;
  /** Why a filter of the fuller questionnaire keeps this city out, in the reader's language. */
  excludedBecause?: string;
  /** Up to five plain-language reasons the city fits, each rated 1 to 5. */
  reasons: Rated[];
  /** Up to three things that weigh against it for this reader, each rated 1 to 5. */
  drawbacks: Rated[];
  /** 0 to 1 on the five temperament answers alone; null before any of them. */
  temperament: number | null;
  /** Why the temperament part is what it is: per answer, the neighbourhoods at the reader's level. */
  temperamentLines: TemperamentLine[];
  /** 0 to 1 on every other answer. */
  practical: number;
  /** "Pourquoi vous" lines: what the reader said, met by what the city offers. */
  portrait: PortraitLine[];
}

const LANGUAGE_NAMES: Bilingual<Record<Language, string>> = {
  fr: {
    fr: "français",
    en: "anglais",
    pt: "portugais",
    ar: "arabe",
    es: "espagnol",
    sw: "swahili",
  },
  en: {
    fr: "French",
    en: "English",
    pt: "Portuguese",
    ar: "Arabic",
    es: "Spanish",
    sw: "Swahili",
  },
};

const MAX_PRIORITIES = 3;
// A non-negotiable counts as two ordinary answers.
const NON_NEGOTIABLE = 2;
const pull = (axis: Axis, target: number, weight: number): Pull => ({ axis, target, weight });
/** A practical need the reader states outright: it ranks, unlike a need read between the lines. */
const need = (axis: Axis, target: number, weight: number): Pull => ({
  axis,
  target,
  weight,
  chosen: true,
});

// Each answer is a set of pulls: where it wants the city on an axis (0 to 1, relative to the
// 115 cities), and how much that counts. A reading of the answer, written down so it can be
// argued with: "Danser jusqu'au matin" wants a city at the lively end of nightlife.
// Each answer is read against every one of the 16 criteria: a pull
// says where the answer wants the city (0 to 1, relative to the 115 cities) and how much that
// counts; a criterion left out is unrelated to the answer on purpose. A practical criterion the
// reader did not name is lowered to a floor by asFloor below: the site ranks on resemblance.
// The project is a need the reader states: it ranks on its criteria (operator, 2026-11-16).
const PROJECT: Record<NonNullable<Answers["project"]>, Pull[]> = {
  installer: [
    need("safety", 0.9, 2),
    need("comfort", 0.85, 2),
    need("paperwork", 0.85, 1.5),
    need("jobs", 0.7, 1),
    need("returnees", 0.7, 1),
    need("internet", 0.7, 0.5),
    need("schools", 0.6, 0.5),
    need("flights", 0.6, 0.5),
    need("cheap", 0.6, 0.5),
    need("easySetup", 0.6, 0.5),
  ],
  pied: [
    need("flights", 0.95, 3),
    need("internet", 0.85, 1.5),
    need("safety", 0.8, 1),
    need("comfort", 0.75, 1),
    need("paperwork", 0.8, 1),
    need("easySetup", 0.7, 0.5),
    need("returnees", 0.7, 0.5),
  ],
  tester: [
    need("easySetup", 0.9, 2),
    need("safety", 0.8, 1.5),
    need("returnees", 0.8, 1.5),
    need("cheap", 0.7, 1),
    need("comfort", 0.75, 1),
    need("internet", 0.75, 1),
    need("paperwork", 0.75, 1),
    need("flights", 0.7, 0.5),
  ],
  investir: [
    need("business", 0.95, 3),
    need("paperwork", 0.85, 2),
    need("jobs", 0.7, 1),
    need("safety", 0.75, 1),
    need("flights", 0.7, 1),
    need("internet", 0.7, 0.5),
  ],
  decouvrir: [
    need("safety", 0.9, 2),
    need("comfort", 0.8, 1.5),
    need("culture", 0.8, 1.5),
    need("history", 0.8, 1.5),
    need("flights", 0.8, 1.5),
    need("nightlife", 0.65, 0.5),
    need("cheap", 0.6, 0.5),
  ],
};
const SATURDAY: Record<Step, Pull[]> = {
  1: [pull("nightlife", 1, 3), pull("pace", 0.8, 1), pull("culture", 0.7, 0.5)],
  0.5: [pull("nightlife", 0.55, 2), pull("culture", 0.6, 0.5)],
  0: [pull("nightlife", 0.1, 2.5), pull("pace", 0.2, 1.5)],
};
const BUDGET: Record<NonNullable<Answers["budget"]>, Pull[]> = {
  serre: [need("cheap", 1, 3), need("easySetup", 0.85, 1.5), pull("bargaining", 0.6, 0.5)],
  moyen: [need("cheap", 0.65, 1.5), need("easySetup", 0.6, 0.5)],
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
// The pace answer, apart from the size (operator, 2026-11-17: « une grande ville qui vibre » let
// a lively small town pass for a big city).
const PACE: Record<Step, Pull[]> = {
  1: [pull("pace", 0.95, 2.5), pull("nightlife", 0.7, 0.5)],
  0.5: [pull("pace", 0.5, 2.5)],
  0: [pull("pace", 0.1, 2.5), pull("nightlife", 0.3, 0.5)],
};
const GREW_UP: Record<NonNullable<Answers["grewUp"]>, Pull[]> = {
  city: [pull("pace", 0.8, 1)],
  town: [pull("pace", 0.45, 1)],
  country: [pull("pace", 0.15, 1)],
};
const PRIORITY: Record<Priority, Pull[]> = {
  safety: [need("safety", 1, 3)],
  cost: [need("cheap", 1, 3), need("easySetup", 0.8, 1)],
  healthAndSchools: [need("comfort", 1, 2), need("schools", 1, 2)],
  career: [need("jobs", 1, 3), need("business", 0.7, 1)],
  diaspora: [pull("returnees", 1, 3)],
  memory: [pull("history", 1, 3), pull("culture", 0.7, 0.5)],
  flights: [need("flights", 1, 3)],
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
// Temperament answers are matched against the city's neighbourhoods (the temperament facts), not
// read as a demand for comfort (operator, 2026-11-16): « tout carré » is a taste, not a need.
const ORDER: Record<Step, Pull[]> = {
  1: [],
  0.5: [],
  0: [pull("bargaining", 0.8, 1.5)],
};
const TOGETHER: Record<Step, Pull[]> = {
  1: [pull("welcome", 0.85, 2)],
  0.5: [pull("welcome", 0.6, 1)],
  0: [],
};
const STEP_PULLS = {
  crowds: (s: Step) => [pull("pace", 0.1 + 0.9 * s, 2)],
  bargaining: (s: Step) => [pull("bargaining", 0.1 + 0.9 * s, 1.5)],
  tripsHome: (s: Step) => [need("flights", 0.4 + 0.6 * s, 1 + 3 * s)],
};
const SETUP: Record<NonNullable<Answers["setupBudget"]>, Pull[]> = {
  low: [need("easySetup", 0.85, 3)],
  medium: [need("easySetup", 0.7, 1.5)],
  high: [],
};
const BELONGING: Record<NonNullable<Answers["belonging"]>, Pull[]> = {
  returnees: [pull("returnees", 0.85, 2)],
  locals: [pull("returnees", 0.2, 1.5)],
  both: [pull("returnees", 0.7, 1)],
};
const ADVENTURE_LEVEL = { familiar: 0, open: 0.5, seeking: 1 } as const;
// Twice its first weight: the neighbourhoods' temperament is what the site matches the reader on.
const TEMPERAMENT_WEIGHT = 4;
/**
 * How much one answer counts against the others, as evidence (scoreOf below); an answer not
 * listed counts 1. The daily language decides first: ticking Arabic must turn the list over at
 * the thirteenth answer too (operator, 2026-11-16).
 */
const ANSWER_WEIGHT: Record<string, number> = { languages: 3, project: 1.5, music: 0.5 };
/**
 * How strongly the family's region draws the reader, by project: settling far from one's own is
 * harder than travelling far from them, which is the point of a trip (operator, 2026-11-16).
 */
const ORIGIN_DRAW: Record<NonNullable<Answers["project"]>, number> = {
  installer: 2,
  pied: 1.5,
  tester: 1,
  investir: 0.75,
  decouvrir: 0,
};
// Before the reader says whether feeling at home matters, the region draws a little less; once
// they say it does not, it no longer draws at all (operator, 2026-11-16).
const KIN_SCALE = { much: 1.5, some: 1, unsaid: 0.75, none: 0 } as const;
// An appetite for the unknown makes the family's region nearly neutral rather than pushing to
// its opposite: the other answers then mix the regions (operator, 2026-11-16).
const ADVENTURE_SCALE = { familiar: 1.25, open: 1, seeking: 0.25 } as const;
const PRACTICAL: Axis[] = [
  "safety",
  "comfort",
  "paperwork",
  "easySetup",
  "flights",
  "internet",
  "business",
  "jobs",
  "schools",
  "cheap",
];
// A floor: only the weakest third of cities on the criterion lose points, the rest are equal.
const FLOOR_TARGET = 0.3;
const FLOOR_WEIGHT = 0.5;
/** A practical criterion the reader did not name is a floor, not a ranking (operator, 2026-11-16). */
const asFloor = (p: Pull): Pull =>
  p.chosen || !PRACTICAL.includes(p.axis)
    ? p
    : { ...p, target: Math.min(p.target, FLOOR_TARGET), weight: p.weight * FLOOR_WEIGHT };
const RENOUNCE_AXIS: Partial<Record<CriterionKey, Axis>> = {
  culture: "culture",
  internet: "internet",
  flights: "flights",
  history: "history",
  jobs: "jobs",
};

interface Profile {
  /** Every pull and fact names the answer it reads (`from`). */
  pulls: Pull[];
  facts: FactPull[];
  /** How much each answer counts as evidence, by `from`. */
  weights: Record<string, number>;
}

/** Turns answers into pulls on axes and facts to match, each tied to its answer. */
export function profileOf(answers: Answers): Profile {
  // No default pull: with no answer every city is equal, and only answers rank them.
  const pulls: Pull[] = [];
  const facts: FactPull[] = [];
  const weights: Record<string, number> = {};
  const add = (from: string, more: Pull[] | undefined, weight = ANSWER_WEIGHT[from] ?? 1) => {
    if (!more?.length) return;
    pulls.push(...more.map((p) => ({ ...p, from })));
    weights[from] = weight;
  };
  const fact = (from: string, more: FactPull, weight = ANSWER_WEIGHT[from] ?? 1) => {
    facts.push({ ...more, from });
    weights[from] = weight;
  };
  if (answers.project) add("project", PROJECT[answers.project]);
  if (answers.saturday !== undefined) add("saturday", SATURDAY[answers.saturday]);
  if (answers.budget) add("budget", BUDGET[answers.budget]);
  if (answers.family) add("family", FAMILY[answers.family]);
  if (answers.job) add("job", JOB[answers.job]);
  if (answers.size) fact("size", { kind: "size", value: answers.size, weight: 2.5 });
  if (answers.pace !== undefined) add("pace", PACE[answers.pace]);
  if (answers.grewUp) add("grewUp", GREW_UP[answers.grewUp]);
  // Each non-negotiable is a piece of evidence of its own, worth more than an ordinary answer.
  for (const priority of (answers.priorities ?? []).slice(0, MAX_PRIORITIES))
    add(`priorities:${priority}`, PRIORITY[priority], NON_NEGOTIABLE);
  if (answers.profession) {
    const { fields, pulls: more } = PROFESSION[answers.profession];
    add("profession", more);
    if (fields.length) fact("profession", { kind: "professions", values: fields, weight: 2.5 });
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
      "currentCity",
      CURRENT_CITY[answers.currentCity].map((p) => ({
        ...p,
        target: p.axis === "pace" ? Math.min(1, Math.max(0.05, p.target + shift)) : p.target,
        weight: p.weight * boost,
      })),
    );
  } else if (answers.rhythm === "calmer") {
    add("rhythm", [pull("pace", 0.25, 1.5)]);
  } else if (answers.rhythm === "more") {
    add("rhythm", [pull("pace", 0.85, 1.5)]);
  }
  if (answers.rhythm === "unplug") {
    add("rhythm", [pull("remote", 0.85, 2.5), pull("pace", 0.05, 1.5), pull("nightlife", 0.05, 1)]);
  }
  if (answers.mobility) add("mobility", MOBILITY[answers.mobility]);
  add(
    "habits",
    (answers.habits ?? []).flatMap((habit) => HABITS[habit]),
  );
  if (answers.habits?.includes("nature"))
    fact("habits", { kind: "settings", values: ["nature"], weight: 1.5 });
  if (answers.neighbourhood) add("neighbourhood", NEIGHBOURHOOD[answers.neighbourhood]);
  if (answers.neighbourhood === "upscale")
    fact("neighbourhood", { kind: "upscale", values: [], weight: 2 });
  if (answers.people) add("people", PEOPLE[answers.people]);
  if (answers.crowds !== undefined) add("crowds", STEP_PULLS.crowds(answers.crowds));
  if (answers.order !== undefined) add("order", ORDER[answers.order]);
  if (answers.together !== undefined) add("together", TOGETHER[answers.together]);
  // Each temperament answer is also matched against the city's neighbourhoods, so a calm reader
  // is drawn to a city that is mostly calm, not only to one with little nightlife on paper.
  for (const trait of TRAITS) {
    const value =
      trait === "adventure"
        ? answers.adventure && ADVENTURE_LEVEL[answers.adventure]
        : answers[trait];
    if (value === undefined) continue;
    fact(trait, { kind: "temperament", trait, value, weight: TEMPERAMENT_WEIGHT });
  }
  if (answers.bargaining !== undefined)
    add("bargaining", STEP_PULLS.bargaining(answers.bargaining));
  if (answers.tripsHome !== undefined) add("tripsHome", STEP_PULLS.tripsHome(answers.tripsHome));
  if (answers.setupBudget) add("setupBudget", SETUP[answers.setupBudget]);
  if (answers.belonging) add("belonging", BELONGING[answers.belonging]);
  const profile = profileEffects(answers);
  for (const p of profile.pulls) add(p.from!, [p]);
  for (const f of profile.facts) fact(f.from!, f);

  const languages = languagesOf(answers);
  if (languages.length) fact("languages", { kind: "languages", values: languages, weight: 3 });
  const landscapes = landscapesOf(answers);
  const natural = landscapes.filter((l) => l !== "urban");
  if (natural.length) fact("landscapes", { kind: "settings", values: natural, weight: 2.5 });
  if (landscapes.includes("urban")) {
    add("landscapes", [
      pull("culture", 0.8, 1.5),
      pull("pace", 0.7, 0.5),
      pull("nightlife", 0.65, 0.5),
    ]);
  }
  if (answers.climate) fact("climate", { kind: "climates", values: [answers.climate], weight: 2 });
  // Roots bring the family's regions closer.
  const origins = originsOf(answers);
  const africanOrigins = origins.filter((o) => o !== "ameriques");
  if (africanOrigins.length && (answers.roots === "rediscover" || answers.roots === "both")) {
    const weight = answers.roots === "rediscover" ? 1.5 : 1;
    fact("roots", { kind: "zone", values: africanOrigins, weight: 2 * weight }, weight);
  }

  const passports = (answers.passports ?? []).filter((p) => p !== "other");
  if (passports.length) fact("passports", { kind: "entry", values: passports, weight: 1.5 });
  // The origin weighs on its own: the family's region draws the reader by project, more when
  // feeling at home matters, less with an appetite for the unknown; a trip, or that appetite,
  // leans away from it instead.
  if (origins.length) {
    const scale = KIN_SCALE[answers.kin ?? "unsaid"] * ADVENTURE_SCALE[answers.adventure ?? "open"];
    const draw = (answers.project ? ORIGIN_DRAW[answers.project] : 1) * scale;
    const away =
      (answers.project === "decouvrir" ? 0.5 : 0) +
      (answers.adventure === "seeking" ? 0.6 : 0) +
      (answers.roots === "discover" ? 1 : 0);
    // Never more than a non-negotiable, so the temperament can still decide (operator, 2026-11-17).
    const weight = Math.min(NON_NEGOTIABLE, draw + away);
    if (draw > 0) fact("origin", { kind: "kin", origins, weight: draw }, weight);
    if (away > 0) fact("origin", { kind: "elsewhere", origins, weight: away }, weight);
  }
  // Faith counts the same way; a reader without one is not sent towards secular countries.
  const faith = answers.faith;
  if (
    answers.kin &&
    answers.kin !== "none" &&
    (faith === "muslim" || faith === "christian" || faith === "other")
  ) {
    const weight = KIN_SCALE[answers.kin] * ADVENTURE_SCALE[answers.adventure ?? "open"];
    fact("faith", { kind: "faith", value: faith, weight: 2 * weight }, weight);
  }
  // The family's own country: what draws a diaspora back to a city no other answer reaches. A
  // documented war or ban between it and the host country counts inside the same answer, never
  // on its own, and is never written on a card (operator, 2026-11-16).
  const countries = (answers.countries ?? []).filter(Boolean);
  if (countries.length) {
    const roots = answers.roots === "rediscover" ? 2 : answers.roots === "both" ? 1 : 0;
    // Feeling at home among one's own, when it matters a lot, makes the family's country the
    // strongest answer of all, as the region is for a settler.
    const kin = answers.kin === "much" ? 4 : answers.kin === "some" ? 2 : 0;
    const weight = (1 + roots + kin) * ADVENTURE_SCALE[answers.adventure ?? "open"];
    fact("countries", { kind: "homeCountry", values: countries, weight: 2 }, weight);
    fact("countries", { kind: "tension", values: countries, weight: 2 }, weight);
  }

  const renounced = new Set<Axis>(
    (answers.renounce ?? [])
      .map((key) => RENOUNCE_AXIS[key])
      .filter((axis): axis is Axis => Boolean(axis)),
  );
  return {
    pulls: pulls.filter((p) => !renounced.has(p.axis)).map(asFloor),
    facts,
    weights,
  };
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
const CRITERION_BY_KEY = Object.fromEntries(CRITERIA.map((c) => [c.key, c])) as Record<
  CriterionKey,
  CriterionDefinition
>;

/** A reason when the city fits, and a drawback when it does not; no drawback line for some. */
type LinePair = readonly [good: string, bad?: string];

interface LineCopy {
  facts: Partial<Record<NonNullable<Closeness["fact"]>, LinePair>>;
  axes: Partial<Record<Axis, LinePair>>;
  spoken: (names: string) => string;
  otherLanguage: string;
  and: string;
  safari: string;
  sea: string;
  behind: (label: string) => string;
  notSpoken: (names: string) => string;
  nor: string;
  noSchool: string;
  care: string;
  visa: string;
  law: string;
}

const LINE_COPY: Bilingual<LineCopy> = {
  fr: {
    facts: {
      settings: ["Le paysage que vous cherchez, tout près", "Paysage différent de votre souhait"],
      climates: ["Le climat que vous cherchez", "Climat différent de votre souhait"],
      zone: ["Dans la région de votre famille"],
      sectors: ["Votre secteur y recrute", "Votre secteur y recrute peu"],
      professions: ["Votre métier y recrute", "Votre métier y recrute peu"],
      entry: ["Facile d'y entrer avec votre passeport", "Un visa à demander à l'ambassade"],
      faith: ["Votre foi y est largement partagée", "Votre foi y est minoritaire"],
      homeCountry: ["Le pays de votre famille"],
      music: ["Votre musique y fait danser"],
      season: ["La belle saison quand vous partez", "La saison des pluies quand vous partez"],
      kin: ["Près de chez les vôtres", "Loin de la région de votre famille"],
      elsewhere: ["Un ailleurs à découvrir, loin de ce que vous connaissez"],
      upscale: ["Des quartiers comme le vôtre"],
      size: ["La taille de ville que vous cherchez", "Une ville d'une autre taille"],
    },
    axes: {
      pace: ["Le rythme de ville que vous cherchez", "Un rythme éloigné de ce que vous cherchez"],
      nightlife: ["Une ambiance à votre mesure", "Une ambiance décalée par rapport à vous"],
      cheap: ["Une vie à votre budget", "Plus cher que votre budget"],
      comfort: ["Courant, eau et soins à la hauteur", "Courant, eau et soins en retrait"],
      bargaining: [
        "Des prix comme vous les aimez",
        "Des prix qui se négocient plus ou moins que vous ne le voudriez",
      ],
      welcome: [
        "Des habitants ouverts aux nouveaux venus (enquête Afrobaromètre)",
        "Une ouverture aux nouveaux venus plus réservée (enquête Afrobaromètre)",
      ],
      walkable: [
        "Beaucoup de choses à faire à pied",
        "Une ville où l'on se déplace surtout en voiture",
      ],
      leisure: [
        "Votre quotidien à portée : sport, cafés, culture",
        "Moins de lieux du quotidien à portée",
      ],
      paperwork: ["Démarches simples", "Démarches plus lourdes"],
      remote: [
        "Loin de l'agitation, comme vous le voulez",
        "Plus fréquentée que vous ne le voudriez",
      ],
    },
    spoken: (names) => `On y vit en ${names}`,
    otherLanguage: "Langue du quotidien différente de votre souhait",
    and: " et ",
    safari: "Un safari à moins de deux heures",
    sea: "Plongée, surf ou glisse tout près",
    behind: (label) => `${label} : en retrait`,
    notSpoken: (names) => `On n'y vit pas en ${names}`,
    nor: " ni en ",
    noSchool: "Pas d'école du programme souhaité",
    care: "Les soins suivis demandent d'aller ailleurs",
    visa: "Visa nécessaire avec un passeport français",
    law: "Le pays punit l'homosexualité",
  },
  en: {
    facts: {
      settings: [
        "The landscape you are looking for, close by",
        "A landscape unlike the one you want",
      ],
      climates: ["The climate you are looking for", "A climate unlike the one you want"],
      zone: ["In your family's region"],
      sectors: ["Your sector is hiring there", "Your sector hires little there"],
      professions: ["Your profession is hiring there", "Your profession hires little there"],
      entry: ["Easy to enter with your passport", "A visa to request from the embassy"],
      faith: ["Your faith is widely shared there", "Your faith is a minority there"],
      homeCountry: ["Your family's country"],
      music: ["Your music fills the dance floors there"],
      season: ["The good season when you travel", "The rainy season when you travel"],
      kin: ["Close to your own people", "Far from your family's region"],
      elsewhere: ["Somewhere new to discover, far from what you know"],
      upscale: ["Neighbourhoods like yours"],
      size: ["The size of city you are looking for", "A city of another size"],
    },
    axes: {
      pace: ["The pace of city you are looking for", "A pace far from what you are looking for"],
      nightlife: ["A mood that suits you", "A mood out of step with you"],
      cheap: ["A life within your budget", "More expensive than your budget"],
      comfort: [
        "Power, water and healthcare up to standard",
        "Power, water and healthcare lagging behind",
      ],
      bargaining: [
        "Prices the way you like them",
        "Prices haggled more or less than you would like",
      ],
      welcome: [
        "People open to newcomers (Afrobarometer survey)",
        "A more reserved welcome for newcomers (Afrobarometer survey)",
      ],
      walkable: ["Plenty to do on foot", "A city where people mostly get around by car"],
      leisure: [
        "Your daily life within reach: sport, cafés, culture",
        "Fewer everyday places within reach",
      ],
      paperwork: ["Simple paperwork", "Heavier paperwork"],
      remote: ["Away from the bustle, as you want", "Busier than you would like"],
    },
    spoken: (names) => `Daily life happens in ${names} there`,
    otherLanguage: "A daily language other than the one you want",
    and: " and ",
    safari: "A safari less than two hours away",
    sea: "Diving, surfing or board sports close by",
    behind: (label) => `${label}: lagging behind`,
    notSpoken: (names) => `Daily life there is not in ${names}`,
    nor: " or ",
    noSchool: "No school with the curriculum you want",
    care: "Ongoing care means going elsewhere",
    visa: "A visa is needed with a French passport",
    law: "The country punishes homosexuality",
  },
};

function labelOf(
  part: Closeness,
  city: City,
  answers: Answers,
  good: boolean,
  locale: Locale,
): string | undefined {
  const copy = LINE_COPY[locale];
  if (part.fact === "languages") {
    const spoken = livableLanguages(city).filter((l) => languagesOf(answers).includes(l));
    return good
      ? copy.spoken(spoken.map((l) => LANGUAGE_NAMES[locale][l]).join(copy.and))
      : copy.otherLanguage;
  }
  // Weighs in the score, never written on a card: a war between two peoples next to a level reads
  // as a verdict on the reader's family (operator, 2026-11-16).
  if (part.fact === "tension") return undefined;
  if (part.fact === "activities")
    return good ? (part.tags?.includes("safari") ? copy.safari : copy.sea) : undefined;
  const pair = (part.fact && copy.facts[part.fact]) || (part.axis && copy.axes[part.axis]);
  if (pair) return good ? pair[0] : pair[1];
  const key = part.axis ? CRITERION_OF[part.axis] : undefined;
  if (!key) return undefined;
  const label = criterionCopy(CRITERION_BY_KEY[key], locale).label;
  return good ? label : copy.behind(label);
}

function exclusionFor(city: City, answers: Answers, locale: Locale): string | undefined {
  const copy = LINE_COPY[locale];
  const country = city.countryFacts;
  const languages = languagesOf(answers);
  if (answers.languageOnly && languages.length) {
    if (!livableLanguages(city).some((l) => languages.includes(l))) {
      return copy.notSpoken(
        languages.map((l) => LANGUAGE_NAMES[locale][l as Language]).join(copy.nor),
      );
    }
  }
  if (answers.schoolCurriculum) {
    const curricula = city.facts.schoolCurricula;
    const fits =
      answers.schoolCurriculum === "any"
        ? curricula.length > 0
        : curricula.includes(answers.schoolCurriculum);
    // A school score nobody checked keeps the city, marked "à vérifier" (§4.2).
    if (!fits && city.scores.schools.level !== null) return copy.noSchool;
  }
  if (answers.specialistCare) {
    const level = city.scores.healthcare.level;
    if (level !== null && level < 3) return copy.care;
  }
  if (answers.visaFreeOnly && country?.visaFreeDaysFrenchPassport === 0) {
    return copy.visa;
  }
  if (answers.excludeCriminalising) {
    const status = country?.sameSexRelations.status;
    if (status === "criminalised" || status === "criminalised-not-enforced") {
      return copy.law;
    }
  }
  return undefined;
}

const levelOf = (value: number) => Math.round(1 + 4 * value);

/** One answer read as evidence: its weight against the other answers, and what it asks. */
interface Evidence {
  weight: number;
  pulls: Pull[];
  facts: FactPull[];
}

function evidenceOf(profile: Profile): Evidence[] {
  const byAnswer = new Map<string, Evidence>();
  const of = (from = "") => {
    let evidence = byAnswer.get(from);
    if (!evidence) {
      evidence = { weight: profile.weights[from] ?? 1, pulls: [], facts: [] };
      byAnswer.set(from, evidence);
    }
    return evidence;
  };
  for (const p of profile.pulls) of(p.from).pulls.push(p);
  for (const f of profile.facts) of(f.from).facts.push(f);
  return [...byAnswer.values()];
}

/** A clean miss keeps a tenth of its chances: an answer orients the list, it never erases a city. */
const MISS_FLOOR = 0.1;

/**
 * The cities a reader is shown first: « En tête pour l'instant » on the map, the mailed and shared
 * result, a reaction's top three, and what the next question tries to turn over. One number.
 */
export const TOP_THREE = 3;

/**
 * Each answer is one piece of evidence and the pieces multiply, as in a guessing game: a city far
 * from an answer loses as much at the thirteenth answer as at the first, however many criteria
 * the other answers touch. The weighted geometric mean keeps the score between 0 and 1. The
 * score is null when nothing was asked.
 */
function scoreOf(city: City, evidence: Evidence[]): { score: number | null; parts: Closeness[] } {
  const parts: Closeness[] = [];
  let log = 0;
  let total = 0;
  for (const answer of evidence) {
    const own = closenessOf(city, answer.pulls, answer.facts);
    const weight = own.reduce((sum, p) => sum + p.weight, 0);
    if (!weight) continue;
    const fit = own.reduce((sum, p) => sum + p.weight * p.value, 0) / weight;
    log += answer.weight * Math.log(MISS_FLOOR + (1 - MISS_FLOOR) * fit);
    total += answer.weight;
    parts.push(...own);
  }
  return { score: total ? Math.exp(log / total) : null, parts };
}

function evaluate(
  city: City,
  answers: Answers,
  profile: Profile,
  evidence: { all: Evidence[]; temperament: Evidence[] | null; practical: Evidence[] },
  locale: Locale,
): Match {
  const { score, parts } = scoreOf(city, evidence.all);
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  const known = parts.filter((p) => p.known).reduce((sum, p) => sum + p.weight, 0);
  // A missing value is never cited for or against a city.
  const cited = parts.filter((p) => p.known);
  const rated = (list: Closeness[], good: boolean): Rated[] =>
    list.flatMap((p) => {
      const label = labelOf(p, city, answers, good, locale);
      return label ? [{ label, level: levelOf(p.value) }] : [];
    });
  // A practical criterion is a reason only when the reader asked for it: otherwise it is a floor,
  // and the card leads with what resembles the reader (operator, 2026-11-16).
  const chosen = new Set(profile.pulls.filter((p) => p.chosen).map((p) => p.axis));
  const reasons = rated(
    cited
      .filter((p) => !p.axis || !PRACTICAL.includes(p.axis) || chosen.has(p.axis))
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
    score: score ?? 0,
    coverage: total ? known / total : 1,
    excludedBecause: exclusionFor(city, answers, locale),
    reasons,
    drawbacks,
    temperament: evidence.temperament ? scoreOf(city, evidence.temperament).score : null,
    temperamentLines: temperamentLinesFor(city.name, answers, locale),
    practical: scoreOf(city, evidence.practical).score ?? 0,
    portrait: portraitFor(city, answers, locale),
  };
}

/**
 * `locale` only sets the language of the reasons; the order is the same in both. It defaults to
 * French for the callers that read scores and names only (the next question, the server).
 */
export function rankCities(answers: Answers, locale: Locale = "fr"): Match[] {
  // The same matching, run on the temperament answers alone and on all the others, gives the
  // two parts of the score shown on a card.
  const temperamentAnswers: Answers = {};
  const practicalAnswers: Answers = { ...answers };
  for (const key of TEMPERAMENT_KEYS) {
    (temperamentAnswers as Record<string, unknown>)[key] = answers[key];
    delete (practicalAnswers as Record<string, unknown>)[key];
  }
  const asked = TEMPERAMENT_KEYS.some((key) => answers[key] !== undefined);
  const profile = profileOf(answers);
  const evidence = {
    all: evidenceOf(profile),
    temperament: asked ? evidenceOf(profileOf(temperamentAnswers)) : null,
    practical: evidenceOf(profileOf(practicalAnswers)),
  };
  return CITIES.map((city) => evaluate(city, answers, profile, evidence, locale)).sort(
    (a, b) => b.score - a.score,
  );
}

/**
 * The names of the first cities, as bestMatches orders them, without building reasons or the
 * temperament part: cheap enough to try every answer of every open question on a phone.
 */
export function topCities(answers: Answers, count: number): string[] {
  const evidence = evidenceOf(profileOf(answers));
  return CITIES.map((city) => ({ city, score: scoreOf(city, evidence).score ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .filter(({ city }) => !exclusionFor(city, answers, "fr"))
    .slice(0, count)
    .map(({ city }) => city.name);
}

/**
 * The cities to offer the reader. Only a filter of the fuller questionnaire removes a city.
 * Travel advice does not: it is shown with the city as dated information, because it is written
 * for visitors who have never been there (operator, 2026-11-15).
 */
export function bestMatches(answers: Answers, count: number, locale: Locale = "fr"): Match[] {
  return rankCities(answers, locale)
    .filter((m) => !m.excludedBecause)
    .slice(0, count);
}
