import { CITIES } from "./cities";
import { SEASONS } from "./holiday";
import type { Answers } from "./ranking";

export interface Choice {
  label: string;
  /** null: the reader would rather not say; it counts as a skip. */
  value: string | number | boolean | null;
  /** A short line under the answer, when it helps. */
  sub?: string;
  /** Offered only when this holds for the answers so far (quiz paths, 2026-11-16). */
  when?: (answers: Answers) => boolean;
}

export interface Question {
  id: keyof Answers;
  /** The chapter name shown above the question. */
  group: string;
  /**
   * The quick quiz's chapters come in this order and never interleave (operator,
   * 2026-11-16): 1 the project, 2 the trip or the life there, 3 the temperament, 4 the reader's
   * history with Africa, 5 the non-negotiables.
   */
  chapter?: 1 | 2 | 3 | 4 | 5;
  title: string;
  /** One line saying what the question is for. */
  hint?: string;
  choices: Choice[];
  /** Several answers allowed, up to this many. */
  max?: number;
  /** Asked only when this holds for the answers so far. */
  when?: (answers: Answers) => boolean;
}

/** The family regions the reader named, « Je préfère ne pas dire » left out. */
export const namedOrigins = (answers: Answers): string[] =>
  (Array.isArray(answers.origin) ? answers.origin : [answers.origin]).filter(
    (o): o is Exclude<typeof o, undefined> => Boolean(o),
  );
/** African family regions picked so far. */
const africanOrigins = (answers: Answers): string[] =>
  namedOrigins(answers).filter((o) => o !== "ameriques");

const COUNTRY_CHOICES: Choice[] = [
  ...new Map(CITIES.map((city) => [city.country, city.zone])).entries(),
]
  .sort(([a], [b]) => a.localeCompare(b, "fr"))
  // Only the countries of the regions the reader picked.
  .map(([country, zone]) => ({
    label: country,
    value: country,
    when: (answers: Answers) => africanOrigins(answers).includes(zone),
  }));

const PROJECT = "Votre projet";
const TRIP = "Votre voyage";
const TEMPERAMENT = "Votre tempérament";
const HISTORY = "Votre histoire avec l'Afrique";
const LAST = "Pour finir";

const holiday = (answers: Answers) => answers.project === "decouvrir";
/** The reader will spend real time there: not for an investor who does not live there. */
export const livesThere = (answers: Answers) => answers.project !== "investir";
/** The reader will work there: not on holiday, not as a distant investor. */
export const worksThere = (answers: Answers) =>
  answers.project !== "investir" && answers.project !== "decouvrir";
const withChildren = (answers: Answers) =>
  answers.family === "parents" || answers.family === "fonder";
const kinMatters = (answers: Answers) => answers.kin === "much" || answers.kin === "some";

