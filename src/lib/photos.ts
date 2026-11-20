import type { Locale } from "../i18n/locale";
import catalogue from "../data/photos.json";
import slideshows from "../data/city-photos.json";

/** A free-licensed photo, served from /photos so no page calls a third party. */
export interface Photo {
  name: string;
  file: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  alt: string;
  /** Where it was found, for the credit; a city's first photo is always from Wikimedia Commons. */
  from?: string;
}

const BY_NAME = new Map(
  (catalogue as unknown as Photo[]).filter((p) => p.file).map((p) => [p.name, p]),
);

export function photoFor(cityName: string): Photo | undefined {
  return BY_NAME.get(cityName);
}

/** The most photos a slideshow shows: past it a reader stops looking and the page only gets heavier. */
const MOST_SLIDES = 15;

/**
 * A city's slideshow (operator, 2026-11-20): its first photo, the one every card and share
 * picture uses, then the others in the order they were chosen (data/city-photos.json).
 */
export function photosFor(cityName: string): Photo[] {
  const first = photoFor(cityName);
  if (!first) return [];
  const others = (slideshows as Record<string, Omit<Photo, "name">[]>)[cityName] ?? [];
  return [first, ...others.map((photo) => ({ name: cityName, ...photo }))].slice(0, MOST_SLIDES);
}

/** « Photo : author · licence », the short credit drawn on share pictures. */
export function photoCredit(photo: Photo, locale: Locale): string {
  return `${locale === "en" ? "Photo:" : "Photo :"} ${photo.author} · ${photo.license}`;
}
