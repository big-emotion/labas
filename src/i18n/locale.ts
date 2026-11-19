/**
 * The site's languages. French is the source: every text is written in French first, then
 * translated (the labas-translate skill). The admin stays French (operator, 2026-11-18).
 */
export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * A text in every language. Typing the English side with the French side's shape makes a
 * missing translation a type error, so `make check` fails before a page ships half-translated.
 */
export type Bilingual<T> = Record<Locale, T>;

/** One name per language, chosen 2026-11-18: « là-bas » is « over there ». */
export const BRAND: Bilingual<string> = { fr: "Là-bas", en: "Over There" };

/** Open Graph and schema.org language tags. */
export const LANGUAGE_TAG: Bilingual<{ html: string; og: string }> = {
  fr: { html: "fr", og: "fr_FR" },
  en: { html: "en", og: "en_GB" },
};

/** The language a page was built in, read in the browser from `<html lang>`. */
export function pageLocale(): Locale {
  return document.documentElement.lang === "en" ? "en" : "fr";
}

/** French sorts and formats numbers its own way; English pages use British English. */
export const INTL_LOCALE: Bilingual<string> = { fr: "fr-FR", en: "en-GB" };

/**
 * Where a reader writes to the team. hello@overthere.africa (operator, 2026-11-18) exists only
 * once the English domain does, so English pages show it only when PUBLIC_EN_ORIGIN is set:
 * before that, a message to it would bounce.
 */
export function contactFor(enOrigin: string): Bilingual<string> {
  return {
    fr: "hello@big-emotion.com",
    en: enOrigin ? "hello@overthere.africa" : "hello@big-emotion.com",
  };
}
export const CONTACT = contactFor(import.meta.env?.PUBLIC_EN_ORIGIN?.trim() ?? "");
