import type { Locale } from "../i18n/locale";

/**
 * Reviews translated on request with DeepL (operator, 2026-11-18): a review is written in one
 * language and read in two. Only the review's text is sent, never its author, journey or answers.
 */
export interface Translation {
  text: string;
  /** The language DeepL read the text in, lower case (« fr », « en », « wo »…). */
  detectedSource: string;
}

export type Translator = (text: string, target: Locale) => Promise<Translation>;

/** British English, as the English pages are written. */
const TARGET_LANG: Record<Locale, string> = { fr: "FR", en: "EN-GB" };

/**
 * A DeepL client. Free keys end in « :fx » and only work on the free endpoint. No source
 * language is sent, so DeepL detects it: a review on the French site may be in English, Wolof…
 */
export function deepl(apiKey: string, fetchImpl: typeof fetch = fetch): Translator {
  const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  return async (text, target) => {
    const response = await fetchImpl(`https://${host}/v2/translate`, {
      method: "POST",
      headers: {
        authorization: `DeepL-Auth-Key ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text: [text], target_lang: TARGET_LANG[target] }),
    });
    if (!response.ok) throw new Error(`DeepL answered ${response.status}`);
    const body = (await response.json()) as {
      translations: { detected_source_language: string; text: string }[];
    };
    const [first] = body.translations;
    return { text: first.text, detectedSource: first.detected_source_language.toLowerCase() };
  };
}
