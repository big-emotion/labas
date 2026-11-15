import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { advisoryNote } from "./advisory";

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
