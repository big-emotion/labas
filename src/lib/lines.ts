import catalogue from "../data/city-lines.json";

/**
 * The warm, hand-written layer of the quick quiz, kept
 * apart from `cities.json` so editors can write it without touching the scores.
 */
export interface Source {
  title: string;
  url: string;
  published?: string;
  accessed: string;
}

export interface CityLines {
  name: string;
  /** "On dit de … que …": a reputation, never a measurement. */
  reputation: string | null;
  /** The cliché the city breaks, through a checkable place or event. */
  surprise: string | null;
  neighbourhoods: {
    name: string;
    text: string;
    setting?: "central" | "residential" | "seaside" | "outskirts";
    standing?: "upscale" | "middle" | "popular" | null;
    walkable?: boolean | null;
    lively?: boolean | null;
  }[];
  /** A city's own "pourquoi vous" sentence for an answer, keyed "questionId:value". */
  why?: Record<string, string>;
  sources: Source[];
}

// JSON imports infer each city's `why` keys as a separate literal type, which does not
// narrow to a Record; the shape is guarded by lines.test.ts instead.
const BY_NAME = new Map((catalogue as unknown as CityLines[]).map((lines) => [lines.name, lines]));

export function linesFor(cityName: string): CityLines | undefined {
  return BY_NAME.get(cityName);
}
