import { CITIES, livableLanguages, type City, type CriterionKey } from "./cities";
import { temperamentFit, type Trait } from "./city-temperament";
import { hasActivity, seasonFit, type ActivityTag } from "./holiday";
import { linesFor } from "./lines";

/**
 * How Là-bas matches a reader with a city: not "which city is best", but "which city looks like
 * what you said". Each city gets a fingerprint on character axes, each relative to the whole
 * catalogue (a percentile), so no city is better everywhere. Each answer pulls some axes towards
 * a target with a weight, like tokens adding up. The score is the weighted closeness between
 * the reader's pulls and the city's fingerprint.
 */

export type Axis =
  | "pace"
  | "nightlife"
  | "cheap"
  | "easySetup"
  | "safety"
  | "comfort"
  | "internet"
  | "schools"
  | "jobs"
  | "business"
  | "flights"
  | "culture"
  | "history"
  | "returnees"
  | "bargaining"
  | "paperwork"
  | "welcome"
  | "walkable"
  | "leisure"
  | "remote";

/** Facts are matched, not measured: a city has the sea or it does not. */
export type FactPull =
  | { kind: "languages"; values: string[]; weight: number }
  | { kind: "settings"; values: string[]; weight: number }
  | { kind: "climates"; values: string[]; weight: number }
  | { kind: "zone"; values: string[]; weight: number }
  | { kind: "sectors"; values: string[]; weight: number }
  | { kind: "professions"; values: string[]; weight: number }
  | { kind: "upscale"; values: string[]; weight: number }
  /** The city's region close to the family's. */
  | { kind: "kin"; origins: string[]; weight: number }
  /** The passports the reader holds: how easily each one gets into the city's country. */
  | { kind: "entry"; values: string[]; weight: number }
  /**
   * How a Black reader can expect to be received: documented anti-Black racism counts against a
   * country whatever the reader's taste for adventure, xenophobic violence half as much.
   */
  | { kind: "reception"; weight: number }
  /** The family's own countries. */
  | { kind: "homeCountry"; values: string[]; weight: number }
  /** The countries where the music the reader picked plays (data/music.json). */
  | { kind: "music"; values: string[]; weight: number }
  /** The months of the holiday: the city's best season, or its rains (data/city-holiday.json). */
  | { kind: "season"; months: number[]; weight: number }
  /** Something the reader wants to do within two hours of the city (safari, diving…). */
  | { kind: "activities"; tags: ActivityTag[]; weight: number }
  /** The reader's faith: the share of the country that shares it. */
  | { kind: "faith"; value: "muslim" | "christian" | "other"; weight: number }
  /** The reverse, for readers after the unknown. */
  | { kind: "elsewhere"; origins: string[]; weight: number }
  /** A temperament answer, 0 to 1: the share of the city's neighbourhoods that suits it. */
  | { kind: "temperament"; trait: Trait; value: number; weight: number };

export interface Pull {
  axis: Axis;
  /** Where on the axis the reader wants to be, 0 to 1. */
  target: number;
  weight: number;
}

/** What an axis reads from the sourced scores; comfort averages power, water and care. */
const SOURCES: Record<
  Exclude<Axis, "paperwork" | "welcome" | "walkable" | "leisure" | "remote">,
  CriterionKey[]
> = {
  pace: ["pace"],
  nightlife: ["nightlife"],
  cheap: ["cost"],
  easySetup: ["setupCost"],
  safety: ["safety"],
  comfort: ["utilities", "healthcare"],
  internet: ["internet"],
  schools: ["schools"],
  jobs: ["jobs"],
  business: ["business"],
  flights: ["flights"],
  culture: ["culture"],
  history: ["history"],
  returnees: ["returnees"],
  bargaining: ["negotiation"],
};

const NEUTRAL = 0.5;

const log = (n: number) => Math.log1p(n);

