import { CITIES } from "./cities";
import type { Answers } from "./ranking";

export interface Choice {
  label: string;
  /** null: the reader would rather not say; it counts as a skip. */
  value: string | number | boolean | null;
  /** The region a choice belongs to: only choices of regions already picked are shown. */
  zone?: string;
  /** A short line under the answer, when it helps. */
  sub?: string;
}

export interface Question {
  id: keyof Answers;
  /** The chapter the question belongs to, shown above it. */
  group: string;
  title: string;
  /** One line saying what the question is for. */
  hint?: string;
  choices: Choice[];
  /** Several answers allowed, up to this many. */
  max?: number;
  /** Asked only when this holds for the answers so far. */
  when?: (answers: Answers) => boolean;
}

/** African family regions picked so far. */
const africanOrigins = (answers: Answers): string[] =>
  (Array.isArray(answers.origin) ? answers.origin : [answers.origin]).filter(
    (o): o is Exclude<typeof o, undefined> => Boolean(o) && o !== "ameriques",
  );

const COUNTRY_CHOICES: Choice[] = [
  ...new Map(CITIES.map((city) => [city.country, city.zone])).entries(),
]
  .sort(([a], [b]) => a.localeCompare(b, "fr"))
  .map(([country, zone]) => ({ label: country, value: country, zone }));

const HISTORY = "Ton histoire avec l'Afrique";
const TEMPERAMENT = "Ton tempérament";
const PROJECT = "Ton projet de vie";
const DAILY = "Ton quotidien";

/** Feeling at home matters to the reader: only then are faith and its weight asked. */
const kinMatters = (answers: Answers) => answers.kin === "much" || answers.kin === "some";

