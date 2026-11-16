import { cleanAnswers } from "./keep";
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
  form: { email: string; consent: boolean; news: boolean; website: string },
  kind: JourneyKind,
  answers: Answers,
) {
  const email = form.email.trim();
  if (!form.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    email,
    consent: true as const,
    news: form.news,
    website: form.website,
    journey: { kind, answers },
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

export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}
