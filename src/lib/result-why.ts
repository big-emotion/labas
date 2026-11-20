import { namedOrigins } from "./questions";
import { staysNear, type Reach } from "./reach";
import type { Answers, Match } from "./ranking";
import { INTL_LOCALE, type Bilingual, type Locale } from "../i18n/locale";
import { countryName } from "../i18n/places";

/**
 * The box above the result cards (beta feedback, 2026-11-19: readers were surprised by their top
 * cities and found no explanation without opening a card). It reuses the reasons the ranking
 * already rates for each card, so the box can never say something a card contradicts.
 */
export interface ResultWhy {
  /** What every city on screen has going for it, in the first city's order. */
  shared: string[];
  /** What puts the first city ahead: its own reasons, or its strongest when all are shared. */
  first: string[];
  /** The main thing that weighs against the first city for this reader. */
  toKnow?: string;
  /** What the reader said of their own, and the closeness it gives these cities. */
  yours?: { said: string[]; closer?: string };
}

/**
 * Written as closeness only (operator, 2026-11-20): the box says which cities came nearer and
 * why, never which region stepped back. The faith is a tie, never named: the box stays on a
 * screen someone else may see.
 */
const YOURS: Bilingual<{
  from: Record<string, string>;
  family: (regions: string) => string;
  countries: (names: string) => string;
  near: Record<Exclude<Reach, "anywhere">, string>;
  closer: (faith: boolean) => string;
}> = {
  fr: {
    from: {
      ouest: "d'Afrique de l'Ouest",
      centre: "d'Afrique centrale",
      est: "d'Afrique de l'Est",
      sud: "d'Afrique australe",
      nord: "d'Afrique du Nord",
      ameriques: "des Caraïbes ou des Amériques",
    },
    family: (regions) => `Votre famille vient ${regions}`,
    countries: (names) => `Le pays de votre famille : ${names}`,
    near: {
      country: "Vous aimeriez vivre dans le pays de votre famille",
      region: "Vous aimeriez rester dans la région de votre famille",
      alike: "Vous cherchez une culture proche de la vôtre",
    },
    closer: (faith) =>
      `Nous avons mis en avant les villes qui ont un lien plus étroit avec vos origines${faith ? " et votre religion" : ""}.`,
  },
  en: {
    from: {
      ouest: "West Africa",
      centre: "Central Africa",
      est: "East Africa",
      sud: "Southern Africa",
      nord: "North Africa",
      ameriques: "the Caribbean or the Americas",
    },
    family: (regions) => `Your family comes from ${regions}`,
    countries: (names) => `Your family's country: ${names}`,
    near: {
      country: "You would like to live in your family's country",
      region: "You would like to stay in your family's region",
      alike: "You are looking for a culture close to your own",
    },
    closer: (faith) =>
      `We have put forward the cities with a closer tie to your roots${faith ? " and your faith" : ""}.`,
  },
};

function yoursOf(answers: Answers, locale: Locale): ResultWhy["yours"] {
  const copy = YOURS[locale];
  const origins = namedOrigins(answers);
  if (origins.length === 0) return undefined;
  const list = new Intl.ListFormat(INTL_LOCALE[locale], { type: "conjunction" });
  const said = [copy.family(list.format(origins.map((origin) => copy.from[origin])))];
  const countries = (answers.countries ?? []).filter(Boolean);
  if (countries.length)
    said.push(copy.countries(countries.map((country) => countryName(country, locale)).join(", ")));
  const near = staysNear(answers);
  if (answers.reach && near) said.push(copy.near[answers.reach as Exclude<Reach, "anywhere">]);
  const faith = near && ["muslim", "christian", "other"].includes(answers.faith ?? "");
  return near ? { said, closer: copy.closer(faith) } : { said };
}

const SHOWN = 3;

export function whyTheseCities(
  matches: Match[],
  answers: Answers = {},
  locale: Locale = "fr",
): ResultWhy {
  const [first, ...others] = matches;
  if (!first) return { shared: [], first: [] };
  const own = first.reasons.map((reason) => reason.label);
  const shared = own.filter((label) =>
    others.every((other) => other.reasons.some((reason) => reason.label === label)),
  );
  const distinctive = own.filter((label) => !shared.includes(label));
  const why: ResultWhy = {
    shared: shared.slice(0, SHOWN),
    first: (distinctive.length ? distinctive : own).slice(0, SHOWN),
  };
  const against = first.drawbacks[0]?.label;
  if (against) why.toKnow = against;
  const yours = yoursOf(answers, locale);
  if (yours) why.yours = yours;
  return why;
}
