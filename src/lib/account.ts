import { cleanAnswers, withoutSensitive } from "./keep";
import { ANSWERS_TO_LIGHT } from "./map";
import { type Answers, bestMatches } from "./ranking";

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

/** « Reprendre plus tard »: nothing leaves without the explicit consent box. */
export function saveBody(
  form: { email: string; consent: boolean; sensitive: boolean; news: boolean; website: string },
  kind: JourneyKind,
  answers: Answers,
) {
  const email = form.email.trim();
  if (!form.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    email,
    consent: true as const,
    sensitive: form.sensitive,
    news: form.news,
    website: form.website,
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
) {
  const email = form.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    email,
    link,
    sensitive: form.sensitive,
    news: form.news,
    website: form.website,
    journey: { kind, answers: form.sensitive ? answers : withoutSensitive(answers) },
  };
}

/** What a journey card shows: its kind, how far it went and, once enough is answered, its cities. */
export function journeySummary(journey: Journey) {
  const answers = cleanAnswers(journey.answers);
  const count = Object.keys(answers).length;
  return {
    title: journey.kind === "deep" ? "Questionnaire complet" : "Quiz rapide",
    answered: `${count} réponse${count > 1 ? "s" : ""}`,
    cities:
      count >= ANSWERS_TO_LIGHT
        ? bestMatches(answers, 3).map((m) => ({
            name: m.city.name,
            percent: Math.round(m.score * 100),
          }))
        : [],
  };
}

/**
 * Every journey resumes in the full questionnaire: it already picks up the answers kept in the
 * browser and asks only what is missing, so a quick quiz left halfway continues there too.
 */
export function resumeHref(id: string): string {
  return `/approfondir/?parcours=${id}`;
}

/** The same page, scrolled to the ranking: where the results e-mail's button lands. */
export function resultsHref(id: string): string {
  return `${resumeHref(id)}#vos-villes`;
}

export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}