// The quick quiz, as paths (operator, 2026-11-16): the project picks which questions
// apply, and they come chapter by chapter. Worded in « vous ». The temperament chapter is a quick
// reading inspired by the Big Five, one question per trait.
export const QUESTIONS: Question[] = [
  {
    id: "project",
    group: PROJECT,
    chapter: 1,
    title: "Là-bas, vous vous y voyez comment ?",
    hint: "Selon votre projet, on regarde surtout la sécurité, les démarches, les vols ou le coût pour s'installer.",
    choices: [
      { label: "M'installer pour de bon", value: "installer", sub: "Y construire ma vie" },
      { label: "Un pied ici, un pied là-bas", value: "pied", sub: "Des allers-retours réguliers" },
      { label: "Tester quelques mois", value: "tester", sub: "Voir si la vie sur place me va" },
      { label: "Investir sans y vivre", value: "investir" },
      { label: "D'abord des vacances", value: "decouvrir", sub: "Et je verrai ensuite" },
    ],
  },
  {
    id: "wants",
    group: TRIP,
    chapter: 2,
    when: holiday,
    title: "Ce que vous voulez vivre là-bas ?",
    hint: "Jusqu'à trois choix : on cherche les villes où vous pourrez le faire.",
    max: 3,
    choices: [
      { label: "La plage ou une île", value: "beach" },
      { label: "Le désert ou la savane", value: "wild" },
      { label: "La montagne et la nature", value: "nature" },
      { label: "Faire la fête", value: "party" },
      { label: "L'histoire et la mémoire", value: "history" },
      { label: "La culture et les musées", value: "culture" },
      { label: "Un safari", value: "safari" },
      { label: "La plongée, le surf ou la glisse", value: "sea" },
    ],
  },
  {
    id: "season",
    group: TRIP,
    chapter: 2,
    when: holiday,
    title: "Quand partez-vous ?",
    hint: "Pour éviter la saison des pluies et viser la belle saison.",
    choices: [
      ...SEASONS.map((s) => ({ label: s.label, value: s.value })),
      { label: "Je ne sais pas encore", value: null },
    ],
  },
  {
    id: "profession",
    group: PROJECT,
    chapter: 2,
    when: worksThere,
    title: "Votre métier ?",
    hint: "Pour privilégier les villes où votre métier recrute.",
    choices: [
      { label: "Finance", value: "finance" },
      { label: "Droit", value: "law" },
      { label: "Conseil, gestion de projet", value: "consulting" },
      { label: "Numérique", value: "tech" },
      { label: "Santé", value: "health" },
      { label: "Enseignement", value: "teaching" },
      { label: "ONG, international", value: "ngo" },
      { label: "Commerce", value: "trade" },
      { label: "Culture, médias", value: "culture" },
      { label: "Artisanat", value: "craft" },
      { label: "Études", value: "student" },
      { label: "Retraite", value: "retired" },
    ],
  },
  {
    id: "family",
    group: PROJECT,
    chapter: 2,
    when: livesThere,
    title: "Vous partez avec qui ?",
    hint: "Avec des enfants, les écoles, les soins et la sécurité pèsent davantage.",
    choices: [
      { label: "Seul·e", value: "celib" },
      { label: "En couple", value: "couple" },
      { label: "Pour fonder une famille", value: "fonder", when: (a) => !holiday(a) },
      { label: "Avec mes enfants", value: "parents" },
    ],
  },
  {
    id: "languages",
    group: PROJECT,
    chapter: 2,
    title: "Dans quelles langues êtes-vous à l'aise au quotidien ?",
    hint: "Pour vous proposer des villes où l'on vit dans l'une de ces langues.",
    max: 6,
    choices: [
      { label: "Français", value: "fr" },
      { label: "Anglais", value: "en" },
      { label: "Portugais", value: "pt" },
      { label: "Arabe", value: "ar" },
      { label: "Espagnol", value: "es" },
      { label: "Swahili", value: "sw" },
      { label: "Peu importe, je m'adapte", value: null },
    ],
  },
  {
    id: "size",
    group: PROJECT,
    chapter: 2,
    title: "Quelle taille de ville ?",
    hint: "Pour savoir si vous préférez l'animation d'une grande ville ou le calme d'une petite.",
    choices: [
      { label: "Une grande ville qui vibre jour et nuit", value: 3 },
      { label: "Une ville à taille humaine", value: 2 },
      { label: "Une petite ville qui prend son temps", value: 1 },
    ],
  },
  {
    id: "landscapes",
    group: PROJECT,
    chapter: 2,
    // On holiday, « Ce que vous voulez vivre » asks it better.
    when: (answers) => livesThere(answers) && !holiday(answers),
    title: "Quel paysage autour de vous ?",
    hint: "Une préférence : le paysage que vous aimeriez avoir tout près de chez vous.",
    max: 3,
    choices: [
      { label: "La mer", value: "beach" },
      { label: "Une île", value: "island" },
      { label: "Un fleuve ou un lac", value: "water" },
      { label: "La montagne ou la forêt", value: "nature" },
      { label: "La savane ou le désert", value: "wildSpaces" },
      { label: "Peu importe, la ville me suffit", value: "urban" },
    ],
  },
  {
    id: "saturday",
    group: TEMPERAMENT,
    chapter: 3,
    when: livesThere,
    title: "Votre samedi soir idéal ?",
    hint: "Pour savoir si vous cherchez une ville animée ou plutôt calme.",
    choices: [
      { label: "Du monde, de la musique, on rentre tard", value: 1 },
      { label: "Un dîner avec quelques amis", value: 0.5 },
      { label: "Chez moi, au calme", value: 0 },
    ],
  },
  {
    id: "adventure",
    group: TEMPERAMENT,
    chapter: 3,
    when: livesThere,
    title: "Découvrir une région d'Afrique que vous ne connaissez pas, ça vous tente ?",
    hint: "Si oui, on vous propose aussi des villes loin de la région de votre famille.",
    choices: [
      { label: "Oui, c'est ce que je cherche", value: "seeking" },
      { label: "Pourquoi pas", value: "open" },
      { label: "Je préfère rester en terrain connu", value: "familiar" },
    ],
  },
  {
    id: "order",
    group: TEMPERAMENT,
    chapter: 3,
    when: livesThere,
    title: "Au quotidien, avez-vous besoin que tout soit organisé ?",
    hint: "Pour savoir si vous préférez une ville où les démarches sont simples et prévisibles.",
    choices: [
      {
        label: "J'ai besoin que tout soit carré",
        value: 1,
        sub: "Des démarches claires, des horaires tenus",
      },
      { label: "Un minimum de cadre me suffit", value: 0.5 },
      { label: "J'improvise, tout se négocie", value: 0, sub: "Je m'adapte au jour le jour" },
    ],
  },
  {
    id: "together",
    group: TEMPERAMENT,
    chapter: 3,
    when: livesThere,
    title: "Pour avancer, vous comptez plutôt sur vous ou sur les autres ?",
    hint: "Pour savoir si vous cherchez une ville d'affaires et de compétition, ou une ville solidaire.",
    choices: [
      { label: "Sur moi", value: 0, sub: "Que le meilleur gagne" },
      { label: "Ça dépend des situations", value: 0.5 },
      { label: "Sur les autres", value: 1, sub: "L'entraide d'abord" },
    ],
  },
  {
    id: "friction",
    group: TEMPERAMENT,
    chapter: 3,
    when: livesThere,
    title: "Coupures de courant, démarches lentes, imprévus : comment le vivez-vous ?",
    hint: "Si cela vous pèse, on écarte les villes où ces problèmes sont fréquents.",
    choices: [
      { label: "Ça m'amuse presque, je m'adapte", value: 1 },
      { label: "Ça m'agace, mais je gère", value: 0.5 },
      { label: "Ça m'épuise vite", value: 0 },
    ],
  },
  {
    id: "origin",
    group: HISTORY,
    chapter: 4,
    title: "D'où vient votre famille ?",
    hint: "Facultatif. Pour vous proposer des villes proches de vos repères.",
    max: 3,
    choices: [
      { label: "Afrique de l'Ouest", value: "ouest" },
      { label: "Afrique centrale", value: "centre" },
      { label: "Afrique de l'Est", value: "est" },
      { label: "Afrique australe", value: "sud" },
      { label: "Afrique du Nord", value: "nord" },
      { label: "Caraïbes, Amériques", value: "ameriques" },
      { label: "Je préfère ne pas dire", value: null },
    ],
  },
  {
    id: "kin",
    group: HISTORY,
    chapter: 4,
    // Only with a region to be near: « Je préfère ne pas dire » skips it (operator, 2026-11-16).
    when: (answers) => namedOrigins(answers).length > 0,
    title: "Vivre près de vos origines, de votre culture, de votre religion, ça compte pour vous ?",
    hint: "Si oui, on privilégie les villes proches de la région de votre famille.",
    choices: [
      { label: "Beaucoup", value: "much" },
      { label: "Un peu", value: "some" },
      { label: "Pas vraiment", value: "none" },
    ],
  },
  {
    id: "priorities",
    group: LAST,
    chapter: 5,
    title: "Sur quoi ne voulez-vous pas transiger ?",
    hint: "Jusqu'à trois choix. Ce sont vos non-négociables : ils comptent le plus dans votre classement.",
    max: 3,
    choices: [
      { label: "Me sentir en sécurité", value: "safety" },
      { label: "Une vie abordable", value: "cost" },
      { label: "La santé et l'école", value: "healthAndSchools", when: withChildren },
      { label: "Ma carrière", value: "career", when: worksThere },
      { label: "Retrouver d'autres repats", value: "diaspora", when: (a) => !holiday(a) },
      { label: "Les lieux de mémoire (traite, histoire des diasporas)", value: "memory" },
      { label: "Voyager facilement", value: "flights" },
    ],
  },
];