function rawLevel(city: City, axis: Axis): number | null {
  if (axis === "paperwork") return city.countryFacts?.paperwork.level ?? null;
  if (axis === "welcome") {
    // What residents say (Afrobarometer): trust in others and openness to foreign neighbours.
    const survey = city.countryFacts?.welcome?.afrobarometer;
    const values = [survey?.trustNeighbours, survey?.toleranceForeigners].filter(
      (v): v is number => typeof v === "number",
    );
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }
  if (axis === "remote") {
    // Far from the hubs: the fewer direct flights, the further away. Some readers want exactly
    // that, and no "at least this many flights" answer can say it for them.
    const flights = city.scores.flights.level;
    return flights === null ? null : -flights;
  }
  const places = city.life.places;
  if (axis === "walkable") {
    return places
      ? log(places.shops) + log(places.transit) + log(places.cafe + places.resto)
      : null;
  }
  if (axis === "leisure") {
    return places
      ? log(places.gym) + log(places.cafe + places.resto) + log(places.books + places.culture)
      : null;
  }
  const levels = SOURCES[axis]
    .map((key) => city.scores[key].level)
    .filter((level): level is number => level !== null);
  return levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : null;
}

/** A level's place among all cities, 0 to 1, ties sharing the middle of their rank. */
function percentiles(axis: Axis): Map<string, number | null> {
  const known = CITIES.map((city) => ({ name: city.name, level: rawLevel(city, axis) }));
  const sorted = known
    .map((k) => k.level)
    .filter((level): level is number => level !== null)
    .sort((a, b) => a - b);
  const rank = (level: number) => {
    const below = sorted.filter((l) => l < level).length;
    const equal = sorted.filter((l) => l === level).length;
    return sorted.length > 1 ? (below + (equal - 1) / 2) / (sorted.length - 1) : NEUTRAL;
  };
  return new Map(known.map((k) => [k.name, k.level === null ? null : rank(k.level)]));
}

const AXES = [
  ...Object.keys(SOURCES),
  "paperwork",
  "welcome",
  "walkable",
  "leisure",
  "remote",
] as Axis[];
const FINGERPRINTS = new Map(AXES.map((axis) => [axis, percentiles(axis)]));

/** Where a city sits on an axis, 0 to 1, or null when no source says. */
export function fingerprint(city: City, axis: Axis): number | null {
  return FINGERPRINTS.get(axis)?.get(city.name) ?? null;
}

export interface Closeness {
  /** 0 to 1. */
  value: number;
  weight: number;
  known: boolean;
  axis?: Axis;
  fact?: FactPull["kind"];
  /** For an « activities » fact: what the reader wants to do. */
  tags?: ActivityTag[];
}

const CLIMATE_CLASSES: Record<string, string[]> = {
  hot: ["hot-humid", "hot-dry"],
  mild: ["mild", "highland"],
  dry: ["hot-dry"],
};
const SETTINGS: Record<string, string[]> = {
  beach: ["ocean"],
  water: ["lake-or-river", "ocean"],
  nature: ["mountains", "forest"],
  wildSpaces: ["savanna", "desert"],
  island: ["island"],
};

/**
 * Two kinds of criteria. Tastes (pace, nightlife, bargaining, returnees) want a city close to a
 * point: too lively is as wrong as too quiet, and a reader who wants to live among locals is as
 * badly served by a returnee enclave as a returnee is by a town none of them chose. Everything else is a floor: an answer asks for "enough"
 * safety or schools, and a city above that floor gains nothing more, so the safest, best
 * equipped cities do not win every profile.
 */
const TASTES: Axis[] = ["pace", "nightlife", "bargaining", "returnees"];
/** How high the floor sits for a pull's target: 1 asks for the top quarter of cities. */
const floorOf = (target: number) => 0.15 + 0.6 * target;

const closenessAt = (axis: Axis, target: number, position: number) =>
  TASTES.includes(axis)
    ? 1 - Math.abs(target - position)
    : Math.min(1, 1 - (floorOf(target) - position));

/**
 * A missing value neither wins nor loses (§4.2): it scores what the cities with a value score
 * on average for the same pull. A flat 0.5 would sit below most cities once floors saturate,
 * so thinly documented towns would lose to well-documented capitals on data, not on fit.
 */
