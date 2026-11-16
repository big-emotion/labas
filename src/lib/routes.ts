import catalogue from "../data/city-routes.json";
import type { Source } from "./lines";
import type { Answers } from "./ranking";
import { bestWeekIndex } from "./week-pick";

export { jobOf } from "./week-pick";

/**
 * A typical week and a discovery route per city, written from the sourced neighbourhood sheets
 * in research/cities/<country>/<city>.neighbourhoods.md. Each week is keyed to quick-quiz
 * answers so the site can show the one that fits the reader.
 */
export interface TypicalWeek {
  /** The quiz answers this week is written for, e.g. { job: "remote", family: "celib" }. */
  for: Partial<Pick<Answers, "project" | "family" | "job">>;
  title: string;
  /** The neighbourhood the week starts from. */
  base: string;
  /** Monday to Sunday, one line each. */
  days: string[];
  /** A rough weekly spend built only from sourced prices, or null when they are missing. */
  budget: string | null;
}

export interface CityRoutes {
  name: string;
  weeks: TypicalWeek[];
  /** For « D'abord des vacances »: a day (morning, midday, afternoon, evening) and a week. */
  discovery: { day: string[]; week: string[] };
  sources: Source[];
}

const BY_NAME = new Map(
  (catalogue as unknown as CityRoutes[]).map((routes) => [routes.name, routes]),
);

export function routesFor(cityName: string): CityRoutes | undefined {
  return BY_NAME.get(cityName);
}

/** The week whose answers match the reader's the most (week-pick.ts); the first when none does. */
export function weekFor(cityName: string, given: Answers): TypicalWeek | undefined {
  const weeks = routesFor(cityName)?.weeks ?? [];
  return weeks[bestWeekIndex(weeks, given)];
}
