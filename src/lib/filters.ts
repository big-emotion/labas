import { CITIES, livableLanguages, type City } from "./cities";
import type { Match } from "./ranking";
import { INTL_LOCALE, type Locale } from "../i18n/locale";
import { cityName } from "../i18n/places";

/**
 * Filters on the result page. They only remove cities: the order stays the score's, which is
 * the one ranking rule. A city whose value nobody has measured is kept, so a filter never
 * hides a city for lack of data.
 */
export interface Filters {
  /** Cities the reader already knows, removed from the list. */
  known?: string[];
  sizes?: City["size"][];
  languages?: string[];
  water?: ("sea" | "island")[];
  /** Regions taken out, like the cities the reader already knows (beta feedback, 2026-11-18). */
  regions?: City["zone"][];
  faiths?: ("muslim" | "christian")[];
  budget?: "serre" | "moyen" | "large";
  excludeCriminalising?: boolean;
}

/** The lowest cost level each budget accepts: 5 is cheapest (architecture.md, `cost`). */
const CHEAPEST_ENOUGH = { serre: 4, moyen: 3, large: 0 } as const;

function passes(city: City, filters: Filters): boolean {
  if (filters.known?.includes(city.name)) return false;
  if (filters.sizes?.length && !filters.sizes.includes(city.size)) return false;
  if (filters.languages?.length) {
    if (!livableLanguages(city).some((l) => filters.languages!.includes(l))) return false;
  }
  if (filters.water?.length) {
    const settings = city.facts.settings;
    const wanted = filters.water.map((w) => (w === "sea" ? "ocean" : "island"));
    if (!settings.some((s) => wanted.includes(s as "ocean" | "island"))) return false;
  }
  if (filters.regions?.includes(city.zone)) return false;
  if (filters.faiths?.length) {
    const religion = city.countryFacts?.religion;
    if (religion && !filters.faiths.some((faith) => religion[faith] > 50)) return false;
  }
  if (filters.budget) {
    const level = city.scores.cost.level;
    if (level !== null && level < CHEAPEST_ENOUGH[filters.budget]) return false;
  }
  if (filters.excludeCriminalising) {
    const status = city.countryFacts?.sameSexRelations.status;
    if (status === "criminalised" || status === "criminalised-not-enforced") return false;
  }
  return true;
}

export function applyFilters(matches: Match[], filters: Filters): Match[] {
  return matches.filter((m) => passes(m.city, filters));
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  /** The English label, next to the French so a missing one is a type error. */
  en: string;
}

export interface FilterMenuEntry {
  key: keyof Filters;
  label: string;
  /** What the sheet says under its title. */
  hint: string;
  options: FilterOption[];
  /** One option at most (budget, the law toggle). */
  single?: boolean;
  en: { label: string; hint: string };
}

