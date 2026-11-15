import type { Answers } from "./ranking";

export interface Choice {
  label: string;
  value: string | number | boolean;
}

export interface Question {
  id: keyof Answers;
  title: string;
  choices: Choice[];
  /** Several answers allowed, up to this many. */
  max?: number;
}

// Worded in « tu » and kept playful (docs/criteria/architecture.md §A.3); the answer values
// are the prototype's, so the ranking and its tests stand.
export const QUESTIONS: Question[] = [
  {
    id: "project",
    title: "Là-bas, tu t'y vois comment ?",
    choices: [
      { label: "M'installer pour de bon", value: "installer" },
      { label: "Un pied ici, un pied là-bas", value: "pied" },
      { label: "Tester quelques mois", value: "tester" },
      { label: "Investir sans y vivre", value: "investir" },
      { label: "D'abord des vacances", value: "decouvrir" },
    ],
  },
  {
    id: "saturday",
    title: "Ton samedi soir idéal ?",
    choices: [
      { label: "Danser jusqu'au matin", value: 1 },
      { label: "Un bon dîner entre amis", value: 0.5 },
      { label: "Tranquille chez moi", value: 0 },
    ],
  },
  {
    id: "budget",
    title: "Ton budget sur place ?",
    choices: [
      { label: "Serré", value: "serre" },
      { label: "Moyen", value: "moyen" },
      { label: "Le prix compte peu", value: "large" },
    ],
  },
  {
    id: "family",
    title: "Tu pars avec qui ?",
    choices: [
      { label: "Seul·e", value: "celib" },
      { label: "En couple", value: "couple" },
      { label: "Pour fonder une famille", value: "fonder" },
      { label: "Avec mes enfants", value: "parents" },
    ],
  },
  {
    id: "job",
    title: "Et le travail ?",
    choices: [
      { label: "Salarié·e", value: "cadre" },
      { label: "J'entreprends", value: "entre" },
      { label: "Télétravail", value: "remote" },
      { label: "Création, culture", value: "crea" },
      { label: "Santé, enseignement", value: "soin" },
    ],
  },
  {
    id: "language",
    title: "Tu es à l'aise en…",
    choices: [
      { label: "Français", value: "fr" },
      { label: "Anglais", value: "en" },
      { label: "Portugais", value: "pt" },
      { label: "Arabe", value: "ar" },
    ],
  },
  {
    id: "size",
    title: "Plutôt une ville qui…",
    choices: [
      { label: "Vibre jour et nuit", value: 3 },
      { label: "Reste à taille humaine", value: 2 },
      { label: "Prend son temps", value: 1 },
    ],
  },
  {
    id: "landscape",
    title: "Le week-end, tu files où ?",
    choices: [
      { label: "À la plage", value: "beach" },
      { label: "En montagne, en forêt", value: "nature" },
      { label: "Dans la savane ou le désert", value: "wildSpaces" },
      { label: "Sur une île", value: "island" },
      { label: "Je reste en ville", value: "urban" },
    ],
  },
  {
    id: "climate",
    title: "Côté météo ?",
    choices: [
      { label: "Chaud toute l'année", value: "hot" },
      { label: "Doux", value: "mild" },
      { label: "Sec et ensoleillé", value: "dry" },
    ],
  },
  {
    id: "priorities",
    title: "Ce qui compte le plus pour toi ?",
    max: 3,
    choices: [
      { label: "Me sentir en sécurité", value: "safety" },
      { label: "Une vie abordable", value: "cost" },
      { label: "La santé et l'école", value: "healthAndSchools" },
      { label: "Ma carrière", value: "career" },
      { label: "Retrouver d'autres repats", value: "diaspora" },
      { label: "La mémoire de la diaspora", value: "memory" },
      { label: "Voyager facilement", value: "flights" },
    ],
  },
];
