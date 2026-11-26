import { INTL_LOCALE, type Bilingual, type Locale } from "../i18n/locale";
import { cityName } from "../i18n/places";
import { pathFor } from "../i18n/routes";
import { cleanAnswers, withoutSensitive } from "./keep";
import { ANSWERS_TO_LIGHT } from "./map";
import { type Answers, bestMatches, TOP_THREE } from "./ranking";

/**
 * Saved journeys and « Mon espace » as the pages see them (approved mockup, 2026-11-16). The
 * server side is src/server/accounts.ts; the reasons are in docs/accounts.md.
 */

export type JourneyKind = "quick" | "deep";

export interface Journey {
  id: string;
  kind: JourneyKind;
  answers: unknown;
  updatedAt?: string;
}

/**
 * The quick quiz asks for an e-mail once, with one button (operator, 2026-11-26, mockup E3: few
 * readers gave theirs when two blocks asked). It waits for the fourth answer, early enough to
 * reach readers who stop, and goes when the quiz ends (`answered` is 0 then).
 */
export const SAVE_AFTER = 4;

export function offersSaving(answered: number): boolean {
  return answered >= SAVE_AFTER;
}

/** « Reprendre plus tard »: nothing leaves without the explicit consent box. */
export function saveBody(
  form: { email: string; consent: boolean; sensitive: boolean; news: boolean; website: string },
  kind: JourneyKind,
  answers: Answers,
  locale: Locale,
) {
  const email = form.email.trim();
  if (!form.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    email,
    consent: true as const,
    sensitive: form.sensitive,
    news: form.news,
    website: form.website,
    locale,
    journey: { kind, answers: form.sensitive ? answers : withoutSensitive(answers) },
  };
}

/** « Reprendre plus tard » for a signed-in reader: no address, the same separate box. */
export function memberJourneyBody(kind: JourneyKind, answers: Answers, sensitive: boolean) {
  return { kind, sensitive, answers: sensitive ? answers : withoutSensitive(answers) };
}

/**
 * « Recevoir par e-mail » (operator, 2026-11-17): the result link for the e-mail, and the journey
 * for Mon espace. The sensitive answers stay in the browser unless their own box is ticked.
 */
export function resultsMailBody(
  form: { email: string; sensitive: boolean; news: boolean; website: string },
  kind: JourneyKind,
  answers: Answers,
  link: string,
  locale: Locale,
) {
  const email = form.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    email,
    link,
    sensitive: form.sensitive,
    news: form.news,
    website: form.website,
    locale,
    journey: { kind, answers: form.sensitive ? answers : withoutSensitive(answers) },
  };
}

const SUMMARY = {
  fr: {
    quick: "Quiz rapide",
    deep: "Questionnaire complet",
    answered: (count: number) => `${count} réponse${count > 1 ? "s" : ""}`,
  },
  en: {
    quick: "Quick quiz",
    deep: "Full questionnaire",
    answered: (count: number) => `${count} answer${count === 1 ? "" : "s"}`,
  },
} satisfies Bilingual<unknown>;

/** What a journey card shows: its kind, how far it went and, once enough is answered, its cities. */
export function journeySummary(journey: Journey, locale: Locale) {
  const copy = SUMMARY[locale];
  const answers = cleanAnswers(journey.answers);
  const count = Object.keys(answers).length;
  return {
    title: journey.kind === "deep" ? copy.deep : copy.quick,
    answered: copy.answered(count),
    cities:
      count >= ANSWERS_TO_LIGHT
        ? bestMatches(answers, TOP_THREE).map((m) => ({
            name: cityName(m.city.name, locale),
            percent: Math.round(m.score * 100),
          }))
        : [],
  };
}

/**
 * Every journey resumes in the full questionnaire: it already picks up the answers kept in the
 * browser and asks only what is missing, so a quick quiz left halfway continues there too.
 */
export function resumeHref(id: string, locale: Locale): string {
  return `${pathFor("deep", locale)}?parcours=${id}`;
}

/** The same page, scrolled to the ranking: where the results e-mail's button lands. */
export function resultsHref(id: string, locale: Locale): string {
  return `${resumeHref(id, locale)}#vos-villes`;
}

export function dateLabel(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}
