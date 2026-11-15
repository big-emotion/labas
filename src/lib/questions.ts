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

const HISTORY = "Votre histoire avec l'Afrique";
const TEMPERAMENT = "Votre tempérament";
const PROJECT = "Votre projet de vie";
const DAILY = "Votre quotidien";

/** Feeling at home matters to the reader: only then are faith and its weight asked. */
/** The reader will spend real time there: not for an investor who does not live there. */
const livesThere = (answers: Answers) => answers.project !== "investir";
/** The reader will work there: not on holiday, not as a distant investor. */
const worksThere = (answers: Answers) =>
  answers.project !== "investir" && answers.project !== "decouvrir";

const kinMatters = (answers: Answers) => answers.kin === "much" || answers.kin === "some";

// The free quiz of the approved V3 mockup (canvas « Là-bas — quiz », 2026-11-15): four chapters
// in a fixed order, so the reader always sees « question 7 sur 18 ». Worded in « vous ». The
// temperament chapter is a quick reading inspired by the Big Five, one question per trait.
export const QUESTIONS: Question[] = [
  {
    id: "project",
    group: HISTORY,
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
    id: "origin",
    group: HISTORY,
    title: "D'où vient votre famille ?",
    hint: "Facultatif. Pour vous proposer des villes proches de vos repères et vous éviter les pays où le racisme est documenté.",
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
    title: "De quel pays vient votre famille ?",
    hint: "Le pays de votre famille pèse fort si vous voulez vous sentir chez vous.",
    max: 3,
    when: (answers) => africanOrigins(answers).length > 0,
    choices: [...COUNTRY_CHOICES, { label: "Je préfère ne pas dire", value: null }],
  },
  {
    id: "kin",
    group: HISTORY,
    title: "Vivre près de vos origines, de votre culture, de votre religion, ça compte pour vous ?",
    hint: "Si oui, on privilégie les villes proches de la région de votre famille.",
    choices: [
      { label: "Beaucoup", value: "much" },
      { label: "Un peu", value: "some" },
      { label: "Pas vraiment", value: "none" },
    ],
  },
  {
    id: "faith",
    group: HISTORY,
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
  {
    id: "saturday",
    group: TEMPERAMENT,
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
    id: "profession",
    group: PROJECT,
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
    id: "budget",
    group: PROJECT,
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
    id: "family",
    group: PROJECT,
    when: livesThere,
    title: "Vous partez avec qui ?",
    hint: "Avec des enfants, les écoles, les soins et la sécurité pèsent davantage.",
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
    id: "languages",
    group: DAILY,
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
    ],
  },
  {
    id: "size",
    group: DAILY,
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
    group: DAILY,
    when: livesThere,
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
    id: "priorities",
    group: DAILY,
    title: "Ce qui compte le plus pour vous ?",
    hint: "Jusqu'à trois choix. Ils pèsent lourd dans le résultat.",
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
