import type { Answers } from "./ranking";
import type { Bilingual, Locale } from "../i18n/locale";

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
 * traits; the reader gets the closest one. The French name is also the key reactions are filtered
 * by (/avis), so it never changes with the reader's language.
 */
export const TEMPERAMENTS: {
  name: string;
  text: string;
  at: number[];
  en: { name: string; text: string };
}[] = [
  {
    name: "Conquête",
    text: "Vous aimez les villes qui vont vite, où tout se négocie et où l'on vient pour réussir.",
    at: [1, 0.5, 0, 0, 1],
    en: {
      name: "Drive",
      text: "You like cities that move fast, where everything is negotiable and people come to succeed.",
    },
  },
  {
    name: "Lien",
    text: "Vous aimez les villes chaleureuses, où l'on sort et où l'on se lie vite.",
    at: [1, 0.5, 0.5, 1, 0.5],
    en: {
      name: "Connection",
      text: "You like warm cities, where people go out and make friends quickly.",
    },
  },
  {
    name: "Fondation",
    text: "Vous aimez les villes lisibles, aux démarches simples et prévisibles.",
    at: [0.5, 0.5, 1, 0.5, 0.5],
    en: {
      name: "Foundation",
      text: "You like cities that are easy to read, with simple, predictable paperwork.",
    },
  },
  {
    name: "Exploration",
    text: "Vous aimez les villes qui vous surprennent et vous apprennent quelque chose.",
    at: [0.5, 1, 0, 0.5, 1],
    en: { name: "Exploration", text: "You like cities that surprise you and teach you something." },
  },
  {
    name: "Refuge",
    text: "Vous aimez le calme, des repères solides et une vraie communauté autour de vous.",
    at: [0, 0, 1, 1, 0],
    en: { name: "Refuge", text: "You like calm, solid landmarks and a real community around you." },
  },
];

const OPENNESS = { familiar: 0, open: 0.5, seeking: 1 } as const;

const TRAIT_COPY: Bilingual<{ names: string[]; ranges: string[] }> = {
  fr: {
    names: ["Extraversion", "Ouverture", "Conscience", "Agréabilité", "Stabilité"],
    ranges: [
      "calme ou monde",
      "repères ou dépaysement",
      "improvisation ou cadre",
      "compétition ou entraide",
      "sensible ou imperturbable",
    ],
  },
  en: {
    names: ["Extraversion", "Openness", "Conscientiousness", "Agreeableness", "Stability"],
    ranges: [
      "quiet or crowds",
      "the familiar or the new",
      "improvising or structure",
      "competition or mutual help",
      "sensitive or unflappable",
    ],
  },
};

export function archetypeOf(answers: Answers, locale: Locale): Archetype | undefined {
  const { saturday, adventure, order, together, friction } = answers;
  if (adventure === undefined) return;
  const given = [saturday, OPENNESS[adventure], order, together, friction];
  if (given.some((v) => v === undefined)) return;
  const values = given as number[];
  const distance = (at: number[]) => at.reduce((sum, x, i) => sum + (x - values[i]) ** 2, 0);
  const closest = TEMPERAMENTS.reduce((best, a) => (distance(a.at) < distance(best.at) ? a : best));
  const { names, ranges } = TRAIT_COPY[locale];
  const words = locale === "fr" ? closest : closest.en;
  return {
    name: words.name,
    text: words.text,
    traits: names.map((name, i) => ({ name, range: ranges[i], value: values[i] })),
  };
}
