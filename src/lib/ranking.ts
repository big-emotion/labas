import { CITIES, type City, type Climate, type Language, type PracticalCriterion } from "./cities";

/**
 * The ten questions of the one-screen form. Every answer is optional: an
 * unanswered question simply drops out of the score. The first prototype asked
 * 24; the ones left out are listed in the README.
 */
export interface Answers {
  project?: "installer" | "pied" | "tester" | "investir" | "decouvrir";
  budget?: "serre" | "moyen" | "large";
  family?: "celib" | "couple" | "fonder" | "parents";
  job?: "cadre" | "entre" | "remote" | "crea" | "soin";
  language?: Language;
  size?: City["size"];
  landscape?: "beach" | "nature" | "wildSpaces" | "urban";
  climate?: Climate;
  /** Ideal Saturday night: 1 out late with a crowd, 0.5 dinner with friends, 0 quiet at home. */
  saturday?: 0 | 0.5 | 1;
  /** Non-negotiables; only the first three count. */
  priorities?: PracticalCriterion[];
}

export interface Match {
  city: City;
  /** 0 to 1: the share of the best possible weighted score this city reaches. */
  score: number;
  /** Up to five plain-language reasons the city fits. */
  reasons: string[];
  /** Up to three things that weigh against it for this reader. */
  drawbacks: string[];
}

const CRITERION_LABELS: Record<PracticalCriterion, string> = {
  cost: "Coût de la vie accessible",
  safety: "Sécurité au quotidien",
  nightlife: "Fête et vie nocturne",
  culture: "Scène culturelle et créative",
  food: "Gastronomie",
  career: "Carrière et opportunités",
  investment: "Facilité d'investir",
  internet: "Internet et télétravail",
  healthAndSchools: "Santé et écoles",
  heritage: "Histoire et patrimoine",
  beach: "Plages et océan",
  nature: "Montagnes et nature",
  wildSpaces: "Grands espaces et safaris",
  memory: "Mémoire et liens avec la diaspora",
  flights: "Liaisons aériennes",
  diaspora: "Communauté de repats",
};

const LANGUAGE_NAMES: Record<Language, string> = {
  fr: "français",
  en: "anglais",
  pt: "portugais",
  ar: "arabe",
};

const MAX_PRIORITIES = 3;
const MAX = 5;

type Weights = Record<PracticalCriterion, number>;

// Weights are the prototype's, kept so its results stay recognisable. A reader who
// answers nothing still gets a sensible order: cost and safety matter to everyone.
function baseWeights(): Weights {
  return {
    cost: 1,
    safety: 1,
    nightlife: 0,
    culture: 0.5,
    food: 0.5,
    career: 0,
    investment: 0,
    internet: 0.5,
    healthAndSchools: 0,
    heritage: 0.5,
    beach: 0.5,
    nature: 0.5,
    wildSpaces: 0,
    memory: 0.5,
    flights: 0.5,
    diaspora: 0.5,
  };
}

type Boost = Partial<Weights>;

const PROJECT: Record<NonNullable<Answers["project"]>, Boost> = {
  installer: { healthAndSchools: 1, safety: 1.5, cost: 1, diaspora: 1 },
  pied: { flights: 3, internet: 1, investment: 1 },
  tester: { internet: 1.5, diaspora: 1.5, cost: 1 },
  investir: { investment: 3, career: 1.5, flights: 1 },
  decouvrir: { culture: 1, food: 1, heritage: 1, beach: 0.5, safety: 0.5 },
};
const JOB: Record<NonNullable<Answers["job"]>, Boost> = {
  cadre: { career: 2.5 },
  entre: { career: 2, investment: 1.5 },
  remote: { internet: 3, flights: 1 },
  crea: { culture: 2.5, nightlife: 0.5 },
  soin: { healthAndSchools: 1, cost: 1, diaspora: 0.5 },
};
const FAMILY: Record<NonNullable<Answers["family"]>, Boost> = {
  celib: { nightlife: 1.5, diaspora: 1.5, culture: 1 },
  couple: { food: 1, beach: 1 },
  fonder: { healthAndSchools: 2.5, safety: 1.5, diaspora: 1 },
  parents: { healthAndSchools: 3.5, safety: 2.5 },
};
const LANDSCAPE: Record<NonNullable<Answers["landscape"]>, Boost> = {
  beach: { beach: 3 },
  nature: { nature: 3 },
  wildSpaces: { wildSpaces: 3 },
  urban: { culture: 1.5, food: 1 },
};

