import type { Locale } from "../i18n/locale";
import catalogue from "../data/city-holiday.json";
import type { Source } from "./lines";

/**
 * Holiday facts per city (operator, 2026-11-16), each with its source: what one can do within
 * about two hours, the best months and the rains, and escapes for a day or a weekend. Only the
 * cities travel advice does not warn against are researched; the others are unknown here.
 */
export const ACTIVITY_TAGS = [
  "safari",
  "desert",
  "diving",
  "surf",
  "hiking",
  "watersports",
  "heritage",
  "festival",
] as const;
export type ActivityTag = (typeof ACTIVITY_TAGS)[number];

export interface Holiday {
  name: string;
  activities: { tag: ActivityTag; where: string; distance: string; source: Source }[];
  bestMonths: number[];
  rainyMonths: number[];
  monthsSource?: Source;
  escapes: { name: string; what: string; distance: string; source: Source }[];
}

export const HOLIDAYS = catalogue as Holiday[];
const BY_NAME = new Map(HOLIDAYS.map((h) => [h.name, h]));

export function holidayOf(cityName: string): Holiday | undefined {
  return BY_NAME.get(cityName);
}

/** How well the reader's months fall: 1 in the best months, 0 in the rains, 0.5 otherwise. */
export function seasonFit(cityName: string, months: number[]): number | null {
  const h = BY_NAME.get(cityName);
  if (!h || (!h.bestMonths.length && !h.rainyMonths.length) || !months.length) return null;
  const each: number[] = months.map((m) =>
    h.bestMonths.includes(m) ? 1 : h.rainyMonths.includes(m) ? 0 : 0.5,
  );
  return each.reduce((a, b) => a + b, 0) / each.length;
}

/** Whether one of these activities is within reach of the city; null when nothing is known. */
export function hasActivity(cityName: string, tags: ActivityTag[]): boolean | null {
  const h = BY_NAME.get(cityName);
  if (!h) return null;
  return h.activities.some((a) => tags.includes(a.tag));
}

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** « novembre, décembre, janvier » for a list of month numbers. */
export function monthNames(months: number[], locale: Locale): string {
  const names = locale === "en" ? MONTHS_EN : MONTHS;
  return months.map((m) => names[m - 1]).join(", ");
}

/** The answers of « Quand partez-vous ? », by three-month stretch. */
export const SEASONS = [
  { value: "djf", label: "De décembre à février", months: [12, 1, 2] },
  { value: "mam", label: "De mars à mai", months: [3, 4, 5] },
  { value: "jja", label: "De juin à août", months: [6, 7, 8] },
  { value: "son", label: "De septembre à novembre", months: [9, 10, 11] },
] as const;
export type Season = (typeof SEASONS)[number]["value"];
