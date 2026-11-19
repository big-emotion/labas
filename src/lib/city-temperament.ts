import catalogue from "../data/city-temperament.json";
import type { Bilingual, Locale } from "../i18n/locale";

/**
 * The five temperament axes, named after the question that asks each one (inspired by the Big
 * Five: extraversion, openness, conscientiousness, agreeableness, emotional stability).
 */
export const TRAITS = ["saturday", "adventure", "order", "together", "friction"] as const;
export type Trait = (typeof TRAITS)[number];

/**
 * How many of a city's neighbourhoods sit at 0, 0.5 and 1 on each axis, counted from the
 * ratings in research/cities/<country>/<city>.temperament.md, on one scale shared by every city.
 * A city is not one temperament: Abidjan has calm neighbourhoods and Kigali lively streets, what
 * differs is how much of the city carries each aura. `editorial` marks a city rated as a whole
 * because it has no neighbourhood sheet.
 */
export type CityTemperament = {
  name: string;
  areas: number;
  editorial: boolean;
} & Record<Trait, [number, number, number]>;

const BY_NAME = new Map(
  (catalogue as unknown as CityTemperament[]).map((profile) => [profile.name, profile]),
);
const LEVELS = [0, 0.5, 1];

export function temperamentOf(cityName: string): CityTemperament | undefined {
  return BY_NAME.get(cityName);
}

/**
 * How much of the city suits the reader's answer on one axis, 0 to 1: a neighbourhood at the
 * reader's level counts 1, half a step away 0.5, at the other end 0. On `friction` a reader is
 * only hurt by more friction than they can take: someone whom outages amuse is not put off by a
 * city where everything works.
 */
export function temperamentFit(cityName: string, trait: Trait, reader: number): number | null {
  const profile = BY_NAME.get(cityName);
  if (!profile) return null;
  const fit = profile[trait].reduce((sum, count, i) => {
    const gap =
      trait === "friction" ? Math.max(0, LEVELS[i] - reader) : Math.abs(LEVELS[i] - reader);
    return sum + count * (1 - gap);
  }, 0);
  return fit / profile.areas;
}

/** The axes told neighbourhood by neighbourhood; organisation and friction make the gauge. */
type Told = "saturday" | "adventure" | "together";
const TOLD: readonly Trait[] = ["saturday", "adventure", "together"];

type Levels = Record<Told, [string, string, string]>;

/**
 * The words of a neighbourhood line. `levels`: what a neighbourhood at each level is like, in the
 * reader's words, low level first. `none` and `notTheCity`: the same levels when no
 * neighbourhood has them, as a sentence: « On sort tard : aucun quartier » read badly. « Aucun »
 * is the strongest claim the site makes about a city, so it is tied to our notes; a city rated as
 * a whole says « pas une ville… » and that it is our estimate (operator, 2026-11-16).
 */
interface LineCopy {
  levels: Levels;
  none: Levels;
  notTheCity: Levels;
  estimate: string;
  sources: string;
  count: (n: number, areas: number) => string;
  unexpected: string;
  gauge: (level: number, estimate: boolean) => string;
  /** The small word drawn after the gauge of a city rated as a whole. */
  estimateMark: string;
}

const COPY: Bilingual<LineCopy> = {
  fr: {
    levels: {
      saturday: ["Calme le soir", "Dîners et quelques bars", "On sort tard"],
      adventure: ["Repères familiers", "Entre repères et dépaysement", "Dépaysant"],
      together: ["Chacun sa route", "Vie résidentielle tranquille", "Vie de quartier et entraide"],
    },
    none: {
      saturday: [
        "Aucun quartier calme le soir",
        "Aucun quartier de dîners et de quelques bars",
        "Aucun quartier où l'on sort tard",
      ],
      adventure: [
        "Aucun quartier aux repères familiers",
        "Aucun quartier entre repères et dépaysement",
        "Aucun quartier dépaysant",
      ],
      together: [
        "Aucun quartier où chacun suit sa route",
        "Aucun quartier résidentiel et tranquille",
        "Aucun quartier où l'on vit en voisins",
      ],
    },
    notTheCity: {
      saturday: [
        "Pas une ville calme le soir",
        "Pas une ville de dîners et de quelques bars",
        "Pas une ville où l'on sort tard",
      ],
      adventure: [
        "Pas une ville aux repères familiers",
        "Pas une ville entre repères et dépaysement",
        "Pas une ville dépaysante",
      ],
      together: [
        "Pas une ville où chacun suit sa route",
        "Pas une ville résidentielle et tranquille",
        "Pas une ville où l'on vit en voisins",
      ],
    },
    estimate: ", selon notre estimation",
    sources: ", selon nos sources",
    count: (n, areas) => ` : ${n} quartier${n > 1 ? "s" : ""} sur ${areas}`,
    unexpected: "Prévoir des imprévus",
    gauge: (level, estimate) =>
      `Prévoir des imprévus : ${level} sur 5${estimate ? ", estimation" : ""}`,
    estimateMark: " estimation",
  },
  en: {
    levels: {
      saturday: ["Quiet in the evening", "Dinners and a few bars", "Out late"],
      adventure: ["Familiar landmarks", "Between the familiar and the new", "A change of scene"],
      together: [
        "Everyone their own way",
        "Quiet residential life",
        "Neighbourhood life and mutual help",
      ],
    },
    none: {
      saturday: [
        "No neighbourhood quiet in the evening",
        "No neighbourhood of dinners and a few bars",
        "No neighbourhood where people go out late",
      ],
      adventure: [
        "No neighbourhood with familiar landmarks",
        "No neighbourhood between the familiar and the new",
        "No neighbourhood that feels like a change of scene",
      ],
      together: [
        "No neighbourhood where everyone goes their own way",
        "No quiet residential neighbourhood",
        "No neighbourhood where people live as neighbours",
      ],
    },
    notTheCity: {
      saturday: [
        "Not a city that is quiet in the evening",
        "Not a city of dinners and a few bars",
        "Not a city where people go out late",
      ],
      adventure: [
        "Not a city of familiar landmarks",
        "Not a city between the familiar and the new",
        "Not a city that feels like a change of scene",
      ],
      together: [
        "Not a city where everyone goes their own way",
        "Not a quiet residential city",
        "Not a city where people live as neighbours",
      ],
    },
    estimate: ", by our estimate",
    sources: ", according to our sources",
    count: (n, areas) => `: ${n} neighbourhood${n > 1 ? "s" : ""} out of ${areas}`,
    unexpected: "Expect the unexpected",
    gauge: (level, estimate) =>
      `Expect the unexpected: ${level} out of 5${estimate ? ", estimate" : ""}`,
    estimateMark: " estimate",
  },
};