const typicalCache = new Map<string, number>();
function typicalCloseness(axis: Axis, target: number): number {
  const key = `${axis}:${target}`;
  let typical = typicalCache.get(key);
  if (typical === undefined) {
    const known = CITIES.map((city) => fingerprint(city, axis)).filter(
      (position): position is number => position !== null,
    );
    typical = known.length
      ? known.reduce((sum, position) => sum + closenessAt(axis, target, position), 0) / known.length
      : NEUTRAL;
    typicalCache.set(key, typical);
  }
  return typical;
}

const EU_ENTRY = { free: 1, online: 0.6, embassy: 0.2 } as const;
/**
 * Free-movement zones, by member country. ECOWAS lists its members after Mali, Burkina Faso and
 * Niger left in January 2025; it announced it would keep recognising their passports until
 * further notice, so they stay in (to recheck). Outside its zone an African passport is scored
 * as unknown: several countries now let all Africans in without a visa, case by case.
 */
const FREE_MOVEMENT: Record<string, string[]> = {
  ecowas: [
    "Bénin",
    "Cap-Vert",
    "Côte d'Ivoire",
    "Gambie",
    "Ghana",
    "Guinée",
    "Guinée-Bissau",
    "Liberia",
    "Nigeria",
    "Sénégal",
    "Sierra Leone",
    "Togo",
    "Mali",
    "Burkina Faso",
    "Niger",
  ],
  cemac: ["Cameroun", "Centrafrique", "Congo", "Gabon", "Guinée équatoriale", "Tchad"],
  eac: [
    "Burundi",
    "RD Congo",
    "Kenya",
    "Rwanda",
    "Somalie",
    "Soudan du Sud",
    "Tanzanie",
    "Ouganda",
  ],
};

function entryEase(city: City, passport: string): number {
  if (passport === "eu") {
    const entry = city.countryFacts?.entryFrenchPassport;
    return entry ? EU_ENTRY[entry] : NEUTRAL;
  }
  const zone = FREE_MOVEMENT[passport];
  return zone?.includes(city.country) ? 1 : NEUTRAL;
}

/**
 * How close a city's region feels to the family's region, 0 to 1. Neighbouring regions share
 * languages, religions and history; North Africa and sub-Saharan Africa share the least, which
 * is what readers of either origin describe when they imagine living there. Readers from the
 * Caribbean and the Americas are closest to the Atlantic coast their ancestors left from.
 */
const AFFINITY: Record<string, Record<string, number>> = {
  ouest: { ouest: 1, centre: 0.6, est: 0.35, sud: 0.35, nord: 0 },
  centre: { centre: 1, ouest: 0.6, est: 0.5, sud: 0.5, nord: 0 },
  est: { est: 1, centre: 0.5, sud: 0.5, ouest: 0.35, nord: 0.1 },
  sud: { sud: 1, centre: 0.5, est: 0.5, ouest: 0.35, nord: 0 },
  nord: { nord: 1, ouest: 0.1, centre: 0.05, est: 0.1, sud: 0.05 },
  ameriques: { ouest: 0.8, centre: 0.7, sud: 0.55, est: 0.5, nord: 0.1 },
};

