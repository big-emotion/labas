import { CITIES, livableLanguages, type City, type CriterionKey } from "./cities";

/**
 * How Là-bas matches a reader with a city: not "which city is best", but "which city looks like
 * what you said". Each city gets a fingerprint on character axes, each relative to the whole
 * catalogue (a percentile), so no city is better everywhere. Each answer pulls some axes towards
 * a target with a weight, like tokens adding up. The score is the weighted closeness between
 * the reader's pulls and the city's fingerprint. Rationale: docs/criteria/architecture.md §4.
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
  | "paperwork";

/** Facts are matched, not measured: a city has the sea or it does not. */
export type FactPull =
  | { kind: "languages"; values: string[]; weight: number }
  | { kind: "settings"; values: string[]; weight: number }
  | { kind: "climates"; values: string[]; weight: number }
  | { kind: "zone"; value: string; weight: number }
  | { kind: "sectors"; values: string[]; weight: number };

export interface Pull {
  axis: Axis;
  /** Where on the axis the reader wants to be, 0 to 1. */
  target: number;
  weight: number;
}

/** What an axis reads from the sourced scores; comfort averages power, water and care. */
const SOURCES: Record<Exclude<Axis, "paperwork">, CriterionKey[]> = {
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

function rawLevel(city: City, axis: Axis): number | null {
  if (axis === "paperwork") return city.countryFacts?.paperwork.level ?? null;
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

const AXES = [...Object.keys(SOURCES), "paperwork"] as Axis[];
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
};

/**
 * Two kinds of criteria. Tastes (pace, nightlife, bargaining) want a city close to a point:
 * too lively is as wrong as too quiet. Everything else is a floor: an answer asks for "enough"
 * safety or schools, and a city above that floor gains nothing more, so the safest, best
 * equipped cities do not win every profile.
 */
const TASTES: Axis[] = ["pace", "nightlife", "bargaining"];
/** How high the floor sits for a pull's target: 1 asks for the top quarter of cities. */
const floorOf = (target: number) => 0.15 + 0.6 * target;

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
    // A missing value neither wins nor loses (§4.2).
    const target = sum / weight;
    const value =
      position === null
        ? 0.5
        : TASTES.includes(axis)
          ? 1 - Math.abs(target - position)
          : Math.min(1, 1 - (floorOf(target) - position));
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
      match = city.zone === fact.value;
    } else if (fact.kind === "sectors") {
      match = city.facts.sectors.some((s) => fact.values.includes(s));
    }
    parts.push({ value: match ? 1 : 0, weight: fact.weight, known: true, fact: fact.kind });
  }
  return parts;
}
