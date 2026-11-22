import { BRAND, type Bilingual, type Locale } from "../i18n/locale";
import { cityName, countryName } from "../i18n/places";
import { builtPathFor, ROUTES, type Route } from "../i18n/routes";
import type { SharedResult } from "../lib/shared-result";

/**
 * The e-mails the subscribe service sends, as plain text and HTML, in the language of the page
 * the reader asked from. The HTML keeps to inline styles and tables-free blocks that mail clients
 * render; colours are the site's tokens (src/styles/global.css), written out because mail clients
 * ignore CSS variables.
 */
export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Only a message to the team sets it, to the reader who asked for an answer. */
  replyTo?: string;
  /** The reader's language: it picks the sender's name and the team address answers go to. */
  locale?: Locale;
}

/** Anything but « en » reads as French, the site's source language and the default. */
export function readLocale(value: unknown): Locale {
  return value === "en" ? "en" : "fr";
}

/**
 * Where the service's pages live: SITE_URL, and EN_SITE_URL once English has its own domain
 * (overthere.africa, docs/deploy.md); `en` is empty until then, and English stays under /en/.
 */
export interface Sites {
  fr: string;
  en: string;
}

/** The origin a reader of this language uses: links and the session cookie must land there. */
export const originFor = (sites: Sites, locale: Locale) =>
  locale === "en" && sites.en ? sites.en : sites.fr;

/** A page's path on that origin: bare English words on the English domain, /en/… otherwise. */
export const pagePath = (sites: Sites, route: Route, locale: Locale, slug = "") =>
  locale === "en" && sites.en
    ? ROUTES[route].en.replace(":slug", slug)
    : builtPathFor(route, locale, slug);

/** A page of the site in the reader's language, so a link in an e-mail opens the page they asked from. */
export const pageUrl = (sites: Sites, route: Route, locale: Locale, slug = "") =>
  `${originFor(sites, locale)}${pagePath(sites, route, locale, slug)}`;

const SITE_FOOTER: Bilingual<string> = {
  fr: "Là-bas est édité par Big Emotion · labas.africa. Nous ne vendons ni ne prêtons votre adresse.",
  en: `${BRAND.en} is published by Big Emotion · labas.africa. We never sell or lend your address.`,
};

/** French sets a space before a colon, English does not. */
const COLON: Bilingual<string> = { fr: " :", en: ":" };

/** City names and lines come from the repository, but an apostrophe or « & » must still not break the markup. */
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const WORDMARK: Bilingual<string> = {
  fr: 'Là<span style="color:#ffb627">-</span>bas',
  en: 'Over<span style="color:#ffb627"> · </span>There',
};

const page = (inner: string, footer: string, locale: Locale) =>
  `<!doctype html><html lang="${locale}"><body style="margin:0;background:#f1f0ff;font-family:Arial,sans-serif;color:#1d1b3a">
<div style="max-width:560px;margin:24px auto;background:#161a5c;color:#f1f0ff;border-radius:20px;padding:28px">
<p style="margin:0 0 16px;font-family:Georgia,serif;font-weight:900;font-size:32px">${WORDMARK[locale]}</p>
${inner}
</div>
<p style="max-width:560px;margin:0 auto 24px;font-size:13px;color:#4a4870">${escape(footer)}</p>
</body></html>`;

const button = (link: string, label: string) =>
  `<p><a href="${escape(link)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#ffb627;color:#1d1b3a;font-weight:800;text-decoration:none">${escape(label)}</a></p>`;

const CONFIRM_LABEL: Bilingual<string> = {
  fr: "Je confirme mon inscription",
  en: "I confirm my sign-up",
};

const confirmButton = (link: string, locale: Locale, outlined = false) =>
  `<p><a href="${escape(link)}" style="display:inline-block;padding:14px 24px;border-radius:999px;${
    outlined ? "border:2px solid #ffb627;color:#ffb627" : "background:#ffb627;color:#1d1b3a"
  };font-weight:800;text-decoration:none">${CONFIRM_LABEL[locale]}</a></p>`;

const note = (text: string) => `<p style="color:#b4b8ea;font-size:15px">${escape(text)}</p>`;

