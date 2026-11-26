import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import {
  leftOut,
  placesAsideIn,
  restore,
  setAside,
  setAsideChoices,
  setAsideNotice,
} from "./not-for-me";
import { bestMatches, type Answers } from "./ranking";

const oran = CITIES.find((c) => c.name === "Oran")!;
const base: Answers = { project: "installer", languages: ["fr"] };

describe("« Pas pour moi » on a city", () => {
  it("offers the city, its country and its region, each with how many cities go", () => {
    expect(setAsideChoices(oran, "fr")).toEqual([
      { level: "city", label: "Cette ville", detail: "Oran seulement" },
      { level: "country", label: "Tout le pays", detail: "Algérie · 2 villes" },
      { level: "region", label: "Toute la région", detail: "Afrique du Nord · 14 villes" },
    ]);
    expect(setAsideChoices(oran, "en")[2]).toEqual({
      level: "region",
      label: "The whole region",
      detail: "North Africa · 14 cities",
    });
  });

  it("takes the place out of the best matches, the others keeping theirs", () => {
    const answers = setAside(base, oran, "region");
    expect(answers).toEqual({ ...base, avoidRegions: ["nord"] });
    for (const m of bestMatches(answers, 20)) expect(m.city.zone).not.toBe("nord");
    expect(setAside(base, oran, "country").avoidCountries).toEqual(["Algérie"]);
    expect(setAside(base, oran, "city").avoidCities).toEqual(["Oran"]);
  });

  it("sets a place aside once, however many times it is tapped", () => {
    const twice = setAside(setAside(base, oran, "city"), oran, "city");
    expect(twice.avoidCities).toEqual(["Oran"]);
  });

  // « En moins : … » rather than « … écarté(e) »: a country is masculine, a region feminine.
  it("says what went, and how many cities", () => {
    expect(setAsideNotice(oran, "region", "fr")).toBe("En moins : Afrique du Nord (14 villes).");
    expect(setAsideNotice(oran, "city", "fr")).toBe("En moins : Oran.");
    expect(setAsideNotice(oran, "country", "en")).toBe("Left out: Algeria (2 cities).");
  });
});

describe("the places left out", () => {
  it("are listed with their names, so each can be put back", () => {
    const answers = setAside(setAside(base, oran, "region"), oran, "city");
    expect(leftOut(answers, "fr")).toEqual([
      { level: "city", value: "Oran", label: "Oran" },
      { level: "region", value: "nord", label: "Afrique du Nord" },
    ]);
    expect(leftOut(answers, "en")[1].label).toBe("North Africa");
  });

  it("come back one at a time, and the list forgets an empty level", () => {
    const answers = setAside(setAside(base, oran, "region"), oran, "city");
    const back = restore(answers, { level: "region", value: "nord" });
    expect(back).toEqual({ ...base, avoidCities: ["Oran"] });
    expect(bestMatches(back, 115).some((m) => m.city.name === "Tunis")).toBe(true);
  });
});

describe("the places left out, read back from the answers kept", () => {
  it("keeps the cities, countries and regions set aside and nothing else", () => {
    const dakar = CITIES.find((c) => c.name === "Dakar")!;
    const answers = setAside(
      setAside({ project: "installer" } as Answers, dakar, "city"),
      dakar,
      "region",
    );
    expect(placesAsideIn(answers)).toEqual({
      avoidCities: ["Dakar"],
      avoidRegions: [dakar.zone],
    });
  });
});
