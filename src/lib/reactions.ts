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

export interface Reaction {
  id: string;
  name: string;
  text: string;
  top: TopCity[] | null;
  profile: Profile | null;
  createdAt: string;
  mine: boolean;
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
