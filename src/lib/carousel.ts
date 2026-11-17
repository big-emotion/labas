import { CITIES, type CriterionKey } from "./cities";
import { bestMatches, type Answers } from "./ranking";

/**
 * What a social carousel may name. Every city on a card comes from here, so the reader who
 * takes the quiz with the same answers lands on the same cities (operator, 2026-11-16).
 */

export interface Reveal {
  city: string;
  country: string;
  /** Rounded as the result card shows it. */
  percent: number;
}

export function revealFor(answers: Answers, count: number): Reveal[] {
  return bestMatches(answers, count).map((m) => ({
    city: m.city.name,
    country: m.city.country,
    percent: Math.round(m.score * 100),
  }));
}

export interface Twin {
  city: string;
  country: string;
  /** Sum of the level differences with the reference city on the chosen criteria (0 = same). */
  gap: number;
  levels: { criterion: CriterionKey; level: number }[];
}

/**
 * Look-alikes in other countries, « sur ce critère-là ». A city whose level is unknown on one of
 * the criteria is left out rather than counted as close: an unknown is not a resemblance.
 */
export function twinsOf(slug: string, criteria: CriterionKey[], count: number): Twin[] {
  const reference = CITIES.find((c) => c.slug === slug);
  if (!reference) throw new Error(`Unknown city slug: ${slug}`);
  for (const criterion of criteria) {
    if (reference.scores[criterion].level === null) {
      throw new Error(`${reference.name} has no known level on ${criterion}`);
    }
  }

  const twins: Twin[] = [];
  for (const city of CITIES) {
    if (city.country === reference.country) continue;
    const levels = criteria.map((criterion) => ({
      criterion,
      level: city.scores[criterion].level,
    }));
    if (levels.some((l) => l.level === null)) continue;
    const known = levels as Twin["levels"];
    const gap = known.reduce(
      (sum, l) => sum + Math.abs(l.level - (reference.scores[l.criterion].level as number)),
      0,
    );
    twins.push({ city: city.name, country: city.country, gap, levels: known });
  }
  return twins.sort((a, b) => a.gap - b.gap || a.city.localeCompare(b.city, "fr")).slice(0, count);
}
