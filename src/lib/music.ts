import catalogue from "../data/music.json";
import type { Source } from "./lines";

/**
 * Club genres and the countries where they are born or fill the dance floors, each link backed
 * by a dated source (operator, 2026-11-16). Raï was left out: no source ties it to a club scene.
 */
export interface Genre {
  value: string;
  label: string;
  countries: string[];
  sources: Source[];
}

export const MUSIC = catalogue as Genre[];

/** The countries of the genres the reader picked. */
export function musicCountries(genres: string[] | undefined): string[] {
  return MUSIC.filter((g) => genres?.includes(g.value)).flatMap((g) => g.countries);
}
