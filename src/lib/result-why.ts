import type { Match } from "./ranking";

/**
 * The box above the result cards (beta feedback, 2026-11-19: readers were surprised by their top
 * cities and found no explanation without opening a card). It reuses the reasons the ranking
 * already rates for each card, so the box can never say something a card contradicts.
 */
export interface ResultWhy {
  /** What every city on screen has going for it, in the first city's order. */
  shared: string[];
  /** What puts the first city ahead: its own reasons, or its strongest when all are shared. */
  first: string[];
  /** The main thing that weighs against the first city for this reader. */
  toKnow?: string;
}

const SHOWN = 3;

export function whyTheseCities(matches: Match[]): ResultWhy {
  const [first, ...others] = matches;
  if (!first) return { shared: [], first: [] };
  const own = first.reasons.map((reason) => reason.label);
  const shared = own.filter((label) =>
    others.every((other) => other.reasons.some((reason) => reason.label === label)),
  );
  const distinctive = own.filter((label) => !shared.includes(label));
  const why: ResultWhy = {
    shared: shared.slice(0, SHOWN),
    first: (distinctive.length ? distinctive : own).slice(0, SHOWN),
  };
  const against = first.drawbacks[0]?.label;
  if (against) why.toKnow = against;
  return why;
}
