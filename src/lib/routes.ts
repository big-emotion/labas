import catalogue from "../data/city-routes.json";
import type { Source } from "./lines";
import type { Answers } from "./ranking";

/**
 * A typical week and a discovery route per city, written from the sourced neighbourhood sheets
 * in research/cities/<country>/<city>.neighbourhoods.md. Each week is keyed to level-1 quiz
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

/**
 * The week whose answers match the reader's the most; the first week when none matches.
 * A week that contradicts an answer the reader gave (« En couple » for someone « Avec mes
 * enfants ») loses half a point, so ties go to the week that fits without contradiction.
 */
export function weekFor(cityName: string, answers: Answers): TypicalWeek | undefined {
  const weeks = routesFor(cityName)?.weeks ?? [];
  let best = weeks[0];
  let bestScore = 0;
  for (const week of weeks) {
    const keys = Object.entries(week.for) as [keyof Answers, unknown][];
    const matches = keys.filter(([key, value]) => answers[key] === value).length;
    const contradictions = keys.filter(
      ([key, value]) => answers[key] !== undefined && answers[key] !== value,
    ).length;
    const score = matches - 0.5 * contradictions;
    if (score > bestScore) {
      best = week;
      bestScore = score;
    }
  }
  return best;
}
