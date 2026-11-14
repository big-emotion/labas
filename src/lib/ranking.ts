import {
  CITIES,
  CRITERIA,
  CRITERION_KEYS,
  livableLanguages,
  type City,
  type CriterionKey,
  type Language,
  type Setting,
} from "./cities";
import { portraitFor, type PortraitLine } from "./portrait";

/** The non-negotiables offered by the quiz (their values predate the sourced criteria). */
export type Priority =
  "safety" | "cost" | "healthAndSchools" | "career" | "diaspora" | "memory" | "flights";

/** A three-step stated preference: 0, 0.5 or 1. */
type Step = 0 | 0.5 | 1;

/**
 * Every answer is optional: an unanswered question drops out of the score. The first ten are
 * the free quiz; the rest belong to the fuller questionnaire (/approfondir).
 */
export interface Answers {
  project?: "installer" | "pied" | "tester" | "investir" | "decouvrir";
  budget?: "serre" | "moyen" | "large";
  family?: "celib" | "couple" | "fonder" | "parents";
  job?: "cadre" | "entre" | "remote" | "crea" | "soin";
  language?: Exclude<Language, "es" | "sw">;
  size?: City["size"];
  landscape?: "beach" | "nature" | "wildSpaces" | "urban";
  climate?: "hot" | "mild" | "dry";
  /** Ideal Saturday night: 1 out late with a crowd, 0.5 dinner with friends, 0 quiet at home. */
  saturday?: Step;
  /** Non-negotiables; only the first three count. */
  priorities?: Priority[];

  // The fuller questionnaire. Filters remove cities, and the page says how many and why.
  /** Only cities where the reader's language is spoken day to day. */
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
  /** Bargaining over prices: 1 a game, 0.5 fine, 0 a chore. */
  bargaining?: Step;
  /** Trips back to Europe a year: 0 one or fewer, 0.5 two or three, 1 every month. */
  tripsHome?: Step;
  /** Cash available before moving in. */
  setupBudget?: "low" | "medium" | "high";
  /** Life over there: among other returnees, like the locals, or both. */
  belonging?: "returnees" | "locals" | "both";
  /** What the reader can give up (weight set to zero). */
  renounce?: CriterionKey[];
}

export interface Match {
  city: City;
  /** 0 to 1: the share of the best possible weighted score this city reaches. */
  score: number;
  /** 0 to 1: the share of the reader's weight backed by a known value (§4.2). */
  coverage: number;
  /** Why a filter of the fuller questionnaire keeps this city out, in plain French. */
  excludedBecause?: string;
  /** Up to five plain-language reasons the city fits. */
  reasons: string[];
  /** Up to three things that weigh against it for this reader. */
  drawbacks: string[];
  /** "Pourquoi toi" lines: what the reader said, met by what the city offers. */
  portrait: PortraitLine[];
}

const MAX = 5;
/** A missing value neither wins nor loses (§4.2): it sits in the middle of the scale. */
const NEUTRAL = 2.5;
const MAX_PRIORITIES = 3;
const LABELS = Object.fromEntries(CRITERIA.map((c) => [c.key, c.label])) as Record<
  CriterionKey,
  string
>;

const LANGUAGE_NAMES: Record<Language, string> = {
  fr: "français",
  en: "anglais",
  pt: "portugais",
  ar: "arabe",
  es: "espagnol",
  sw: "swahili",
};

type Weights = Record<CriterionKey | "paperwork", number>;
type Boost = Partial<Weights>;

// The prototype's weights, carried over to the sourced criteria (§4.1), so a reader who answers
// nothing still gets a sensible order: cost and safety matter to everyone.
function baseWeights(): Weights {
  const weights = Object.fromEntries(CRITERION_KEYS.map((k) => [k, 0])) as Weights;
  return {
    ...weights,
    paperwork: 0,
    cost: 1,
    safety: 1,
    utilities: 0.5,
    internet: 0.5,
    healthcare: 0.5,
    flights: 0.5,
    culture: 0.5,
    history: 0.5,
  };
}