/** The gauge's name and its « estimation » mark, for the cards that draw it. */
export function gaugeWords(locale: Locale): { label: string; estimate: string } {
  return { label: COPY[locale].unexpected, estimate: COPY[locale].estimateMark };
}

/**
 * Why the city fits the reader's answer on one axis: how many of its neighbourhoods sit at the
 * reader's level (« Calme le soir : 3 quartiers sur 11 »). Organisation and friction have no
 * such line: they make the gauge of surprises to plan for (`unexpectedGauge`).
 */
export function neighbourhoodLine(
  cityName: string,
  trait: Trait,
  reader: number,
  locale: Locale,
): TemperamentLine | null {
  const profile = BY_NAME.get(cityName);
  const level = LEVELS.indexOf(reader);
  if (!profile || level < 0 || !TOLD.includes(trait)) return null;
  const told = trait as Told;
  const copy = COPY[locale];
  const n = profile[told][level];
  if (profile.editorial)
    return n
      ? { text: `${copy.levels[told][level]}${copy.estimate}`, weak: false }
      : { text: `${copy.notTheCity[told][level]}${copy.estimate}`, weak: true };
  // A line that counts nothing stays, readable and marked against the city (operator, 2026-11-16).
  if (n === 0) return { text: `${copy.none[told][level]}${copy.sources}`, weak: true };
  return { text: `${copy.levels[told][level]}${copy.count(n, profile.areas)}`, weak: false };
}

const meanLevel = (counts: [number, number, number], areas: number) =>
  counts.reduce((sum, count, i) => sum + count * LEVELS[i], 0) / areas;

/**
 * How many surprises to plan for, 1 to 5 (operator, 2026-11-16): no city can be said to « work
 * as planned », not even Paris, but where people improvise and outages are common, one plans for
 * more. Half how much of the city improvises (organisation), half how much friction it carries,
 * from the same neighbourhood counts as the rest.
 */
function unexpectedGauge(cityName: string): { level: number; estimate: boolean } | null {
  const profile = BY_NAME.get(cityName);
  if (!profile) return null;
  const improvised = 1 - meanLevel(profile.order, profile.areas);
  const friction = meanLevel(profile.friction, profile.areas);
  return { level: 1 + Math.round(((improvised + friction) / 2) * 4), estimate: profile.editorial };
}

/**
 * One line under a city: its text, whether it counts against the city (no neighbourhood fits),
 * and for « Prévoir des imprévus » the gauge the cards draw (the text says it for e-mail and sharing).
 */
export interface TemperamentLine {
  text: string;
  weak: boolean;
  gauge?: { level: number; estimate: boolean };
}

const ADVENTURE_LEVELS = { familiar: 0, open: 0.5, seeking: 1 } as const;

/** The reader's temperament answers, the only ones a shared result carries. */
export type TemperamentAnswers = {
  saturday?: number;
  adventure?: keyof typeof ADVENTURE_LEVELS;
  order?: number;
  together?: number;
  friction?: number;
};

/**
 * One line per temperament answer: the neighbourhoods of the city at the reader's level, those
 * that fit first, then the gauge of surprises (one, for organisation or friction), then those
 * that count nothing.
 */
export function temperamentLinesFor(
  cityName: string,
  answers: TemperamentAnswers,
  locale: Locale,
): TemperamentLine[] {
  const lines = TRAITS.flatMap((trait) => {
    const reader =
      trait === "adventure"
        ? answers.adventure && ADVENTURE_LEVELS[answers.adventure]
        : answers[trait];
    const line = reader === undefined ? null : neighbourhoodLine(cityName, trait, reader, locale);
    return line ? [line] : [];
  });
  const gauge =
    answers.order !== undefined || answers.friction !== undefined
      ? unexpectedGauge(cityName)
      : null;
  const gaugeLine: TemperamentLine[] = gauge
    ? [
        {
          text: COPY[locale].gauge(gauge.level, gauge.estimate),
          weak: false,
          gauge,
        },
      ]
    : [];
  return [...lines.filter((l) => !l.weak), ...gaugeLine, ...lines.filter((l) => l.weak)];
}
