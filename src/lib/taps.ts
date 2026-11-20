/**
 * The one-tap reaction on a city (operator, 2026-11-20): three answers, no account, a public
 * count. Named « taps » in the code because `reactions` already means the written reviews.
 */
export const TAP_KINDS = ["like", "suits", "not"] as const;
export type TapKind = (typeof TAP_KINDS)[number];
export type TapCounts = Record<TapKind, number>;
/** Counts by city slug; a city nobody tapped is absent. */
export type TapsByCity = Record<string, TapCounts>;

export const isTapKind = (value: unknown): value is TapKind => TAP_KINDS.includes(value as TapKind);

export const noTaps = (): TapCounts => ({ like: 0, suits: 0, not: 0 });

export const tapTotal = (counts: TapCounts | undefined): number =>
  counts ? counts.like + counts.suits + counts.not : 0;

/**
 * What a tap does: the reader's answer for the city, the one it replaces, and the counts as
 * they will read. Tapping the answer already given takes it back.
 */
export function tapOn(
  tapped: TapKind,
  mine: TapKind | undefined,
  counts: TapCounts | undefined,
): { kind: TapKind | null; was: TapKind | null; counts: TapCounts } {
  const kind = tapped === mine ? null : tapped;
  const next = { ...(counts ?? noTaps()) };
  if (mine) next[mine] = Math.max(0, next[mine] - 1);
  if (kind) next[kind] += 1;
  return { kind, was: mine ?? null, counts: next };
}

/** « 12 réactions », or nothing for a city nobody reacted to: no « 0 » is ever shown. */
export function tapsLabel(counts: TapCounts | undefined, locale: "fr" | "en"): string {
  const total = tapTotal(counts);
  if (total === 0) return "";
  const word = locale === "en" ? "reaction" : "réaction";
  return `${new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR").format(total)} ${word}${total > 1 ? "s" : ""}`;
}

export const TAP_SORTS = [
  { key: "", label: { fr: "Par région", en: "By region" } },
  { key: "plus", label: { fr: "Le plus de réactions", en: "Most reactions" } },
  { key: "moins", label: { fr: "Le moins de réactions", en: "Fewest reactions" } },
] as const;
export type TapSort = (typeof TAP_SORTS)[number]["key"];

/**
 * City slugs by their number of reactions. « Le moins » still lists the cities with the fewest
 * first, those nobody tapped included; `tappedOnly` keeps the cities with at least one.
 */
export function byTaps(
  slugs: string[],
  taps: TapsByCity,
  sort: Exclude<TapSort, "">,
  tappedOnly = false,
): string[] {
  const direction = sort === "plus" ? -1 : 1;
  return slugs
    .filter((slug) => !tappedOnly || tapTotal(taps[slug]) > 0)
    .map((slug, index) => ({ slug, index, total: tapTotal(taps[slug]) }))
    .sort((a, b) => direction * (a.total - b.total) || a.index - b.index)
    .map((entry) => entry.slug);
}
