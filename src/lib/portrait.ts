import { livableLanguages, type City, type CriterionKey } from "./cities";
import { linesFor } from "./lines";
import { QUESTIONS } from "./questions";
import type { Answers, Priority } from "./ranking";

/** One "Pourquoi toi" line: the answer the reader gave, and what the city offers for it. */
export interface PortraitLine {
  said: string;
  text: string;
}

interface Candidate {
  key: string;
  weight: number;
  /** The generic sentence, or null when the city's sourced scores do not back the claim. */
  text: string | null;
}

const MAX_LINES = 3;
const LANGUAGE_NAMES = { fr: "français", en: "anglais", pt: "portugais", ar: "arabe" } as const;

// Each sentence pairs a stated preference with a fact the sourced scores support (4 or 5 out
// of 5, or a direct match on a fact). The rule from §A.7: the reader's taste, never a trait.
const PRIORITY_LINES: Record<Priority, { criterion: CriterionKey; line: (c: string) => string }> = {
  safety: {
    criterion: "safety",
    line: (c) =>
      `La sécurité compte pour toi : ${c} a la réputation d'une ville sûre au quotidien.`,
  },
  cost: {
    criterion: "cost",
    line: (c) => `Une vie abordable compte pour toi : à ${c}, elle le reste.`,
  },
  healthAndSchools: {
    criterion: "healthcare",
    line: (c) => `La santé et l'école comptent pour toi : ${c} est bien équipée.`,
  },
  career: {
    criterion: "jobs",
    line: (c) => `Tu penses carrière : ${c} offre de vraies opportunités.`,
  },
  diaspora: {
    criterion: "returnees",
    line: (c) => `Tu veux retrouver d'autres repats : la communauté du retour est active à ${c}.`,
  },
  memory: {
    criterion: "history",
    line: (c) => `La mémoire de la diaspora compte pour toi : ${c} en garde des lieux forts.`,
  },
  flights: {
    criterion: "flights",
    line: (c) => `Tu veux voyager facilement : ${c} est bien reliée à l'Europe.`,
  },
};

function chipLabel(questionId: keyof Answers, value: unknown): string {
  const question = QUESTIONS.find((q) => q.id === questionId);
  const choice = question?.choices.find((c) => c.value === value);
  return choice?.label ?? "";
}

function candidates(city: City, answers: Answers): Candidate[] {
  const level = (key: CriterionKey) => city.scores[key].level ?? -1;
  const high = (key: CriterionKey) => level(key) >= 4;
  const settings = city.facts.settings;
  const climates = city.facts.climates;
  const name = city.name;
  const list: Candidate[] = [];
  const add = (key: string, weight: number, text: string | null) =>
    list.push({ key, weight, text });

  if (answers.saturday === 1)
    add(
      "saturday:1",
      2.5,
      high("nightlife") ? `Tu aimes danser jusqu'au matin : ${name} aussi, on y sort tard.` : null,
    );
  if (answers.saturday === 0.5) {
    const n = level("nightlife");
    add(
      "saturday:0.5",
      2.5,
      n >= 2 && n <= 4
        ? `Tu préfères un bon dîner entre amis : à ${name}, les soirées restent conviviales.`
        : null,
    );
  }
  if (answers.saturday === 0) {
    const n = level("nightlife");
    add(
      "saturday:0",
      2.5,
      n >= 0 && n <= 2 ? `Tu aimes le calme le soir : ${name} est une ville tranquille.` : null,
    );
  }

  if (answers.language && livableLanguages(city).includes(answers.language)) {
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

  if (answers.climate) {
    const byClimate = {
      hot: climates.some((c) => c === "hot-humid" || c === "hot-dry")
        ? `Tu veux la chaleur toute l'année : à ${name}, tu l'auras.`
        : null,
      mild: climates.some((c) => c === "mild" || c === "highland")
        ? `Tu cherches la douceur : à ${name}, le climat est doux.`
        : null,
      dry: climates.includes("hot-dry")
        ? `Tu veux du soleil et du sec : ${name} est servie.`
        : null,
    };
    add(`climate:${answers.climate}`, 2, byClimate[answers.climate]);
  }

  if (answers.landscape) {
    const byLandscape = {
      beach: settings.includes("ocean")
        ? `Tu veux la mer : à ${name}, la plage est tout près.`
        : null,
      nature: settings.some((s) => s === "mountains" || s === "forest" || s === "lake-or-river")
        ? `Tu aimes la nature : autour de ${name}, elle est toute proche.`
        : null,
      wildSpaces: settings.some((s) => s === "savanna" || s === "desert")
        ? `Tu rêves de grands espaces : ils sont à portée de route depuis ${name}.`
        : null,
      urban: high("culture") ? `La ville te suffit : ${name} a une vraie vie culturelle.` : null,
    };
    add(`landscape:${answers.landscape}`, 3, byLandscape[answers.landscape]);
  }

  if (answers.job) {
    const byJob = {
      cadre: high("jobs")
        ? `Tu cherches un emploi sur place : ${name} offre de vraies opportunités.`
        : null,
      entre: high("business")
        ? `Tu veux entreprendre : ${name} est une ville où l'on crée des entreprises.`
        : null,
      remote: high("internet") ? `Tu télétravailles : à ${name}, la connexion suit.` : null,
      crea: high("culture")
        ? `Tu vis pour la culture : ${name} a une scène créative vivante.`
        : null,
      soin: high("healthcare")
        ? `Tu travailles dans la santé ou l'enseignement : ${name} a des hôpitaux où exercer.`
        : null,
    };
    add(`job:${answers.job}`, 2.5, byJob[answers.job]);
  }

  if (answers.budget === "serre")
    add(
      "budget:serre",
      3,
      high("cost") ? `Ton budget est serré : la vie à ${name} reste abordable.` : null,
    );

  if (answers.family === "parents" || answers.family === "fonder")
    add(
      `family:${answers.family}`,
      2.5,
      high("schools") && level("healthcare") >= 3
        ? `Tu pars en famille : ${name} a de bonnes écoles et des soins à portée.`
        : null,
    );

  if (answers.project === "pied")
    add(
      "project:pied",
      3,
      high("flights") ? `Un pied ici, un pied là-bas : ${name} est bien reliée à l'Europe.` : null,
    );
  if (answers.project === "tester")
    add(
      "project:tester",
      1.5,
      high("returnees")
        ? `Tu veux tester quelques mois : à ${name}, d'autres repats sont déjà passés par là.`
        : null,
    );
  if (answers.project === "investir")
    add(
      "project:investir",
      3,
      high("business") ? `Tu veux investir : ${name} attire les investisseurs.` : null,
    );

  for (const priority of (answers.priorities ?? []).slice(0, 3)) {
    const entry = PRIORITY_LINES[priority];
    if (entry) add(`priorities:${priority}`, 2.5, high(entry.criterion) ? entry.line(name) : null);
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
