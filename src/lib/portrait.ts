import { livableLanguages, type City, type CriterionKey } from "./cities";
import { linesFor } from "./lines";
import { DEEP_QUESTIONS } from "./deep-questions";
import { questionIn } from "./questions";
import type { Answers, Landscape, Priority } from "./ranking";
import type { Bilingual, Locale } from "../i18n/locale";
import { cityCopy } from "../i18n/city-copy";

/** One "Pourquoi vous" line: the answer the reader gave, and what the city offers for it. */
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

type Line = (city: string) => string;

/**
 * Each sentence pairs a stated preference with a fact the sourced scores support (4 or 5 out of
 * 5, or a direct match on a fact). The rule from §A.7: the reader's taste, never a trait, so
 * English says « you like », never « you are ».
 */
interface PortraitCopy {
  languages: Record<QuizLanguage, string>;
  speaks: (language: string, city: string) => string;
  saturday: Record<"out" | "dinner" | "calm", Line>;
  size: Record<1 | 2 | 3, Line>;
  climate: Record<"hot" | "mild" | "dry", Line>;
  landscape: Record<Landscape, Line>;
  job: Record<NonNullable<Answers["job"]>, Line>;
  tightBudget: Line;
  family: Line;
  project: Record<"pied" | "tester" | "investir", Line>;
  priority: Record<Priority, Line>;
}

type QuizLanguage = NonNullable<Answers["languages"]>[number];

