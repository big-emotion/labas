import type { Answers } from "./ranking";

export interface Trait {
  name: string;
  /** The two ends of the trait, low first. */
  range: string;
  /** 0 to 1. */
  value: number;
}

export interface Archetype {
  name: string;
  text: string;
  traits: Trait[];
}

/**
 * A quick reading inspired by the Big Five, one question per trait, shown as preferences and
 * never as a verdict on the reader (operator, 2026-11-15). Each archetype is a point on the five
 * traits; the reader gets the closest one.
 */
export const TEMPERAMENTS: { name: string; text: string; at: number[] }[] = [
  {
    name: "Conquête",
    text: "Vous aimez les villes qui vont vite, où tout se négocie et où l'on vient pour réussir.",
    at: [1, 0.5, 0, 0, 1],
  },
  {
    name: "Lien",
    text: "Vous aimez les villes chaleureuses, où l'on sort et où l'on se lie vite.",
    at: [1, 0.5, 0.5, 1, 0.5],
  },
  {
    name: "Fondation",
    text: "Vous aimez les villes lisibles, aux démarches simples et prévisibles.",
    at: [0.5, 0.5, 1, 0.5, 0.5],
  },
  {
    name: "Exploration",
    text: "Vous aimez les villes qui vous surprennent et vous apprennent quelque chose.",
    at: [0.5, 1, 0, 0.5, 1],
  },
  {
    name: "Refuge",
    text: "Vous aimez le calme, des repères solides et une vraie communauté autour de vous.",
    at: [0, 0, 1, 1, 0],
  },
];

const OPENNESS = { familiar: 0, open: 0.5, seeking: 1 } as const;

export function archetypeOf(answers: Answers): Archetype | undefined {
  const { saturday, adventure, order, together, friction } = answers;
  if (adventure === undefined) return;
  const given = [saturday, OPENNESS[adventure], order, together, friction];
  if (given.some((v) => v === undefined)) return;
  const values = given as number[];
  const distance = (at: number[]) => at.reduce((sum, x, i) => sum + (x - values[i]) ** 2, 0);
  const closest = TEMPERAMENTS.reduce((best, a) => (distance(a.at) < distance(best.at) ? a : best));
  const names = ["Extraversion", "Ouverture", "Conscience", "Agréabilité", "Stabilité"];
  const ranges = [
    "calme ou monde",
    "repères ou dépaysement",
    "improvisation ou cadre",
    "compétition ou entraide",
    "sensible ou imperturbable",
  ];
  return {
    name: closest.name,
    text: closest.text,
    traits: names.map((name, i) => ({ name, range: ranges[i], value: values[i] })),
  };
}