// The free quiz of the approved V3 mockup (canvas « Là-bas — quiz », 2026-11-15): four chapters
// in a fixed order, so the reader always sees « question 7 sur 18 ». Worded in « tu ». The
// temperament chapter is a quick reading inspired by the Big Five, one question per trait.
export const QUESTIONS: Question[] = [
  {
    id: "project",
    group: HISTORY,
    title: "Là-bas, tu t'y vois comment ?",
    hint: "Pas besoin d'un projet arrêté : chaque ville dira aussi ce qu'elle vaut pour y vivre.",
    choices: [
      { label: "M'installer pour de bon", value: "installer", sub: "Y construire ma vie" },
      { label: "Un pied ici, un pied là-bas", value: "pied", sub: "Des allers-retours réguliers" },
      { label: "Tester quelques mois", value: "tester", sub: "Voir si la vie sur place me va" },
      { label: "Investir sans y vivre", value: "investir" },
      { label: "D'abord des vacances", value: "decouvrir", sub: "Et je verrai ensuite" },
    ],
  },
  {
    id: "origin",
    group: HISTORY,
    title: "D'où vient ta famille ?",
    hint: "Facultatif. Sert à repérer les régions où tu as des repères. Rien n'est enregistré.",
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
    id: "countries",
    group: HISTORY,
    title: "Et le pays ?",
    hint: "Le pays de ta famille compte fort si tu veux te sentir chez toi.",
    max: 3,
    when: (answers) => africanOrigins(answers).length > 0,
    choices: [...COUNTRY_CHOICES, { label: "Je préfère ne pas dire", value: null }],
  },
  {
    id: "kin",
    group: HISTORY,
    title: "Te sentir parmi les tiens, ça compte ?",
    hint: "Origine, culture, religion : ce qui fait qu'on se sent chez soi.",
    choices: [
      { label: "Beaucoup", value: "much" },
      { label: "Un peu", value: "some" },
      { label: "Pas vraiment", value: "none" },
    ],
  },
  {
    id: "faith",
    group: HISTORY,
    title: "Ta religion ?",
    hint: "Pour savoir si ta foi est largement partagée dans le pays (Pew Research Center, 2020).",
    when: kinMatters,
    choices: [
      { label: "Islam", value: "muslim" },
      { label: "Christianisme", value: "christian" },
      { label: "Une autre", value: "other" },
      { label: "Aucune", value: "none" },
      { label: "Je préfère ne pas dire", value: null },
    ],
  },
  {
    id: "saturday",
    group: TEMPERAMENT,
    title: "Ton samedi soir idéal ?",
    hint: "Ton envie de monde, comparée à l'énergie de chaque ville.",
    choices: [
      { label: "Du monde, de la musique, on rentre tard", value: 1 },
      { label: "Un dîner avec quelques amis", value: 0.5 },
      { label: "Chez moi, au calme", value: 0 },
    ],
  },
  {
    id: "adventure",
    group: TEMPERAMENT,
    title: "Partir loin de ce que tu connais, ça te tente ?",
    hint: "Ton goût du dépaysement, comparé à ce que chaque ville a de nouveau pour toi.",
    choices: [
      { label: "Oui, c'est ce que je cherche", value: "seeking" },
      { label: "Pourquoi pas", value: "open" },
      { label: "Je préfère rester en terrain connu", value: "familiar" },
    ],
  },
  {
    id: "order",
    group: TEMPERAMENT,
    title: "Les règles et l'organisation, pour toi ?",
    hint: "Ton besoin de cadre, comparé à l'ordre et à la prévisibilité de chaque ville.",
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
    title: "Dans la vie, tu avances comment ?",
    hint: "Comparé à l'esprit de chaque ville : plutôt compétition, ou plutôt entraide.",
    choices: [
      { label: "Je trace ma route", value: 0, sub: "Que le meilleur gagne" },
      { label: "Ça dépend des situations", value: 0.5 },
      { label: "Avec les autres, l'entraide d'abord", value: 1 },
    ],
  },
  {
    id: "friction",
    group: TEMPERAMENT,
    title: "Coupures, démarches, imprévus…",
    hint: "Ce que tu encaisses, comparé à l'intensité de chaque ville.",
    choices: [
      { label: "Ça m'amuse presque, je m'adapte", value: 1 },
      { label: "Ça m'agace, mais je gère", value: 0.5 },
      { label: "Ça m'épuise vite", value: 0 },
    ],
  },
  {
    id: "profession",
    group: PROJECT,
    title: "Ton métier ?",
    hint: "Toutes les villes n'offrent pas les mêmes débouchés selon le métier.",
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
    id: "budget",
    group: PROJECT,
    title: "Ton budget sur place ?",
    hint: "Pour comparer avec ce que coûtent un logement et la vie courante.",
    choices: [
      { label: "Serré", value: "serre" },
      { label: "Moyen", value: "moyen" },
      { label: "Le prix compte peu", value: "large" },
    ],
  },
  {
    id: "family",
    group: PROJECT,
    title: "Tu pars avec qui ?",
    hint: "Les écoles, les soins et le rythme comptent plus avec des enfants.",
    choices: [
      { label: "Seul·e", value: "celib" },
      { label: "En couple", value: "couple" },
      { label: "Pour fonder une famille", value: "fonder" },
      { label: "Avec mes enfants", value: "parents" },
    ],
  },
  {
    id: "passports",
    group: PROJECT,
    title: "Ton passeport ?",
    hint: "Pour savoir où tu entres sans visa, et où tu circules librement.",
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
    id: "languages",
    group: DAILY,
    title: "Tu es à l'aise en…",
    hint: "La langue de tous les jours compte plus que tout le reste.",
    max: 6,
    choices: [
      { label: "Français", value: "fr" },
      { label: "Anglais", value: "en" },
      { label: "Portugais", value: "pt" },
      { label: "Arabe", value: "ar" },
      { label: "Espagnol", value: "es" },
      { label: "Swahili", value: "sw" },
    ],
  },
  {
    id: "size",
    group: DAILY,
    title: "Plutôt une ville qui…",
    hint: "La taille et le rythme de la ville.",
    choices: [
      { label: "Vibre jour et nuit", value: 3 },
      { label: "Reste à taille humaine", value: 2 },
      { label: "Prend son temps", value: 1 },
    ],
  },
  {
    id: "landscapes",
    group: DAILY,
    title: "Le week-end, tu files où ?",
    hint: "Mer, île, fleuve, montagne ou désert : le paysage autour de la ville.",
    max: 3,
    choices: [
      { label: "À la plage", value: "beach" },
      { label: "Sur une île", value: "island" },
      { label: "Au bord d'un fleuve ou d'un lac", value: "water" },
      { label: "En montagne, en forêt", value: "nature" },
      { label: "Dans la savane ou le désert", value: "wildSpaces" },
      { label: "Je reste en ville", value: "urban" },
    ],
  },
  {
    id: "priorities",
    group: DAILY,
    title: "Ce qui compte le plus pour toi ?",
    hint: "Jusqu'à trois priorités. Elles pèsent lourd dans le score.",
    max: 3,
    choices: [
      { label: "Me sentir en sécurité", value: "safety" },
      { label: "Une vie abordable", value: "cost" },
      { label: "La santé et l'école", value: "healthAndSchools" },
      { label: "Ma carrière", value: "career" },
      { label: "Retrouver d'autres repats", value: "diaspora" },
      { label: "La mémoire de la diaspora", value: "memory" },
      { label: "Voyager facilement", value: "flights" },
    ],
  },
];
