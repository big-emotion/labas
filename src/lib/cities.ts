import catalogue from "../data/cities.json";
import criteriaCatalogue from "../data/criteria.json";
import scoreCatalogue from "../data/city-scores.json";
import countryCatalogue from "../data/countries.json";

/**
 * A city joins three files: who it is (cities.json), how it scores on each criterion with its
 * sources (city-scores.json), and the national facts of its country (countries.json). Rationale:
 * docs/criteria/architecture.md §3 and §5.
 */

export const CRITERION_KEYS = [
  "cost",
  "setupCost",
  "negotiation",
  "safety",
  "utilities",
  "internet",
  "healthcare",
  "schools",
  "jobs",
  "business",
  "flights",
  "culture",
  "nightlife",
  "history",
  "returnees",
  "pace",
] as const;
export type CriterionKey = (typeof CRITERION_KEYS)[number];

export interface Source {
  title: string;
  url: string;
  published?: string;
  accessed: string;
}

export type Confidence = "measured" | "survey" | "sourced" | "editorial";

export interface Score {
  /** 0 to 5 on the written rubric, or null when no reliable figure exists. */
  level: number | null;
  justification: string;
  confidence: Confidence;
  sources: Source[];
}

export interface CriterionDefinition {
  key: CriterionKey;
  label: string;
  means: string;
  doesNotMean: string;
  direction: "higher-is-better" | "target";
  rubric: { "1": string; "3": string; "5": string };
}

export const CRITERIA = criteriaCatalogue as CriterionDefinition[];

export type Language = "fr" | "en" | "pt" | "ar" | "es" | "sw";
export type Setting = "ocean" | "lake-or-river" | "mountains" | "forest" | "savanna" | "desert";
export type ClimateClass = "hot-humid" | "hot-dry" | "mild" | "highland";
export type AdvisoryColour = "green" | "yellow" | "orange" | "red";

export interface Advisory {
  franceDiplomatie: AdvisoryColour | null;
  fcdo: "all" | "all-but-essential" | "none" | null;
  date: string | null;
  sources: Source[];
}

export interface Facts {
  settings: Setting[];
  climates: ClimateClass[];
  languages: { language: Language; use: "daily" | "work-and-admin" | "limited" }[];
  sectors: string[];
  schoolCurricula: string[];
  advisory: Advisory;
}

export interface CountryFacts {
  name: string;
  paperwork: Score;
  visaFreeDaysFrenchPassport: number | null;
  visaNote: string;
  diasporaRoute: string;
  dualNationality: { allowed: "yes" | "no" | "restricted" | null; note: string; sources: Source[] };
  sameSexRelations: {
    status: "legal" | "criminalised" | "criminalised-not-enforced" | "unclear" | null;
    note: string;
    sources: Source[];
  };
  mobileMoney: string;
  described: { womenDaily: string; returneePerception: string; religion: string };
  sources: Source[];
}

export const ZONES = {
  ouest: "Afrique de l'Ouest",
  centre: "Afrique centrale",
  est: "Afrique de l'Est",
  sud: "Afrique australe et océan Indien",
  nord: "Afrique du Nord",
} as const;
export type Zone = keyof typeof ZONES;

export const POPULATION_LABELS: Record<number, string> = {
  4: "Mégapole de plus de 10 millions d'habitants",
  3: "Agglomération de 3 à 10 millions",
  2: "Agglomération de 1 à 3 millions",
  1: "Moins d'un million d'habitants",
};

interface Identity {
  name: string;
  country: string;
  zone: Zone;
  lat: number;
  lon: number;
  population: number;
  size: 1 | 2 | 3;
  languageLabel: string;
  currency: string;
  tagline: string;
  pitch: string;
  watch: string;
}

export interface City extends Identity {
  slug: string;
  scores: Record<CriterionKey, Score>;
  facts: Facts;
  countryFacts: CountryFacts | undefined;
  /**
   * Ranked but never proposed. Derived from travel advice, never hand-set (§4.3): France
   * Diplomatie colours the city's zone orange or red, or the UK advises against all or all but
   * essential travel there.
   */
  unsafe: boolean;
}

interface ScoredEntry {
  name: string;
  scores: Record<CriterionKey, Score>;
  facts: Facts;
}

export function slugOf(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isUnsafe(advisory: Advisory): boolean {
  return (
    advisory.franceDiplomatie === "orange" ||
    advisory.franceDiplomatie === "red" ||
    advisory.fcdo === "all" ||
    advisory.fcdo === "all-but-essential"
  );
}

const SCORED = new Map(
  (scoreCatalogue as unknown as ScoredEntry[]).map((entry) => [entry.name, entry]),
);
const COUNTRIES = new Map(
  (countryCatalogue as unknown as CountryFacts[]).map((country) => [country.name, country]),
);

export const CITIES: City[] = (catalogue as unknown as Identity[]).map((identity) => {
  const scored = SCORED.get(identity.name);
  if (!scored) throw new Error(`${identity.name} has no entry in city-scores.json`);
  return {
    ...identity,
    slug: slugOf(identity.name),
    scores: scored.scores,
    facts: scored.facts,
    countryFacts: COUNTRIES.get(identity.country),
    unsafe: isUnsafe(scored.facts.advisory),
  };
});

/** Languages a newcomer can live in: daily or at work and in offices. */
export function livableLanguages(city: City): Language[] {
  return city.facts.languages.filter((l) => l.use !== "limited").map((l) => l.language);
}
