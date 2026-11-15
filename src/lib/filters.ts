import { livableLanguages, type City } from "./cities";
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
