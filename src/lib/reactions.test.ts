import { describe, expect, it } from "vitest";
import { ofCity, reactionCount, reactionDate, topLine } from "./reactions";

const NOW = Date.UTC(2026, 10, 18, 12);
const HOUR = 60 * 60 * 1000;
const at = (offset: number) => new Date(NOW - offset).toISOString();

describe("when a reaction was written", () => {
  it("speaks plainly for the last days, then gives the date", () => {
    expect(reactionDate(at(2 * HOUR), NOW)).toBe("aujourd'hui");
    expect(reactionDate(at(24 * HOUR), NOW)).toBe("hier");
    expect(reactionDate(at(3 * 24 * HOUR), NOW)).toBe("il y a 3 jours");
    expect(reactionDate("2026-10-02T09:00:00.000Z", NOW)).toBe("le 2 octobre 2026");
  });
});

describe("how many reactions", () => {
  it("agrees the noun with the number", () => {
    expect(reactionCount(0)).toBe("Aucune réaction pour l'instant");
    expect(reactionCount(1)).toBe("1 réaction");
    expect(reactionCount(12)).toBe("12 réactions");
  });
});

describe("the joined top three", () => {
  it("names the cities and their percentages, nothing else", () => {
    const top = [
      { slug: "dakar", name: "Dakar", percent: 87 },
      { slug: "accra", name: "Accra", percent: 81 },
      { slug: "abidjan", name: "Abidjan", percent: 79 },
    ];
    expect(topLine(top)).toBe("Son top 3 : Dakar 87\u202f%, Accra 81\u202f%, Abidjan 79\u202f%");
  });
});

describe("the city in the title", () => {
  it("elides « de » before a vowel, as French does", () => {
    expect(ofCity("Dakar")).toBe("de Dakar");
    expect(ofCity("Abidjan")).toBe("d'Abidjan");
    expect(ofCity("Essaouira")).toBe("d'Essaouira");
    expect(ofCity("Hargeisa")).toBe("de Hargeisa");
  });
});
