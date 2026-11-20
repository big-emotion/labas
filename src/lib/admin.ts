/**
 * The operator's view of the reviews (/admin, operator 2026-11-18): grouped by city, the ones to
 * reread on top. Never an address: moderation does not need to know who wrote.
 */

export interface AdminReview {
  id: string;
  city: string;
  name: string;
  text: string;
  createdAt: string;
  reports: number;
  /** Hidden by the operator, or by three reports. */
  hidden: boolean;
  /** The first review of the thread when this is a reply. */
  replyTo: string | null;
  mention: string | null;
  marks: Record<string, number>;
}

export interface Thread {
  review: AdminReview;
  replies: AdminReview[];
}

export interface CityGroup {
  city: string;
  name: string;
  reviews: number;
  replies: number;
  /** Reported or hidden, replies included. */
  flagged: number;
  latest: string;
  threads: Thread[];
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);
const isFlagged = (r: AdminReview) => r.hidden || r.reports > 0;

/** Cities with the newest activity first, a reply counting as activity. */
export function byCity(reviews: AdminReview[], names: Record<string, string>): CityGroup[] {
  const groups = new Map<string, AdminReview[]>();
  for (const r of reviews) groups.set(r.city, [...(groups.get(r.city) ?? []), r]);
  return [...groups]
    .map(([city, all]) => {
      const firsts = all.filter((r) => !r.replyTo).sort(newestFirst);
      const replies = all.filter((r) => r.replyTo);
      return {
        city,
        name: names[city] ?? city,
        reviews: firsts.length,
        replies: replies.length,
        flagged: all.filter(isFlagged).length,
        latest: [...all].sort(newestFirst)[0].createdAt,
        threads: firsts.map((review) => ({
          review,
          replies: replies
            .filter((r) => r.replyTo === review.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        })),
      };
    })
    .sort((a, b) => b.latest.localeCompare(a.latest));
}

/** Hidden first, then the most reported. */
export function toReread(reviews: AdminReview[]): AdminReview[] {
  return reviews
    .filter(isFlagged)
    .sort((a, b) => Number(b.hidden) - Number(a.hidden) || b.reports - a.reports);
}

export type Goals = Record<string, { visitors: number; events: number }>;

const STEPS = [
  { label: "Ont répondu une fois", goal: "Réponse" },
  { label: "Quiz rapide terminé", goal: "Questionnaire 1 terminé" },
  { label: "Questionnaire complet terminé", goal: "Questionnaire complet terminé" },
];

/** Each step's share of all visitors: the leak shows where the share drops most. */
export function funnel(visitors: number, goals: Goals) {
  const share = (n: number) => (visitors ? `${Math.round((100 * n) / visitors)} %` : "–");
  return [
    { label: "Visiteurs", visitors, share: share(visitors) },
    ...STEPS.map(({ label, goal }) => {
      const reached = goals[goal]?.visitors ?? 0;
      return { label, visitors: reached, share: share(reached) };
    }),
  ];
}

/**
 * One reaction on a result, as the server kept it (quiz_outcomes): no reader behind it, and no
 * link between two rows, so a reader who changes their mind counts once per gesture.
 */
export interface Outcome {
  day: string;
  /** The site's version that ranked the cities; null for rows kept before v0.28.0. */
  version: string | null;
  kind: string;
  city: string;
  /** null when the reader took their reaction back. */
  reaction: "like" | "suits" | "not" | null;
  answers: Record<string, unknown>;
  top: string[];
}

interface Tally {
  like: number;
  suits: number;
  not: number;
  /** The share of « ça ne me correspond pas » among the reactions that stand. */
  misses: string;
}

function tally(rows: Outcome[]): Tally {
  const count = (reaction: Outcome["reaction"]) =>
    rows.filter((row) => row.reaction === reaction).length;
  const [like, suits, not] = [count("like"), count("suits"), count("not")];
  const standing = like + suits + not;
  return { like, suits, not, misses: standing ? `${Math.round((100 * not) / standing)} %` : "–" };
}

function grouped<K>(rows: Outcome[], key: (row: Outcome) => K): [K, Outcome[]][] {
  const groups = new Map<K, Outcome[]>();
  for (const row of rows) groups.set(key(row), [...(groups.get(key(row)) ?? []), row]);
  return [...groups];
}

const byVersion = (a: string | null, b: string | null) =>
  a === null || b === null
    ? Number(a === null) - Number(b === null)
    : b.localeCompare(a, undefined, { numeric: true });

/**
 * Where the ranking goes wrong: by version, to see whether a change helped, and by city, the
 * ones readers most often say do not suit them first.
 */
export function outcomesRead(rows: Outcome[]) {
  return {
    versions: grouped(rows, (row) => row.version)
      .sort(([a], [b]) => byVersion(a, b))
      .map(([version, own]) => ({ version, ...tally(own) })),
    cities: grouped(rows, (row) => row.city)
      .map(([city, own]) => ({ city, ...tally(own) }))
      .sort((a, b) => b.not - a.not || a.city.localeCompare(b.city)),
  };
}