/**
 * Asked in the full questionnaire, not the quick quiz: measured on 40 runs per path, they move the
 * top five least (operator, 2026-11-16). Their rules still hold there.
 */
export const LATER: Question[] = [
  {
    id: "duration",
    group: TRIP,
    chapter: 2,
    when: holiday,
    title: "Combien de temps ?",
    hint: "Pour un séjour court, on privilégie les villes desservies par des vols directs.",
    choices: [
      { label: "Un long week-end", value: "weekend" },
      { label: "Une semaine", value: "week" },
      { label: "Deux à trois semaines", value: "weeks" },
      { label: "Un mois ou plus", value: "month" },
    ],
  },
  {
    id: "tripsHome",
    group: PROJECT,
    chapter: 2,
    // Living there, not on holiday: how often the reader flies back.
    when: (answers) => livesThere(answers) && !holiday(answers),
    title: "Combien d'allers-retours vers l'Europe par an ?",
    hint: "Plus vous rentrez souvent, plus les vols directs comptent.",
    choices: [
      { label: "Un ou moins", value: 0 },
      { label: "Deux ou trois", value: 0.5 },
      { label: "Tous les mois", value: 1 },
    ],
  },
  {
    id: "budget",
    group: PROJECT,
    chapter: 2,
    when: livesThere,
    title: "Votre budget sur place ?",
    hint: "Pour privilégier les villes où le logement et la vie courante tiennent dans votre budget.",
    choices: [
      { label: "Serré", value: "serre" },
      { label: "Moyen", value: "moyen" },
      { label: "Le prix compte peu", value: "large" },
    ],
  },
  {
    id: "passports",
    group: PROJECT,
    chapter: 2,
    title: "Quel passeport avez-vous ?",
    hint: "Pour privilégier les pays où vous entrez sans visa ou circulez librement.",
    max: 2,
    choices: [
      { label: "Français ou européen", value: "eu" },
      { label: "D'un pays de la CEDEAO", value: "ecowas" },
      { label: "De la CEMAC", value: "cemac" },
      { label: "De la Communauté d'Afrique de l'Est", value: "eac" },
      { label: "Un autre", value: "other" },
    ],
  },
  {
    id: "countries",
    group: HISTORY,
    chapter: 4,
    title: "De quel pays vient votre famille ?",
    hint: "Le pays de votre famille pèse fort si vous voulez vous sentir chez vous.",
    max: 3,
    when: (answers) => africanOrigins(answers).length > 0,
    choices: [...COUNTRY_CHOICES, { label: "Je préfère ne pas dire", value: null }],
  },
  {
    id: "faith",
    group: HISTORY,
    chapter: 4,
    title: "Votre religion ?",
    hint: "Pour privilégier les pays où votre religion est la plus pratiquée (Pew Research Center, 2020).",
    when: kinMatters,
    choices: [
      { label: "Islam", value: "muslim" },
      { label: "Christianisme", value: "christian" },
      { label: "Une autre", value: "other" },
      { label: "Aucune", value: "none" },
      { label: "Je préfère ne pas dire", value: null },
    ],
  },
];

