import { CITIES, type City, type Zone } from "./cities";
import type { Answers } from "./ranking";
import type { Bilingual, Locale } from "../i18n/locale";
import { cityName, countryName, zoneName } from "../i18n/places";

/**
 * « Pas pour moi » (beta feedback, 2026-11-18): the reader sets a city, its country or its region
 * aside from a city they see. The places live in the answers, so the ranking, the adaptive quiz
 * and the resumed questionnaire all read the same filter (ranking.ts, `exclusionFor`).
 */
export type SetAsideLevel = "city" | "country" | "region";

export interface SetAsideChoice {
  level: SetAsideLevel;
  label: string;
  detail: string;
}

export interface LeftOutPlace {
  level: SetAsideLevel;
  value: string;
  label: string;
}

const KEY = {
  city: "avoidCities",
  country: "avoidCountries",
  region: "avoidRegions",
} as const satisfies Record<SetAsideLevel, keyof Answers>;

const COPY: Bilingual<{
  labels: Record<SetAsideLevel, string>;
  only: (name: string) => string;
  cities: (count: number) => string;
  leftOut: string;
}> = {
  fr: {
    labels: { city: "Cette ville", country: "Tout le pays", region: "Toute la région" },
    only: (name) => `${name} seulement`,
    cities: (count) => `${count} ${count > 1 ? "villes" : "ville"}`,
    leftOut: "En moins : ",
  },
  en: {
    labels: { city: "This city", country: "The whole country", region: "The whole region" },
    only: (name) => `${name} only`,
    cities: (count) => `${count} ${count > 1 ? "cities" : "city"}`,
    leftOut: "Left out: ",
  },
};

function valueAt(city: City, level: SetAsideLevel): string {
  return level === "city" ? city.name : level === "country" ? city.country : city.zone;
}

function nameOf(level: SetAsideLevel, value: string, locale: Locale): string {
  if (level === "city") return cityName(value, locale);
  if (level === "country") return countryName(value, locale);
  return zoneName(value as Zone, locale);
}

function citiesIn(level: SetAsideLevel, value: string): number {
  return CITIES.filter((c) => valueAt(c, level) === value).length;
}

/** The three ways to set a city aside, each saying how much of the catalogue it takes. */
export function setAsideChoices(city: City, locale: Locale): SetAsideChoice[] {
  const copy = COPY[locale];
  return (["city", "country", "region"] as const).map((level) => {
    const value = valueAt(city, level);
    const name = nameOf(level, value, locale);
    return {
      level,
      label: copy.labels[level],
      detail:
        level === "city" ? copy.only(name) : `${name} · ${copy.cities(citiesIn(level, value))}`,
    };
  });
}

export function setAside(answers: Answers, city: City, level: SetAsideLevel): Answers {
  const key = KEY[level];
  const value = valueAt(city, level);
  const current = (answers[key] ?? []) as string[];
  if (current.includes(value)) return answers;
  return { ...answers, [key]: [...current, value] };
}

export function restore(answers: Answers, place: Pick<LeftOutPlace, "level" | "value">): Answers {
  const key = KEY[place.level];
  const kept = ((answers[key] ?? []) as string[]).filter((v) => v !== place.value);
  const next: Answers = { ...answers };
  if (kept.length) (next as Record<string, unknown>)[key] = kept;
  else delete next[key];
  return next;
}

/** What the reader has set aside, cities first, so the row reads from the smallest to the widest. */
export function leftOut(answers: Answers, locale: Locale): LeftOutPlace[] {
  return (["city", "country", "region"] as const).flatMap((level) =>
    ((answers[KEY[level]] ?? []) as string[]).map((value) => ({
      level,
      value,
      label: nameOf(level, value, locale),
    })),
  );
}

/** The line announced once a place is set aside, next to « Annuler ». */
export function setAsideNotice(city: City, level: SetAsideLevel, locale: Locale): string {
  const copy = COPY[locale];
  const value = valueAt(city, level);
  const name = nameOf(level, value, locale);
  const count = level === "city" ? "" : ` (${copy.cities(citiesIn(level, value))})`;
  return `${copy.leftOut}${name}${count}.`;
}