const COPY: Bilingual<PortraitCopy> = {
  fr: {
    languages: {
      fr: "français",
      en: "anglais",
      pt: "portugais",
      ar: "arabe",
      es: "espagnol",
      sw: "swahili",
    },
    speaks: (lang, c) => `Vous parlez ${lang} : à ${c}, on vit en ${lang}.`,
    saturday: {
      out: (c) => `Vous aimez danser jusqu'au matin : ${c} aussi, on y sort tard.`,
      dinner: (c) =>
        `Vous préférez un bon dîner entre amis : à ${c}, les soirées restent conviviales.`,
      calm: (c) => `Vous aimez le calme le soir : ${c} est une ville tranquille.`,
    },
    size: {
      3: (c) => `Vous voulez une grande ville : ${c} en est une.`,
      2: (c) => `Vous voulez une ville moyenne : c'est la taille de ${c}.`,
      1: (c) => `Vous préférez une petite ville : ${c} en est une.`,
    },
    climate: {
      hot: (c) => `Vous voulez la chaleur toute l'année : à ${c}, vous l'aurez.`,
      mild: (c) => `Vous cherchez la douceur : à ${c}, le climat est doux.`,
      dry: (c) => `Vous voulez du soleil et du sec : ${c} est servie.`,
    },
    landscape: {
      water: (c) => `Vous aimez l'eau : ${c} vit au bord d'un fleuve ou d'un lac.`,
      beach: (c) => `Vous voulez la mer : à ${c}, la plage est tout près.`,
      nature: (c) => `Vous aimez la nature : autour de ${c}, elle est toute proche.`,
      wildSpaces: (c) => `Vous rêvez de grands espaces : ils sont à portée de route depuis ${c}.`,
      island: (c) => `Vous rêvez d'une île : ${c} en est une.`,
      urban: (c) => `La ville vous suffit : ${c} a une vraie vie culturelle.`,
    },
    job: {
      cadre: (c) => `Vous cherchez un emploi sur place : ${c} offre de vraies opportunités.`,
      entre: (c) => `Vous voulez entreprendre : ${c} est une ville où l'on crée des entreprises.`,
      remote: (c) => `Vous télétravaillez : à ${c}, la connexion suit.`,
      crea: (c) => `Vous vivez pour la culture : ${c} a une scène créative vivante.`,
      soin: (c) =>
        `Vous travaillez dans la santé ou l'enseignement : ${c} a des hôpitaux où exercer.`,
    },
    tightBudget: (c) => `Votre budget est serré : la vie à ${c} reste abordable.`,
    family: (c) => `Vous partez en famille : ${c} a de bonnes écoles et des soins à portée.`,
    project: {
      pied: (c) => `Un pied ici, un pied là-bas : ${c} est bien reliée à l'Europe.`,
      tester: (c) =>
        `Vous voulez tester quelques mois : à ${c}, d'autres repats sont déjà passés par là.`,
      investir: (c) => `Vous voulez investir : ${c} attire les investisseurs.`,
    },
    priority: {
      safety: (c) =>
        `La sécurité compte pour vous : ${c} a la réputation d'une ville sûre au quotidien.`,
      cost: (c) => `Une vie abordable compte pour vous : à ${c}, elle le reste.`,
      health: (c) => `La santé compte pour vous : à ${c}, de bons soins sont à portée.`,
      schools: (c) => `L'école des enfants compte pour vous : ${c} a de bonnes écoles.`,
      career: (c) => `Vous pensez carrière : ${c} offre de vraies opportunités.`,
      diaspora: (c) =>
        `Vous voulez retrouver d'autres repats : la communauté du retour est active à ${c}.`,
      memory: (c) => `La mémoire de la diaspora compte pour vous : ${c} en garde des lieux forts.`,
      flights: (c) => `Vous voulez voyager facilement : ${c} est bien reliée à l'Europe.`,
    },
  },
  en: {
    languages: {
      fr: "French",
      en: "English",
      pt: "Portuguese",
      ar: "Arabic",
      es: "Spanish",
      sw: "Swahili",
    },
    speaks: (lang, c) => `You speak ${lang}: in ${c}, daily life happens in ${lang}.`,
    saturday: {
      out: (c) => `You like dancing until morning: so does ${c}, people go out late there.`,
      dinner: (c) =>
        `You prefer a good dinner with friends: in ${c}, evenings stay warm and friendly.`,
      calm: (c) => `You like quiet evenings: ${c} is a peaceful city.`,
    },
    size: {
      3: (c) => `You want a big city: ${c} is one.`,
      2: (c) => `You want a mid-sized city: that is the size of ${c}.`,
      1: (c) => `You prefer a small town: ${c} is one.`,
    },
    climate: {
      hot: (c) => `You want warmth all year round: in ${c}, you will have it.`,
      mild: (c) => `You are after mild weather: in ${c}, the climate is gentle.`,
      dry: (c) => `You want sun and dry air: ${c} has plenty of both.`,
    },
    landscape: {
      water: (c) => `You love the water: ${c} lives by a river or a lake.`,
      beach: (c) => `You want the sea: in ${c}, the beach is close by.`,
      nature: (c) => `You love nature: around ${c}, it is close at hand.`,
      wildSpaces: (c) => `You dream of wide open spaces: they are a drive away from ${c}.`,
      island: (c) => `You dream of an island: ${c} is one.`,
      urban: (c) => `The city is enough for you: ${c} has a real cultural life.`,
    },
    job: {
      cadre: (c) => `You are looking for a job there: ${c} offers real opportunities.`,
      entre: (c) => `You want to start a business: ${c} is a city where people do.`,
      remote: (c) => `You work remotely: in ${c}, the connection keeps up.`,
      crea: (c) => `You live for culture: ${c} has a lively creative scene.`,
      soin: (c) => `You work in health or teaching: ${c} has hospitals to work in.`,
    },
    tightBudget: (c) => `Your budget is tight: life in ${c} stays affordable.`,
    family: (c) => `You are going as a family: ${c} has good schools and healthcare within reach.`,
    project: {
      pied: (c) => `One foot here, one foot there: ${c} is well connected to Europe.`,
      tester: (c) =>
        `You want to try a few months: in ${c}, other returnees have been there before you.`,
      investir: (c) => `You want to invest: ${c} draws investors.`,
    },
    priority: {
      safety: (c) => `Safety matters to you: ${c} has a reputation as a safe city day to day.`,
      cost: (c) => `An affordable life matters to you: in ${c}, it stays affordable.`,
      health: (c) => `Healthcare matters to you: in ${c}, good care is within reach.`,
      schools: (c) => `Your children's schooling matters to you: ${c} has good schools.`,
      career: (c) => `You are thinking of your career: ${c} offers real opportunities.`,
      diaspora: (c) =>
        `You want to meet other returnees: the returnee community is active in ${c}.`,
      memory: (c) => `The diaspora's memory matters to you: ${c} keeps powerful places of it.`,
      flights: (c) => `You want to travel easily: ${c} is well connected to Europe.`,
    },
  },
};

/** Which sourced score backs each non-negotiable. */
const PRIORITY_CRITERION: Record<Priority, CriterionKey> = {
  safety: "safety",
  cost: "cost",
  health: "healthcare",
  schools: "schools",
  career: "jobs",
  diaspora: "returnees",
  memory: "history",
  flights: "flights",
};

function chipLabel(questionId: keyof Answers, value: unknown, locale: Locale): string {
  const question = DEEP_QUESTIONS.find((q) => q.id === questionId);
  if (!question) return "";
  return questionIn(question, locale).choices.find((c) => c.value === value)?.label ?? "";
}

