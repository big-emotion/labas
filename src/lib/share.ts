import { CITIES } from "./cities";

/** The production address. Links shared on social networks and read by search engines must be absolute. */
export const SITE = "https://labas.africa";

const PUBLIC_PAGES = ["/", "/approfondir/", "/methode/", "/mentions-legales/", "/confidentialite/"];

export function absoluteUrl(path: string): string {
  return new URL(path, SITE).href;
}

/**
 * Pages are built as folders, and nginx redirects /ville/dakar to /ville/dakar/: the address
 * with the slash is the one that answers directly, so it is the one search engines are given.
 */
export function canonicalUrl(path: string): string {
  const folder = path.replace(/index\.html$/, "").replace(/\/?$/, "/");
  return absoluteUrl(folder);
}

/** A city page shares its own picture; every other page shares the home picture. */
export function shareImageFor(path: string): string {
  const city = /^\/ville\/([a-z0-9-]+)\/?$/.exec(path)?.[1];
  return absoluteUrl(`/og/${city ?? "home"}.jpg`);
}

/** The quick part's length depends on the reader's project, so no number of questions is promised. */
export function siteDescription(): string {
  return `Répondez à quelques questions directes et découvrez, parmi ${CITIES.length} villes des 54 pays d'Afrique, celles qui vous ressemblent.`;
}

export function sitemapPaths(): string[] {
  return [...PUBLIC_PAGES, ...CITIES.map((city) => `/ville/${city.slug}/`)];
}

export function sitemapXml(paths: string[]): string {
  const urls = paths.map((path) => `  <url><loc>${absoluteUrl(path)}</loc></url>`).join("\n");
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
