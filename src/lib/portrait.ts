import type { City, PracticalCriterion } from "./cities";
import { linesFor } from "./lines";
import { QUESTIONS } from "./questions";
import type { Answers } from "./ranking";

/** One "Pourquoi toi" line: the answer the reader gave, and what the city offers for it. */
export interface PortraitLine {
  said: string;
  text: string;
}

interface Candidate {
  key: string;
  weight: number;
  /** The generic sentence, or null when the city's scores do not back the claim. */
  text: string | null;
}

const MAX_LINES = 3;

const LANGUAGE_NAMES = { fr: "français", en: "anglais", pt: "portugais", ar: "arabe" } as const;

// Each sentence pairs a stated preference with a fact the scores support (>= 4 out of 5,
// or a direct match). The rule from §A.7: the reader's taste, never a trait.
const PRIORITY_LINES: Record<PracticalCriterion, (city: string) => string> = {
  safety: (c) =>
    `La sécurité compte pour toi : ${c} a la réputation d'une ville sûre au quotidien.`,
  cost: (c) => `Une vie abordable compte pour toi : à ${c}, elle le reste.`,
  healthAndSchools: (c) => `La santé et l'école comptent pour toi : ${c} est bien équipée.`,
  career: (c) => `Tu penses carrière : ${c} offre de vraies opportunités.`,
  diaspora: (c) => `Tu veux retrouver d'autres repats : la communauté du retour est active à ${c}.`,
  memory: (c) => `La mémoire de la diaspora compte pour toi : ${c} en garde des lieux forts.`,
  flights: (c) => `Tu veux voyager facilement : ${c} est bien reliée à l'Europe.`,
  nightlife: (c) => `Tu aimes sortir : ${c} vit la nuit.`,
  culture: (c) => `Tu vis pour la culture : ${c} a une scène créative vivante.`,
  food: (c) => `Tu aimes bien manger : ${c} a de quoi te régaler.`,
  investment: (c) => `Tu veux investir : ${c} attire les investisseurs.`,
  internet: (c) => `Tu as besoin d'une bonne connexion : à ${c}, elle suit.`,
  heritage: (c) => `Tu aimes l'histoire : ${c} en est pleine.`,
  beach: (c) => `Tu veux la mer : à ${c}, la plage est tout près.`,
  nature: (c) => `Tu aimes la nature : autour de ${c}, elle est toute proche.`,
  wildSpaces: (c) => `Tu rêves de grands espaces : ils sont à portée de route depuis ${c}.`,
};

function chipLabel(questionId: keyof Answers, value: unknown): string {
  const question = QUESTIONS.find((q) => q.id === questionId);
  const choice = question?.choices.find((c) => c.value === value);
  return choice?.label ?? "";
}

