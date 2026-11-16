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

export function signUpBody(form: Form): Form | null {
  const email = form.email.trim();
  if (!form.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, consent: true, website: form.website };
}

/** « Recevoir par e-mail »: the result link the page already builds, never the answers. */
export function resultsBody(
  form: { email: string; news: boolean; website: string },
  link: string,
): { email: string; link: string; news: boolean; website: string } | null {
  const email = form.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, link, news: form.news, website: form.website };
}

export type Outcome = { sent: true } | { sent: false; message: string };

/** What the reader is told for each answer of the service; 0 is a network failure. */
export function outcomeOf(status: number, form: "news" | "results" | "save" = "news"): Outcome {
  if (status === 202) return { sent: true };
  if (status === 400)
    return {
      sent: false,
      message:
        form === "news"
          ? "Vérifiez votre adresse et cochez la case, puis réessayez."
          : form === "save"
            ? "Vérifiez votre adresse et cochez la case d'accord, puis réessayez."
            : "Vérifiez votre adresse, puis réessayez.",
    };
  if (status === 429)
    return { sent: false, message: "Trop de demandes d'un coup. Réessayez dans une heure." };
  return {
    sent: false,
    message:
      "L'inscription n'est pas partie. Réessayez dans un moment ; si cela continue, écrivez-nous à hello@big-emotion.com.",
  };
}
