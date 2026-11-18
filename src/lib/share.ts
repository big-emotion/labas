import { CITIES } from "./cities";
import type { Locale } from "../i18n/locale";
import { builtPathFor, EN_SITE, FR_ORIGIN, localeOfPath, type Route } from "../i18n/routes";

/** The production address. Links shared on social networks and read by search engines must be absolute. */
export const SITE = FR_ORIGIN;

const PUBLIC_PAGES: Route[] = ["home", "deep", "cities", "method", "legal", "privacy"];

export function absoluteUrl(path: string): string {
  return new URL(path, SITE).href;
}

/**
 * Pages are built as folders, and nginx redirects /ville/dakar to /ville/dakar/: the address
 * with the slash is the one that answers directly, so it is the one search engines are given.
 */
export function canonicalUrl(path: string): string {
  const folder = path.replace(/index\.html$/, "").replace(/\/?$/, "/");
  // English pages are built under /en/; EN_SITE says where they are read (labas.africa/en for now).
  if (localeOfPath(folder) === "en") return `${EN_SITE}${folder.slice("/en".length)}`;
  return absoluteUrl(folder);
}

/** A city page shares its own picture; every other page shares the home picture, in its language. */
export function shareImageFor(path: string): string {
  const english = localeOfPath(path) === "en";
  const city = /^(?:\/en\/city|\/ville)\/([a-z0-9-]+)\/?$/.exec(path)?.[1];
  return absoluteUrl(`/og/${english ? "en/" : ""}${city ?? "home"}.jpg`);
}

/** The quick part's length depends on the reader's project, so no number of questions is promised. */
export function siteDescription(locale: Locale): string {
  return locale === "en"
    ? `Answer a few straight questions and discover which of ${CITIES.length} cities across Africa's 54 countries are most like you.`
    : `Répondez à quelques questions directes et découvrez, parmi ${CITIES.length} villes des 54 pays d'Afrique, celles qui vous ressemblent.`;
}

/** Built paths (English under /en/) of every page search engines should know, in both languages. */
export function sitemapPaths(): string[] {
  return (["fr", "en"] as const).flatMap((locale: Locale) => [
    ...PUBLIC_PAGES.map((route) => builtPathFor(route, locale)),
    ...CITIES.map((city) => builtPathFor("city", locale, city.slug)),
  ]);
}

export function sitemapXml(paths: string[]): string {
  const urls = paths.map((path) => `  <url><loc>${canonicalUrl(path)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function robotsTxt(): string {
  return ["User-agent: *", "Allow: /", "", `Sitemap: ${absoluteUrl("/sitemap.xml")}`, ""].join(
    "\n",
  );
}
