import type { City, CriterionKey } from "./cities";
import type { Match, Rated } from "./ranking";
import type { Bilingual, Locale } from "../i18n/locale";

const LIVING: Bilingual<[income: string, trips: string, comfort: string]> = {
  fr: [
    "Vivre avec un revenu européen",
    "Allers-retours vers l'Europe",
    "Confort : sécurité, soins, internet",
  ],
  en: [
    "Living on a European income",
    "Return trips to Europe",
    "Comfort: safety, healthcare, internet",
  ],
};

/**
 * « Si vous y viviez »: three lines read straight from the sourced scores (0 to 5). A line no
 * source rates is left out rather than guessed.
 */
export function livingLines(city: City, locale: Locale): Rated[] {
  const level = (keys: CriterionKey[]) => {
    const known = keys.map((key) => city.scores[key].level).filter((l): l is number => l !== null);
    return known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
  };
  const [income, trips, comfort] = LIVING[locale];
  const lines: [string, number | null][] = [
    [income, level(["cost"])],
    [trips, level(["flights"])],
    [comfort, level(["safety", "healthcare", "utilities", "internet"])],
  ];
  return lines
    .filter((line): line is [string, number] => line[1] !== null)
    .map(([label, l]) => ({ label, level: Math.max(1, l) }));
}

/** The other cities of the same country, best first: « Aussi au Sénégal : Saly 94 % ». */
export function sameCountry(ranked: Match[], city: City): { name: string; score: number }[] {
  return ranked
    .filter((m) => m.city.country === city.country && m.city.name !== city.name)
    .map((m) => ({ name: m.city.name, score: m.score }));
}

const REGIONS: Record<City["zone"], string> = {
  ouest: "Afrique de l'Ouest",
  centre: "Afrique centrale",
  est: "Afrique de l'Est",
  sud: "Afrique australe",
  nord: "Afrique du Nord",
};

/** The region on a card: short in English too, where the region list names the islands. */
const REGIONS_EN: Record<City["zone"], string> = {
  ouest: "West Africa",
  centre: "Central Africa",
  est: "East Africa",
  sud: "Southern Africa",
  nord: "North Africa",
};

export const regionName = (zone: City["zone"], locale: Locale) =>
  locale === "fr" ? REGIONS[zone] : REGIONS_EN[zone];

/** The `cost` score in words: 5 is cheapest (architecture.md, `cost`). */
const COSTS: Bilingual<string[]> = {
  fr: [
    "Coût de vie très élevé",
    "Coût de vie très élevé",
    "Coût de vie élevé",
    "Coût de vie intermédiaire",
    "Coût de vie abordable",
    "Coût de vie très abordable",
  ],
  en: [
    "Very high cost of living",
    "Very high cost of living",
    "High cost of living",
    "Middling cost of living",
    "Affordable cost of living",
    "Very affordable cost of living",
  ],
};

/** French by default for the city page, which calls it without a language yet. */
export const costLabel = (level: number | null, locale: Locale = "fr") =>
  level === null ? undefined : COSTS[locale][level];

/**
 * Which slide of « Tout près derrière » faces the reader, for the dots under the strip
 * (operator, 2026-11-26). Read from how far the strip has scrolled rather than from the slide at
 * the left edge: the last slides never reach that edge, and their dots must still light.
 */
export function slideAt(scrollLeft: number, maxScroll: number, count: number): number {
  if (maxScroll <= 0) return 0;
  return Math.round((Math.min(scrollLeft, maxScroll) / maxScroll) * (count - 1));
}
