import {
  CHAPTER,
  LATER,
  livesThere,
  namedOrigins,
  QUESTIONS,
  worksThere,
  type Question,
} from "./questions";
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
    en: { title: "Where do you live today?" },
    choices: [
      {
        label: "Une grande capitale (Paris, Bruxelles…)",
        value: "capital",
        en: { label: "A major capital (Paris, Brussels…)" },
      },
      { label: "Une grande ville", value: "bigcity", en: { label: "A big city" } },
      { label: "Une petite ville", value: "town", en: { label: "A small town" } },
      { label: "À la campagne", value: "country", en: { label: "In the countryside" } },
      {
        label: "Je bouge tout le temps",
        value: "nomad",
        en: { label: "I move around all the time" },
      },
    ],
  },
  {
    id: "rhythm",
    when: livesThere,
    title: "Là-bas, votre rythme :",
    en: { title: "Your pace over there:" },
    choices: [
      { label: "Le même qu'aujourd'hui", value: "same", en: { label: "The same as today" } },
      { label: "Plus calme", value: "calmer", en: { label: "Calmer" } },
      { label: "Plus intense", value: "more", en: { label: "More intense" } },
      { label: "Couper avec tout", value: "unplug", en: { label: "Cut off from it all" } },
    ],
  },
  {
    id: "mobility",
    when: livesThere,
    title: "Comment vous déplacez-vous au quotidien ?",
    en: { title: "How do you get around day to day?" },
    choices: [
      { label: "À pied", value: "walk", en: { label: "On foot" } },
      { label: "En transports", value: "transit", en: { label: "By public transport" } },
      { label: "À vélo", value: "bike", en: { label: "By bike" } },
      { label: "En voiture", value: "car", en: { label: "By car" } },
    ],
  },
  {
    id: "habits",
    when: livesThere,
    title: "Votre quotidien, c'est plutôt…",
    en: { title: "Your everyday life is mostly…" },
    max: 3,
    choices: [
      { label: "Salle de sport", value: "gym", en: { label: "The gym" } },
      { label: "Cafés et restaurants", value: "cafes", en: { label: "Cafés and restaurants" } },
      { label: "Livres et expos", value: "culture", en: { label: "Books and exhibitions" } },
      {
        label: "Marchés et petits commerces",
        value: "markets",
        en: { label: "Markets and small shops" },
      },
      { label: "Sorties le soir", value: "nights", en: { label: "Evenings out" } },
      { label: "Nature le week-end", value: "nature", en: { label: "Nature at the weekend" } },
    ],
  },
  {
    id: "neighbourhood",
    when: livesThere,
    title: "Votre quartier aujourd'hui :",
    en: { title: "Your neighbourhood today:" },
    choices: [
      { label: "Central et animé", value: "central", en: { label: "Central and lively" } },
      {
        label: "Résidentiel et calme",
        value: "residential",
        en: { label: "Residential and quiet" },
      },
      { label: "Plutôt chic", value: "upscale", en: { label: "Rather upmarket" } },
      { label: "Populaire et vivant", value: "popular", en: { label: "Working-class and lively" } },
    ],
  },
  {
    id: "people",
    when: livesThere,
    title: "Avec les gens, vous aimez…",
    en: { title: "With people, you like…" },
    choices: [
      {
        label: "Être invité, connaître mes voisins",
        value: "invited",
        en: { label: "Being invited, knowing my neighbours" },
      },
      { label: "Garder ma tranquillité", value: "quiet", en: { label: "Keeping my peace" } },
      { label: "Un peu des deux", value: "both", en: { label: "A bit of both" } },
    ],
  },
  {
    id: "belonging",
    when: livesThere,
    title: "Là-bas, vous voulez vivre…",
    en: { title: "Over there, you want to live…" },
    choices: [
      { label: "Parmi les gens du coin", value: "locals", en: { label: "Among local people" } },
      { label: "Avec d'autres repats", value: "returnees", en: { label: "With other returnees" } },
      { label: "Un peu des deux", value: "both", en: { label: "A bit of both" } },
    ],
  },
  {
    id: "roots",
    after: "origin",
    when: (a) => namedOrigins(a).length > 0,
    title: "Vous cherchez plutôt à…",
    en: { title: "You are mostly looking to…" },
    choices: [
      { label: "Retrouver mes racines", value: "rediscover", en: { label: "Rediscover my roots" } },
      { label: "Découvrir ailleurs", value: "discover", en: { label: "Discover somewhere else" } },
      { label: "Les deux", value: "both", en: { label: "Both" } },
    ],
  },
  {
    id: "climate",
    title: "Côté météo ?",
    en: { title: "What about the weather?" },
    choices: [
      { label: "Chaud toute l'année", value: "hot", en: { label: "Hot all year round" } },
      { label: "Doux", value: "mild", en: { label: "Mild" } },
      { label: "Sec et ensoleillé", value: "dry", en: { label: "Dry and sunny" } },
    ],
  },
  {
    id: "languageOnly",
    title: "Votre langue, c'est…",
    en: { title: "Your language is…" },
    choices: [
      { label: "Indispensable au quotidien", value: true, en: { label: "Essential day to day" } },
      { label: "Un plus", value: false, en: { label: "A bonus" } },
    ],
  },
  {
    id: "schoolCurriculum",
    when: (a) => a.family === "parents" || a.family === "fonder",
    title: "Des enfants à scolariser là-bas ?",
    en: { title: "Children to put in school over there?" },
    choices: [
      {
        label: "Oui, en programme français",
        value: "french",
        en: { label: "Yes, in the French curriculum" },
      },
      {
        label: "Oui, en programme anglais",
        value: "english",
        en: { label: "Yes, in an English-language curriculum" },
      },
      {
        label: "Oui, peu importe le programme",
        value: "any",
        en: { label: "Yes, any curriculum" },
      },
    ],
  },
  {
    id: "specialistCare",
    title: "Un besoin de soins suivis (traitement, grossesse, parent âgé) ?",
    en: { title: "Do you need ongoing care (treatment, pregnancy, an elderly parent)?" },
    choices: [
      { label: "Oui", value: true, en: { label: "Yes" } },
      { label: "Non", value: false, en: { label: "No" } },
    ],
  },
  {
    id: "visaFreeOnly",
    when: (a) => a.project === "decouvrir" || a.project === "tester",
    title: "Pour un premier séjour, vous voulez éviter le visa ?",
    en: { title: "For a first stay, would you rather avoid needing a visa?" },
    choices: [
      { label: "Oui, sans visa", value: true, en: { label: "Yes, no visa" } },
      { label: "Le visa ne me gêne pas", value: false, en: { label: "A visa doesn't bother me" } },
    ],
  },
  {
    id: "excludeCriminalising",
    title: "Vous voulez écarter les pays qui punissent l'homosexualité ?",
    en: { title: "Do you want to leave out the countries that punish homosexuality?" },
    choices: [
      { label: "Oui, écarte-les", value: true, en: { label: "Yes, leave them out" } },
      { label: "Non", value: false, en: { label: "No" } },
    ],
  },
  {
    id: "crowds",
    title: "Le bruit et la foule…",
    en: { title: "Noise and crowds…" },
    choices: [
      { label: "Me donnent de l'énergie", value: 1, en: { label: "Give me energy" } },
      { label: "Ça dépend", value: 0.5, en: { label: "It depends" } },
      { label: "Me fatiguent", value: 0, en: { label: "Tire me out" } },
    ],
  },
  {
    id: "friction",
    title: "Coupures de courant, démarches longues, imprévus…",
    en: { title: "Power cuts, long paperwork, the unexpected…" },
    choices: [
      { label: "Je fais avec", value: 1, en: { label: "I live with it" } },
      { label: "Ça me pèse", value: 0.5, en: { label: "It weighs on me" } },
      { label: "Je veux l'éviter", value: 0, en: { label: "I want to avoid it" } },
    ],
  },
  {
    id: "bargaining",
    title: "Négocier les prix (loyer, taxi, marché), pour vous c'est…",
    en: { title: "Haggling over prices (rent, taxis, markets), for you, is…" },
    choices: [
      { label: "Un jeu", value: 1, en: { label: "A game" } },
      { label: "Ça va", value: 0.5, en: { label: "Fine" } },
      { label: "Une corvée", value: 0, en: { label: "A chore" } },
    ],
  },
  {
    id: "setupBudget",
    when: (a) => a.project === "installer" || a.project === "tester" || a.project === "pied",
    title: "Combien pouvez-vous avancer pour vous installer (caution, loyers d'avance) ?",
    en: { title: "How much can you put down to settle in (deposit, rent in advance)?" },
    choices: [
      { label: "Moins de 2 000 €", value: "low", en: { label: "Under €2,000" } },
      { label: "2 000 à 6 000 €", value: "medium", en: { label: "€2,000 to €6,000" } },
      { label: "Plus", value: "high", en: { label: "More" } },
    ],
  },
  {
    id: "renounce",
    title: "À quoi pouvez-vous renoncer ?",
    en: { title: "What could you give up?" },
    max: 2,
    choices: [
      { label: "La vie culturelle", value: "culture", en: { label: "Cultural life" } },
      { label: "Un internet rapide", value: "internet", en: { label: "Fast internet" } },
      { label: "Les avions directs", value: "flights", en: { label: "Direct flights" } },
      { label: "Les lieux d'histoire", value: "history", en: { label: "Historic places" } },
      {
        label: "Un emploi sur place",
        value: "jobs",
        when: worksThere,
        en: { label: "A local job" },
      },
    ],
  },
];

