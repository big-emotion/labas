import type { Zone } from "./cities";
import type { Reaction } from "./reactions";
import { TEMPERAMENTS } from "./temperament";

/**
 * The search of /avis (operator, 2026-11-18): another way in than the quiz. A reader picks a few
 * filters and the reviews closest to them come first, so the cities they talk about surface.
 * The place filters are strict (a reader asking for Dakar wants Dakar); the temperament only
 * orders, so a young list never answers « nothing found ».
 */

export interface Place {
  slug: string;
  name: string;
  country: string;
  zone: Zone;
}

export interface ReviewFilters {
  /** A city, a country or any word of a review or of its replies. */
  query: string;
  /** A city slug: set when the reader comes from a city page. */
  city: string | null;
  zone: Zone | null;
  /** An archetype name of the temperament chapter. */
  temperament: string | null;
}

export interface Found {
  review: Reaction;
  /** Close to the temperament chosen; every review is close when none is. */
  close: boolean;
}

/** Out of 5 (five traits, each 0 to 1, squared): one full step on one trait at most. */
const CLOSE_ENOUGH = 1;

const plain = (text: string) => text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

function distanceTo(review: Reaction, temperament: string): number {
  const profile = review.profile;
  if (!profile) return Infinity;
  if (profile.name === temperament) return 0;
  const at = TEMPERAMENTS.find((t) => t.name === temperament)?.at;
  if (!at || profile.traits.length !== at.length) return Infinity;
  return profile.traits.reduce((sum, trait, i) => sum + (trait.value - at[i]) ** 2, 0);
}

export function searchReviews(
  reviews: Reaction[],
  places: Record<string, Place>,
  filters: ReviewFilters,
): Found[] {
  const words = plain(filters.query.trim());
  const kept = reviews.filter((review) => {
    const place = places[review.city];
    if (filters.city && review.city !== filters.city) return false;
    if (filters.zone && place?.zone !== filters.zone) return false;
    if (!words) return true;
    const said = [
      place?.name ?? "",
      place?.country ?? "",
      review.text,
      ...(review.replies ?? []).map((r) => r.text),
    ];
    return said.some((text) => plain(text).includes(words));
  });
  const { temperament } = filters;
  if (!temperament) return kept.map((review) => ({ review, close: true }));
  // A stable sort: at equal distance the newest stays first. Equal is tested first because
  // Infinity - Infinity is NaN, which would scramble the reviews that have no temperament.
  return kept
    .map((review) => ({ review, distance: distanceTo(review, temperament) }))
    .sort((a, b) => (a.distance === b.distance ? 0 : a.distance - b.distance))
    .map(({ review, distance }) => ({ review, close: distance <= CLOSE_ENOUGH }));
}

export interface RisingCity {
  slug: string;
  name: string;
  count: number;
}

/** The cities the close reviews keep coming back to: where they were written and their top three. */
export function risingCities(
  found: Found[],
  places: Record<string, Place>,
  limit = 6,
): RisingCity[] {
  const counts = new Map<string, number>();
  for (const { review, close } of found) {
    if (!close) continue;
    const named = new Set([review.city, ...(review.top ?? []).map((c) => c.slug)]);
    for (const slug of named) if (places[slug]) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts]
    .map(([slug, count]) => ({ slug, name: places[slug].name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"))
    .slice(0, limit);
}