const CONFIRMATION = {
  fr: {
    subject: "Confirmez votre inscription aux nouveautés de Là-bas",
    hello: "Bonjour,",
    asked:
      "Vous avez demandé à recevoir les nouveautés de Là-bas : nouvelles villes, questionnaire amélioré, un e-mail par mois au plus.",
    openLink: "Pour confirmer, ouvrez ce lien :",
    tapButton: "Pour confirmer, touchez le bouton.",
    notYou: "Vous n'avez rien demandé ? Ignorez ce message : vous ne recevrez rien d'autre.",
    leave: "Pour vous désinscrire plus tard, à tout moment :",
    leaveLink: "se désinscrire",
  },
  en: {
    subject: `Confirm your sign-up to ${BRAND.en} news`,
    hello: "Hello,",
    asked: `You asked to receive ${BRAND.en} news: new cities, a better questionnaire, one email a month at most.`,
    openLink: "To confirm, open this link:",
    tapButton: "To confirm, tap the button.",
    notYou: "Didn't ask for this? Ignore this message: you won't receive anything else.",
    leave: "To unsubscribe later, at any time:",
    leaveLink: "unsubscribe",
  },
} satisfies Bilingual<Record<string, string>>;

export function confirmationEmail(
  to: string,
  link: string,
  leaveLink: string,
  locale: Locale,
): Mail {
  const copy = CONFIRMATION[locale];
  return {
    to,
    locale,
    subject: copy.subject,
    text: `${copy.hello}

${copy.asked}

${copy.openLink}
${link}

${copy.notYou}

${copy.leave}
${leaveLink}

${SITE_FOOTER[locale]}`,
    html: page(
      `<p>${copy.hello}</p>
<p>${escape(copy.asked)} ${copy.tapButton}</p>
${confirmButton(link, locale)}
${note(copy.notYou)}
<p style="color:#b4b8ea;font-size:13px">${escape(copy.leave)} <a href="${escape(leaveLink)}" style="color:#b4b8ea">${copy.leaveLink}</a>.</p>`,
      SITE_FOOTER[locale],
      locale,
    ),
  };
}

const RESULTS = {
  fr: {
    subject: (names: string) => `Vos villes d'Afrique : ${names}`,
    hello: "Bonjour, voici vos résultats, comme vous l'avez demandé.",
    profile: "Votre profil :",
    cities: "Vos villes d'Afrique :",
    seeCity: "Voir la ville",
    seeResults: "Voir mes résultats",
    seeResult: "Revoir mon résultat",
    spaceNote:
      "Ce bouton ouvre votre espace : votre classement complet et pourquoi chaque ville vous correspond. Il marche 7 jours, une seule fois. Ensuite, ouvrez labas.africa et touchez « Mon espace » : un nouveau lien vous sera envoyé.",
    sensitiveNote:
      "Votre origine, votre religion et votre santé ne sont pas gardées, comme vous l'avez choisi : le questionnaire vous les redemandera, et le classement peut changer un peu.",
    notYou:
      "Vous n'avez rien demandé ? Ignorez ce message : sans clic de votre part, tout est effacé sous 7 jours.",
    deeperText: "Pour un classement plus fin, le questionnaire complet :",
    deeperHtml: "Pour un classement plus fin :",
    deeperLink: "le questionnaire complet",
    newsText:
      "Vous avez aussi demandé les nouveautés de Là-bas. Confirmez-le en ouvrant ce lien ; sans cela, vous ne recevrez rien d'autre :",
    newsHtml:
      "Vous avez aussi demandé les nouveautés de Là-bas. Confirmez-le en un clic ; sans cela, vous ne recevrez rien d'autre.",
    footer:
      "Vous recevez cet e-mail parce que vous l'avez demandé sur labas.africa. Il contient votre profil et vos villes, jamais vos autres réponses.",
  },
  en: {
    subject: (names: string) => `Your African cities: ${names}`,
    hello: "Hello, here are your results, as you asked.",
    profile: "Your profile:",
    cities: "Your African cities:",
    seeCity: "See the city",
    seeResults: "See my results",
    seeResult: "See my result again",
    spaceNote: `This button opens your space: your full ranking and why each city suits you. It works for 7 days, once. After that, open ${BRAND.en} and tap "My space": we'll send you a new link.`,
    sensitiveNote:
      "Your origin, your faith and your health are not kept, as you chose: the questionnaire will ask again, and the ranking may change a little.",
    notYou:
      "Didn't ask for this? Ignore this message: unless you click, everything is erased within 7 days.",
    deeperText: "For a finer ranking, the full questionnaire:",
    deeperHtml: "For a finer ranking:",
    deeperLink: "the full questionnaire",
    newsText: `You also asked for ${BRAND.en} news. Confirm it by opening this link; without that, you won't receive anything else:`,
    newsHtml: `You also asked for ${BRAND.en} news. Confirm it in one click; without that, you won't receive anything else.`,
    footer:
      "You're receiving this email because you asked for it on labas.africa. It holds your profile and your cities, never your other answers.",
  },
} satisfies Bilingual<Record<string, unknown>>;

