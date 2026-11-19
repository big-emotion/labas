import { CONTACT, type Bilingual, type Locale } from "../i18n/locale";

/**
 * The news sign-up as the page sees it (components/Newsletter.astro). The address goes to the
 * subscribe service (src/server/subscribe.ts), which mails a confirmation link; nothing else from
 * the quiz is ever sent.
 */

/** The quiz block appears after this many answers: early enough to reach readers who stop. */
export const NEWS_AFTER = 4;

export function shouldOfferNews(answered: number, dismissed: boolean): boolean {
  return answered >= NEWS_AFTER && !dismissed;
}

interface Form {
  email: string;
  consent: boolean;
  /** The hidden field only robots fill. */
  website: string;
}

/** The page's language travels with every request that makes the service write an e-mail. */
export function signUpBody(form: Form, locale: Locale): (Form & { locale: Locale }) | null {
  const email = form.email.trim();
  if (!form.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, consent: true, website: form.website, locale };
}

/** « Recevoir par e-mail »: the result link the page already builds, never the answers. */
export function resultsBody(
  form: { email: string; news: boolean; website: string },
  link: string,
  locale: Locale,
): { email: string; link: string; news: boolean; website: string; locale: Locale } | null {
  const email = form.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, link, news: form.news, website: form.website, locale };
}

export type Outcome = { sent: true } | { sent: false; message: string };

const OUTCOMES = {
  fr: {
    news: "Vérifiez votre adresse et cochez la case, puis réessayez.",
    save: "Vérifiez votre adresse et cochez la case d'accord, puis réessayez.",
    results: "Vérifiez votre adresse, puis réessayez.",
    slowDown: "Trop de demandes d'un coup. Réessayez dans une heure.",
    failed:
      "L'inscription n'est pas partie. Réessayez dans un moment ; si cela continue, écrivez-nous à hello@big-emotion.com.",
  },
  en: {
    news: "Check your address and tick the box, then try again.",
    save: "Check your address and tick the consent box, then try again.",
    results: "Check your address, then try again.",
    slowDown: "Too many requests at once. Try again in an hour.",
    failed: `It didn't go through. Try again in a moment; if it keeps happening, write to us at ${CONTACT.en}.`,
  },
} satisfies Bilingual<Record<string, string>>;

/** What the reader is told for each answer of the service; 0 is a network failure. */
export function outcomeOf(
  status: number,
  form: "news" | "results" | "save",
  locale: Locale,
): Outcome {
  const copy = OUTCOMES[locale];
  if (status === 202) return { sent: true };
  if (status === 400) return { sent: false, message: copy[form] };
  if (status === 429) return { sent: false, message: copy.slowDown };
  return { sent: false, message: copy.failed };
}
