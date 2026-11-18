import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { advisoryLine, advisoryNote } from "./advisory";

const city = (name: string) => CITIES.find((c) => c.name === name)!;

describe("the travel advice shown with a city", () => {
  it("says nothing when the authorities do not advise against the city", () => {
    expect(advisoryNote(city("Dakar"))).toBeUndefined();
  });

  it("gives the French advice in plain words, with its date", () => {
    const note = advisoryNote(city("Kinshasa"))!;
    expect(note).toMatch(/orange/);
    expect(note).toMatch(/15 septembre 2026/);
  });

  it("adds the British advice when it warns too", () => {
    expect(advisoryNote(city("Bamako"))).toMatch(/Royaume-Uni déconseille tout voyage/);
  });

  it("frames the advice as information for visitors, not a verdict on the city", () => {
    expect(advisoryNote(city("Kinshasa"))).toMatch(/gens qui y vivent/);
  });
});

describe("the travel advice in English", () => {
  it("names the French ministry and the FCDO with the date, in British English", () => {
    const note = advisoryNote(city("Bamako"), "en")!;
    expect(note).toMatch(/French foreign ministry/);
    expect(note).toMatch(/FCDO advises against all travel/);
    expect(advisoryNote(city("Kinshasa"), "en")).toMatch(/15 September 2026/);
    expect(advisoryNote(city("Kinshasa"), "en")).toMatch(/people who live there/);
  });

  it("dates the advice line of every city page in both languages", () => {
    const kinshasa = city("Kinshasa").facts.advisory;
    expect(advisoryLine(kinshasa, "fr")).toMatch(/^France Diplomatie : zone orange/);
    expect(advisoryLine(kinshasa, "en")).toMatch(/^France Diplomatie: orange zone/);
    expect(advisoryLine(kinshasa, "en")).toMatch(/Advice dated 15 September 2026\./);
    for (const c of CITIES)
      expect(advisoryLine(c.facts.advisory, "en"), c.name).toMatch(
        /check the ministry's page before you go\.$/,
      );
  });
});
