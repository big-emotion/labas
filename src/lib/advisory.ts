import type { Bilingual, Locale } from "../i18n/locale";
import { INTL_LOCALE } from "../i18n/locale";
import type { Advisory, City } from "./cities";

type Warning = "orange" | "red";

/**
 * Both authorities keep their own name in English: France Diplomatie is the French foreign
 * ministry's travel advice, the FCDO the British one. An English reader still needs to know
 * which country's advice they are reading.
 */
const COPY: Bilingual<{
  france: Record<Warning, string>;
  ministry: string;
  dated: (date: string) => string;
  framing: string;
  zone: Record<NonNullable<Advisory["franceDiplomatie"]>, string>;
  zonePrefix: string;
  noZone: string;
  fcdoLine: Record<NonNullable<Advisory["fcdo"]>, string>;
  adviceDate: (date: string) => string;
  checkFirst: string;
}> = {
  fr: {
    france: {
      orange: "la classe en orange : il la déconseille sauf raison impérative",
      red: "la classe en rouge : il la déconseille formellement",
    },
    ministry: "Le ministère des Affaires étrangères",
    dated: (date) => ` (avis du ${date})`,
    framing:
      "Ces avis sont écrits pour des voyageurs qui ne connaissent pas la ville. Sur place, la situation change d'un quartier à l'autre : demandez à des gens qui y vivent quelles précautions prendre.",
    zone: {
      green: "vert (vigilance normale)",
      yellow: "jaune (vigilance renforcée)",
      orange: "orange (déconseillé sauf raison impérative)",
      red: "rouge (formellement déconseillé)",
    },
    zonePrefix: "France Diplomatie : zone ",
    noZone: "France Diplomatie : couleur de la zone non trouvée.",
    fcdoLine: {
      all: "Le Royaume-Uni déconseille tout voyage.",
      "all-but-essential": "Le Royaume-Uni déconseille tout voyage sauf nécessité.",
      none: "Le Royaume-Uni ne déconseille pas de s'y rendre.",
    },
    adviceDate: (date) => `Avis du ${date}.`,
    checkFirst: "Vérifiez toujours la page du ministère avant de partir.",
  },
  en: {
    france: {
      orange: "rates it orange: it advises against travel unless there is a pressing reason",
      red: "rates it red: it advises against all travel",
    },
    ministry: "The French foreign ministry (France Diplomatie)",
    dated: (date) => ` (advice dated ${date})`,
    framing:
      "This advice is written for travellers who do not know the city. On the ground, things change from one neighbourhood to the next: ask people who live there which precautions to take.",
    zone: {
      green: "green zone (normal care)",
      yellow: "yellow zone (extra care)",
      orange: "orange zone (advised against unless there is a pressing reason)",
      red: "red zone (advised against at all times)",
    },
    zonePrefix: "France Diplomatie: ",
    noZone: "France Diplomatie: zone colour not found.",
    fcdoLine: {
      all: "The UK's FCDO advises against all travel.",
      "all-but-essential": "The UK's FCDO advises against all but essential travel.",
      none: "The UK's FCDO does not advise against going.",
    },
    adviceDate: (date) => `Advice dated ${date}.`,
    checkFirst: "Always check the ministry's page before you go.",
  },
};

/** What travel advice is, said wherever it is shown. */
export const ADVICE_FRAMING: Bilingual<string> = {
  fr: COPY.fr.framing,
  en: COPY.en.framing,
};

function longDate(iso: string, locale: Locale): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * What the authorities say about a city they advise against, as information for the reader.
 * The advice never removes a city (operator, 2026-11-15): it is written for visitors who have
 * never been, while people live, work and come back there; so the note says what it is and
 * sends the reader to people who live there. French by default while the result cards that
 * call it are being translated.
 */
export function advisoryNote(city: City, locale: Locale = "fr"): string | undefined {
  if (!city.advisedAgainst) return undefined;
  const copy = COPY[locale];
  const { franceDiplomatie, fcdo, date } = city.facts.advisory;
  const parts: string[] = [];
  if (franceDiplomatie === "orange" || franceDiplomatie === "red") {
    const when = date ? copy.dated(longDate(date, locale)) : "";
    parts.push(`${copy.ministry} ${copy.france[franceDiplomatie]}${when}.`);
  }
  if (fcdo === "all" || fcdo === "all-but-essential") parts.push(copy.fcdoLine[fcdo]);
  parts.push(copy.framing);
  return parts.join(" ");
}

/** The dated advice line every city page shows, whatever the colour. */
export function advisoryLine(advisory: Advisory, locale: Locale): string {
  const copy = COPY[locale];
  const parts = [
    advisory.franceDiplomatie
      ? `${copy.zonePrefix}${copy.zone[advisory.franceDiplomatie]}.`
      : copy.noZone,
  ];
  if (advisory.fcdo) parts.push(copy.fcdoLine[advisory.fcdo]);
  if (advisory.date) parts.push(copy.adviceDate(longDate(advisory.date, locale)));
  parts.push(copy.checkFirst);
  return parts.join(" ");
}
