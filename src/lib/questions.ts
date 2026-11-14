import type { Answers } from "./ranking";

export interface Choice {
  label: string;
  value: string | number;
}

export interface Question {
  id: keyof Answers;
  title: string;
  choices: Choice[];
  /** Several answers allowed, up to this many. */
  max?: number;
}

export const QUESTIONS: Question[] = [
  {
    id: "project",
    title: "Comment vous voyez-vous là-bas ?",
    choices: [
      { label: "M'installer pour de bon", value: "installer" },
      { label: "Un pied là-bas, un pied ici", value: "pied" },
      { label: "Tester quelques mois", value: "tester" },
      { label: "Investir sans y vivre", value: "investir" },
      { label: "D'abord des vacances", value: "decouvrir" },
    ],
  },
  {
    id: "saturday",
    title: "Votre samedi soir idéal ?",
    choices: [
      { label: "Musique jusqu'au matin", value: 1 },
      { label: "Un dîner entre amis", value: 0.5 },
      { label: "Au calme chez moi", value: 0 },
    ],
  },
  {
    id: "budget",
    title: "Votre budget sur place ?",
    choices: [
      { label: "Serré", value: "serre" },
      { label: "Moyen", value: "moyen" },
      { label: "Le prix compte peu", value: "large" },
    ],
  },
  {
    id: "family",
    title: "Côté famille ?",
    choices: [
      { label: "Célibataire", value: "celib" },
      { label: "En couple", value: "couple" },
      { label: "Fonder une famille là-bas", value: "fonder" },
      { label: "Parent, les enfants d'abord", value: "parents" },
    ],
  },
  {
    id: "job",
    title: "Votre travail ?",
    choices: [
      { label: "Salarié ou cadre", value: "cadre" },
      { label: "Entrepreneur", value: "entre" },
      { label: "Télétravail", value: "remote" },
      { label: "Création, culture", value: "crea" },
      { label: "Santé, enseignement", value: "soin" },
    ],
  },
  {
    id: "language",
    title: "Votre langue sur place ?",
    choices: [
      { label: "Français", value: "fr" },
      { label: "Anglais", value: "en" },
      { label: "Portugais", value: "pt" },
      { label: "Arabe", value: "ar" },
    ],
  },
  {
    id: "size",
    title: "Quelle taille de ville ?",
    choices: [
      { label: "Très grande", value: 3 },
      { label: "À taille humaine", value: 2 },
      { label: "Petite et tranquille", value: 1 },
    ],
  },
  {
    id: "landscape",
    title: "Quel paysage autour ?",
    choices: [
      { label: "Océan", value: "beach" },
      { label: "Montagnes, forêts", value: "nature" },
      { label: "Savane, désert", value: "wildSpaces" },
      { label: "La ville me suffit", value: "urban" },
    ],
  },
  {
    id: "climate",
    title: "Quel climat ?",
    choices: [
      { label: "Chaud toute l'année", value: "hot" },
      { label: "Doux", value: "mild" },
      { label: "Sec et ensoleillé", value: "dry" },
    ],
  },
  {
    id: "priorities",
    title: "Sur quoi ne transigez-vous pas ?",
    max: 3,
    choices: [
      { label: "La sécurité", value: "safety" },
      { label: "Le coût de la vie", value: "cost" },
      { label: "La santé et les écoles", value: "healthAndSchools" },
      { label: "La carrière", value: "career" },
      { label: "Une communauté de repats", value: "diaspora" },
      { label: "La mémoire de la diaspora", value: "memory" },
      { label: "Voyager facilement", value: "flights" },
    ],
  },
];
