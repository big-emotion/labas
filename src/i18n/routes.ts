import type { Locale } from "./locale";

/**
 * Each public page in both languages. English addresses use English words (operator,
 * 2026-11-18): an English reader and a search engine both read the address. The admin is French
 * only and has no entry here.
 */
export const ROUTES = {
  home: { fr: "/", en: "/" },
  deep: { fr: "/approfondir/", en: "/go-deeper/" },
  result: { fr: "/resultat/", en: "/result/" },
  cities: { fr: "/villes/", en: "/cities/" },
  city: { fr: "/ville/:slug/", en: "/city/:slug/" },
  reviews: { fr: "/avis/", en: "/reviews/" },
  method: { fr: "/methode/", en: "/method/" },
  legal: { fr: "/mentions-legales/", en: "/legal-notice/" },
  privacy: { fr: "/confidentialite/", en: "/privacy/" },
  space: { fr: "/espace/", en: "/my-space/" },
  spaceExpired: { fr: "/espace/lien-expire/", en: "/my-space/link-expired/" },
  newsConfirmed: { fr: "/nouveautes/confirmee/", en: "/news/confirmed/" },
  newsUnsubscribed: { fr: "/nouveautes/desinscription/", en: "/news/unsubscribe/" },
  newsInvalid: { fr: "/nouveautes/lien-invalide/", en: "/news/invalid-link/" },
} as const;

export type Route = keyof typeof ROUTES;

/**
 * English pages are built under /en/. Once overthere.africa points at the same server
 * (docs/deploy.md), PUBLIC_EN_ORIGIN names it: English links then drop the prefix, nginx maps
 * the bare English addresses back to the /en/ folder, and links between languages become
 * absolute because they cross domains.
 */
const EN_ORIGIN = import.meta.env?.PUBLIC_EN_ORIGIN?.trim().replace(/\/$/, "") ?? "";
const BUILT_PREFIX = "/en";

/** The address a reader follows to a page, from a page in the same language. */
export function pathFor(route: Route, locale: Locale, slug = ""): string {
  const path = ROUTES[route][locale].replace(":slug", slug);
  if (locale === "fr") return path;
  return EN_ORIGIN ? path : `${BUILT_PREFIX}${path}`;
}

/** The language of a page, from the path Astro builds it at. */
export function localeOfPath(path: string): Locale {
  return path === BUILT_PREFIX || path.startsWith(`${BUILT_PREFIX}/`) ? "en" : "fr";
}

/** Matches a built path against a route pattern, returning the slug when it fits. */
function matchRoute(pattern: string, path: string): string | undefined {
  const [head, tail = ""] = pattern.split(":slug");
  if (!pattern.includes(":slug")) return pattern === path ? "" : undefined;
  if (!path.startsWith(head) || !path.endsWith(tail)) return undefined;
  const slug = path.slice(head.length, path.length - tail.length);
  return /^[a-z0-9-]+$/.test(slug) ? slug : undefined;
}

/** The path Astro builds the page at: English always under /en/. */
export function builtPathFor(route: Route, locale: Locale, slug = ""): string {
  const path = ROUTES[route][locale].replace(":slug", slug);
  return locale === "en" ? `${BUILT_PREFIX}${path}` : path;
}

/** The built path of the same page in the other language; an unknown page maps to its home. */
export function counterpartBuilt(builtPath: string): string {
  const from = localeOfPath(builtPath);
  const to: Locale = from === "fr" ? "en" : "fr";
  const bare = from === "en" ? builtPath.slice(BUILT_PREFIX.length) || "/" : builtPath;
  const folder = bare.replace(/index\.html$/, "").replace(/\/?$/, "/");
  for (const route of Object.keys(ROUTES) as Route[]) {
    const slug = matchRoute(ROUTES[route][from], folder);
    if (slug !== undefined) return builtPathFor(route, to, slug);
  }
  return builtPathFor("home", to);
}

/**
 * The link to the same page in the other language, for the language switch. Absolute once
 * English has its own domain, since the link then crosses domains.
 */
export function counterpart(builtPath: string): string {
  const target = counterpartBuilt(builtPath);
  if (!EN_ORIGIN) return target;
  return localeOfPath(target) === "en"
    ? `${EN_ORIGIN}${target.slice(BUILT_PREFIX.length)}`
    : `${FR_ORIGIN}${target}`;
}

export const FR_ORIGIN = "https://labas.africa";
/** Where English pages live for readers and search engines. */
export const EN_SITE = EN_ORIGIN || `${FR_ORIGIN}${BUILT_PREFIX}`;
