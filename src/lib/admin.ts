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