function candidates(city: City, answers: Answers): Candidate[] {
  const s = city.scores;
  const name = city.name;
  const list: Candidate[] = [];
  const add = (key: string, weight: number, text: string | null) =>
    list.push({ key, weight, text });

  if (answers.saturday === 1)
    add(
      "saturday:1",
      2.5,
      s.nightlife >= 4 ? `Tu aimes danser jusqu'au matin : ${name} aussi, on y sort tard.` : null,
    );
  if (answers.saturday === 0.5)
    add(
      "saturday:0.5",
      2.5,
      s.social >= 3 && s.social <= 4
        ? `Tu préfères un bon dîner entre amis : à ${name}, les soirées restent conviviales.`
        : null,
    );
  if (answers.saturday === 0)
    add(
      "saturday:0",
      2.5,
      s.social <= 2 ? `Tu aimes le calme le soir : ${name} est une ville tranquille.` : null,
    );

  if (answers.language && city.languages.includes(answers.language)) {
    const lang = LANGUAGE_NAMES[answers.language];
    // Language is a constraint, not a pleasure: it comes after the lines that make people want to go.
    add(`language:${answers.language}`, 1, `Tu parles ${lang} : à ${name}, on vit en ${lang}.`);
  }

  if (answers.size && answers.size === city.size) {
    const bySize = {
      3: `Tu veux une ville qui vibre : ${name} ne s'arrête presque jamais.`,
      2: `Tu veux une ville à taille humaine : c'est le cas de ${name}.`,
      1: `Tu préfères une ville qui prend son temps : ${name} vit à un rythme tranquille.`,
    };
    add(`size:${answers.size}`, 2, bySize[answers.size]);
  }

  if (answers.climate && city.climates.includes(answers.climate)) {
    const byClimate = {
      hot: `Tu veux la chaleur toute l'année : à ${name}, tu l'auras.`,
      mild: `Tu cherches la douceur : à ${name}, le climat est doux.`,
      dry: `Tu veux du soleil et du sec : ${name} est servie.`,
    };
    add(`climate:${answers.climate}`, 2, byClimate[answers.climate]);
  }

  if (answers.landscape) {
    const byLandscape = {
      beach: s.beach >= 4 ? PRIORITY_LINES.beach(name) : null,
      nature: s.nature >= 4 ? PRIORITY_LINES.nature(name) : null,
      wildSpaces: s.wildSpaces >= 4 ? PRIORITY_LINES.wildSpaces(name) : null,
      urban: s.culture >= 4 ? `La ville te suffit : ${name} a une vraie vie culturelle.` : null,
    };
    add(`landscape:${answers.landscape}`, 3, byLandscape[answers.landscape]);
  }

  if (answers.job) {
    const byJob = {
      cadre:
        s.career >= 4
          ? `Tu cherches un emploi sur place : ${name} offre de vraies opportunités.`
          : null,
      entre:
        s.investment >= 4 ? `Tu veux entreprendre : ${name} est une ville où l'on investit.` : null,
      remote: s.internet >= 4 ? `Tu télétravailles : à ${name}, la connexion suit.` : null,
      crea: s.culture >= 4 ? PRIORITY_LINES.culture(name) : null,
      soin:
        s.healthAndSchools >= 4
          ? `Tu travailles dans la santé ou l'enseignement : ${name} a des hôpitaux et des écoles où exercer.`
          : null,
    };
    add(`job:${answers.job}`, 2.5, byJob[answers.job]);
  }

  if (answers.budget === "serre")
    add(
      "budget:serre",
      3,
      s.cost >= 4 ? `Ton budget est serré : la vie à ${name} reste abordable.` : null,
    );

  if (answers.family === "parents" || answers.family === "fonder")
    add(
      `family:${answers.family}`,
      2.5,
      s.healthAndSchools >= 4
        ? `Tu pars en famille : ${name} a de bonnes écoles et de bons soins.`
        : null,
    );

  if (answers.project === "pied")
    add(
      "project:pied",
      3,
      s.flights >= 4 ? `Un pied ici, un pied là-bas : ${name} est bien reliée à l'Europe.` : null,
    );
  if (answers.project === "tester")
    add(
      "project:tester",
      1.5,
      s.diaspora >= 4
        ? `Tu veux tester quelques mois : à ${name}, d'autres repats sont déjà passés par là.`
        : null,
    );
  if (answers.project === "investir")
    add("project:investir", 3, s.investment >= 4 ? PRIORITY_LINES.investment(name) : null);

  for (const priority of (answers.priorities ?? []).slice(0, 3)) {
    add(`priorities:${priority}`, 2.5, s[priority] >= 4 ? PRIORITY_LINES[priority](name) : null);
  }
  return list;
}

/**
 * Two or three lines for "Pourquoi toi et [ville]". A city's own sentence (city-lines.json)
 * wins over the generic one; with no answer, there is no portrait.
 */
export function portraitFor(city: City, answers: Answers): PortraitLine[] {
  const own = linesFor(city.name)?.why ?? {};
  return candidates(city, answers)
    .map((c) => ({ ...c, text: own[c.key] ?? c.text }))
    .filter((c): c is Candidate & { text: string } => c.text !== null)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_LINES)
    .map((c) => {
      const [questionId, value] = c.key.split(":");
      const parsed = questionId === "saturday" || questionId === "size" ? Number(value) : value;
      return { said: chipLabel(questionId as keyof Answers, parsed), text: c.text };
    });
}
