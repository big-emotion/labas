import catalogue from "../data/city-temperament.json";

/**
 * The five temperament axes, named after the question that asks each one (inspired by the Big
 * Five: extraversion, openness, conscientiousness, agreeableness, emotional stability).
 */
export const TRAITS = ["saturday", "adventure", "order", "together", "friction"] as const;
export type Trait = (typeof TRAITS)[number];

/**
 * How many of a city's neighbourhoods sit at 0, 0.5 and 1 on each axis, counted from the
 * ratings in research/cities/<country>/<city>.temperament.md (docs/criteria/temperament-cities.md).
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

/** What a neighbourhood at each level is like, in the reader's words, low level first. */
const LEVEL_NAMES: Record<Trait, [string, string, string]> = {
  saturday: ["Calme le soir", "Dîners et quelques bars", "On sort tard"],
  adventure: ["Repères familiers", "Entre repères et dépaysement", "Dépaysant"],
  order: ["On improvise, tout se négocie", "Un peu de cadre", "Tout fonctionne comme prévu"],
  together: ["Chacun sa route", "Vie résidentielle tranquille", "Vie de quartier et entraide"],
  friction: ["Quotidien sans heurts", "Peu d'imprévus", ""],
};

/**
 * Why the city fits the reader's answer on one axis: how many of its neighbourhoods sit at the
 * reader's level (« Calme le soir : 3 quartiers sur 11 »). On `friction` a reader is fine with
 * any smoother neighbourhood, so those count too; a reader whom outages amuse gets no line, since
 * every city suits them. A city rated as a whole says so.
 */
export function neighbourhoodLine(cityName: string, trait: Trait, reader: number): string | null {
  const profile = BY_NAME.get(cityName);
  const level = LEVELS.indexOf(reader);
  if (!profile || level < 0) return null;
  if (trait === "friction" && level === 2) return null;
  const name = LEVEL_NAMES[trait][level];
  const counts = profile[trait];
  const n =
    trait === "friction" ? counts.slice(0, level + 1).reduce((a, b) => a + b, 0) : counts[level];
  if (profile.editorial) return `${name} : ${n ? "oui" : "non"}, estimation pour la ville`;
  return `${name} : ${n} quartier${n > 1 ? "s" : ""} sur ${profile.areas}`;
}
