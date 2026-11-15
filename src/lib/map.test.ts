import { describe, expect, it } from "vitest";
import { answersBeforeLight, dotTier, placeLabels } from "./map";

describe("the city map", () => {
  it("colours a city warmer the more it resembles the reader", () => {
    expect(dotTier(0)).toBe("faint");
    expect(dotTier(0.5)).toBe("lilac");
    expect(dotTier(0.75)).toBe("coral");
    expect(dotTier(1)).toBe("saffron");
  });

  it("never lets two city names overlap", () => {
    const labels = placeLabels([
      { name: "Le Caire", x: 235.6, y: 50.3 },
      { name: "Alexandrie", x: 230.5, y: 44.7 },
      { name: "Assouan", x: 242.1, y: 78.9 },
    ]);
    const sameSide = labels.filter((l) => l.anchor === labels[0].anchor);
    const ys = sameSide.map((l) => l.labelY).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(14);
  });

  it("puts a name on the side where it fits", () => {
    const [east] = placeLabels([{ name: "Victoria", x: 330, y: 217 }]);
    const [west] = placeLabels([{ name: "Dakar", x: 45, y: 124 }]);
    expect(east.anchor).toBe("end");
    expect(west.anchor).toBe("start");
  });
});

describe("when the map lights up", () => {
  it("waits for enough answers before colouring any city", () => {
    expect(answersBeforeLight(0)).toBe(3);
    expect(answersBeforeLight(1)).toBe(2);
    expect(answersBeforeLight(3)).toBe(0);
    expect(answersBeforeLight(7)).toBe(0);
  });
});