/** The choices this reader is offered now. */
export function visibleChoices(question: Question, answers: Answers): Choice[] {
  return question.choices.filter((choice) => choice.when?.(answers) ?? true);
}

/**
 * The answers once those that no longer fit are dropped: a question whose condition fails, a
 * choice no longer offered. Going back and changing an answer re-routes the path this way, and
 * nothing hidden is ever counted (operator, 2026-11-16). Repeated until stable, since dropping
 * one answer can hide another question (no region, so no « Vivre près de vos origines », so no
 * religion).
 */
export function keepInBank(bank: Question[], given: Answers): Answers {
  const answers: Record<string, unknown> = { ...given };
  for (let changed = true; changed;) {
    changed = false;
    for (const question of bank) {
      const value = answers[question.id];
      if (value === undefined) continue;
      const typed = answers as Answers;
      if (!(question.when?.(typed) ?? true)) {
        delete answers[question.id];
        changed = true;
        continue;
      }
      const offered = new Set(visibleChoices(question, typed).map((c) => c.value));
      if (Array.isArray(value)) {
        const kept = value.filter((v) => offered.has(v));
        if (kept.length !== value.length) {
          answers[question.id] = kept.length ? kept : undefined;
          if (!kept.length) delete answers[question.id];
          changed = true;
        }
      } else if (!offered.has(value as Choice["value"])) {
        delete answers[question.id];
        changed = true;
      }
    }
  }
  return answers as Answers;
}

/** The quick quiz's answers, once those that no longer fit are dropped. */
export function keepInPath(answers: Answers): Answers {
  return keepInBank(QUESTIONS, answers);
}

/** The chapter name shown above a question: the second chapter is the trip on holiday. */
export function chapterName(question: Question, answers: Answers): string {
  if (question.chapter === 2) return holiday(answers) ? TRIP : PROJECT;
  return question.group;
}