function candidates(city: City, answers: Answers, locale: Locale): Candidate[] {
  const copy = COPY[locale];
  const level = (key: CriterionKey) => city.scores[key].level ?? -1;
  const high = (key: CriterionKey) => level(key) >= 4;
  const settings = city.facts.settings;
  const climates = city.facts.climates;
  const name = cityCopy(city, locale).name;
  const list: Candidate[] = [];
  const add = (key: string, weight: number, text: string | null) =>
    list.push({ key, weight, text });

  if (answers.saturday === 1)
    add("saturday:1", 2.5, high("nightlife") ? copy.saturday.out(name) : null);
  if (answers.saturday === 0.5) {
    const n = level("nightlife");
    add("saturday:0.5", 2.5, n >= 2 && n <= 4 ? copy.saturday.dinner(name) : null);
  }
  if (answers.saturday === 0) {
    const n = level("nightlife");
    add("saturday:0", 2.5, n >= 0 && n <= 2 ? copy.saturday.calm(name) : null);
  }

  const languages = answers.languages ?? [];
  const spoken = languages.find((l) => livableLanguages(city).includes(l));
  if (spoken) {
    // Language is a constraint, not a pleasure: it comes after the lines that make people want to go.
    add(`language:${spoken}`, 1, copy.speaks(copy.languages[spoken], name));
  }

  if (answers.size && answers.size === city.size)
    add(`size:${answers.size}`, 2, copy.size[answers.size](name));

  if (answers.climate) {
    const fits = {
      hot: climates.some((c) => c === "hot-humid" || c === "hot-dry"),
      mild: climates.some((c) => c === "mild" || c === "highland"),
      dry: climates.includes("hot-dry"),
    };
    add(
      `climate:${answers.climate}`,
      2,
      fits[answers.climate] ? copy.climate[answers.climate](name) : null,
    );
  }

  for (const landscape of answers.landscapes ?? []) {
    const fits: Record<Landscape, boolean> = {
      water: settings.includes("lake-or-river"),
      beach: settings.includes("ocean"),
      nature: settings.some((s) => s === "mountains" || s === "forest" || s === "lake-or-river"),
      wildSpaces: settings.some((s) => s === "savanna" || s === "desert"),
      island: settings.includes("island"),
      urban: high("culture"),
    };
    add(`landscape:${landscape}`, 3, fits[landscape] ? copy.landscape[landscape](name) : null);
  }

  if (answers.job) {
    const fits = {
      cadre: high("jobs"),
      entre: high("business"),
      remote: high("internet"),
      crea: high("culture"),
      soin: high("healthcare"),
    };
    add(`job:${answers.job}`, 2.5, fits[answers.job] ? copy.job[answers.job](name) : null);
  }

  if (answers.budget === "serre")
    add("budget:serre", 3, high("cost") ? copy.tightBudget(name) : null);

  if (answers.family === "parents" || answers.family === "fonder")
    add(
      `family:${answers.family}`,
      2.5,
      high("schools") && level("healthcare") >= 3 ? copy.family(name) : null,
    );

  if (answers.project === "pied")
    add("project:pied", 3, high("flights") ? copy.project.pied(name) : null);
  if (answers.project === "tester")
    add("project:tester", 1.5, high("returnees") ? copy.project.tester(name) : null);
  if (answers.project === "investir")
    add("project:investir", 3, high("business") ? copy.project.investir(name) : null);

  for (const priority of (answers.priorities ?? []).slice(0, 3)) {
    const criterion = PRIORITY_CRITERION[priority];
    if (criterion)
      add(`priorities:${priority}`, 2.5, high(criterion) ? copy.priority[priority](name) : null);
  }
  return list;
}

/**
 * Two or three lines for "Pourquoi vous et [ville]". A city's own sentence (city-lines.json)
 * wins over the generic one; with no answer, there is no portrait. Those sentences are French
 * only for now, so an English reader gets the generic English one.
 */
export function portraitFor(city: City, answers: Answers, locale: Locale): PortraitLine[] {
  const own = locale === "fr" ? (linesFor(city.name)?.why ?? {}) : {};
  return candidates(city, answers, locale)
    .map((c) => ({ ...c, text: own[c.key] ?? c.text }))
    .filter((c): c is Candidate & { text: string } => c.text !== null)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_LINES)
    .map((c) => {
      const [questionId, value] = c.key.split(":");
      const parsed = questionId === "saturday" || questionId === "size" ? Number(value) : value;
      return { said: chipLabel(questionId as keyof Answers, parsed, locale), text: c.text };
    });
}
