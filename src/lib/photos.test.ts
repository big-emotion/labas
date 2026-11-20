import { describe, expect, it } from "vitest";
import catalogue from "../data/photos.json";
import { CITIES } from "./cities";
import slideshows from "../data/city-photos.json";
import { photoCredit, photoFor, photosFor } from "./photos";

// Only licences that allow reuse on a site, with credit (no non-commercial, no "no derivatives").
const FREE = /^(CC0|Public domain|CC BY(-SA)? \d\.\d( [a-z]{2})?)$/;

describe("the city photos", () => {
  it("only uses free licences and credits every author", () => {
    for (const photo of catalogue) {
      expect(photo.license, photo.name).toMatch(FREE);
      expect(photo.author.length, photo.name).toBeGreaterThan(1);
      expect(photo.source, photo.name).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(photo.alt.length, photo.name).toBeLessThanOrEqual(120);
    }
  });

  it("serves every photo from the site itself", () => {
    const served = Object.keys(import.meta.glob("/public/photos/*.jpg"));
    for (const photo of catalogue) {
      expect(served, photo.name).toContain(`/public/photos/${photo.file}`);
    }
  });

  it("shows a photo for nearly every city the quiz can propose", () => {
    const proposable = CITIES;
    const withPhoto = proposable.filter((city) => photoFor(city.name));
    expect(withPhoto.length / proposable.length).toBeGreaterThan(0.9);
  });
});

describe("a photo's credit line", () => {
  it("names the author and the licence in the reader's language", () => {
    const photo = photoFor("Dakar")!;
    expect(photoCredit(photo, "fr")).toBe(`Photo : ${photo.author} · ${photo.license}`);
    expect(photoCredit(photo, "en")).toBe(`Photo: ${photo.author} · ${photo.license}`);
  });
});

// Operator, 2026-11-20: a city is more than one picture. Up to fifteen photos a city, found on
// Wikimedia Commons and Openverse (scripts/photo-candidates.mjs), chosen by eye.
describe("a city's slideshow", () => {
  const slides = Object.entries(slideshows).flatMap(([city, photos]) =>
    photos.map((photo) => ({ city, ...photo })),
  );

  it("only uses free licences, credits every author and links to the source", () => {
    for (const photo of slides) {
      expect(photo.license, photo.file).toMatch(FREE);
      expect(photo.author.length, photo.file).toBeGreaterThan(1);
      expect(photo.source, photo.file).toMatch(/^https:\/\//);
      expect(photo.licenseUrl, photo.file).toMatch(/^https:\/\/creativecommons\.org\//);
      expect(photo.from.length, photo.file).toBeGreaterThan(1);
    }
  });

  it("describes every photo in a short sentence", () => {
    for (const photo of slides) {
      expect(photo.alt.length, photo.file).toBeGreaterThan(10);
      expect(photo.alt.length, photo.file).toBeLessThanOrEqual(120);
    }
  });

  it("serves every photo from the site itself, for cities of the site only", () => {
    const served = Object.keys(import.meta.glob("/public/photos/*.jpg"));
    const names = CITIES.map((city) => city.name);
    for (const photo of slides) {
      expect(served, photo.file).toContain(`/public/photos/${photo.file}`);
      expect(names, photo.file).toContain(photo.city);
    }
  });

  it("opens on the city's first photo, then shows the others in their order", () => {
    const [first, ...others] = photosFor("Abidjan");
    expect(first).toEqual(photoFor("Abidjan"));
    expect(others.map((photo) => photo.file)).toEqual(slideshows.Abidjan.map((p) => p.file));
    expect(others.every((photo) => photo.name === "Abidjan")).toBe(true);
  });

  it("is the one photo for a city with no slideshow yet, and nothing for an unknown city", () => {
    expect(photosFor("Saly")).toEqual([photoFor("Saly")]);
    expect(photosFor("Paris")).toEqual([]);
  });

  it("never shows the same photo twice in a city", () => {
    const same = (url: string) => decodeURIComponent(url).replace(/ /g, "_").toLowerCase();
    for (const city of Object.keys(slideshows)) {
      const sources = photosFor(city).map((photo) => same(photo.source));
      expect(new Set(sources).size, city).toBe(sources.length);
    }
  });

  it("never grows past fifteen photos", () => {
    for (const city of Object.keys(slideshows))
      expect(photosFor(city).length, city).toBeLessThanOrEqual(15);
  });
});
