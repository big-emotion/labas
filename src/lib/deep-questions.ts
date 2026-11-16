import { LATER, livesThere, namedOrigins, QUESTIONS, worksThere, type Question } from "./questions";
import { MUSIC } from "./music";
import type { Answers } from "./ranking";

/**
 * The fuller questionnaire of /approfondir: the quick quiz's bank, then filters and stated
 * tolerances. Kept to what the sourced data can answer today.
 */
const FURTHER: Omit<Question, "group">[] = [
  {
    id: "currentCity",
    when: livesThere,
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
    when: livesThere,
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
    when: livesThere,
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
    when: livesThere,
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
    when: livesThere,
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
    when: livesThere,
    title: "Avec les gens, vous aimez…",
    choices: [
      { label: "Être invité, connaître mes voisins", value: "invited" },
      { label: "Garder ma tranquillité", value: "quiet" },
      { label: "Un peu des deux", value: "both" },
    ],
  },
  {
    id: "belonging",
    when: livesThere,
    title: "Là-bas, vous voulez vivre…",
    choices: [
      { label: "Parmi les gens du coin", value: "locals" },
      { label: "Avec d'autres repats", value: "returnees" },
      { label: "Un peu des deux", value: "both" },
    ],
  },
  {
    id: "roots",
    when: (a) => namedOrigins(a).length > 0,
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
    when: (a) => a.family === "parents" || a.family === "fonder",
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
    when: (a) => a.project === "decouvrir" || a.project === "tester",
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
    id: "setupBudget",
    when: (a) => a.project === "installer" || a.project === "tester" || a.project === "pied",
    title: "Combien pouvez-vous avancer pour vous installer (caution, loyers d'avance) ?",
    choices: [
      { label: "Moins de 2 000 €", value: "low" },
      { label: "2 000 à 6 000 €", value: "medium" },
      { label: "Plus", value: "high" },
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
      { label: "Un emploi sur place", value: "jobs", when: worksThere },
    ],
  },
];

const settling = (a: Answers) =>
  Boolean(a.project) && a.project !== "decouvrir" && a.project !== "investir";
const holiday = (a: Answers) => a.project === "decouvrir";

/**
 * Asked only to the readers they fit, before the general questions: the project and the
 * temperament answers decide (validated by the operator, 2026-11-15).
 */
const PROFILE: Omit<Question, "group">[] = [
  {
    id: "music",
    title: "La musique qui vous fait bouger ?",
    hint: "Jusqu'à deux choix : on rapproche un peu les pays où elle fait danser.",
    max: 2,
    when: (a) => a.saturday === 1,
    choices: MUSIC.map((genre) => ({ label: genre.label, value: genre.value })),
  },
  {
    id: "nightOut",
    title: "Vos soirées là-bas, plutôt…",
    when: (a) => holiday(a) && a.saturday === 1,
    choices: [
      { label: "Clubs et concerts jusqu'à l'aube", value: "clubs" },
      { label: "Maquis et bars où l'on danse", value: "maquis" },
      { label: "Un verre au bord de l'eau, au coucher du soleil", value: "waterside" },
    ],
  },
  {
    id: "quietStay",
    title: "Des vacances au calme, c'est…",
    when: (a) => holiday(a) && a.saturday === 0,
    choices: [
      { label: "La plage, et c'est tout", value: "beach" },
      { label: "Marcher, randonner, respirer", value: "walks" },
      { label: "Visiter des villes d'histoire, sans se presser", value: "history" },
    ],
  },
  {
    id: "offTrack",
    title: "Sortir des sentiers battus, jusqu'où ?",
    when: (a) => holiday(a) && a.adventure === "seeking",
    choices: [
      { label: "Là où peu de visiteurs vont", value: "far" },
      { label: "Un peu, avec un point de chute confortable", value: "some" },
      { label: "Pas trop loin du confort", value: "near" },
    ],
  },
  {
    id: "afterWork",
    title: "En semaine, après le travail ?",
    when: (a) => settling(a) && a.saturday !== undefined && a.saturday >= 0.5,
    choices: [
      { label: "Afterworks et rooftops", value: "rooftops" },
      { label: "Sport et plein air", value: "outdoors" },
      { label: "Rentrer chez moi au calme", value: "home" },
    ],
  },
  {
    id: "friends",
    title: "Pour vous faire des amis là-bas ?",
    when: (a) => settling(a) && a.together === 1,
    choices: [
      { label: "Associations et bénévolat", value: "associations" },
      { label: "La diaspora et d'autres repats", value: "diaspora" },
      { label: "Les voisins, la vie de quartier", value: "neighbours" },
    ],
  },
  {
    id: "mustWork",
    title: "Ce qui doit marcher sans faute ?",
    max: 2,
    when: (a) => settling(a) && a.friction === 0,
    choices: [
      { label: "Le courant et l'eau", value: "utilities" },
      { label: "Internet", value: "internet" },
      { label: "Les démarches", value: "paperwork" },
      { label: "Les soins", value: "care" },
    ],
  },
  {
    id: "ambition",
    title: "Là-bas, vous venez surtout pour…",
    when: (a) => (a.project === "installer" || a.project === "investir") && a.together === 0,
    choices: [
      { label: "Faire grandir une affaire", value: "business" },
      { label: "Accélérer ma carrière", value: "career" },
      { label: "Me construire un réseau", value: "network" },
    ],
  },
  {
    id: "evenings",
    title: "Le soir, chez vous, il vous faut…",
    when: (a) => a.project === "installer" && a.saturday === 0 && a.order === 1,
    choices: [
      { label: "Un quartier résidentiel et calme", value: "residential" },
      { label: "De l'espace, un jardin", value: "space" },
      { label: "La mer ou la nature tout près", value: "nature" },
    ],
  },
];
export const PROFILE_QUESTIONS: Question[] = PROFILE.map((q) => ({ ...q, group: "VOTRE PROFIL" }));

export const DEEP_QUESTIONS: Question[] = [
  ...QUESTIONS,
  ...PROFILE_QUESTIONS,
  ...LATER,
  ...FURTHER.filter((q) => !QUESTIONS.some((free) => free.id === q.id)).map((q) => ({
    ...q,
    group: "POUR AFFINER",
  })),
];
