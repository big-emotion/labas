import { describe, expect, it } from "vitest";
import catalogue from "../data/photos.json";
import { CITIES } from "./cities";
import { photoFor } from "./photos";

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
    const proposable = CITIES.filter((city) => !city.unsafe);
    const withPhoto = proposable.filter((city) => photoFor(city.name));
    expect(withPhoto.length / proposable.length).toBeGreaterThan(0.9);
  });
});
