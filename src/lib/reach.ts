/**
 * « Jusqu'où aimeriez-vous aller ? » (operator, 2026-11-20): one question for the distance a
 * reader accepts from their own, geographic and cultural at once. It replaces « vivre près de
 * vos origines » (« Beaucoup », « Un peu », which readers found unclear) and « aller vers
 * l'inconnu », which asked the same thing twice for a reader who had named an origin.
 */
export const REACHES = ["country", "region", "alike", "anywhere"] as const;
export type Reach = (typeof REACHES)[number];
export type Adventure = "familiar" | "open" | "seeking";

/** The appetite for the unknown that the answer also tells, for the temperament profile. */
const ADVENTURE_OF: Record<Reach, Adventure> = {
  country: "familiar",
  region: "open",
  alike: "open",
  anywhere: "seeking",
};

/**
 * The same answers with the appetite for the unknown filled in from the reach. A reader who
 * named no origin is asked « aller vers l'inconnu » itself, and that answer stands.
 */
export function withAdventure<T extends { reach?: Reach; adventure?: Adventure }>(answers: T): T {
  return answers.reach ? { ...answers, adventure: ADVENTURE_OF[answers.reach] } : answers;
}

/** The reader asked to stay near their own, however near. */
export const staysNear = (answers: { reach?: Reach }): boolean =>
  answers.reach !== undefined && answers.reach !== "anywhere";
