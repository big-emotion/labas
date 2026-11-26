import { CITIES } from "./cities";
import { staysNear } from "./reach";
import { SEASONS } from "./holiday";
import type { Answers } from "./ranking";
import { INTL_LOCALE, type Bilingual, type Locale } from "../i18n/locale";
import { countryName } from "../i18n/places";

export interface Choice {
  label: string;
  /** null: the reader would rather not say; it counts as a skip. */
  value: string | number | boolean | null;
  /** A short line under the answer, when it helps. */
  sub?: string;
  /** Offered only when this holds for the answers so far (quiz paths, 2026-11-16). */
  when?: (answers: Answers) => boolean;
  /** The English answer: written next to the French so a missing one is a type error. */
  en: { label: string; sub?: string };
}

export interface Question {
  id: keyof Answers;
  /** The chapter name shown above the question. */
  group: string;
  /**
   * A follow-up: asked right after this question once it is answered, so a theme is not left
   * and taken up again three screens later (operator, 2026-11-17).
   */
  after?: keyof Answers;
  title: string;
  /** One line saying what the question is for. */
  hint?: string;
  choices: Choice[];
  /** Several answers allowed, up to this many. */
  max?: number;
  /** Asked only when this holds for the answers so far. */
  when?: (answers: Answers) => boolean;
  /** The English title and hint (British English, « you »). */
  en: { title: string; hint?: string };
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
    // Families from RD Congo took « Congo » for theirs (operator, 2026-11-22).
    label: country === "Congo" ? "Congo-Brazzaville" : country,
    value: country,
    en: { label: countryName(country, "en") },
    when: (answers: Answers) => africanOrigins(answers).includes(zone),
  }));

/** The chapters, by their French name: `group` keeps the French name the tests and code know. */
const CHAPTERS = {
  project: { fr: "Votre projet", en: "Your plans" },
  trip: { fr: "Votre voyage", en: "Your trip" },
  temperament: { fr: "Votre façon de vivre", en: "Your way of living" },
  history: { fr: "Votre histoire avec l'Afrique", en: "Your story with Africa" },
  last: { fr: "Pour finir", en: "To finish" },
  profile: { fr: "VOTRE PROFIL", en: "YOUR PROFILE" },
  refine: { fr: "POUR AFFINER", en: "TO REFINE" },
} satisfies Record<string, Bilingual<string>>;
export const CHAPTER = {
  temperament: CHAPTERS.temperament.fr,
  profile: CHAPTERS.profile.fr,
  refine: CHAPTERS.refine.fr,
};
const PROJECT = CHAPTERS.project.fr;
const TRIP = CHAPTERS.trip.fr;
const TEMPERAMENT = CHAPTER.temperament;
const HISTORY = CHAPTERS.history.fr;
const LAST = CHAPTERS.last.fr;

const holiday = (answers: Answers) => answers.project === "decouvrir";
/** The reader will spend real time there: not for an investor who does not live there. */
export const livesThere = (answers: Answers) => answers.project !== "investir";
/** The reader will work there: not on holiday, not as a distant investor. */
export const worksThere = (answers: Answers) =>
  answers.project !== "investir" && answers.project !== "decouvrir";
const withChildren = (answers: Answers) =>
  answers.family === "parents" || answers.family === "fonder";

