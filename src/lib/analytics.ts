import { QUESTIONS } from "./questions";

/**
 * Cookieless audience measurement on the shared self-hosted Plausible that EthniAfrica and
 * Big Emotion already use (decided 2026-11-14: one anonymous event per answer, no stored
 * profile). Nothing loads unless a site domain is configured, so local builds and previews
 * send nothing.
 */
const DEFAULT_HOST = "https://stats.big-emotion.com";

export function plausibleScriptSrc(config: { domain?: string; host?: string }): string | null {
  if (!config.domain?.trim()) return null;
  const host = (config.host?.trim() || DEFAULT_HOST).replace(/\/+$/, "");
  return `${host}/js/script.js`;
}

// Only the quick-quiz questions are measured. Origin, family country, feeling at home and faith
// are sensitive data (GDPR art. 9) and never leave the browser, nor do the fuller
// questionnaire's filters about health and about laws against homosexuality.
const MEASURED = new Set<string>(QUESTIONS.map((question) => question.id));
const NEVER_SENT = new Set([
  "origin",
  "countries",
  "kin",
  "faith",
  "excludeCriminalising",
  "specialistCare",
]);

export interface AnswerEvent {
  name: "Réponse";
  props: { question: string; answer: string };
}

export function answerEvent(question: string, value: unknown): AnswerEvent | null {
  if (NEVER_SENT.has(question) || !MEASURED.has(question)) return null;
  if (value === undefined || value === null) return null;
  const answer = Array.isArray(value) ? value.map(String).join(",") : String(value);
  if (answer === "") return null;
  return { name: "Réponse", props: { question, answer } };
}
