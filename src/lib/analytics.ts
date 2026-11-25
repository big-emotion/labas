import type { FeedbackKind } from "./feedback";
import type { TapKind } from "./taps";
import { SENSITIVE_ANSWERS } from "./keep";
import { QUESTIONS } from "./questions";

/**
 * Cookieless audience measurement on the shared self-hosted Plausible that EthniAfrica and
 * Big Emotion already use (decided 2026-11-14: one anonymous event per answer, no stored
 * profile). Nothing loads unless a site domain is configured, so local builds and previews
 * send nothing.
 */
const DEFAULT_HOST = "https://stats.big-emotion.com";

export function plausibleScriptSrc(config: { domain?: string; host?: string }): string | null {
  if (!config.domain?.trim()) return null;
  const host = (config.host?.trim() || DEFAULT_HOST).replace(/\/+$/, "");
  return `${host}/js/script.js`;
}

// Only the quick-quiz questions are measured, and never the sensitive answers (keep.ts).
const MEASURED = new Set<string>(QUESTIONS.map((question) => question.id));
const NEVER_SENT = new Set<string>(SENSITIVE_ANSWERS);

export interface AnswerEvent {
  name: "Réponse";
  props: { parcours: string; etape: string; question: string; answer: string };
}

/**
 * The paths as the dashboard shows them. The questions come in an order that depends on the
 * answers, so each answer carries its path and its rank in it: filtered on a path, the « etape »
 * breakdown shows where its readers stop (operator, 2026-11-16).
 */
const PATHS: Record<string, string> = {
  installer: "S'installer",
  pied: "Un pied ici, un pied là-bas",
  tester: "Tester quelques mois",
  investir: "Investir",
  decouvrir: "Vacances",
};
const pathOf = (project: unknown) =>
  (typeof project === "string" && PATHS[project]) || "Pas encore choisi";

/** Where an answer sits: the reader's project so far, and the question's rank in their path. */
export interface PathStep {
  project?: string;
  step: number;
}

/**
 * The goals to declare in Plausible (Settings → Goals → Custom event): an event whose goal is
 * missing is received but never shown. A minimal funnel, as a beta tester who does audience work
 * suggested (2026-11-15): someone answers, finishes the quick quiz, then the full questionnaire.
 * Where readers stop inside the quiz already shows in the « Réponse » breakdown by question.
 */
export const GOALS = [
  "Réponse",
  "Questionnaire 1 terminé",
  "Questionnaire complet terminé",
  "Réaction : formulaire ouvert",
  "Réaction envoyée",
  "Réactions consultées",
  "Réaction traduite",
  "Partage",
  "Message envoyé",
  "Pas pour moi",
  "Pas pour moi annulé",
  "Réaction rapide",
  "Quiz commencé",
  "Villes depuis l'accueil",
] as const;
export type Goal = (typeof GOALS)[number];

export interface SiteEvent {
  name: Goal;
  props: { parcours: string };
}

/** A result shared on a network (`networks.ts`); « reseau » is a Plausible custom property. */
export interface ShareEvent {
  name: "Partage";
  props: { reseau: string };
}

export function finishedEvent(
  name: "Questionnaire 1 terminé" | "Questionnaire complet terminé",
  project: string | undefined,
): SiteEvent {
  return { name, props: { parcours: pathOf(project) } };
}

export function answerEvent(question: string, value: unknown, at: PathStep): AnswerEvent | null {
  if (NEVER_SENT.has(question) || !MEASURED.has(question)) return null;
  if (value === undefined || value === null) return null;
  const answer = Array.isArray(value) ? value.map(String).join(",") : String(value);
  if (answer === "") return null;
  return {
    name: "Réponse",
    props: {
      parcours: pathOf(question === "project" ? value : at.project),
      etape: String(at.step).padStart(2, "0"),
      question,
      answer,
    },
  };
}

/**
 * Reactions (operator, 2026-11-18): who opens the form, who sends, who goes to read, by place
 * and city. The props « lieu », « ville » and « statut » must be listed in Plausible's custom
 * properties. Never the text, the name or the address.
 */