const PROJECT: Record<NonNullable<Answers["project"]>, Boost> = {
  installer: { cost: 1, safety: 1.5, utilities: 1, healthcare: 1, returnees: 1, paperwork: 1 },
  pied: { internet: 1, business: 1, flights: 3 },
  tester: { cost: 1, setupCost: 2, internet: 1.5, returnees: 1.5 },
  investir: { jobs: 1.5, business: 3, flights: 1, paperwork: 1 },
  decouvrir: { culture: 1, history: 1, safety: 0.5 },
};
const JOB: Record<NonNullable<Answers["job"]>, Boost> = {
  cadre: { jobs: 2.5 },
  entre: { jobs: 1, business: 2.5, paperwork: 1 },
  remote: { utilities: 1.5, internet: 3, flights: 1 },
  crea: { culture: 2.5 },
  soin: { cost: 1, healthcare: 1, returnees: 0.5 },
};
const FAMILY: Record<NonNullable<Answers["family"]>, Boost> = {
  celib: { returnees: 1.5, culture: 1 },
  couple: {},
  fonder: { schools: 2.5, healthcare: 1, safety: 1.5, returnees: 1 },
  parents: { schools: 3.5, healthcare: 1, safety: 2.5 },
};
const PRIORITY: Record<Priority, Boost> = {
  safety: { safety: 2.5 },
  cost: { cost: 2.5 },
  healthAndSchools: { healthcare: 2.5, schools: 2.5 },
  career: { jobs: 2.5 },
  diaspora: { returnees: 2.5 },
  memory: { history: 2.5 },
  flights: { flights: 2.5 },
};
const LANDSCAPES: Record<Exclude<NonNullable<Answers["landscape"]>, "urban">, Setting[]> = {
  beach: ["ocean"],
  nature: ["mountains", "forest", "lake-or-river"],
  wildSpaces: ["savanna", "desert"],
};
const CLIMATES: Record<NonNullable<Answers["climate"]>, string[]> = {
  hot: ["hot-humid", "hot-dry"],
  mild: ["mild", "highland"],
  dry: ["hot-dry"],
};
const PRIORITY_CRITERIA = Object.keys(PRIORITY) as Priority[];

function weightsFor(answers: Answers): Weights {
  const weights = baseWeights();
  const add = (boost: Boost | undefined) => {
    for (const [criterion, extra] of Object.entries(boost ?? {})) {
      weights[criterion as keyof Weights] += extra;
    }
  };
  if (answers.project) add(PROJECT[answers.project]);
  if (answers.job) add(JOB[answers.job]);
  if (answers.family) add(FAMILY[answers.family]);
  if (answers.landscape === "urban") add({ culture: 1.5 });
  if (answers.budget === "serre") add({ cost: 3, setupCost: 1 });
  if (answers.budget === "moyen") add({ cost: 1.5 });
  if (answers.budget === "large") weights.cost = 0;
  for (const priority of (answers.priorities ?? []).slice(0, MAX_PRIORITIES)) {
    if (PRIORITY_CRITERIA.includes(priority)) add(PRIORITY[priority]);
  }
  if (answers.friction !== undefined) {
    const avoid = 1 - answers.friction;
    add({ utilities: 2 * avoid, paperwork: 1.5 * avoid, setupCost: avoid });
  }
  if (answers.tripsHome !== undefined) add({ flights: 1 + 3 * answers.tripsHome });
  if (answers.setupBudget === "low") add({ setupCost: 3 });
  if (answers.setupBudget === "medium") add({ setupCost: 1.5 });
  if (answers.belonging === "returnees") add({ returnees: 2 });
  if (answers.belonging === "both") add({ returnees: 1 });
  for (const key of answers.renounce ?? []) weights[key] = 0;
  return weights;
}

interface Part {
  label: string;
  /** How well the city does on this point, 0 to 5; null when nobody knows. */
  value: number | null;
  weight: number;
  criterion?: CriterionKey;
}

/** A target criterion scores by distance to what the reader wants (1 to 5). */
function closeness(level: number | null, wanted: number): number | null {
  return level === null ? null : Math.max(0, MAX - Math.abs(wanted - level));
}

