import type { Answers, Priority } from "./ranking";

/**
 * Prototype of the free-text entry (docs/prompt-mode.md, option A): French patterns turn a
 * reader's own words into the quiz's answers, entirely in the browser. The page shows what was
 * understood so the reader can correct it; nothing is guessed silently.
 *
 * Deliberately never read from text: the LGBT filter and the health need (architecture §2.1:
 * opt-in only, never inferred).
 */
export interface Understood {
  question: keyof Answers;
  phrase: string;
}

type Rule<V> = { pattern: RegExp; value: V; negatable?: boolean };

// Within each list the first rule that matches wins, so specific wording comes first.
const PROJECT: Rule<NonNullable<Answers["project"]>>[] = [
  { pattern: /un pied (ici|là-bas|en france)|entre la france et/, value: "pied" },
  { pattern: /tester|essayer|quelques mois/, value: "tester" },
  { pattern: /investir|sans y vivre/, value: "investir" },
  { pattern: /vacances|visiter|découvrir d'abord/, value: "decouvrir" },
  {
    pattern: /pour de bon|m'installer|rentrer au pays|retour au pays|définitivement/,
    value: "installer",
  },
];

const FAMILY: Rule<NonNullable<Answers["family"]>>[] = [
  { pattern: /enfants?|mes fils|ma fille|nos filles/, value: "parents", negatable: true },
  { pattern: /fonder une famille|avoir des enfants|un bébé/, value: "fonder" },
  {
    pattern:
      /en couple|\bcouple\b|mon mari|ma femme|mon conjoint|ma conjointe|mon compagnon|ma compagne/,
    value: "couple",
  },
  { pattern: /\bseule?\b|célibataire/, value: "celib" },
];

const JOB: Rule<NonNullable<Answers["job"]>>[] = [
  { pattern: /télétravail|à distance|en remote|full remote/, value: "remote" },
  {
    pattern:
      /créer (mon|une|ma) (entreprise|boîte|activité)|entreprendre|j'entreprends|entrepreneur|entrepreneuse|lancer (mon|ma|une) (business|activité|boîte)/,
    value: "entre",
  },
  { pattern: /infirmi|médecin|soignant|sage-femme|enseignant|professeur|prof\b/, value: "soin" },
  { pattern: /artiste|musicien|créatrice|créateur|cinéma|photograph|culture/, value: "crea" },
  { pattern: /salarié|en cdi|employé|cadre|un poste/, value: "cadre" },
];

const BUDGET: Rule<NonNullable<Answers["budget"]>>[] = [
  { pattern: /pas (trop )?cher|petit budget|budget serré|serré/, value: "serre" },
  { pattern: /le prix compte peu|budget confortable|les moyens/, value: "large" },
  { pattern: /budget moyen/, value: "moyen" },
];

const LANGUAGE: Rule<NonNullable<Answers["languages"]>[number]>[] = [
  { pattern: /français|francophone/, value: "fr" },
  { pattern: /anglais|anglophone/, value: "en" },
  { pattern: /portugais|lusophone/, value: "pt" },
  { pattern: /arabe|arabophone/, value: "ar" },
];

const LANDSCAPE: Rule<NonNullable<Answers["landscapes"]>[number]>[] = [
  { pattern: /plage|la mer\b|océan|bord de mer/, value: "beach" },
  { pattern: /montagne|forêt|randonn/, value: "nature" },
  { pattern: /savane|désert|safari/, value: "wildSpaces" },
  { pattern: /rester en ville|en ville le week-end/, value: "urban" },
];

const CLIMATE: Rule<NonNullable<Answers["climate"]>>[] = [
  { pattern: /pas trop chaud|doux|tempéré/, value: "mild" },
  { pattern: /chaud toute l'année|la chaleur/, value: "hot" },
  { pattern: /\bsec\b|ensoleillé/, value: "dry" },
];

const SATURDAY: Rule<NonNullable<Answers["saturday"]>>[] = [
  { pattern: /danser|faire la fête|en boîte|sortir le soir/, value: 1 },
  { pattern: /dîner|resto|entre amis/, value: 0.5 },
  { pattern: /tranquille chez moi|casanier|casanière|chez moi le soir/, value: 0 },
];

const SIZE: Rule<NonNullable<Answers["size"]>>[] = [
  { pattern: /ville qui bouge|ça bouge|grande ville|métropole|animée/, value: 3 },
  { pattern: /taille humaine|ville moyenne/, value: 2 },
  { pattern: /petite ville|ville calme|au calme|prend son temps/, value: 1 },
];

const PRIORITIES: Rule<Priority>[] = [
  { pattern: /sécurité|\bsûre?\b|en sécurité/, value: "safety" },
  { pattern: /vie abordable|coût de la vie/, value: "cost" },
  { pattern: /école|scolari|lycée|santé|hôpital/, value: "healthAndSchools" },
  { pattern: /carrière|évoluer professionnellement/, value: "career" },
  { pattern: /repats|autres repats|la diaspora/, value: "diaspora" },
  { pattern: /mémoire|histoire|racines|ancêtres/, value: "memory" },
  { pattern: /voyager|des vols|aéroport/, value: "flights" },
];

const NEGATION = /(sans|pas d'|pas de|aucun|aucune)\s*$/;

function find<V>(text: string, rules: Rule<V>[]): { value: V; phrase: string; at: number } | null {
  for (const rule of rules) {
    const match = rule.pattern.exec(text);
    if (!match) continue;
    if (rule.negatable && NEGATION.test(text.slice(Math.max(0, match.index - 12), match.index)))
      continue;
    return { value: rule.value, phrase: match[0], at: match.index };
  }
  return null;
}

/** The first rule by position in the text, for answers where the reader names one of several. */
function firstMentioned<V>(text: string, rules: Rule<V>[]) {
  const hits = rules
    .map((rule) => find(text, [rule]))
    .filter((hit): hit is NonNullable<typeof hit> => hit !== null);
  return hits.sort((a, b) => a.at - b.at)[0] ?? null;
}

/** The questionnaire takes several languages and landscapes; the text gives the first one named. */
function asList<V>(hit: { value: V; phrase: string; at: number } | null) {
  return hit && { ...hit, value: [hit.value] };
}

export function readSituation(raw: string): { answers: Answers; understood: Understood[] } {
  const text = raw.toLowerCase();
  const answers: Answers = {};
  const understood: Understood[] = [];
  if (!text.trim()) return { answers, understood };

  const single: [keyof Answers, { value: unknown; phrase: string } | null][] = [
    ["project", find(text, PROJECT)],
    ["family", find(text, FAMILY)],
    ["job", find(text, JOB)],
    ["budget", find(text, BUDGET)],
    ["languages", asList(firstMentioned(text, LANGUAGE))],
    ["landscapes", asList(firstMentioned(text, LANDSCAPE))],
    ["climate", find(text, CLIMATE)],
    ["saturday", find(text, SATURDAY)],
    ["size", find(text, SIZE)],
  ];
  for (const [question, hit] of single) {
    if (!hit) continue;
    (answers as Record<string, unknown>)[question] = hit.value;
    understood.push({ question, phrase: hit.phrase });
  }

  const priorities = PRIORITIES.map((rule) => find(text, [rule]))
    .filter((hit): hit is NonNullable<typeof hit> => hit !== null)
    .sort((a, b) => a.at - b.at)
    .slice(0, 3);
  if (priorities.length) {
    answers.priorities = priorities.map((hit) => hit.value);
    for (const hit of priorities) understood.push({ question: "priorities", phrase: hit.phrase });
  }
  return { answers, understood };
}