function weightsFor(answers: Answers): Weights {
  const weights = baseWeights();
  const add = (boost: Boost | undefined) => {
    for (const [criterion, extra] of Object.entries(boost ?? {})) {
      weights[criterion as PracticalCriterion] += extra;
    }
  };
  if (answers.project) add(PROJECT[answers.project]);
  if (answers.job) add(JOB[answers.job]);
  if (answers.family) add(FAMILY[answers.family]);
  if (answers.landscape) add(LANDSCAPE[answers.landscape]);
  if (answers.budget === "serre") add({ cost: 3 });
  if (answers.budget === "moyen") add({ cost: 1.5 });
  if (answers.budget === "large") weights.cost = 0;
  for (const priority of (answers.priorities ?? []).slice(0, MAX_PRIORITIES)) {
    add({ [priority]: 2.5 });
  }
  return weights;
}

interface Part {
  label: string;
  /** How well the city does on this point, 0 to 5. */
  value: number;
  weight: number;
}

function partsFor(city: City, answers: Answers, weights: Weights): Part[] {
  const parts: Part[] = Object.entries(weights).map(([criterion, weight]) => ({
    label: CRITERION_LABELS[criterion as PracticalCriterion],
    value: city.scores[criterion as PracticalCriterion],
    weight,
  }));

  if (answers.saturday !== undefined) {
    const wanted = 1 + 4 * answers.saturday;
    const value = Math.max(0, MAX - Math.abs(wanted - city.scores.social));
    parts.push({
      label: value >= 3 ? "Une ambiance à votre mesure" : "Une ambiance décalée par rapport à vous",
      value,
      weight: 2.5,
    });
  }
  if (answers.size) {
    const value = [5, 2.5, 0][Math.abs(city.size - answers.size)];
    parts.push({
      label:
        value >= 3
          ? "Le rythme de ville que vous cherchez"
          : "Taille de ville éloignée de votre souhait",
      value,
      weight: 2,
    });
  }
  if (answers.language) {
    const spoken = city.languages.includes(answers.language);
    parts.push({
      label: spoken
        ? `On y vit en ${LANGUAGE_NAMES[answers.language]}`
        : "Langue du quotidien différente de votre souhait",
      value: spoken ? MAX : 0,
      weight: 3,
    });
  }
  if (answers.climate) {
    const suits = city.climates.includes(answers.climate);
    parts.push({
      label: suits ? "Le climat que vous cherchez" : "Climat différent de votre souhait",
      value: suits ? MAX : 0,
      weight: 2,
    });
  }
  return parts;
}

function evaluate(city: City, answers: Answers, weights: Weights): Match {
  const parts = partsFor(city, answers, weights);
  const earned = parts.reduce((sum, p) => sum + p.weight * p.value, 0);
  const possible = parts.reduce((sum, p) => sum + p.weight * MAX, 0);
  const reasons = parts
    .filter((p) => p.weight > 0 && p.value >= 3.5)
    .sort((a, b) => b.weight * b.value - a.weight * a.value)
    .slice(0, 5)
    .map((p) => p.label);
  const drawbacks = parts
    .filter((p) => p.weight >= 2 && p.value <= 2)
    .sort((a, b) => b.weight * (MAX - b.value) - a.weight * (MAX - a.value))
    .slice(0, 3)
    .map((p) => p.label);
  return { city, score: possible ? earned / possible : 0, reasons, drawbacks };
}

export function rankCities(answers: Answers): Match[] {
  const weights = weightsFor(answers);
  return CITIES.map((city) => evaluate(city, answers, weights)).sort((a, b) => b.score - a.score);
}

/** The cities to offer the reader: conflict zones are ranked but never proposed. */
export function bestMatches(answers: Answers, count: number): Match[] {
  return rankCities(answers)
    .filter((m) => !m.city.unsafe)
    .slice(0, count);
}