export function closenessOf(city: City, pulls: Pull[], facts: FactPull[]): Closeness[] {
  // Several answers can pull the same axis: their targets average, their weights add up.
  const merged = new Map<Axis, { sum: number; weight: number }>();
  for (const pull of pulls) {
    const current = merged.get(pull.axis) ?? { sum: 0, weight: 0 };
    merged.set(pull.axis, {
      sum: current.sum + pull.target * pull.weight,
      weight: current.weight + pull.weight,
    });
  }
  const parts: Closeness[] = [];
  for (const [axis, { sum, weight }] of merged) {
    if (weight <= 0) continue;
    const position = fingerprint(city, axis);
    const target = sum / weight;
    const value =
      position === null ? typicalCloseness(axis, target) : closenessAt(axis, target, position);
    parts.push({ value, weight, known: position !== null, axis });
  }
  for (const fact of facts) {
    let match = false;
    if (fact.kind === "languages") {
      match = livableLanguages(city).some((l) => fact.values.includes(l));
    } else if (fact.kind === "settings") {
      const wanted = fact.values.flatMap((v) => SETTINGS[v] ?? []);
      match = city.facts.settings.some((s) => wanted.includes(s));
    } else if (fact.kind === "climates") {
      const wanted = fact.values.flatMap((v) => CLIMATE_CLASSES[v] ?? []);
      match = city.facts.climates.some((c) => wanted.includes(c));
    } else if (fact.kind === "zone") {
      match = fact.values.includes(city.zone);
    } else if (fact.kind === "reception") {
      const racism = city.countryFacts?.racism?.kind;
      parts.push({
        value: racism === "anti-black" ? 0 : racism === "xenophobia" ? 0.5 : 1,
        weight: fact.weight,
        known: true,
        fact: fact.kind,
      });
      continue;
    } else if (fact.kind === "homeCountry" || fact.kind === "music") {
      match = fact.values.includes(city.country);
    } else if (fact.kind === "sectors") {
      match = city.facts.sectors.some((s) => fact.values.includes(s));
    } else if (fact.kind === "professions") {
      // A field that hires a lot counts fully; one that offers a few posts counts a third.
      const strength = Math.max(
        0,
        ...city.life.professions
          .filter((p) => fact.values.includes(p.field))
          .map((p) => p.strength),
      );
      parts.push({ value: strength / 3, weight: fact.weight, known: true, fact: fact.kind });
      continue;
    } else if (fact.kind === "faith") {
      const religion = city.countryFacts?.religion;
      parts.push({
        value: religion ? religion[fact.value] / 100 : NEUTRAL,
        weight: fact.weight,
        known: Boolean(religion),
        fact: fact.kind,
      });
      continue;
    } else if (fact.kind === "entry") {
      parts.push({
        value: Math.max(...fact.values.map((passport) => entryEase(city, passport))),
        weight: fact.weight,
        known: true,
        fact: fact.kind,
      });
      continue;
    } else if (fact.kind === "kin" || fact.kind === "elsewhere") {
      // A mixed family is at home wherever one of its sides is. Documented anti-Black racism
      // halves how at home a reader of sub-Saharan or Caribbean family can expect to feel,
      // whatever the map says (UN, Amnesty, HRW: countries.json).
      const antiBlack = city.countryFacts?.racism?.kind === "anti-black";
      const affinity = Math.max(
        ...fact.origins.map(
          (origin) =>
            (AFFINITY[origin]?.[city.zone] ?? NEUTRAL) * (antiBlack && origin !== "nord" ? 0.5 : 1),
        ),
      );
      parts.push({
        // Adventure means leaving the family's region, not seeking its opposite: Kinshasa is as
        // much an adventure for a reader from Dakar as Tunis is.
        value: fact.kind === "kin" ? affinity : affinity < 1 ? 1 : 0,
        weight: fact.weight,
        known: true,
        fact: fact.kind,
      });
      continue;
    } else if (fact.kind === "season") {
      const fit = seasonFit(city.name, fact.months);
      parts.push({
        value: fit ?? NEUTRAL,
        weight: fact.weight,
        known: fit !== null,
        fact: fact.kind,
      });
      continue;
    } else if (fact.kind === "activities") {
      const found = hasActivity(city.name, fact.tags);
      parts.push({
        value: found === null ? NEUTRAL : found ? 1 : 0,
        weight: fact.weight,
        known: found !== null,
        fact: fact.kind,
        tags: fact.tags,
      });
      continue;
    } else if (fact.kind === "temperament") {
      const fit = temperamentFit(city.name, fact.trait, fact.value);
      parts.push({
        value: fit ?? NEUTRAL,
        weight: fact.weight,
        known: fit !== null,
        fact: fact.kind,
      });
      continue;
    } else if (fact.kind === "upscale") {
      const areas = linesFor(city.name)?.neighbourhoods ?? [];
      const known = areas.some((a) => a.standing);
      parts.push({
        value: known ? (areas.some((a) => a.standing === "upscale") ? 1 : 0) : 0.5,
        weight: fact.weight,
        known,
        fact: fact.kind,
      });
      continue;
    }
    parts.push({ value: match ? 1 : 0, weight: fact.weight, known: true, fact: fact.kind });
  }
  return parts;
}