// The quick quiz's pool (operator, 2026-11-17): the project picks which questions apply, and
// adaptive.ts picks the order from the answers. Worded in « vous ». The temperament questions are
// a quick reading inspired by the Big Five, one question per trait.
export const QUESTIONS: Question[] = [
  {
    id: "project",
    group: PROJECT,
    title: "Là-bas, vous vous y voyez comment ?",
    en: {
      title: "How do you picture yourself over there?",
      hint: "Depending on your plans, we look mostly at safety, paperwork, flights or the cost of settling in.",
    },
    hint: "Selon votre projet, on regarde surtout la sécurité, les démarches, les vols ou le coût pour s'installer.",
    choices: [
      {
        label: "M'installer pour de bon",
        value: "installer",
        sub: "Y construire ma vie",
        en: { label: "Settle for good", sub: "Build my life there" },
      },
      {
        label: "Un pied ici, un pied là-bas",
        value: "pied",
        sub: "Des allers-retours réguliers",
        en: { label: "One foot here, one foot there", sub: "Regular trips back and forth" },
      },
      {
        label: "Tester quelques mois",
        value: "tester",
        sub: "Voir si la vie sur place me va",
        en: { label: "Try it for a few months", sub: "See if life there suits me" },
      },
      {
        label: "D'abord des vacances",
        value: "decouvrir",
        sub: "Et je verrai ensuite",
        en: { label: "A holiday first", sub: "And I'll see after that" },
      },
    ],
  },
  {
    id: "wants",
    group: TRIP,
    when: holiday,
    title: "Ce que vous voulez vivre là-bas ?",
    en: {
      title: "What do you want to experience there?",
      hint: "Up to three choices: we look for the cities where you can do it.",
    },
    hint: "Jusqu'à trois choix : on cherche les villes où vous pourrez le faire.",
    max: 3,
    choices: [
      { label: "La plage ou une île", value: "beach", en: { label: "The beach or an island" } },
      {
        label: "Le désert ou la savane",
        value: "wild",
        en: { label: "The desert or the savannah" },
      },
      { label: "La montagne et la nature", value: "nature", en: { label: "Mountains and nature" } },
      { label: "Faire la fête", value: "party", en: { label: "Partying" } },
      { label: "L'histoire et la mémoire", value: "history", en: { label: "History and memory" } },
      { label: "La culture et les musées", value: "culture", en: { label: "Culture and museums" } },
      { label: "Un safari", value: "safari", en: { label: "A safari" } },
      {
        label: "La plongée, le surf ou la glisse",
        value: "sea",
        en: { label: "Diving, surfing or board sports" },
      },
    ],
  },
  {
    id: "season",
    group: TRIP,
    when: holiday,
    title: "Quand partez-vous ?",
    en: {
      title: "When are you going?",
      hint: "To dodge the rainy season and catch the best weather.",
    },
    hint: "Pour éviter la saison des pluies et viser la belle saison.",
    choices: [
      ...SEASONS.map((s) => ({ label: s.label, value: s.value, en: { label: s.en } })),
      { label: "Je ne sais pas encore", value: null, en: { label: "I don't know yet" } },
    ],
  },
  {
    id: "profession",
    group: PROJECT,
    when: worksThere,
    title: "Votre métier ?",
    en: { title: "Your line of work?", hint: "To favour the cities where your field is hiring." },
    hint: "Pour privilégier les villes où votre métier recrute.",
    choices: [
      { label: "Finance", value: "finance", en: { label: "Finance" } },
      { label: "Droit", value: "law", en: { label: "Law" } },
      {
        label: "Conseil, gestion de projet",
        value: "consulting",
        en: { label: "Consulting, project management" },
      },
      { label: "Numérique", value: "tech", en: { label: "Digital and tech" } },
      { label: "Santé", value: "health", en: { label: "Health" } },
      { label: "Enseignement", value: "teaching", en: { label: "Teaching" } },
      { label: "ONG, international", value: "ngo", en: { label: "NGOs, international work" } },
      { label: "Commerce", value: "trade", en: { label: "Trade" } },
      { label: "Culture, médias", value: "culture", en: { label: "Culture, media" } },
      { label: "Artisanat", value: "craft", en: { label: "Crafts" } },
      { label: "Études", value: "student", en: { label: "Studying" } },
      { label: "Retraite", value: "retired", en: { label: "Retired" } },
    ],
  },
  {
    id: "family",
    group: PROJECT,
    when: livesThere,
    title: "Vous partez avec qui ?",
    en: {
      title: "Who are you going with?",
      hint: "With children, schools, healthcare and safety weigh more.",
    },
    hint: "Avec des enfants, les écoles, les soins et la sécurité pèsent davantage.",
    choices: [
      { label: "Seul·e", value: "celib", en: { label: "On my own" } },
      { label: "En couple", value: "couple", en: { label: "As a couple" } },
      {
        label: "Pour fonder une famille",
        value: "fonder",
        when: (a) => !holiday(a),
        en: { label: "To start a family" },
      },
      { label: "Avec mes enfants", value: "parents", en: { label: "With my children" } },
    ],
  },
  {
    id: "languages",
    group: PROJECT,
    title: "Dans quelles langues êtes-vous à l'aise au quotidien ?",
    en: {
      title: "Which languages are you comfortable in day to day?",
      hint: "To suggest cities where daily life happens in one of them.",
    },
    hint: "Pour vous proposer des villes où l'on vit dans l'une de ces langues.",
    max: 6,
    choices: [
      { label: "Français", value: "fr", en: { label: "French" } },
      { label: "Anglais", value: "en", en: { label: "English" } },
      { label: "Portugais", value: "pt", en: { label: "Portuguese" } },
      { label: "Arabe", value: "ar", en: { label: "Arabic" } },
      { label: "Espagnol", value: "es", en: { label: "Spanish" } },
      { label: "Swahili", value: "sw", en: { label: "Swahili" } },
      {
        label: "Peu importe, je m'adapte",
        value: null,
        en: { label: "Doesn't matter, I'll adapt" },
      },
    ],
  },
  {
    id: "size",
    group: PROJECT,
    // Size and pace go together, whichever comes first.
    after: "pace",
    title: "Quelle taille de ville ?",
    en: { title: "What size of city?", hint: "Size only: the pace is asked separately." },
    hint: "La taille seulement : le rythme se demande à part.",
    choices: [
      { label: "Une grande ville", value: 3, en: { label: "A big city" } },
      { label: "Une ville moyenne", value: 2, en: { label: "A mid-sized city" } },
      { label: "Une petite ville", value: 1, en: { label: "A small town" } },
    ],
  },
  {
    id: "pace",
    group: PROJECT,
    after: "size",
    title: "Quel rythme de ville ?",
    en: {
      title: "What pace of city?",
      hint: "A big city can be calm, a small one can stay up late.",
    },
    hint: "Une grande ville peut être calme, une petite peut bouger tard.",
    choices: [
      { label: "Ça bouge jour et nuit", value: 1, en: { label: "Buzzing day and night" } },
      { label: "Animé, sans excès", value: 0.5, en: { label: "Lively, within reason" } },
      { label: "Calme et posé", value: 0, en: { label: "Calm and settled" } },
    ],
  },
  {
    id: "landscapes",
    group: PROJECT,
    // On holiday, « Ce que vous voulez vivre » asks it better.
    when: (answers) => livesThere(answers) && !holiday(answers),
    title: "Quel paysage autour de vous ?",
    en: {
      title: "What landscape around you?",
      hint: "A preference: the landscape you would love to have close to home.",
    },
    hint: "Une préférence : le paysage que vous aimeriez avoir tout près de chez vous.",
    max: 3,
    choices: [
      { label: "La mer", value: "beach", en: { label: "The sea" } },
      { label: "Une île", value: "island", en: { label: "An island" } },
      { label: "Un fleuve ou un lac", value: "water", en: { label: "A river or a lake" } },
      { label: "La montagne ou la forêt", value: "nature", en: { label: "Mountains or forest" } },
      { label: "La savane ou le désert", value: "wildSpaces", en: { label: "Savannah or desert" } },
      {
        label: "Peu importe, la ville me suffit",
        value: "urban",
        en: { label: "Doesn't matter, the city is enough" },
      },
    ],
  },
  {
    id: "saturday",
    group: TEMPERAMENT,
    when: livesThere,
    title: "Votre samedi soir idéal ?",
    en: {
      title: "Your ideal Saturday night?",
      hint: "To know whether you are after a lively city or a calmer one.",
    },
    hint: "Pour savoir si vous cherchez une ville animée ou plutôt calme.",
    choices: [
      {
        label: "Du monde, de la musique, on rentre tard",
        value: 1,
        en: { label: "People, music, home late" },
      },
      {
        label: "Un dîner avec quelques amis",
        value: 0.5,
        en: { label: "Dinner with a few friends" },
      },
      { label: "Chez moi, au calme", value: 0, en: { label: "At home, in peace" } },
    ],
  },
  {
    id: "adventure",
    group: TEMPERAMENT,
    // Only once the reader has declined to name an origin: with one, « Jusqu'où aimeriez-vous
    // aller ? » asks the same thing with the family in mind (lib/reach.ts).
    when: (answers) =>
      livesThere(answers) && answers.origin !== undefined && namedOrigins(answers).length === 0,
    title: "Découvrir une région d'Afrique que vous ne connaissez pas, ça vous tente ?",
    en: {
      title: "Discovering a region of Africa you don't know: does it appeal to you?",
      hint: "If so, we also suggest cities far from your family's region.",
    },
    hint: "Si oui, on vous propose aussi des villes loin de la région de votre famille.",
    choices: [
      {
        label: "Oui, c'est ce que je cherche",
        value: "seeking",
        en: { label: "Yes, that's what I'm looking for" },
      },
      { label: "Pourquoi pas", value: "open", en: { label: "Why not" } },
      {
        label: "Je préfère rester en terrain connu",
        value: "familiar",
        en: { label: "I'd rather stay on familiar ground" },
      },
    ],
  },
  {
    id: "order",
    group: TEMPERAMENT,
    when: livesThere,
    title: "Au quotidien, avez-vous besoin que tout soit organisé ?",
    en: {
      title: "Day to day, do you need everything organised?",
      hint: "To know whether you prefer a city where paperwork is simple and predictable.",
    },
    hint: "Pour savoir si vous préférez une ville où les démarches sont simples et prévisibles.",
    choices: [
      {
        label: "J'ai besoin que tout soit carré",
        en: { label: "I need everything in order", sub: "Clear paperwork, timetables kept" },
        value: 1,
        sub: "Des démarches claires, des horaires tenus",
      },
      {
        label: "Un minimum de cadre me suffit",
        value: 0.5,
        en: { label: "A little structure is enough" },
      },
      {
        label: "J'improvise, tout se négocie",
        value: 0,
        sub: "Je m'adapte au jour le jour",
        en: { label: "I improvise, everything's negotiable", sub: "I adapt day by day" },
      },
    ],
  },
  {
    id: "together",
    group: TEMPERAMENT,
    when: livesThere,
    title: "Pour avancer, vous comptez plutôt sur vous ou sur les autres ?",
    en: {
      title: "To get ahead, do you rely on yourself or on others?",
      hint: "To know whether you want a city of business and competition, or one of mutual help.",
    },
    hint: "Pour savoir si vous cherchez une ville d'affaires et de compétition, ou une ville solidaire.",
    choices: [
      {
        label: "Sur moi",
        value: 0,
        sub: "Que le meilleur gagne",
        en: { label: "On myself", sub: "May the best one win" },
      },
      { label: "Ça dépend des situations", value: 0.5, en: { label: "It depends" } },
      {
        label: "Sur les autres",
        value: 1,
        sub: "L'entraide d'abord",
        en: { label: "On others", sub: "Helping each other first" },
      },
    ],
  },
  {
    id: "friction",
    group: TEMPERAMENT,
    when: livesThere,
    title: "Coupures de courant, démarches lentes, imprévus : comment le vivez-vous ?",
    en: {
      title: "Power cuts, slow paperwork, the unexpected: how do you take it?",
      hint: "If it wears you down, we set aside the cities where these problems are common.",
    },
    hint: "Si cela vous pèse, on écarte les villes où ces problèmes sont fréquents.",
    choices: [
      {
        label: "Ça m'amuse presque, je m'adapte",
        value: 1,
        en: { label: "It almost amuses me, I adapt" },
      },
      { label: "Ça m'agace, mais je gère", value: 0.5, en: { label: "It annoys me, but I cope" } },
      { label: "Ça m'épuise vite", value: 0, en: { label: "It wears me out fast" } },
    ],
  },
  {
    id: "origin",
    group: HISTORY,
    title: "D'où vient votre famille ?",
    en: {
      title: "Where does your family come from?",
      hint: "Optional. To suggest cities close to what you know.",
    },
    hint: "Facultatif. Pour vous proposer des villes proches de vos repères.",
    max: 5,
    choices: [
      { label: "Afrique de l'Ouest", value: "ouest", en: { label: "West Africa" } },
      { label: "Afrique centrale", value: "centre", en: { label: "Central Africa" } },
      { label: "Afrique de l'Est", value: "est", en: { label: "East Africa" } },
      { label: "Afrique australe", value: "sud", en: { label: "Southern Africa" } },
      { label: "Afrique du Nord", value: "nord", en: { label: "North Africa" } },
      {
        label: "Caraïbes, Amériques",
        value: "ameriques",
        en: { label: "The Caribbean, the Americas" },
      },
      { label: "Je préfère ne pas dire", value: null, en: { label: "I'd rather not say" } },
    ],
  },
  // The family's country and the faith are asked in the quick quiz (operator, 2026-11-20): left
  // to the full questionnaire they never weighed on the first result, the one most readers stop at.
  {
    id: "countries",
    group: HISTORY,
    after: "origin",
    title: "De quel pays vient votre famille ?",
    en: {
      title: "Which country does your family come from?",
      hint: "Your family's country weighs heavily if you want to feel at home.",
    },
    hint: "Le pays de votre famille pèse fort si vous voulez vous sentir chez vous.",
    max: 5,
    when: (answers) => africanOrigins(answers).length > 0,
    choices: [
      ...COUNTRY_CHOICES,
      { label: "Je préfère ne pas dire", value: null, en: { label: "I'd rather not say" } },
    ],
  },
  {
    // The guard for a reader who would rather not name an origin (operator, 2026-11-20): asked,
    // never inferred, and only when its answers can still change the top three.
    id: "drawnTo",
    group: HISTORY,
    when: (answers) => answers.origin !== undefined && namedOrigins(answers).length === 0,
    title: "Des régions vous attirent plus que d'autres ?",
    en: {
      title: "Do some regions draw you more than others?",
      hint: "Optional. Their cities come closer; none is removed.",
    },
    hint: "Facultatif. Leurs villes se rapprochent ; aucune n'est retirée.",
    max: 5,
    choices: [
      { label: "Afrique de l'Ouest", value: "ouest", en: { label: "West Africa" } },
      { label: "Afrique centrale", value: "centre", en: { label: "Central Africa" } },
      { label: "Afrique de l'Est", value: "est", en: { label: "East Africa" } },
      { label: "Afrique australe", value: "sud", en: { label: "Southern Africa" } },
      { label: "Afrique du Nord", value: "nord", en: { label: "North Africa" } },
      { label: "Aucune en particulier", value: null, en: { label: "None in particular" } },
    ],
  },
  {
    id: "reach",
    group: HISTORY,
    // Only with a region to be near: « Je préfère ne pas dire » skips it (operator, 2026-11-16).
    when: (answers) => namedOrigins(answers).length > 0,
    title: "Jusqu'où aimeriez-vous aller ?",
    en: {
      title: "How far would you like to go?",
      hint: "Nearly done. Your answer says how much your roots should count in your cities.",
    },
    hint: "Presque fini. Votre réponse dit combien vos origines doivent compter dans vos villes.",
    choices: [
      {
        label: "Dans le pays de ma famille",
        value: "country",
        when: (answers) => (answers.countries ?? []).some(Boolean),
        en: { label: "In my family's country" },
      },
      {
        label: "Dans la même région, d'autres pays aussi",
        value: "region",
        when: (answers) => africanOrigins(answers).length > 0,
        en: { label: "In the same region, other countries too" },
      },
      {
        label: "Ailleurs en Afrique, là où la culture ressemble",
        value: "alike",
        en: { label: "Elsewhere in Africa, where the culture is alike" },
      },
      {
        label: "Partout, surprenez-moi",
        value: "anywhere",
        en: { label: "Anywhere, surprise me" },
      },
    ],
  },
  {
    // Operator, 2026-11-22: readers from south of the Sahara who said « anywhere » turned down
    // the North African cities it gave them; the divide now weighs only on their own word.
    id: "acrossSahara",
    group: HISTORY,
    after: "reach",
    title: "Et de l'autre côté du Sahara, vous iriez aussi ?",
    en: {
      title: "And across the Sahara, would you go too?",
      hint: "Seen from your family's side, North Africa or Africa south of the Sahara.",
    },
    hint: "Vu du côté de votre famille : l'Afrique du Nord, ou l'Afrique au sud du Sahara.",
    // A mixed family is at home on both sides: there is no other side to ask about.
    when: (answers) => {
      const origins = namedOrigins(answers);
      const sides = new Set(origins.map((o) => o === "nord"));
      return answers.reach === "anywhere" && sides.size === 1;
    },
    choices: [
      {
        label: "Oui, montrez-moi aussi ces villes",
        value: "yes",
        en: { label: "Yes, show me those cities too" },
      },
      { label: "Plutôt pas", value: "no", en: { label: "Rather not" } },
    ],
  },
  {
    id: "faith",
    group: HISTORY,
    after: "reach",
    title: "Votre religion ?",
    en: {
      title: "Your religion?",
      hint: "To favour the countries where your religion is most widely practised (Pew Research Center, 2020).",
    },
    hint: "Pour privilégier les pays où votre religion est la plus pratiquée (Pew Research Center, 2020).",
    when: staysNear,
    choices: [
      { label: "Islam", value: "muslim", en: { label: "Islam" } },
      { label: "Christianisme", value: "christian", en: { label: "Christianity" } },
      { label: "Une autre", value: "other", en: { label: "Another one" } },
      { label: "Aucune", value: "none", en: { label: "None" } },
      { label: "Je préfère ne pas dire", value: null, en: { label: "I'd rather not say" } },
    ],
  },
  {
    id: "priorities",
    group: LAST,
    title: "Sur quoi ne voulez-vous pas transiger ?",
    en: {
      title: "What won't you compromise on?",
      hint: "Up to three choices. These are your non-negotiables: they count most in your ranking.",
    },
    hint: "Jusqu'à trois choix. Ce sont vos non-négociables : ils comptent le plus dans votre classement.",
    max: 3,
    choices: [
      { label: "Me sentir en sécurité", value: "safety", en: { label: "Feeling safe" } },
      { label: "Une vie abordable", value: "cost", en: { label: "An affordable life" } },
      { label: "De bons soins", value: "health", en: { label: "Good healthcare" } },
      {
        label: "L'école des enfants",
        value: "schools",
        when: withChildren,
        en: { label: "The children's schooling" },
      },
      { label: "Ma carrière", value: "career", when: worksThere, en: { label: "My career" } },
      {
        label: "Retrouver d'autres repats",
        value: "diaspora",
        when: (a) => !holiday(a),
        en: { label: "Meeting other returnees" },
      },
      {
        label: "Les lieux de mémoire (traite, histoire des diasporas)",
        value: "memory",
        en: { label: "Places of memory (the slave trade, diaspora history)" },
      },
      { label: "Voyager facilement", value: "flights", en: { label: "Travelling easily" } },
    ],
  },
];

