/** The words around a reaction (components/Reactions.astro), kept apart so they can be tested. */

export interface TopCity {
  slug: string;
  name: string;
  percent: number;
}

/** The archetype and its five traits, as the temperament chapter computes them (temperament.ts). */
export interface Profile {
  name: string;
  traits: { name: string; range: string; value: number }[];
}

/**
 * The few marks a reader can leave on a review (operator, 2026-11-18): the heart first and
 * foremost, then four friendly ones. No thumbs down: disagreeing is what a reply is for.
 */
export const MARKS = [
  { key: "coeur", emoji: "❤️", label: "J'aime" },
  { key: "bravo", emoji: "👍", label: "Bien vu" },
  { key: "merci", emoji: "🙏", label: "Merci" },
  { key: "rire", emoji: "😂", label: "Ça me fait rire" },
  { key: "utile", emoji: "💡", label: "Utile" },
] as const;
export type MarkKey = (typeof MARKS)[number]["key"];

export interface Reaction {
  id: string;
  /** The city slug: the reviews of every city share one list on /avis. */
  city: string;
  name: string;
  text: string;
  top: TopCity[] | null;
  profile: Profile | null;
  createdAt: string;
  mine: boolean;
  marks: Partial<Record<MarkKey, number>>;
  myMarks: MarkKey[];
  /** On a reply to a reply only: who it answers, since the thread keeps two levels. */
  mention: string | null;
  /** On a review only, oldest first. */
  replies?: Reaction[];
}

const DAY = 24 * 60 * 60 * 1000;
const longDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Recent reactions read like a conversation; older ones carry their date. */
export function reactionDate(iso: string, now: number): string {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  if (days < 1) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return `le ${longDate.format(new Date(iso))}`;
}

export function reactionCount(total: number): string {
  if (total === 0) return "Aucune réaction pour l'instant";
  return `${total} ${total > 1 ? "réactions" : "réaction"}`;
}

export function initialOf(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase("fr-FR") || "?";
}

/** « d'Abidjan », « de Dakar ». A city starting with « H » keeps « de »: most are aspirated. */
export function ofCity(name: string): string {
  return /^[AEIOUYÂÉÈÊÎÔÛ]/i.test(name) ? `d'${name}` : `de ${name}`;
}

/**
 * The line under a reaction (operator's pick, 2026-11-18): the first city and the temperament at
 * a glance, the detail one tap away, so the journey never outweighs the text.
 */
export function journeySummary(top: TopCity[] | null, profile: Profile | null) {
  const first = top?.[0] ? `${top[0].name} ${top[0].percent}\u202f%` : null;
  const others = top ? top.length - 1 : 0;
  const parts = [
    top?.[0] ? `${top[0].name} en tête` : null,
    profile ? `tempérament ${profile.name}` : null,
  ].filter(Boolean);
  return {
    first,
    temperament: profile?.name ?? null,
    more: others > 0 ? `+${others} ${others > 1 ? "villes" : "ville"}` : null,
    label: `Son parcours : ${parts.join(", ")}. Voir le détail`,
  };
}

/** « avis » is invariable: the count reads the same for one or twelve. */
export function reviewsFound(found: number, total: number): string {
  if (total === 0) return "Aucun avis pour l'instant";
  if (found === total) return `${total} avis`;
  if (found === 0) return `Aucun avis sur ${total} ne correspond`;
  return `${found} avis sur ${total}`;
}

/** The reply button carries the count, so a thread shows it has answers before it opens. */
export function replyCount(total: number): string {
  if (total === 0) return "Répondre";
  return `${total} ${total > 1 ? "réponses" : "réponse"}`;
}

export function markLabel(key: MarkKey, count: number, mine: boolean): string {
  const label = MARKS.find((m) => m.key === key)!.label;
  if (count === 0) return label;
  const people = `${count} ${count > 1 ? "personnes" : "personne"}`;
  return `${label}, ${people}${mine ? ", dont vous" : ""}`;
}
