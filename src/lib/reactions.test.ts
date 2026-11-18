import { describe, expect, it } from "vitest";
import { initialOf, ofCity, reactionCount, reactionDate } from "./reactions";

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

describe("the round badge of the author", () => {
  it("shows the first letter of the name, accents kept, upper case", () => {
    expect(initialOf("awa de Lyon")).toBe("A");
    expect(initialOf("Élodie")).toBe("É");
    expect(initialOf("Utilisateur 3016")).toBe("U");
    expect(initialOf("  ")).toBe("?");
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