const PLACES = {
  preview: "Résultat",
  thread: "Fiche ville",
  card: "Carte 2 ou 3",
  row: "Liste des villes",
  everywhere: "Page des avis",
} as const;
export type ReactionPlace = keyof typeof PLACES;

export interface ReactionEvent {
  name:
    | "Réaction : formulaire ouvert"
    | "Réaction envoyée"
    | "Réactions consultées"
    | "Réaction traduite";
  props: { lieu: string; ville: string; statut?: string };
}

export function reactionEvent(
  name: ReactionEvent["name"],
  place: ReactionPlace,
  city: string,
  published?: boolean,
): ReactionEvent {
  const props: ReactionEvent["props"] = { lieu: PLACES[place], ville: city };
  if (published !== undefined) props.statut = published ? "Publiée" : "En attente du lien";
  return { name, props };
}

/**
 * A message from the feedback tab (operator, 2026-11-18): only whether it reviews the site or
 * writes to the team. The prop « type » must be listed in Plausible's custom properties. Never the
 * text, the page or the address.
 */
export interface MessageEvent {
  name: "Message envoyé";
  props: { type: "Avis" | "Message" };
}

export function messageEvent(kind: FeedbackKind): MessageEvent {
  return { name: "Message envoyé", props: { type: kind === "site" ? "Avis" : "Message" } };
}

/**
 * « Pas pour moi » (operator, 2026-11-18): where a reader sets a place aside and at which level.
 * The props « lieu » and « niveau » must be listed in Plausible's custom properties. Never the
 * city, country or region: it is a sensitive answer (keep.ts).
 */
const NOT_FOR_ME_PLACES = {
  quiz: "Questionnaire",
  result: "Résultat",
  deep: "Questionnaire complet",
} as const;
const LEVELS = { city: "Ville", country: "Pays", region: "Région" } as const;
export type NotForMePlace = keyof typeof NOT_FOR_ME_PLACES;
export type SetAsideLevel = keyof typeof LEVELS;

export interface NotForMeEvent {
  name: "Pas pour moi" | "Pas pour moi annulé";
  props: { lieu: string; niveau: string };
}

export function notForMeEvent(
  place: NotForMePlace,
  level: SetAsideLevel,
  undone = false,
): NotForMeEvent {
  return {
    name: undone ? "Pas pour moi annulé" : "Pas pour moi",
    props: { lieu: NOT_FOR_ME_PLACES[place], niveau: LEVELS[level] },
  };
}

/**
 * A one-tap reaction on a city (operator, 2026-11-20): where it was tapped, the city and the
 * answer, or that it was taken back. The props « lieu », « ville » and « avis » must be listed in
 * Plausible's custom properties. The city is public here by the reader's own gesture, like a
 * review's; never an answer of the quiz.
 */
const TAP_PLACES = {
  result: "Résultat",
  city: "Fiche ville",
  cities: "Liste des villes",
} as const;
export type TapPlace = keyof typeof TAP_PLACES;
const TAP_ANSWERS = {
  like: "J'aime",
  suits: "Ça me correspond",
  not: "Ça ne me correspond pas",
} as const;

export interface TapEvent {
  name: "Réaction rapide";
  props: { lieu: string; ville: string; avis: string };
}

export function tapEvent(place: TapPlace, city: string, kind: TapKind | null): TapEvent {
  return {
    name: "Réaction rapide",
    props: { lieu: TAP_PLACES[place], ville: city, avis: kind ? TAP_ANSWERS[kind] : "Retirée" },
  };
}

/**
 * The home screen's two ways in (operator, 2026-11-26, mockup A3): 68 % of visitors left before
 * the first answer, so the screen asks for one tap first and measures which door it opens. No
 * props: the tap carries nothing about the reader.
 */
export interface HomeEvent {
  name: "Quiz commencé" | "Villes depuis l'accueil";
}

export function homeEvent(door: "quiz" | "cities"): HomeEvent {
  return { name: door === "quiz" ? "Quiz commencé" : "Villes depuis l'accueil" };
}
