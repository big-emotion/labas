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
  shownName,
  profileIn,
  translationNote,
  temperamentText,
} from "./reactions";

describe("the count on /avis", () => {
  it("says how many reviews the filters keep, out of how many", () => {
    expect(reviewsFound(0, 0, "fr")).toBe("Aucun avis pour l'instant");
    // The order is the reader's sort now, so the count no longer claims « les plus récents ».
    expect(reviewsFound(12, 12, "fr")).toBe("12 avis");
    expect(reviewsFound(1, 1, "fr")).toBe("1 avis");
    expect(reviewsFound(3, 12, "fr")).toBe("3 avis sur 12");
    expect(reviewsFound(0, 12, "fr")).toBe("Aucun avis sur 12 ne correspond");
  });
});

describe("the replies under a review", () => {
  it("agrees the noun with the number", () => {
    expect(replyCount(0, "fr")).toBe("Répondre");
    expect(replyCount(1, "fr")).toBe("1 réponse");
    expect(replyCount(4, "fr")).toBe("4 réponses");
  });
});

describe("a mark read aloud", () => {
  it("names the mark, how many readers left it and whether the reader did", () => {
    expect(markLabel("coeur", 0, false, "fr")).toBe("J'aime");
    expect(markLabel("coeur", 3, true, "fr")).toBe("J'aime, 3 personnes, dont vous");
    expect(markLabel("merci", 1, false, "fr")).toBe("Merci, 1 personne");
  });
});

const NOW = Date.UTC(2026, 10, 18, 12);
const HOUR = 60 * 60 * 1000;
const at = (offset: number) => new Date(NOW - offset).toISOString();

describe("when a reaction was written", () => {
  it("speaks plainly for the last days, then gives the date", () => {
    expect(reactionDate(at(2 * HOUR), NOW, "fr")).toBe("aujourd'hui");
    expect(reactionDate(at(24 * HOUR), NOW, "fr")).toBe("hier");
    expect(reactionDate(at(3 * 24 * HOUR), NOW, "fr")).toBe("il y a 3 jours");
    expect(reactionDate("2026-10-02T09:00:00.000Z", NOW, "fr")).toBe("le 2 octobre 2026");
  });
});

describe("how many reactions", () => {
  it("agrees the noun with the number", () => {
    expect(reactionCount(0, "fr")).toBe("Pas encore d'information");
    expect(reactionCount(1, "fr")).toBe("1 réaction");
    expect(reactionCount(12, "fr")).toBe("12 réactions");
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
    expect(journeySummary(top, profile, "fr")).toEqual({
      first: "Arusha 79\u202f%",
      temperament: "Fondation",
      more: "+2 villes",
      label: "Son parcours : Arusha en tête, profil Fondation. Voir le détail",
    });
  });

  it("leaves out what the reader did not give", () => {
    expect(journeySummary(top, null, "fr").temperament).toBeNull();
    expect(journeySummary(top.slice(0, 2), null, "fr").more).toBe("+1 ville");
    expect(journeySummary(null, profile, "fr").first).toBeNull();
    expect(journeySummary(null, profile, "fr").label).toBe(
      "Son parcours : profil Fondation. Voir le détail",
    );
  });
});

describe("the same words on the English pages", () => {
  it("counts, dates and names marks in English", () => {
    expect(reviewsFound(0, 0, "en")).toBe("No reviews yet");
    expect(reviewsFound(1, 1, "en")).toBe("1 review");
    expect(reviewsFound(3, 12, "en")).toBe("3 of 12 reviews");
    expect(reviewsFound(0, 12, "en")).toBe("None of the 12 reviews matches");
    expect(replyCount(0, "en")).toBe("Reply");
    expect(replyCount(1, "en")).toBe("1 reply");
    expect(replyCount(4, "en")).toBe("4 replies");
    expect(reactionCount(1, "en")).toBe("1 reaction");
    expect(markLabel("coeur", 3, true, "en")).toBe("Like, 3 people, including you");
    expect(reactionDate(at(3 * 24 * HOUR), NOW, "en")).toBe("3 days ago");
    expect(reactionDate("2026-10-02T09:00:00.000Z", NOW, "en")).toBe("on 2 October 2026");
  });

  it("names a nameless reader « User », with the same number", () => {
    expect(shownName("Utilisateur 3016", "en")).toBe("User 3016");
    expect(shownName("Utilisateur 3016", "fr")).toBe("Utilisateur 3016");
    expect(shownName("Awa", "en")).toBe("Awa");
  });

  it("names the journey's city and temperament in English", () => {
    const top = [
      { slug: "le-cap", name: "Le Cap", percent: 80 },
      { slug: "dakar", name: "Dakar", percent: 70 },
    ];
    expect(journeySummary(top, { name: "Fondation", traits: [] }, "en")).toEqual({
      first: "Cape Town 80\u202f%",
      temperament: "Foundation",
      more: "+1 city",
      label: "Their journey: Cape Town first, Foundation profile. See the detail",
    });
    const traits = [{ name: "Extraversion", range: "calme ou monde", value: 1 }];
    expect(profileIn({ name: "Lien", traits }, "en")).toEqual({
      name: "Connection",
      traits: [{ name: "Extraversion", range: "quiet or crowds", value: 1 }],
    });
  });

  it("describes a temperament in English, and keeps the French text in French", () => {
    expect(temperamentText("Refuge", "Vous aimez le calme.", "fr")).toBe("Vous aimez le calme.");
    expect(temperamentText("Refuge", "Vous aimez le calme.", "en")).toMatch(/^You like calm/);
  });

  it("says when a review was already in the page's language", () => {
    expect(translationNote("en", "en")).toBe("Already in English");
    expect(translationNote("fr", "fr")).toBe("Déjà en français");
    expect(translationNote("fr", "en")).toBe("Translated by DeepL");
    expect(translationNote("en", "fr")).toBe("Traduit par DeepL");
  });
});