/**
 * The reader's result, sent once at their request (approved mockup, 2026-11-16): profile, three
 * cities with their percentage and why they fit. Never the answers. With the news box ticked, the
 * same e-mail carries the confirmation link instead of a second one.
 *
 * With `space` (operator, 2026-11-17) the button is a login link instead of the shared result:
 * the e-mail stays short, and the full ranking with its reasons waits in Mon espace.
 *
 * In English the city and country names are translated; the profile and the « why » lines are
 * the ones `resultAt` reads, in whatever language it writes them.
 */
export function resultsEmail(
  to: string,
  result: SharedResult,
  links: {
    resultLink: string;
    sites: Sites;
    confirmLink?: string;
    space?: { link: string; sensitiveLeftOut: boolean };
  },
  locale: Locale,
): Mail {
  const { resultLink, sites, confirmLink, space } = links;
  const copy = RESULTS[locale];
  const cities = result.cities.map((c) => ({
    percent: c.percent,
    name: cityName(c.city.name, locale),
    country: countryName(c.city.country, locale),
    page: pageUrl(sites, "city", locale, c.city.slug),
    fits: c.lines.filter((line) => !line.weak).slice(0, 2),
  }));
  const deeper = pageUrl(sites, "deep", locale);
  const profileText = result.archetype
    ? [`${copy.profile} ${result.archetype.name}. ${result.archetype.text}`, ""]
    : [];
  const citiesText = cities.flatMap((c, i) => [
    `${i + 1}. ${c.name} (${c.country}) · ${c.percent} %`,
    ...c.fits.map((line) => `   ${line.text}`),
    `   ${c.page}`,
  ]);
  const confirmText = confirmLink ? ["", copy.newsText, confirmLink] : [];
  const buttonLink = space ? space.link : resultLink;
  const buttonLabel = space ? copy.seeResults : copy.seeResult;
  const spaceNotes = space
    ? [copy.spaceNote, ...(space.sensitiveLeftOut ? [copy.sensitiveNote] : []), copy.notYou]
    : [];
  const footer = `${copy.footer} ${SITE_FOOTER[locale]}`;

  const citiesHtml = cities
    .map(
      (
        c,
        i,
      ) => `<div style="margin:0 0 10px;padding:14px 16px;border-radius:18px;background:#0e1145;border:${
        i === 0 ? "2px solid #ffb627" : "1px solid #262c86"
      }">
<p style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:700">${i + 1}. ${escape(c.name)} <span style="font-family:Arial,sans-serif;font-weight:400;font-size:15px;color:#b4b8ea">${escape(c.country)}</span> <span style="float:right;color:#ffb627">${c.percent} %</span></p>
${c.fits.map((line) => `<p style="margin:4px 0 0;font-size:15px;color:#b4b8ea">${escape(line.text)}</p>`).join("")}
<p style="margin:6px 0 0"><a href="${escape(c.page)}" style="color:#ffb627;font-weight:700">${copy.seeCity}</a></p>
</div>`,
    )
    .join("\n");

  return {
    to,
    locale,
    subject: copy.subject(cities.map((c) => c.name).join(", ")),
    text: [
      copy.hello,
      "",
      ...profileText,
      copy.cities,
      ...citiesText,
      "",
      `${buttonLabel}${COLON[locale]} ${buttonLink}`,
      ...spaceNotes,
      `${copy.deeperText} ${deeper}`,
      ...confirmText,
      "",
      footer,
    ].join("\n"),
    html: page(
      `<p>${escape(copy.hello)}</p>
${
  result.archetype
    ? `<p style="color:#b4b8ea;font-size:15px">${copy.profile} <b style="color:#ffb627">${escape(result.archetype.name)}</b>. ${escape(result.archetype.text)}</p>`
    : ""
}
${citiesHtml}
${button(buttonLink, buttonLabel)}
${spaceNotes.map(note).join("\n")}
<p style="font-size:15px">${copy.deeperHtml} <a href="${escape(deeper)}" style="color:#ffb627">${copy.deeperLink}</a>.</p>
${
  confirmLink
    ? `<div style="margin-top:12px;padding:16px;border-radius:14px;border:1px dashed #b4b8ea">
<p style="margin:0">${escape(copy.newsHtml)}</p>
${confirmButton(confirmLink, locale, true)}
</div>`
    : ""
}`,
      footer,
      locale,
    ),
  };
}