function partsFor(city: City, answers: Answers, weights: Weights): Part[] {
  const parts: Part[] = [];
  for (const key of CRITERION_KEYS) {
    const def = CRITERIA.find((c) => c.key === key);
    if (def?.direction === "target" || weights[key] === 0) continue;
    parts.push({
      label: LABELS[key],
      value: city.scores[key].level,
      weight: weights[key],
      criterion: key,
    });
  }
  if (weights.paperwork > 0) {
    parts.push({
      label: "Démarches simples",
      value: city.countryFacts?.paperwork.level ?? null,
      weight: weights.paperwork,
    });
  }

  if (answers.saturday !== undefined) {
    const value = closeness(city.scores.nightlife.level, 1 + 4 * answers.saturday);
    parts.push({
      label:
        value === null || value >= 3
          ? "Une ambiance à ta mesure"
          : "Une ambiance décalée par rapport à toi",
      value,
      weight: 2.5,
      criterion: "nightlife",
    });
  }
  if (answers.crowds !== undefined) {
    const value = closeness(city.scores.pace.level, 1 + 4 * answers.crowds);
    parts.push({
      label:
        value === null || value >= 3
          ? "Le rythme de ville que tu cherches"
          : "Un rythme éloigné de ce que tu cherches",
      value,
      weight: 2,
      criterion: "pace",
    });
  }
  if (answers.bargaining !== undefined) {
    const value = closeness(city.scores.negotiation.level, 1 + 4 * answers.bargaining);
    parts.push({
      label:
        value === null || value >= 3
          ? "Des prix comme tu les aimes"
          : "Des prix qui se négocient plus ou moins que tu ne le voudrais",
      value,
      weight: 1.5,
      criterion: "negotiation",
    });
  }
  if (answers.size) {
    const value = [5, 2.5, 0][Math.abs(city.size - answers.size)];
    parts.push({
      label:
        value >= 3
          ? "Le rythme de ville que tu cherches"
          : "Taille de ville éloignée de ton souhait",
      value,
      weight: 2,
    });
  }
  if (answers.language) {
    const spoken = livableLanguages(city).includes(answers.language);
    parts.push({
      label: spoken
        ? `On y vit en ${LANGUAGE_NAMES[answers.language]}`
        : "Langue du quotidien différente de ton souhait",
      value: spoken ? MAX : 0,
      weight: 3,
    });
  }
  if (answers.climate) {
    const suits = city.facts.climates.some((c) => CLIMATES[answers.climate!].includes(c));
    parts.push({
      label: suits ? "Le climat que tu cherches" : "Climat différent de ton souhait",
      value: suits ? MAX : 0,
      weight: 2,
    });
  }
  if (answers.landscape && answers.landscape !== "urban") {
    const near = city.facts.settings.some((s) =>
      LANDSCAPES[answers.landscape as "beach"].includes(s),
    );
    parts.push({
      label: near ? "Le paysage que tu cherches, tout près" : "Paysage différent de ton souhait",
      value: near ? MAX : 0,
      weight: 3,
    });
  }
  return parts;
}

function exclusionFor(city: City, answers: Answers): string | undefined {
  const country = city.countryFacts;
  if (answers.languageOnly && answers.language) {
    if (!livableLanguages(city).includes(answers.language)) {
      return `On n'y vit pas en ${LANGUAGE_NAMES[answers.language]}`;
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

function evaluate(city: City, answers: Answers, weights: Weights): Match {
  const parts = partsFor(city, answers, weights);
  const value = (p: Part) => p.value ?? NEUTRAL;
  const earned = parts.reduce((sum, p) => sum + p.weight * value(p), 0);
  const possible = parts.reduce((sum, p) => sum + p.weight * MAX, 0);
  const known = parts.filter((p) => p.value !== null).reduce((sum, p) => sum + p.weight, 0);
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  // A missing value is never cited for or against a city.
  const cited = parts.filter((p) => p.value !== null) as (Part & { value: number })[];
  const reasons = cited
    .filter((p) => p.weight > 0 && p.value >= 3.5)
    .sort((a, b) => b.weight * b.value - a.weight * a.value)
    .slice(0, 5)
    .map((p) => p.label);
  const drawbacks = cited
    .filter((p) => p.weight >= 2 && p.value <= 2)
    .sort((a, b) => b.weight * (MAX - b.value) - a.weight * (MAX - a.value))
    .slice(0, 3)
    .map((p) => p.label);
  return {
    city,
    score: possible ? earned / possible : 0,
    coverage: total ? known / total : 1,
    excludedBecause: exclusionFor(city, answers),
    reasons,
    drawbacks,
    portrait: portraitFor(city, answers),
  };
}

export function rankCities(answers: Answers): Match[] {
  const weights = weightsFor(answers);
  return CITIES.map((city) => evaluate(city, answers, weights)).sort((a, b) => b.score - a.score);
}

/**
 * The cities to offer the reader: conflict zones and cities a filter removed are ranked but
 * never proposed.
 */
export function bestMatches(answers: Answers, count: number): Match[] {
  return rankCities(answers)
    .filter((m) => !m.city.unsafe && !m.excludedBecause)
    .slice(0, count);
}
