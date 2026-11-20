import { describe, expect, it } from "vitest";
import { byTaps, tapOn, tapsLabel, tapTotal, type TapsByCity } from "./taps";

describe("a tap on a city", () => {
  it("adds the reader's answer to the count", () => {
    expect(tapOn("like", undefined, { like: 2, suits: 0, not: 1 })).toEqual({
      kind: "like",
      was: null,
      counts: { like: 3, suits: 0, not: 1 },
    });
  });

  it("moves the answer when the reader changes their mind", () => {
    expect(tapOn("not", "like", { like: 3, suits: 0, not: 1 })).toEqual({
      kind: "not",
      was: "like",
      counts: { like: 2, suits: 0, not: 2 },
    });
  });

  it("takes the answer back on a second tap, and never shows a negative count", () => {
    expect(tapOn("like", "like", undefined)).toEqual({
      kind: null,
      was: "like",
      counts: { like: 0, suits: 0, not: 0 },
    });
  });
});

describe("cities sorted by their reactions", () => {
  const taps: TapsByCity = {
    dakar: { like: 5, suits: 2, not: 1 },
    abidjan: { like: 10, suits: 0, not: 0 },
    lome: { like: 0, suits: 0, not: 0 },
  };
  const slugs = ["abidjan", "cotonou", "dakar", "lome"];

  it("counts the three answers together", () => {
    expect(tapTotal(taps.dakar)).toBe(8);
    expect(tapTotal(undefined)).toBe(0);
  });

  it("says the count in words, and nothing at all for a city without a reaction", () => {
    expect(tapsLabel(taps.dakar, "fr")).toBe("8 réactions");
    expect(tapsLabel({ like: 1, suits: 0, not: 0 }, "en")).toBe("1 reaction");
    expect(tapsLabel(taps.lome, "fr")).toBe("");
  });

  it("lists the most reacted first, the others in their own order", () => {
    expect(byTaps(slugs, taps, "plus")).toEqual(["abidjan", "dakar", "cotonou", "lome"]);
  });

  it("lists the fewest first", () => {
    expect(byTaps(slugs, taps, "moins")).toEqual(["cotonou", "lome", "dakar", "abidjan"]);
  });

  it("keeps only the cities with a reaction when asked", () => {
    expect(byTaps(slugs, taps, "moins", true)).toEqual(["dakar", "abidjan"]);
  });
});
