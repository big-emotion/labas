import type { Locale } from "../i18n/locale";
import catalogue from "../data/photos.json";

/** A free-licensed photo from Wikimedia Commons, served from /photos so no page calls a third party. */
export interface Photo {
  name: string;
  file: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  alt: string;
}

const BY_NAME = new Map(
  (catalogue as unknown as Photo[]).filter((p) => p.file).map((p) => [p.name, p]),
);

export function photoFor(cityName: string): Photo | undefined {
  return BY_NAME.get(cityName);
}

/** « Photo : author · licence », the short credit drawn on share pictures. */
export function photoCredit(photo: Photo, locale: Locale): string {
  return `${locale === "en" ? "Photo:" : "Photo :"} ${photo.author} · ${photo.license}`;
}
