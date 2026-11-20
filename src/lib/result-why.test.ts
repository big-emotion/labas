import { describe, expect, it } from "vitest";
import { bestMatches, TOP_THREE, type Answers } from "./ranking";
import { whyTheseCities } from "./result-why";
import { looksFrench } from "../i18n/looks-french";

const reader: Answers = {
  project: "installer",
  languages: ["fr"],
  landscapes: ["beach"],
  size: 3,
  saturday: 1,
  priorities: ["safety"],
};
const labels = (answers: Answers, index: number) =>
  bestMatches(answers, TOP_THREE)[index].reasons.map((r) => r.label);

describe("why these cities came first", () => {
  it("names what the three cities have in common", () => {
    const why = whyTheseCities(bestMatches(reader, TOP_THREE));
    expect(why.shared.length).toBeGreaterThan(0);
    for (const label of why.shared)
      for (const index of [0, 1, 2]) expect(labels(reader, index)).toContain(label);
  });

  it("explains the first city with its own reasons, not with what the three share", () => {
    const why = whyTheseCities(bestMatches(reader, TOP_THREE));
    expect(why.first.length).toBeGreaterThan(0);
    for (const label of why.first) expect(labels(reader, 0)).toContain(label);
  });

  it("falls back on the first city's strongest reasons when the three share them all", () => {
    const [first] = bestMatches(reader, TOP_THREE);
    const why = whyTheseCities([first, first, first]);
    expect(why.shared).toEqual(first.reasons.slice(0, 3).map((r) => r.label));
    expect(why.first).toEqual(why.shared);
  });

  it("says what weighs against the first city, so a surprise is not left unexplained", () => {
    const farFromHome: Answers = { ...reader, origin: ["ameriques"], languages: ["ar"] };
    const matches = bestMatches(farFromHome, TOP_THREE);
    expect(matches[0].drawbacks.length).toBeGreaterThan(0);
    expect(whyTheseCities(matches).toKnow).toBe(matches[0].drawbacks[0].label);
  });

  it("stays silent before any answer", () => {
    expect(whyTheseCities(bestMatches({}, TOP_THREE))).toEqual({ shared: [], first: [] });
  });

  it("speaks English on the English site", () => {
    const why = whyTheseCities(bestMatches(reader, TOP_THREE, "en"));
    for (const label of [...why.shared, ...why.first])
      expect(looksFrench(label), label).toBe(false);
  });
});
// Operator, 2026-11-20: the box says what brings these cities close to the reader, in the
// reader's own answers. It never says which region or city stepped back.
describe("what the reader said of their own", () => {
  const settler: Answers = { ...reader, origin: ["ameriques"], kin: "much" };
  const why = (answers: Answers, locale: "fr" | "en" = "fr") =>
    whyTheseCities(bestMatches(answers, TOP_THREE, locale), answers, locale);

  it("recalls the family's region and the wish to live near one's own, then speaks of closeness", () => {
    const { yours } = why(settler);
    expect(yours?.said).toEqual([
      "Votre famille vient des Caraïbes ou des Amériques",
      "Vivre près de vos origines compte pour vous",
    ]);
    expect(yours?.closer).toBe(
      "Nous avons mis en avant les villes qui ont un lien plus étroit avec vos origines.",
    );
  });

  it("names the family's countries, and the faith only as a tie, never which one", () => {
    const { yours } = why({
      ...reader,
      origin: ["ouest", "centre"],
      countries: ["Sénégal", "Cameroun"],
      kin: "some",
      faith: "muslim",
    });
    expect(yours?.said).toEqual([
      "Votre famille vient d'Afrique de l'Ouest et d'Afrique centrale",
      "Le pays de votre famille : Sénégal, Cameroun",
      "Vivre près de vos origines compte pour vous",
    ]);
    expect(yours?.closer).toBe(
      "Nous avons mis en avant les villes qui ont un lien plus étroit avec vos origines et votre religion.",
    );
  });

  it("never speaks of a region or a city that stepped back", () => {
    const text = JSON.stringify(why({ ...settler, adventure: "familiar" }).yours);
    for (const word of ["Nord", "après", "retir", "écart", "recul", "loin"])
      expect(text.toLowerCase()).not.toContain(word.toLowerCase());
  });

  it("says nothing of closeness when the reader did not ask for it", () => {
    expect(why({ ...reader, origin: ["ouest"], kin: "none" }).yours?.closer).toBeUndefined();
    expect(
      why({ ...reader, origin: ["ouest"], kin: "much", adventure: "seeking" }).yours?.said,
    ).toHaveLength(2);
    expect(why(reader).yours).toBeUndefined();
  });

  it("says it in English on the English site", () => {
    const { yours } = why({ ...settler, origin: ["ouest"], countries: ["Sénégal"] }, "en");
    expect(yours?.said).toEqual([
      "Your family comes from West Africa",
      "Your family's country: Senegal",
      "Living close to your roots matters to you",
    ]);
    expect(yours?.closer).toBe("We have put forward the cities with a closer tie to your roots.");
  });
});
