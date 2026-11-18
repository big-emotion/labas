import { CITIES, type City } from "./cities";
import { SITE } from "./share";
import {
  TRAITS,
  temperamentLinesFor,
  type TemperamentAnswers,
  type TemperamentLine,
} from "./city-temperament";
import type { Answers, Match } from "./ranking";
import { archetypeOf, type Archetype } from "./temperament";
import { BRAND, type Bilingual, type Locale } from "../i18n/locale";
import { EN_SITE, ROUTES } from "../i18n/routes";
import { cityCopy } from "../i18n/city-copy";

/**
 * A result shared by link (beta feedback, 2026-11-16): the reader's temperament and their three
 * cities, in the part of the address after « # », which browsers never send to a server. Only
 * the five temperament answers travel: never origin, family country, faith or a filter, so the
 * person who receives the link learns where the reader fits, not who they are.
 */
export interface SharedPayload {
  temperament: TemperamentAnswers;
  cities: { slug: string; percent: number }[];
}

export interface SharedResult {
  archetype: Archetype | undefined;
  cities: { city: City; percent: number; lines: TemperamentLine[] }[];
}

const LEVELS = [0, 0.5, 1];
const ADVENTURES = ["familiar", "open", "seeking"];

function temperamentOf(answers: Answers): TemperamentAnswers {
  const kept: Record<string, unknown> = {};
  for (const trait of TRAITS) if (answers[trait] !== undefined) kept[trait] = answers[trait];
  return kept as TemperamentAnswers;
}

function encode(payload: SharedPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Each language's result page, absolute: the link opens in the language it was shared in. Both
 * carry the same « #r= » payload, so either page reads either link.
 */
const RESULT_PAGES: Bilingual<string> = {
  fr: `${SITE}${ROUTES.result.fr}`,
  en: `${EN_SITE}${ROUTES.result.en}`,
};
const HOMES: Bilingual<string> = { fr: `${SITE}/`, en: `${EN_SITE}/` };

/** French by default for the server and the tests that build a link without a page. */
export function resultLink(answers: Answers, matches: Match[], locale: Locale = "fr"): string {
  const payload: SharedPayload = {
    temperament: temperamentOf(answers),
    cities: matches.map((m) => ({ slug: m.city.slug, percent: Math.round(m.score * 100) })),
  };
  return `${RESULT_PAGES[locale]}#r=${encode(payload)}`;
}

/** The payload of « #r=… », or null when the link is broken or was edited into nonsense. */
export function readShared(hash: string): SharedPayload | null {
  const raw = /^#r=([A-Za-z0-9_-]+)$/.exec(hash)?.[1];
  if (!raw) return null;
  try {
    const binary = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))),
    );
    const temperament: Record<string, unknown> = {};
    for (const trait of TRAITS) {
      const value = payload?.temperament?.[trait];
      if (value === undefined) continue;
      const valid = trait === "adventure" ? ADVENTURES.includes(value) : LEVELS.includes(value);
      if (!valid) return null;
      temperament[trait] = value;
    }
    const cities = payload?.cities;
    if (!Array.isArray(cities) || cities.length === 0 || cities.length > 5) return null;
    for (const c of cities)
      if (typeof c?.slug !== "string" || !(c.percent >= 0 && c.percent <= 100)) return null;
    return {
      temperament: temperament as TemperamentAnswers,
      cities: cities.map((c) => ({ slug: c.slug, percent: Math.round(c.percent) })),
    };
  } catch {
    return null;
  }
}

/**
 * What the result page shows: the profile and, for each city, why it fits the temperament. French
 * by default: the server stores the French profile name, which reviews are filtered by.
 */
export function sharedResult(payload: SharedPayload, locale: Locale = "fr"): SharedResult | null {
  const cities = payload.cities.map((c) => ({
    city: CITIES.find((city) => city.slug === c.slug),
    percent: c.percent,
  }));
  if (cities.some((c) => !c.city)) return null;
  return {
    archetype: archetypeOf(payload.temperament as Answers, locale),
    cities: cities.map(({ city, percent }) => ({
      city: city!,
      percent,
      lines: temperamentLinesFor(city!.name, payload.temperament, locale),
    })),
  };
}

/**
 * The result behind a link of this site, French or English, or null for anything else (another
 * site, a forged hash). Read in French, as the server keeps it.
 */
export function resultAt(link: unknown, siteUrl: string, enSiteUrl = ""): SharedResult | null {
  // The service's own sites, from its runtime settings: the build-time EN_SITE may differ.
  const pages = [
    `${siteUrl}${ROUTES.result.fr}`,
    `${siteUrl}/en${ROUTES.result.en}`,
    ...(enSiteUrl ? [`${enSiteUrl}${ROUTES.result.en}`] : []),
  ];
  try {
    const url = new URL(String(link));
    if (!pages.includes(`${url.origin}${url.pathname}`)) return null;
    const payload = readShared(url.hash);
    return payload && sharedResult(payload);
  } catch {
    return null;
  }
}

const SHARE_COPY: Bilingual<{
  profile: (name: string, text: string) => string;
  cities: string;
  see: (link: string) => string;
  you: (home: string) => string;
}> = {
  fr: {
    profile: (name, text) => `Mon profil sur ${BRAND.fr} : ${name}. ${text}`,
    cities: "Mes villes d'Afrique :",
    see: (link) => `Voir mon résultat : ${link}`,
    you: (home) => `Et vous, quelle ville d'Afrique vous ressemble ? ${home}`,
  },
  en: {
    profile: (name, text) => `My profile on ${BRAND.en}: ${name}. ${text}`,
    cities: "My cities in Africa:",
    see: (link) => `See my result: ${link}`,
    you: (home) => `And you, which African city is most like you? ${home}`,
  },
};

/** The message that goes with the link: the profile, each city and its why, then the link. */
export function shareText(answers: Answers, matches: Match[], locale: Locale): string {
  const copy = SHARE_COPY[locale];
  const link = resultLink(answers, matches, locale);
  const shared = sharedResult(readShared(new URL(link).hash)!, locale)!;
  const profile = shared.archetype
    ? [copy.profile(shared.archetype.name, shared.archetype.text), ""]
    : [];
  const cities = shared.cities.flatMap((c, i) => [
    `${i + 1}. ${cityCopy(c.city, locale).name} (${cityCopy(c.city, locale).country}) · ${c.percent}\u202f%`,
    // What draws the reader there: the lines that fit.
    ...c.lines
      .filter((line) => !line.weak)
      .slice(0, 2)
      .map((line) => `   ${line.text}`),
  ]);
  return [...profile, copy.cities, ...cities, "", copy.see(link), copy.you(HOMES[locale])].join(
    "\n",
  );
}
