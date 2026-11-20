import type { Bilingual } from "../i18n/locale";
import { tapTotal, type TapsByCity } from "./taps";
import type { Zone } from "./cities";
import type { Reaction } from "./reactions";
import { TEMPERAMENTS } from "./temperament";

/**
 * The search of /avis (operator, 2026-11-18): another way in than the quiz. A reader picks a
 * region, then one of its cities, a sort, a temperament, and reads the reviews twenty at a time.
 * The place filters are strict (a reader asking for Dakar wants Dakar); the temperament only
 * orders, so a young list never answers « nothing found ». It all runs in the browser over every
 * published review (the server sends them all, up to a cap): the temperament distance is computed
 * here, and a beta's few hundred reviews do not need a paginated API yet.
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
  sort: ReviewSort;
  /** The public one-tap reactions by city, once loaded. */
  taps?: TapsByCity;
  /** Only the reviews of cities with at least one reaction. */
  tapped?: boolean;
}

/** The sorts of /avis, in the order the reader sees them; the first is the default. */
export const SORTS = [
  { key: "recents", label: { fr: "Plus récents", en: "Newest" } },
  { key: "anciens", label: { fr: "Plus anciens", en: "Oldest" } },
  { key: "aimes", label: { fr: "Plus aimés", en: "Most liked" } },
  { key: "moins-aimes", label: { fr: "Moins aimés", en: "Least liked" } },
  { key: "reponses", label: { fr: "Plus de réponses", en: "Most replies" } },
  {
    key: "reactions",
    label: { fr: "Villes aux plus de réactions", en: "Cities with most reactions" },
  },
  {
    key: "moins-reactions",
    label: { fr: "Villes aux moins de réactions", en: "Cities with fewest reactions" },
  },
] as const satisfies readonly { key: string; label: Bilingual<string> }[];
export type ReviewSort = (typeof SORTS)[number]["key"];

/** Every friendly mark counts the same: there is no thumbs down to subtract. */
const likesOf = (review: Reaction) =>
  Object.values(review.marks).reduce((sum, n) => sum + (n ?? 0), 0);
const age = (review: Reaction) => -Date.parse(review.createdAt);

/** Negative when `a` comes first; a tie always falls back to the newest first. */
const orderBy = (taps: TapsByCity): Record<ReviewSort, (a: Reaction, b: Reaction) => number> => ({
  reactions: (a, b) => tapTotal(taps[b.city]) - tapTotal(taps[a.city]) || age(a) - age(b),
  "moins-reactions": (a, b) => tapTotal(taps[a.city]) - tapTotal(taps[b.city]) || age(a) - age(b),
  recents: (a, b) => age(a) - age(b),
  anciens: (a, b) => age(b) - age(a),
  aimes: (a, b) => likesOf(b) - likesOf(a) || age(a) - age(b),
  "moins-aimes": (a, b) => likesOf(a) - likesOf(b) || age(a) - age(b),
  reponses: (a, b) => (b.replies?.length ?? 0) - (a.replies?.length ?? 0) || age(a) - age(b),
});

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
  const taps = filters.taps ?? {};
  const kept = reviews.filter((review) => {
    const place = places[review.city];
    if (filters.tapped && tapTotal(taps[review.city]) === 0) return false;
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
  const sorted = [...kept].sort(orderBy(taps)[filters.sort]);
  const { temperament } = filters;
  if (!temperament) return sorted.map((review) => ({ review, close: true }));
  // A stable sort: at equal distance the chosen sort stays. Equal is tested first because
  // Infinity - Infinity is NaN, which would scramble the reviews that have no temperament.
  return sorted
    .map((review) => ({ review, distance: distanceTo(review, temperament) }))
    .sort((a, b) => (a.distance === b.distance ? 0 : a.distance - b.distance))
    .map(({ review, distance }) => ({ review, close: distance <= CLOSE_ENOUGH }));
}

/** Twenty reviews a page: a phone screen or two, and few enough pages to number them. */
const PER_PAGE = 20;

export function pageOf(found: Found[], asked: number) {
  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const page = Number.isFinite(asked) ? Math.min(Math.max(1, Math.trunc(asked)), pages) : 1;
  return { items: found.slice((page - 1) * PER_PAGE, page * PER_PAGE), page, pages };
}

/** Every page up to seven; beyond, the first, the last and the current one's neighbours. */
export function pageLinks(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const near = [1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages);
  const kept = [...new Set(near)].sort((a, b) => a - b);
  return kept.flatMap((n, i) => (i > 0 && n - kept[i - 1] > 1 ? ["…" as const, n] : [n]));
}

export interface ZoneCity {
  slug: string;
  name: string;
  count: number;
}

/** The list to pick a city in a region: all its cities, the most reviewed first, then by name. */
export function citiesOfZone(
  reviews: Reaction[],
  places: Record<string, Place>,
  zone: Zone,
): ZoneCity[] {
  const counts = new Map<string, number>();
  for (const review of reviews) counts.set(review.city, (counts.get(review.city) ?? 0) + 1);
  return Object.values(places)
    .filter((place) => place.zone === zone)
    .map((place) => ({ slug: place.slug, name: place.name, count: counts.get(place.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}