/**
 * Asked in the full questionnaire, not the quick quiz: measured on 40 runs per path, they move the
 * top five least (operator, 2026-11-16). Their rules still hold there. The family's country and
 * the faith left this list on 2026-11-20.
 */
export const LATER: Question[] = [
  {
    id: "duration",
    group: TRIP,
    when: holiday,
    title: "Combien de temps ?",
    en: { title: "How long for?", hint: "For a short stay, we favour cities with direct flights." },
    hint: "Pour un séjour court, on privilégie les villes desservies par des vols directs.",
    choices: [
      { label: "Un long week-end", value: "weekend", en: { label: "A long weekend" } },
      { label: "Une semaine", value: "week", en: { label: "A week" } },
      { label: "Deux à trois semaines", value: "weeks", en: { label: "Two to three weeks" } },
      { label: "Un mois ou plus", value: "month", en: { label: "A month or more" } },
    ],
  },
  {
    id: "tripsHome",
    group: PROJECT,
    // Living there, not on holiday: how often the reader flies back.
    when: (answers) => livesThere(answers) && !holiday(answers),
    title: "Combien d'allers-retours vers l'Europe par an ?",
    en: {
      title: "How many return trips to Europe a year?",
      hint: "The more often you go back, the more direct flights count.",
    },
    hint: "Plus vous rentrez souvent, plus les vols directs comptent.",
    choices: [
      { label: "Un ou moins", value: 0, en: { label: "One or fewer" } },
      { label: "Deux ou trois", value: 0.5, en: { label: "Two or three" } },
      { label: "Tous les mois", value: 1, en: { label: "Every month" } },
    ],
  },
  {
    id: "budget",
    group: PROJECT,
    when: livesThere,
    title: "Votre budget sur place ?",
    en: {
      title: "Your budget there?",
      hint: "To favour the cities where housing and everyday life fit your budget.",
    },
    hint: "Pour privilégier les villes où le logement et la vie courante tiennent dans votre budget.",
    choices: [
      { label: "Serré", value: "serre", en: { label: "Tight" } },
      { label: "Moyen", value: "moyen", en: { label: "Medium" } },
      { label: "Le prix compte peu", value: "large", en: { label: "Price matters little" } },
    ],
  },
  {
    id: "passports",
    group: PROJECT,
    title: "Quel passeport avez-vous ?",
    en: {
      title: "Which passport do you hold?",
      hint: "To favour the countries you can enter without a visa or move around freely.",
    },
    hint: "Pour privilégier les pays où vous entrez sans visa ou circulez librement.",
    max: 2,
    choices: [
      { label: "Français ou européen", value: "eu", en: { label: "French or European" } },
      { label: "D'un pays de la CEDEAO", value: "ecowas", en: { label: "From an ECOWAS country" } },
      { label: "De la CEMAC", value: "cemac", en: { label: "From CEMAC" } },
      {
        label: "De la Communauté d'Afrique de l'Est",
        value: "eac",
        en: { label: "From the East African Community" },
      },
      { label: "Un autre", value: "other", en: { label: "Another one" } },
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
export function chapterName(question: Question, answers: Answers, locale: Locale): string {
  const group =
    question.group === PROJECT && question.id !== "project"
      ? holiday(answers)
        ? TRIP
        : PROJECT
      : question.group;
  return Object.values(CHAPTERS).find((chapter) => chapter.fr === group)?.[locale] ?? group;
}

/**
 * The question as a reader of this language reads it; values, conditions and order stay the
 * French bank's, since both languages share answers. The family's countries are re-sorted, as
 * an alphabetical list read in another language would look shuffled.
 */
export function questionIn(question: Question, locale: Locale): Question {
  if (locale === "fr") return question;
  const choices = question.choices.map((choice) => ({
    ...choice,
    label: choice.en.label,
    sub: choice.en.sub,
  }));
  if (question.id === "countries")
    choices.sort((a, b) =>
      a.value === null ? 1 : b.value === null ? -1 : a.label.localeCompare(b.label, INTL_LOCALE.en),
    );
  return { ...question, title: question.en.title, hint: question.en.hint, choices };
}
