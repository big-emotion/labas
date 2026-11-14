import catalogue from "../data/cities.json";

/**
 * Scores run from 0 to 5. They are editorial estimates carried over from the
 * first prototype, not survey results: the method page must say so, and any
 * remark on safety, racism or LGBT rights needs a dated source before launch.
 */
export const PRACTICAL_CRITERIA = [
  "cost",
  "safety",
  "nightlife",
  "culture",
  "food",
  "career",
  "investment",
  "internet",
  "healthAndSchools",
  "heritage",
  "beach",
  "nature",
  "wildSpaces",
  "memory",
  "flights",
  "diaspora",
] as const;

/** How the city feels to live in, compared with the reader's temperament. */
export const CHARACTER_CRITERIA = [
  "social",
  "novelty",
  "order",
  "competition",
  "intensity",
] as const;

export type PracticalCriterion = (typeof PRACTICAL_CRITERIA)[number];
export type CharacterCriterion = (typeof CHARACTER_CRITERIA)[number];
export type Criterion = PracticalCriterion | CharacterCriterion;

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

export type Language = "fr" | "en" | "pt" | "ar";
export type Climate = "hot" | "mild" | "dry";

export interface City {
  name: string;
  country: string;
  zone: Zone;
  lat: number;
  lon: number;
  /** 1 to 4, see POPULATION_LABELS. */
  population: number;
  /** Pace of the city: 3 very large, 2 human-sized, 1 small and quiet. */
  size: 1 | 2 | 3;
  /** Languages a newcomer can live in day to day; empty when none of the four. */
  languages: Language[];
  languageLabel: string;
  climates: Climate[];
  currency: string;
  tagline: string;
  pitch: string;
  watch: string;
  /** Conflict zone or severe instability: never offered in the top results. */
  unsafe: boolean;
  scores: Record<Criterion, number>;
}

export const CITIES = catalogue as City[];
