import { describe, expect, it } from "vitest";
import {
  initialOf,
  journeySummary,
  markLabel,
  ofCity,
  reactionCount,
  reactionDate,
  replyCount,
  reviewsFound,
} from "./reactions";

describe("the count on /avis", () => {
  it("says how many reviews the filters keep, out of how many", () => {
    expect(reviewsFound(0, 0)).toBe("Aucun avis pour l'instant");
    expect(reviewsFound(12, 12)).toBe("12 avis, les plus récents d'abord");
    expect(reviewsFound(3, 12)).toBe("3 avis sur 12");
    expect(reviewsFound(0, 12)).toBe("Aucun avis sur 12 ne correspond");
  });
});

describe("the replies under a review", () => {
  it("agrees the noun with the number", () => {
    expect(replyCount(0)).toBe("Répondre");
    expect(replyCount(1)).toBe("1 réponse");
    expect(replyCount(4)).toBe("4 réponses");
  });
});

describe("a mark read aloud", () => {
  it("names the mark, how many readers left it and whether the reader did", () => {
    expect(markLabel("coeur", 0, false)).toBe("J'aime");
    expect(markLabel("coeur", 3, true)).toBe("J'aime, 3 personnes, dont vous");
    expect(markLabel("merci", 1, false)).toBe("Merci, 1 personne");
  });
});

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

describe("the one-line summary of the author's journey", () => {
  const top = [
    { slug: "arusha", name: "Arusha", percent: 79 },
    { slug: "port-louis", name: "Port-Louis", percent: 78 },
    { slug: "grand-baie", name: "Grand Baie", percent: 76 },
  ];
  const profile = { name: "Fondation", traits: [] };

  it("names the first city, the temperament and how many cities wait behind", () => {
    expect(journeySummary(top, profile)).toEqual({
      first: "Arusha 79\u202f%",
      temperament: "Fondation",
      more: "+2 villes",
      label: "Son parcours : Arusha en tête, tempérament Fondation. Voir le détail",
    });
  });

  it("leaves out what the reader did not give", () => {
    expect(journeySummary(top, null).temperament).toBeNull();
    expect(journeySummary(top.slice(0, 2), null).more).toBe("+1 ville");
    expect(journeySummary(null, profile).first).toBeNull();
    expect(journeySummary(null, profile).label).toBe(
      "Son parcours : tempérament Fondation. Voir le détail",
    );
  });
});
