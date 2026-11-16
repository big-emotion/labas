import { describe, expect, it } from "vitest";
import { bestMatches, type Answers } from "./ranking";
import { readShared, resultLink, sharedResult, shareText } from "./shared-result";

// A reader who gave sensitive answers: none of them may travel in a shared link.
const READER: Answers = {
  project: "installer",
  saturday: 0,
  adventure: "open",
  order: 1,
  together: 1,
  friction: 0.5,
  origin: "ouest",
  countries: ["Sénégal"],
  faith: "muslim",
  excludeCriminalising: true,
};
const top = bestMatches(READER, 3);

describe("a result shared by link (beta feedback, 2026-11-16)", () => {
  it("opens a result page that rebuilds the profile and the three cities", () => {
    const link = resultLink(READER, top);
    expect(link.startsWith("https://labas.africa/resultat/#r=")).toBe(true);
    const shared = sharedResult(readShared(new URL(link).hash)!)!;
    expect(shared.archetype?.name).toBeTruthy();
    expect(shared.cities.map((c) => c.city.name)).toEqual(top.map((m) => m.city.name));
    expect(shared.cities.map((c) => c.percent)).toEqual(top.map((m) => Math.round(m.score * 100)));
    expect(shared.cities[0].lines).toEqual(top[0].temperamentLines);
  });

  it("carries the temperament and the cities, never origin, family country, faith or filters", () => {
    const decoded = readShared(new URL(resultLink(READER, top)).hash)!;
    expect(Object.keys(decoded.temperament).sort()).toEqual(
      ["adventure", "friction", "order", "saturday", "together"].sort(),
    );
    const raw = JSON.stringify(decoded);
    for (const secret of ["ouest", "Sénégal", "muslim", "excludeCriminalising", "origin", "faith"])
      expect(raw).not.toContain(secret);
  });

  it("ignores a broken or edited link instead of showing a made-up result", () => {
    expect(readShared("")).toBeNull();
    expect(readShared("#r=not-base64!!")).toBeNull();
    expect(
      sharedResult({ temperament: {}, cities: [{ slug: "atlantis", percent: 99 }] }),
    ).toBeNull();
  });

  it("writes the shared message with the profile, each city's why and the link", () => {
    const text = shareText(READER, top);
    const shared = sharedResult(readShared(new URL(resultLink(READER, top)).hash)!)!;
    expect(text).toContain(shared.archetype!.name);
    for (const m of top) expect(text).toContain(m.city.name);
    expect(text).toContain(top[0].temperamentLines.find((line) => !line.weak)!.text);
    expect(text).toContain("https://labas.africa/resultat/#r=");
  });
});
