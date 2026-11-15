import { QUESTIONS, type Question } from "./questions";

/**
 * The fuller questionnaire of /approfondir: the free quiz's bank, then the filters and stated
 * tolerances of docs/criteria/architecture.md §2 and §4.4. Kept to what the sourced data can
 * answer today; the rest of the §4.4 bank waits for its data.
 */
const FURTHER: Omit<Question, "group">[] = [
  {
    id: "currentCity",
    title: "Vous vivez où aujourd'hui ?",
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
    title: "Là-bas, votre rythme :",
    choices: [
      { label: "Le même qu'aujourd'hui", value: "same" },
      { label: "Plus calme", value: "calmer" },
      { label: "Plus intense", value: "more" },
      { label: "Couper avec tout", value: "unplug" },
    ],
  },
  {
    id: "mobility",
    title: "Comment vous déplacez-vous au quotidien ?",
    choices: [
      { label: "À pied", value: "walk" },
      { label: "En transports", value: "transit" },
      { label: "À vélo", value: "bike" },
      { label: "En voiture", value: "car" },
    ],
  },
  {
    id: "habits",
    title: "Votre quotidien, c'est plutôt…",
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
    title: "Votre quartier aujourd'hui :",
    choices: [
      { label: "Central et animé", value: "central" },
      { label: "Résidentiel et calme", value: "residential" },
      { label: "Plutôt chic", value: "upscale" },
      { label: "Populaire et vivant", value: "popular" },
    ],
  },
  {
    id: "people",
    title: "Avec les gens, vous aimez…",
    choices: [
      { label: "Être invité, connaître mes voisins", value: "invited" },
      { label: "Garder ma tranquillité", value: "quiet" },
      { label: "Un peu des deux", value: "both" },
    ],
  },
  {
    id: "belonging",
    title: "Là-bas, vous voulez vivre…",
    choices: [
      { label: "Parmi les gens du coin", value: "locals" },
      { label: "Avec d'autres repats", value: "returnees" },
      { label: "Un peu des deux", value: "both" },
    ],
  },
  {
    id: "roots",
    title: "Vous cherchez plutôt à…",
    choices: [
      { label: "Retrouver mes racines", value: "rediscover" },
      { label: "Découvrir ailleurs", value: "discover" },
      { label: "Les deux", value: "both" },
    ],
  },
  {
    id: "climate",
    title: "Côté météo ?",
    choices: [
      { label: "Chaud toute l'année", value: "hot" },
      { label: "Doux", value: "mild" },
      { label: "Sec et ensoleillé", value: "dry" },
    ],
  },
  {
    id: "languageOnly",
    title: "Votre langue, c'est…",
    choices: [
      { label: "Indispensable au quotidien", value: true },
      { label: "Un plus", value: false },
    ],
  },
  {
    id: "schoolCurriculum",
    title: "Des enfants à scolariser là-bas ?",
    choices: [
      { label: "Oui, en programme français", value: "french" },
      { label: "Oui, en programme anglais", value: "english" },
      { label: "Oui, peu importe le programme", value: "any" },
    ],
  },
  {
    id: "specialistCare",
    title: "Un besoin de soins suivis (traitement, grossesse, parent âgé) ?",
    choices: [
      { label: "Oui", value: true },
      { label: "Non", value: false },
    ],
  },
  {
    id: "visaFreeOnly",
    title: "Pour un premier séjour, vous voulez éviter le visa ?",
    choices: [
      { label: "Oui, sans visa", value: true },
      { label: "Le visa ne me gêne pas", value: false },
    ],
  },
  {
    id: "excludeCriminalising",
    title: "Vous voulez écarter les pays qui punissent l'homosexualité ?",
    choices: [
      { label: "Oui, écarte-les", value: true },
      { label: "Non", value: false },
    ],
  },
  {
    id: "crowds",
    title: "Le bruit et la foule…",
    choices: [
      { label: "Me donnent de l'énergie", value: 1 },
      { label: "Ça dépend", value: 0.5 },
      { label: "Me fatiguent", value: 0 },
    ],
  },
  {
    id: "friction",
    title: "Coupures de courant, démarches longues, imprévus…",
    choices: [
      { label: "Je fais avec", value: 1 },
      { label: "Ça me pèse", value: 0.5 },
      { label: "Je veux l'éviter", value: 0 },
    ],
  },
  {
    id: "bargaining",
    title: "Négocier les prix (loyer, taxi, marché), pour vous c'est…",
    choices: [
      { label: "Un jeu", value: 1 },
      { label: "Ça va", value: 0.5 },
      { label: "Une corvée", value: 0 },
    ],
  },
  {
    id: "tripsHome",
    title: "Combien d'allers-retours vers l'Europe par an ?",
    choices: [
      { label: "Un ou moins", value: 0 },
      { label: "Deux ou trois", value: 0.5 },
      { label: "Tous les mois", value: 1 },
    ],
  },
  {
    id: "setupBudget",
    title: "Combien pouvez-vous avancer pour vous installer (caution, loyers d'avance) ?",
    choices: [
      { label: "Moins de 2 000 €", value: "low" },
      { label: "2 000 à 6 000 €", value: "medium" },
      { label: "Plus", value: "high" },
    ],
  },
  {
    id: "belonging",
    title: "Là-bas, vous aimeriez…",
    choices: [
      { label: "Retrouver d'autres repats", value: "returnees" },
      { label: "Vivre comme les gens d'ici", value: "locals" },
      { label: "Les deux", value: "both" },
    ],
  },
  {
    id: "renounce",
    title: "À quoi pouvez-vous renoncer ?",
    max: 2,
    choices: [
      { label: "La vie culturelle", value: "culture" },
      { label: "Un internet rapide", value: "internet" },
      { label: "Les avions directs", value: "flights" },
      { label: "Les lieux d'histoire", value: "history" },
      { label: "Un emploi sur place", value: "jobs" },
    ],
  },
];

export const DEEP_QUESTIONS: Question[] = [
  ...QUESTIONS,
  ...FURTHER.filter((q) => !QUESTIONS.some((free) => free.id === q.id)).map((q) => ({
    ...q,
    group: "POUR AFFINER",
  })),
];
