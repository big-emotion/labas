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
