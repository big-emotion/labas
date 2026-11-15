import type { Answers } from "./ranking";

export interface Choice {
  label: string;
  /** null: the reader would rather not say; it counts as a skip. */
  value: string | number | boolean | null;
}

export interface Question {
  id: keyof Answers;
  /** The family the question belongs to, shown above it. */
  group: string;
  title: string;
  choices: Choice[];
  /** Several answers allowed, up to this many. */
  max?: number;
  /** Asked only when this holds for the answers so far. */
  when?: (answers: Answers) => boolean;
}

const PROJECT = "TON PROJET";
const TODAY = "TA VIE AUJOURD'HUI";
const ROOTS = "TES RACINES";
const TASTES = "TES GOÛTS";
const MATTERS = "CE QUI COMPTE";

// The bank of the approved mockup (canvas « Là-bas — quiz », board « La banque de questions »,
// 2026-11-15). Each reader sees 8 to 12 of them, chosen one by one (adaptive.ts). Worded in
// « tu » and kept playful (docs/criteria/architecture.md §A.3).
export const QUESTIONS: Question[] = [
  {
    id: "project",
    group: PROJECT,
    title: "Là-bas, tu t'y vois comment ?",
    choices: [
      { label: "M'installer pour de bon", value: "installer" },
      { label: "Un pied ici, un pied là-bas", value: "pied" },
      { label: "Tester quelques mois", value: "tester" },
      { label: "Investir sans y vivre", value: "investir" },
      { label: "D'abord des vacances", value: "decouvrir" },
    ],
  },
  {
    id: "family",
    group: PROJECT,
    title: "Tu pars avec qui ?",
    choices: [
      { label: "Seul·e", value: "celib" },
      { label: "En couple", value: "couple" },
      { label: "Pour fonder une famille", value: "fonder" },
      { label: "Avec mes enfants", value: "parents" },
    ],
  },
  {
    id: "budget",
    group: PROJECT,
    title: "Ton budget sur place ?",
    choices: [
      { label: "Serré", value: "serre" },
      { label: "Moyen", value: "moyen" },
      { label: "Le prix compte peu", value: "large" },
    ],
  },
  {
    id: "currentCity",
    group: TODAY,
    title: "Tu vis où aujourd'hui ?",
    choices: [
      { label: "Une grande capitale (Paris, Bruxelles…)", value: "capital" },
      { label: "Une grande ville", value: "bigcity" },
      { label: "Une petite ville", value: "town" },
      { label: "À la campagne", value: "country" },
      { label: "Je bouge tout le temps", value: "nomad" },
    ],
  },
  {
    id: "rhythm",
    group: TODAY,
    title: "Là-bas, ton rythme :",
    choices: [
      { label: "Le même qu'aujourd'hui", value: "same" },
      { label: "Plus calme", value: "calmer" },
      { label: "Plus intense", value: "more" },
      { label: "Couper avec tout", value: "unplug" },
    ],
  },
  {
    id: "mobility",
    group: TODAY,
    title: "Comment tu te déplaces au quotidien ?",
    choices: [
      { label: "À pied", value: "walk" },
      { label: "En transports", value: "transit" },
      { label: "À vélo", value: "bike" },
      { label: "En voiture", value: "car" },
    ],
  },
  {
    id: "habits",
    group: TODAY,
    title: "Ton quotidien, c'est plutôt…",
    max: 3,
    choices: [
      { label: "Salle de sport", value: "gym" },
      { label: "Cafés et restaurants", value: "cafes" },
      { label: "Livres et expos", value: "culture" },
      { label: "Marchés et petits commerces", value: "markets" },
      { label: "Sorties le soir", value: "nights" },
      { label: "Nature le week-end", value: "nature" },
    ],
  },
  {
    id: "neighbourhood",
    group: TODAY,
    title: "Ton quartier aujourd'hui :",
    choices: [
      { label: "Central et animé", value: "central" },
      { label: "Résidentiel et calme", value: "residential" },
      { label: "Plutôt chic", value: "upscale" },
      { label: "Populaire et vivant", value: "popular" },
    ],
  },
  {
    id: "profession",
    group: TODAY,
    title: "Ton métier ?",
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
    id: "origin",
    group: ROOTS,
    title: "D'où vient ta famille ?",
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
    id: "roots",
    group: ROOTS,
    title: "Tu cherches plutôt à…",
    choices: [
      { label: "Retrouver mes racines", value: "rediscover" },
      { label: "Découvrir ailleurs", value: "discover" },
      { label: "Les deux", value: "both" },
    ],
  },
  {
    id: "kin",
    group: ROOTS,
    title: "Te sentir parmi les tiens, ça compte ?",
    choices: [
      { label: "Beaucoup", value: "much" },
      { label: "Un peu", value: "some" },
      { label: "Pas vraiment", value: "none" },
    ],
  },
  {
    id: "adventure",
    group: ROOTS,
    title: "Partir loin de ce que tu connais, ça te tente ?",
    choices: [
      { label: "Oui, c'est ce que je cherche", value: "seeking" },
      { label: "Pourquoi pas", value: "open" },
      { label: "Je préfère rester en terrain connu", value: "familiar" },
    ],
  },
  {
    id: "faith",
    group: ROOTS,
    title: "Ta religion ?",
    when: (answers) => answers.kin === "much" || answers.kin === "some",
    choices: [
      { label: "Islam", value: "muslim" },
      { label: "Christianisme", value: "christian" },
      { label: "Une autre", value: "other" },
      { label: "Aucune", value: "none" },
      { label: "Je préfère ne pas dire", value: null },
    ],
  },
  {
    id: "languages",
    group: ROOTS,
    title: "Tu es à l'aise en…",
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
    id: "passports",
    group: ROOTS,
    title: "Ton passeport ?",
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
    id: "saturday",
    group: TASTES,
    title: "Ton samedi soir idéal ?",
    choices: [
      { label: "Danser jusqu'au matin", value: 1 },
      { label: "Un bon dîner entre amis", value: 0.5 },
      { label: "Tranquille chez moi", value: 0 },
    ],
  },
  {
    id: "landscapes",
    group: TASTES,
    title: "Le week-end, tu files où ?",
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
    id: "climate",
    group: TASTES,
    title: "Côté météo ?",
    choices: [
      { label: "Chaud toute l'année", value: "hot" },
      { label: "Doux", value: "mild" },
      { label: "Sec et ensoleillé", value: "dry" },
    ],
  },
  {
    id: "people",
    group: TASTES,
    title: "Avec les gens, tu aimes…",
    choices: [
      { label: "Être invité, connaître mes voisins", value: "invited" },
      { label: "Garder ma tranquillité", value: "quiet" },
      { label: "Un peu des deux", value: "both" },
    ],
  },
  {
    id: "belonging",
    group: TASTES,
    title: "Là-bas, tu veux vivre…",
    choices: [
      { label: "Parmi les gens du coin", value: "locals" },
      { label: "Avec d'autres repats", value: "returnees" },
      { label: "Un peu des deux", value: "both" },
    ],
  },
  {
    id: "friction",
    group: MATTERS,
    title: "Coupures, démarches, imprévus…",
    choices: [
      { label: "Je fais avec", value: 1 },
      { label: "Ça me pèse", value: 0.5 },
      { label: "Je veux l'éviter", value: 0 },
    ],
  },
  {
    id: "priorities",
    group: MATTERS,
    title: "Ce qui compte le plus pour toi ?",
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
