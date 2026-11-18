import { describe, expect, it } from "vitest";
import { counterpart, localeOfPath, pathFor, ROUTES } from "./routes";

describe("bilingual addresses", () => {
  it("keeps French at the root and puts English under /en with English words", () => {
    expect(pathFor("home", "fr")).toBe("/");
    expect(pathFor("home", "en")).toBe("/en/");
    expect(pathFor("deep", "fr")).toBe("/approfondir/");
    expect(pathFor("deep", "en")).toBe("/en/go-deeper/");
    expect(pathFor("reviews", "en")).toBe("/en/reviews/");
  });

  it("builds a city page in either language", () => {
    expect(pathFor("city", "fr", "dakar")).toBe("/ville/dakar/");
    expect(pathFor("city", "en", "dakar")).toBe("/en/city/dakar/");
  });

  it("reads the language from the address", () => {
    expect(localeOfPath("/en/city/dakar/")).toBe("en");
    expect(localeOfPath("/en")).toBe("en");
    expect(localeOfPath("/ville/dakar/")).toBe("fr");
    expect(localeOfPath("/entreprise")).toBe("fr");
  });

  it("sends the language switch to the same page in the other language", () => {
    expect(counterpart("/ville/dakar/")).toBe("/en/city/dakar/");
    expect(counterpart("/en/city/dakar")).toBe("/ville/dakar/");
    expect(counterpart("/approfondir")).toBe("/en/go-deeper/");
    expect(counterpart("/en/")).toBe("/");
    expect(counterpart("/espace/lien-expire/")).toBe("/en/my-space/link-expired/");
  });

  it("falls back to the other home page for an address it does not know", () => {
    expect(counterpart("/admin/")).toBe("/en/");
  });

  it("gives every route a distinct address in each language", () => {
    for (const locale of ["fr", "en"] as const) {
      const paths = Object.keys(ROUTES).map((route) =>
        pathFor(route as keyof typeof ROUTES, locale, "x"),
      );
      expect(new Set(paths).size).toBe(paths.length);
    }
  });
});
