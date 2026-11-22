import { CITIES } from "./cities";
import { DEEP_QUESTIONS } from "./deep-questions";
import type { Answers } from "./ranking";
import { BRAND, type Locale } from "../i18n/locale";

/**
 * The reader's answers kept in their own browser (localStorage), so the full questionnaire
 * starts where the quick quiz stopped (beta feedback, 2026-11-15). Nothing is sent anywhere.
 */
const KEY = "labas.answers";
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function saveAnswers(store: Store | undefined, answers: Answers): void {
  try {
    store?.setItem(KEY, JSON.stringify(answers));
  } catch {
    // Private browsing or blocked storage: the quiz works the same, it just forgets.
  }
}

export function forgetAnswers(store: Store | undefined): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // Nothing kept, nothing to forget.
  }
}

/**
 * The answers kept earlier, keeping only what a question still asks with a choice it still
 * offers: a stale or edited store never reaches the ranking.
 */
export function loadAnswers(store: Store | undefined): Answers {
  let kept: unknown;
  try {
    kept = JSON.parse(store?.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
  return cleanAnswers(kept);
}

/**
 * Only what a question still asks, with a choice it still offers: used for a browser's store and
 * for answers the server receives, so neither a stale store nor a forged request reaches the
 * ranking or the database.
 */
export function cleanAnswers(raw: unknown): Answers {
  if (!raw || typeof raw !== "object") return {};
  const kept = raw as Record<string, unknown>;
  const answers: Record<string, unknown> = {};
  for (const question of DEEP_QUESTIONS) {
    const value = kept[question.id];
    const offered = (v: unknown) => question.choices.some((c) => c.value === v);
    if (question.max && Array.isArray(value)) {
      const valid = value.filter(offered);
      if (valid.length) answers[question.id] = valid;
    } else if (!question.max && value !== undefined && offered(value)) {
      answers[question.id] = value;
    }
  }
  // « Pas pour moi » is a gesture, not a question: its places are checked against the catalogue.
  for (const [id, known] of PLACES_SET_ASIDE) {
    const value = kept[id];
    const valid = Array.isArray(value) ? value.filter((v) => known.has(v)) : [];
    if (valid.length) answers[id] = valid;
  }
  return answers as Answers;
}

const PLACES_SET_ASIDE: [string, Set<unknown>][] = [
  ["avoidCities", new Set(CITIES.map((c) => c.name))],
  ["avoidCountries", new Set(CITIES.map((c) => c.country))],
  ["avoidRegions", new Set(CITIES.map((c) => c.zone))],
];

/**
 * Origin, family country, feeling at home, faith, and the fuller questionnaire's filters about
 * health and about laws against homosexuality: special-category data (GDPR art. 9). Never
 * measured, and kept in Mon espace only with their own box ticked. The places set aside join
 * them: leaving a region out can hint at origin or faith.
 */
export const SENSITIVE_ANSWERS = [
  "origin",
  "countries",
  "reach",
  "acrossSahara",
  "drawnTo",
  "faith",
  "excludeCriminalising",
  "specialistCare",
  "avoidCities",
  "avoidCountries",
  "avoidRegions",
] as const;

export function withoutSensitive(answers: Answers): Answers {
  const kept: Record<string, unknown> = { ...answers };
  for (const id of SENSITIVE_ANSWERS) delete kept[id];
  return kept as Answers;
}

/** The reader's own mail app, the result already written; they choose who receives it. */
export function mailtoFor(text: string, locale: Locale): string {
  const subject = encodeURIComponent(
    locale === "fr" ? `Mes villes d'Afrique sur ${BRAND.fr}` : `My African cities on ${BRAND.en}`,
  );
  return `mailto:?subject=${subject}&body=${encodeURIComponent(text)}`;
}
