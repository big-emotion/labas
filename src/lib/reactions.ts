import { INTL_LOCALE, type Bilingual, type Locale } from "../i18n/locale";
import { cityName } from "../i18n/places";
import { archetypeWords, traitWords } from "./temperament";

/** The words around a reaction (components/Reactions.astro), kept apart so they can be tested. */

export interface TopCity {
  slug: string;
  name: string;
  percent: number;
}

/** The archetype and its five traits, as the temperament chapter computes them (temperament.ts). */
export interface Profile {
  name: string;
  traits: { name: string; range: string; value: number }[];
}

/**
 * The few marks a reader can leave on a review (operator, 2026-11-18): the heart first and
 * foremost, then four friendly ones. No thumbs down: disagreeing is what a reply is for.
 */
export const MARKS = [
  { key: "coeur", emoji: "❤️", label: { fr: "J'aime", en: "Like" } },
  { key: "bravo", emoji: "👍", label: { fr: "Bien vu", en: "Spot on" } },
  { key: "merci", emoji: "🙏", label: { fr: "Merci", en: "Thank you" } },
  { key: "rire", emoji: "😂", label: { fr: "Ça me fait rire", en: "Made me laugh" } },
  { key: "utile", emoji: "💡", label: { fr: "Utile", en: "Useful" } },
] as const satisfies readonly { key: string; emoji: string; label: Bilingual<string> }[];
export type MarkKey = (typeof MARKS)[number]["key"];

export interface Reaction {
  id: string;
  /** The city slug: the reviews of every city share one list on /avis. */
  city: string;
  name: string;
  text: string;
  top: TopCity[] | null;
  profile: Profile | null;
  createdAt: string;
  mine: boolean;
  marks: Partial<Record<MarkKey, number>>;
  myMarks: MarkKey[];
  /** On a reply to a reply only: who it answers, since the thread keeps two levels. */
  mention: string | null;
  /** On a review only, oldest first. */
  replies?: Reaction[];
}

const DAY = 24 * 60 * 60 * 1000;

const DATES = {
  fr: {
    today: "aujourd'hui",
    yesterday: "hier",
    daysAgo: (days: number) => `il y a ${days} jours`,
    on: (date: string) => `le ${date}`,
  },
  en: {
    today: "today",
    yesterday: "yesterday",
    daysAgo: (days: number) => `${days} days ago`,
    on: (date: string) => `on ${date}`,
  },
} satisfies Bilingual<unknown>;

/** Recent reactions read like a conversation; older ones carry their date. */
export function reactionDate(iso: string, now: number, locale: Locale): string {
  const copy = DATES[locale];
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  if (days < 1) return copy.today;
  if (days === 1) return copy.yesterday;
  if (days < 7) return copy.daysAgo(days);
  const date = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
  return copy.on(date);
}

export function reactionCount(total: number, locale: Locale): string {
  if (locale === "en") {
    if (total === 0) return "No reactions yet";
    return `${total} ${total === 1 ? "reaction" : "reactions"}`;
  }
  if (total === 0) return "Aucune réaction pour l'instant";
  return `${total} ${total > 1 ? "réactions" : "réaction"}`;
}

export function initialOf(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase("fr-FR") || "?";
}

/** « d'Abidjan », « de Dakar ». A city starting with « H » keeps « de »: most are aspirated. */
export function ofCity(name: string): string {
  return /^[AEIOUYÂÉÈÊÎÔÛ]/i.test(name) ? `d'${name}` : `de ${name}`;
}

/**
 * The server names a reader who gave no name « Utilisateur 1234 », stored and served in French
 * (accounts.ts); an English page shows « User 1234 ». The number stays, so it is the same person.
 */
export function shownName(name: string, locale: Locale): string {
  return locale === "en" ? name.replace(/^Utilisateur (\d{4})$/, "User $1") : name;
}

export function temperamentName(name: string, locale: Locale): string {
  return archetypeWords(name, locale)?.name ?? name;
}