const SAVE_LINK = {
  fr: {
    subject: "Votre lien pour reprendre sur Là-bas",
    saved: "Bonjour, votre parcours est enregistré.",
    openLink:
      "Pour le reprendre là où vous en étiez, sur n'importe quel appareil, ouvrez ce lien :",
    tapButton:
      "Touchez le bouton pour le reprendre là où vous en étiez, sur n'importe quel appareil.",
    button: "Reprendre mon parcours",
    lifetime:
      "Ce lien marche pendant 24 heures. Ensuite, ouvrez labas.africa et touchez « Mon espace » : un nouveau lien vous sera envoyé.",
    notYou:
      "Vous n'avez rien demandé ? Ignorez ce message : sans clic de votre part, ce parcours est effacé sous 7 jours.",
  },
  en: {
    subject: `Your link to pick up where you left off on ${BRAND.en}`,
    saved: "Hello, your journey is saved.",
    openLink: "To pick it up where you left off, on any device, open this link:",
    tapButton: "Tap the button to pick it up where you left off, on any device.",
    button: "Pick up my journey",
    lifetime: `This link works for 24 hours. After that, open ${BRAND.en} and tap "My space": we'll send you a new link.`,
    notYou:
      "Didn't ask for this? Ignore this message: unless you click, this journey is erased within 7 days.",
  },
} satisfies Bilingual<Record<string, string>>;

/** After « Reprendre plus tard »: the journey waits, unconfirmed, until this link is opened. */
export function saveLinkEmail(to: string, link: string, locale: Locale): Mail {
  const copy = SAVE_LINK[locale];
  return {
    to,
    locale,
    subject: copy.subject,
    text: `${copy.saved} ${copy.openLink}
${link}

${copy.lifetime}

${copy.notYou}

${SITE_FOOTER[locale]}`,
    html: page(
      `<p>${escape(copy.saved)} ${escape(copy.tapButton)}</p>
${button(link, copy.button)}
${note(copy.lifetime)}
${note(copy.notYou)}`,
      SITE_FOOTER[locale],
      locale,
    ),
  };
}

const LOGIN_LINK = {
  fr: {
    subject: "Votre lien de connexion à Là-bas",
    here: "Bonjour, voici votre lien pour ouvrir Mon espace sur Là-bas",
    button: "Ouvrir Mon espace",
    lifetime:
      "Il marche 15 minutes, une seule fois. Vous n'avez rien demandé ? Ignorez ce message : personne ne peut se connecter sans ce lien.",
  },
  en: {
    subject: `Your sign-in link for ${BRAND.en}`,
    here: `Hello, here is your link to open My space on ${BRAND.en}`,
    button: "Open My space",
    lifetime:
      "It works for 15 minutes, once. Didn't ask for this? Ignore this message: nobody can sign in without this link.",
  },
} satisfies Bilingual<Record<string, string>>;

/** From « Mon espace »: a short-lived, single-use link instead of a password. */
export function loginLinkEmail(to: string, link: string, locale: Locale): Mail {
  const copy = LOGIN_LINK[locale];
  return {
    to,
    locale,
    subject: copy.subject,
    text: `${copy.here}${COLON[locale]}
${link}

${copy.lifetime}

${SITE_FOOTER[locale]}`,
    html: page(
      `<p>${escape(copy.here)}.</p>
${button(link, copy.button)}
${note(copy.lifetime)}`,
      SITE_FOOTER[locale],
      locale,
    ),
  };
}