/** The filters of the approved mockup (canvas « Là-bas — quiz », board « Résultat avec filtres »). */
export const FILTER_MENU: FilterMenuEntry[] = [
  {
    key: "known",
    label: "Villes que vous connaissez déjà",
    hint: "Retirez les villes où vous avez déjà vécu ou passé du temps.",
    en: {
      label: "Cities you already know",
      hint: "Take out the cities where you have already lived or spent time.",
    },
    options: CITIES.map((c) => c.name)
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((name) => ({ label: name, value: name, en: cityName(name, "en") })),
  },
  {
    key: "sizes",
    label: "Taille de la ville",
    hint: "Gardez seulement les villes de la taille que vous voulez.",
    en: { label: "Size of city", hint: "Keep only the cities of the size you want." },
    options: [
      { label: "Grande ville", value: 3, en: "A big city" },
      { label: "Ville moyenne", value: 2, en: "A mid-sized city" },
      { label: "Petite ville", value: 1, en: "A small town" },
    ],
  },
  {
    key: "languages",
    label: "Langue",
    hint: "Gardez les villes où l'on vit dans l'une de ces langues.",
    en: {
      label: "Language",
      hint: "Keep the cities where daily life happens in one of these languages.",
    },
    options: [
      { label: "Français", value: "fr", en: "French" },
      { label: "Anglais", value: "en", en: "English" },
      { label: "Portugais", value: "pt", en: "Portuguese" },
      { label: "Arabe", value: "ar", en: "Arabic" },
      { label: "Espagnol", value: "es", en: "Spanish" },
      { label: "Swahili", value: "sw", en: "Swahili" },
    ],
  },
  {
    key: "budget",
    label: "Budget",
    hint: "Gardez les villes où la vie tient dans ce budget. Une ville dont le coût n'a pas été mesuré reste dans la liste.",
    en: {
      label: "Budget",
      hint: "Keep the cities where life fits this budget. A city whose cost has not been measured stays in the list.",
    },
    single: true,
    options: [
      { label: "Serré", value: "serre", en: "Tight" },
      { label: "Moyen", value: "moyen", en: "Medium" },
      { label: "Le prix compte peu", value: "large", en: "Price matters little" },
    ],
  },
  {
    key: "water",
    label: "Mer ou île",
    hint: "Gardez les villes au bord de la mer, ou sur une île.",
    en: { label: "Sea or island", hint: "Keep the cities by the sea, or on an island." },
    options: [
      { label: "Au bord de la mer", value: "sea", en: "By the sea" },
      { label: "Sur une île", value: "island", en: "On an island" },
    ],
  },
  {
    key: "regions",
    label: "Région",
    hint: "Retirez les villes des régions où vous ne voulez pas vivre.",
    en: {
      label: "Region",
      hint: "Take out the cities in the regions where you do not want to live.",
    },
    options: [
      { label: "Afrique de l'Ouest", value: "ouest", en: "West Africa" },
      { label: "Afrique centrale", value: "centre", en: "Central Africa" },
      { label: "Afrique de l'Est", value: "est", en: "East Africa" },
      { label: "Afrique australe", value: "sud", en: "Southern Africa" },
      { label: "Afrique du Nord", value: "nord", en: "North Africa" },
    ],
  },
  {
    key: "faiths",
    label: "Religion majoritaire",
    hint: "D'après le Pew Research Center (2020), pays par pays.",
    en: {
      label: "Main religion",
      hint: "From the Pew Research Center (2020), country by country.",
    },
    options: [
      { label: "Islam", value: "muslim", en: "Islam" },
      { label: "Christianisme", value: "christian", en: "Christianity" },
    ],
  },
  {
    key: "excludeCriminalising",
    label: "Lois sur l'homosexualité",
    hint: "Retirez les pays qui punissent les relations entre personnes de même sexe (ILGA, 2026).",
    en: {
      label: "Laws on homosexuality",
      hint: "Take out the countries that punish relationships between people of the same sex (ILGA, 2026).",
    },
    single: true,
    options: [{ label: "Retirer ces pays", value: true, en: "Take out these countries" }],
  },
];

/** The menu as a reader of this language reads it; keys and values stay the same. */
export function filterMenu(locale: Locale): FilterMenuEntry[] {
  if (locale === "fr") return FILTER_MENU;
  return FILTER_MENU.map((entry) => {
    const options = entry.options.map((option) => ({ ...option, label: option.en }));
    if (entry.key === "known")
      options.sort((a, b) => a.label.localeCompare(b.label, INTL_LOCALE[locale]));
    return { ...entry, ...entry.en, options };
  });
}

/** Turns the options picked in each sheet into filters. */
export function filtersFrom(
  picked: Partial<Record<keyof Filters, FilterOption["value"][]>>,
): Filters {
  const filters: Record<string, unknown> = {};
  for (const entry of FILTER_MENU) {
    const values = picked[entry.key] ?? [];
    if (!values.length) continue;
    filters[entry.key] = entry.single ? values[0] : values;
  }
  return filters as Filters;
}