/** An archetype's one-line portrait; `text` is the French one from temperament.ts. */
export function temperamentText(name: string, text: string, locale: Locale): string {
  return locale === "fr" ? text : (archetypeWords(name, locale)?.text ?? text);
}

/** A stored profile in the page's language: the values never change, only their names. */
export function profileIn(profile: Profile, locale: Locale): Profile {
  if (locale === "fr") return profile;
  return {
    name: temperamentName(profile.name, locale),
    traits: profile.traits.map((trait, i) => ({
      ...trait,
      name: traitWords(locale).names[i] ?? trait.name,
      range: traitWords(locale).ranges[i] ?? trait.range,
    })),
  };
}

const SUMMARY = {
  fr: {
    leads: (city: string) => `${city} en tête`,
    temperament: (name: string) => `tempérament ${name}`,
    more: (others: number) => `+${others} ${others > 1 ? "villes" : "ville"}`,
    label: (parts: string) => `Son parcours : ${parts}. Voir le détail`,
  },
  en: {
    leads: (city: string) => `${city} first`,
    temperament: (name: string) => `${name} temperament`,
    more: (others: number) => `+${others} ${others === 1 ? "city" : "cities"}`,
    label: (parts: string) => `Their journey: ${parts}. See the detail`,
  },
} satisfies Bilingual<unknown>;

/**
 * The line under a reaction (operator's pick, 2026-11-18): the first city and the temperament at
 * a glance, the detail one tap away, so the journey never outweighs the text.
 */
export function journeySummary(top: TopCity[] | null, profile: Profile | null, locale: Locale) {
  const copy = SUMMARY[locale];
  const leader = top?.[0] ? cityName(top[0].name, locale) : null;
  const temperament = profile ? temperamentName(profile.name, locale) : null;
  const others = top ? top.length - 1 : 0;
  const parts = [
    leader ? copy.leads(leader) : null,
    temperament ? copy.temperament(temperament) : null,
  ].filter(Boolean);
  return {
    first: leader ? `${leader} ${top![0].percent}\u202f%` : null,
    temperament,
    more: others > 0 ? copy.more(others) : null,
    label: copy.label(parts.join(", ")),
  };
}

/** « avis » is invariable: the count reads the same for one or twelve. */
export function reviewsFound(found: number, total: number, locale: Locale): string {
  if (locale === "en") {
    const reviews = (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`;
    if (total === 0) return "No reviews yet";
    if (found === total) return reviews(total);
    if (found === 0) return `None of the ${reviews(total)} matches`;
    return `${found} of ${reviews(total)}`;
  }
  if (total === 0) return "Aucun avis pour l'instant";
  if (found === total) return `${total} avis`;
  if (found === 0) return `Aucun avis sur ${total} ne correspond`;
  return `${found} avis sur ${total}`;
}

/** The reply button carries the count, so a thread shows it has answers before it opens. */
export function replyCount(total: number, locale: Locale): string {
  if (locale === "en") {
    if (total === 0) return "Reply";
    return `${total} ${total === 1 ? "reply" : "replies"}`;
  }
  if (total === 0) return "Répondre";
  return `${total} ${total > 1 ? "réponses" : "réponse"}`;
}

export function markLabel(key: MarkKey, count: number, mine: boolean, locale: Locale): string {
  const label = MARKS.find((m) => m.key === key)!.label[locale];
  if (count === 0) return label;
  if (locale === "en") {
    const people = `${count} ${count === 1 ? "person" : "people"}`;
    return `${label}, ${people}${mine ? ", including you" : ""}`;
  }
  const people = `${count} ${count > 1 ? "personnes" : "personne"}`;
  return `${label}, ${people}${mine ? ", dont vous" : ""}`;
}

/**
 * What a translated review says above its text. `detectedSource` is DeepL's guess of the
 * original's language; when it is already the page's, there was nothing to translate.
 */
export function translationNote(detectedSource: string, locale: Locale): string {
  const same = detectedSource.slice(0, 2).toLowerCase() === locale;
  if (locale === "en") return same ? "Already in English" : "Translated by DeepL";
  return same ? "Déjà en français" : "Traduit par DeepL";
}