/** Genre names are the same in English, but for the one that is a French phrase. */
const MUSIC_EN: Record<string, string> = { rumba: "Congolese rumba and ndombolo" };

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
    after: "saturday",
    title: "La musique qui vous fait bouger ?",
    en: {
      title: "The music that gets you moving?",
      hint: "Up to two choices: we bring the countries where it fills the dance floors a little closer.",
    },
    hint: "Jusqu'à deux choix : on rapproche un peu les pays où elle fait danser.",
    max: 2,
    when: (a) => a.saturday === 1,
    choices: MUSIC.map((genre) => ({
      label: genre.label,
      value: genre.value,
      en: { label: MUSIC_EN[genre.value] ?? genre.label },
    })),
  },
  {
    id: "nightOut",
    after: "saturday",
    title: "Vos soirées là-bas, plutôt…",
    en: { title: "Your evenings over there, mostly…" },
    when: (a) => holiday(a) && a.saturday === 1,
    choices: [
      {
        label: "Clubs et concerts jusqu'à l'aube",
        value: "clubs",
        en: { label: "Clubs and concerts until dawn" },
      },
      {
        label: "Maquis et bars où l'on danse",
        value: "maquis",
        en: { label: "Maquis and bars where people dance" },
      },
      {
        label: "Un verre au bord de l'eau, au coucher du soleil",
        value: "waterside",
        en: { label: "A drink by the water at sunset" },
      },
    ],
  },
  {
    id: "quietStay",
    after: "saturday",
    title: "Des vacances au calme, c'est…",
    en: { title: "A quiet holiday means…" },
    when: (a) => holiday(a) && a.saturday === 0,
    choices: [
      {
        label: "La plage, et c'est tout",
        value: "beach",
        en: { label: "The beach, and that's it" },
      },
      {
        label: "Marcher, randonner, respirer",
        value: "walks",
        en: { label: "Walking, hiking, breathing" },
      },
      {
        label: "Visiter des villes d'histoire, sans se presser",
        value: "history",
        en: { label: "Visiting historic towns, unhurried" },
      },
    ],
  },
  {
    id: "offTrack",
    after: "adventure",
    title: "Sortir des sentiers battus, jusqu'où ?",
    en: { title: "Off the beaten track: how far?" },
    when: (a) => holiday(a) && a.adventure === "seeking",
    choices: [
      {
        label: "Là où peu de visiteurs vont",
        value: "far",
        en: { label: "Where few visitors go" },
      },
      {
        label: "Un peu, avec un point de chute confortable",
        value: "some",
        en: { label: "A little, with a comfortable base" },
      },
      {
        label: "Pas trop loin du confort",
        value: "near",
        en: { label: "Not too far from comfort" },
      },
    ],
  },
  {
    id: "afterWork",
    after: "saturday",
    title: "En semaine, après le travail ?",
    en: { title: "On weekdays, after work?" },
    when: (a) => settling(a) && a.saturday !== undefined && a.saturday >= 0.5,
    choices: [
      {
        label: "Afterworks et rooftops",
        value: "rooftops",
        en: { label: "After-work drinks and rooftops" },
      },
      { label: "Sport et plein air", value: "outdoors", en: { label: "Sport and the outdoors" } },
      { label: "Rentrer chez moi au calme", value: "home", en: { label: "Home for some peace" } },
    ],
  },
  {
    id: "friends",
    after: "together",
    title: "Pour vous faire des amis là-bas ?",
    en: { title: "How would you make friends over there?" },
    when: (a) => settling(a) && a.together === 1,
    choices: [
      {
        label: "Associations et bénévolat",
        value: "associations",
        en: { label: "Associations and volunteering" },
      },
      {
        label: "La diaspora et d'autres repats",
        value: "diaspora",
        en: { label: "The diaspora and other returnees" },
      },
      {
        label: "Les voisins, la vie de quartier",
        value: "neighbours",
        en: { label: "Neighbours, neighbourhood life" },
      },
    ],
  },
  {
    id: "mustWork",
    after: "friction",
    title: "Ce qui doit marcher sans faute ?",
    en: { title: "What has to work without fail?" },
    max: 2,
    when: (a) => settling(a) && a.friction === 0,
    choices: [
      { label: "Le courant et l'eau", value: "utilities", en: { label: "Power and water" } },
      { label: "Internet", value: "internet", en: { label: "Internet" } },
      { label: "Les démarches", value: "paperwork", en: { label: "Paperwork" } },
      { label: "Les soins", value: "care", en: { label: "Healthcare" } },
    ],
  },
  {
    id: "ambition",
    after: "together",
    title: "Là-bas, vous venez surtout pour…",
    en: { title: "Over there, you are mainly coming to…" },
    when: (a) => (a.project === "installer" || a.project === "investir") && a.together === 0,
    choices: [
      { label: "Faire grandir une affaire", value: "business", en: { label: "Grow a business" } },
      { label: "Accélérer ma carrière", value: "career", en: { label: "Speed up my career" } },
      { label: "Me construire un réseau", value: "network", en: { label: "Build a network" } },
    ],
  },
  {
    id: "evenings",
    after: "order",
    title: "Le soir, chez vous, il vous faut…",
    en: { title: "In the evening, at home, you need…" },
    when: (a) => a.project === "installer" && a.saturday === 0 && a.order === 1,
    choices: [
      {
        label: "Un quartier résidentiel et calme",
        value: "residential",
        en: { label: "A quiet residential area" },
      },
      { label: "De l'espace, un jardin", value: "space", en: { label: "Space, a garden" } },
      {
        label: "La mer ou la nature tout près",
        value: "nature",
        en: { label: "The sea or nature close by" },
      },
    ],
  },
];
export const PROFILE_QUESTIONS: Question[] = PROFILE.map((q) => ({ ...q, group: CHAPTER.profile }));

export const DEEP_QUESTIONS: Question[] = [
  ...QUESTIONS,
  ...PROFILE_QUESTIONS,
  ...LATER,
  ...FURTHER.filter((q) => !QUESTIONS.some((free) => free.id === q.id)).map((q) => ({
    ...q,
    group: CHAPTER.refine,
  })),
];