const REACTION_LINK = {
  fr: {
    subject: (city: string) => `Publiez votre réaction sur ${city}`,
    thanks: (city: string) => `Bonjour, merci pour votre réaction sur ${city}.`,
    openLink: "Pour la mettre en ligne, ouvrez ce lien :",
    tapButton: "Touchez le bouton pour la mettre en ligne.",
    button: "Publier ma réaction",
    confirms:
      "Ce lien confirme aussi votre adresse : vos prochaines réactions seront publiées tout de suite. Il marche 7 jours, une seule fois.",
    notYou:
      "Vous n'avez rien écrit ? Ignorez ce message : sans clic de votre part, cette réaction est effacée sous 7 jours.",
  },
  en: {
    subject: (city: string) => `Publish your reaction to ${city}`,
    thanks: (city: string) => `Hello, thank you for your reaction to ${city}.`,
    openLink: "To put it online, open this link:",
    tapButton: "Tap the button to put it online.",
    button: "Publish my reaction",
    confirms:
      "This link also confirms your address: your next reactions will go online straight away. It works for 7 days, once.",
    notYou:
      "Didn't write anything? Ignore this message: unless you click, this reaction is erased within 7 days.",
  },
} satisfies Bilingual<Record<string, unknown>>;

/**
 * After a reaction written while signed out: it waits, unpublished, until this link is opened.
 * `city` is already named in the reader's language.
 */
export function reactionLinkEmail(to: string, link: string, city: string, locale: Locale): Mail {
  const copy = REACTION_LINK[locale];
  return {
    to,
    locale,
    subject: copy.subject(city),
    text: `${copy.thanks(city)} ${copy.openLink}
${link}

${copy.confirms}

${copy.notYou}

${SITE_FOOTER[locale]}`,
    html: page(
      `<p>${escape(copy.thanks(city))} ${escape(copy.tapButton)}</p>
${button(link, copy.button)}
${note(copy.confirms)}
${note(copy.notYou)}`,
      SITE_FOOTER[locale],
      locale,
    ),
  };
}

/**
 * A message from the feedback tab, to the team only, so in French like the admin. Its text is
 * typed by a visitor, so it is escaped and never reaches anyone but the team's own mailbox.
 */
export function teamMessageEmail(
  to: string,
  message: { kind: "site" | "message"; text: string; page: string | null; email: string | null },
): Mail {
  const subject = message.kind === "site" ? "Avis sur le site" : "Nouveau message";
  const details = [
    `Page : ${message.page ?? "inconnue"}`,
    message.email
      ? `Pour répondre : ${message.email} (répondre à cet e-mail lui écrit)`
      : "Pas d'adresse : la personne n'attend pas de réponse.",
  ];
  return {
    to,
    subject: `Là-bas · ${subject}`,
    ...(message.email ? { replyTo: message.email } : {}),
    text: [
      `${subject} reçu depuis l'onglet « Votre avis » :`,
      "",
      message.text,
      "",
      ...details,
    ].join("\n"),
    html: page(
      `<p>${subject} reçu depuis l'onglet « Votre avis » :</p>
<p style="white-space:pre-wrap;padding:14px 16px;border-radius:14px;background:#0e1145">${escape(message.text)}</p>
${details.map(note).join("\n")}`,
      "Gardé 1 an, puis effacé. À lire aussi dans /admin.",
      "fr",
    ),
  };
}

/**
 * A review left without an address waits for the operator (operator, 2026-11-22): the team hears
 * of it at once rather than finding it in /admin days later. The reader is never written to.
 */
export function reviewToReadEmail(
  to: string,
  review: { city: string; text: string; name: string | null; adminUrl: string },
): Mail {
  const subject = `Un avis sur ${review.city} attend votre relecture`;
  const signed = `Signé : ${review.name ?? "pas de nom, « Utilisateur » et un numéro"}`;
  return {
    to,
    subject: `Là-bas · ${subject}`,
    text: [
      `${subject} :`,
      "",
      review.text,
      "",
      signed,
      `Publier ou supprimer : ${review.adminUrl}`,
    ].join("\n"),
    html: page(
      `<p>${escape(subject)} :</p>
<p style="white-space:pre-wrap;padding:14px 16px;border-radius:14px;background:#0e1145">${escape(review.text)}</p>
${note(signed)}
${button(review.adminUrl, "Publier ou supprimer")}`,
      "Rien n'est en ligne avant que vous ne publiiez.",
      "fr",
    ),
  };
}
