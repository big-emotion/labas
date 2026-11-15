import { CITIES, livableLanguages, type City } from "./cities";
import type { Match } from "./ranking";

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
  if (filters.regions?.length && !filters.regions.includes(city.zone)) return false;
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

/** How many filters the reader has set, for the « N filtres » label. */
export function activeFilterCount(filters: Filters): number {
  return Object.values(filters).filter((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)))
    .length;
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

export interface FilterMenuEntry {
  key: keyof Filters;
  label: string;
  /** What the sheet says under its title. */
  hint: string;
  options: FilterOption[];
  /** One option at most (budget, the law toggle). */
  single?: boolean;
}

/** The filters of the approved mockup (canvas « Là-bas — quiz », board « Résultat avec filtres »). */
export const FILTER_MENU: FilterMenuEntry[] = [
  {
    key: "known",
    label: "Villes que vous connaissez déjà",
    hint: "Retirez les villes où vous avez déjà vécu ou passé du temps.",
    options: CITIES.map((c) => c.name)
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((name) => ({ label: name, value: name })),
  },
  {
    key: "sizes",
    label: "Taille de la ville",
    hint: "Gardez seulement les villes de la taille que vous voulez.",
    options: [
      { label: "Grande ville", value: 3 },
      { label: "Ville moyenne", value: 2 },
      { label: "Petite ville", value: 1 },
    ],
  },
  {
    key: "languages",
    label: "Langue",
    hint: "Gardez les villes où l'on vit dans l'une de ces langues.",
    options: [
      { label: "Français", value: "fr" },
      { label: "Anglais", value: "en" },
      { label: "Portugais", value: "pt" },
      { label: "Arabe", value: "ar" },
      { label: "Espagnol", value: "es" },
      { label: "Swahili", value: "sw" },
    ],
  },
  {
    key: "budget",
    label: "Budget",
    hint: "Gardez les villes où la vie tient dans ce budget. Une ville dont le coût n'a pas été mesuré reste dans la liste.",
    single: true,
    options: [
      { label: "Serré", value: "serre" },
      { label: "Moyen", value: "moyen" },
      { label: "Le prix compte peu", value: "large" },
    ],
  },
  {
    key: "water",
    label: "Mer ou île",
    hint: "Gardez les villes au bord de la mer, ou sur une île.",
    options: [
      { label: "Au bord de la mer", value: "sea" },
      { label: "Sur une île", value: "island" },
    ],
  },
  {
    key: "regions",
    label: "Région",
    hint: "Gardez les villes de ces régions d'Afrique.",
    options: [
      { label: "Afrique de l'Ouest", value: "ouest" },
      { label: "Afrique centrale", value: "centre" },
      { label: "Afrique de l'Est", value: "est" },
      { label: "Afrique australe", value: "sud" },
      { label: "Afrique du Nord", value: "nord" },
    ],
  },
  {
    key: "faiths",
    label: "Religion majoritaire",
    hint: "D'après le Pew Research Center (2020), pays par pays.",
    options: [
      { label: "Islam", value: "muslim" },
      { label: "Christianisme", value: "christian" },
    ],
  },
  {
    key: "excludeCriminalising",
    label: "Lois sur l'homosexualité",
    hint: "Retirez les pays qui punissent les relations entre personnes de même sexe (ILGA, 2026).",
    single: true,
    options: [{ label: "Retirer ces pays", value: true }],
  },
];

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
