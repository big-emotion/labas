import { describe, expect, it } from "vitest";
import { CITIES, CRITERIA } from "./cities";
import { criteriaPreview } from "./city-sections";
import { bestWeekIndex } from "./week-pick";
import { routesFor, weekFor } from "./routes";

const dakar = CITIES.find((city) => city.name === "Dakar")!;

// Beta feedback, 2026-11-16: the city page is grouped by theme, each with a preview.
describe("the criteria preview of a city page", () => {
  it("shows its three strongest criteria and its weakest, by level", () => {
    const { strongest, weakest } = criteriaPreview(dakar);
    expect(strongest).toHaveLength(3);
    const levels = strongest.map((c) => dakar.scores[c.key].level!);
    const rated = CRITERIA.filter(
      (c) => c.direction === "higher-is-better" && dakar.scores[c.key].level !== null,
    );
    const top = Math.max(...rated.map((c) => dakar.scores[c.key].level!));
    expect(levels[0]).toBe(top);
    expect(levels).toEqual([...levels].sort((a, b) => b - a));
    const bottom = Math.min(...rated.map((c) => dakar.scores[c.key].level!));
    expect(dakar.scores[weakest!.key].level).toBe(bottom);
  });

  it("leaves out « target » criteria, where a high level is neither good nor bad", () => {
    for (const city of CITIES) {
      const { strongest, weakest } = criteriaPreview(city);
      for (const c of [...strongest, weakest].filter(Boolean))
        expect(c!.direction, city.name).toBe("higher-is-better");
    }
  });
});

describe("the typical week a city page opens on", () => {
  it("is the one the ranking would pick for the reader's answers", () => {
    const routes = routesFor("Dakar")!;
    for (const answers of [{}, { job: "remote" as const }, { family: "parents" as const }]) {
      const index = bestWeekIndex(routes.weeks, answers);
      expect(routes.weeks[index]).toBe(weekFor("Dakar", answers));
    }
  });
});
