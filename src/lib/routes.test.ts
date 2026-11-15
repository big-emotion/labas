import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { QUESTIONS } from "./questions";
import { jobOf, routesFor, weekFor } from "./routes";

// Since 2026-11-15 the site says « vous »: no « tu », and never a trait about the reader.
const TRAIT_WORDS =
  /personnalité|votre profil|vous êtes (quelqu|un |une |plutôt)|(?<![\p{L}'’])(tu|te|toi|ton|ta|tes)(?!\p{L})|(?<!\p{L})t['’](?=\p{L})/iu;
// Routes were written for the cities proposed before 2026-11-15; those travel advice used to
// hide have none yet, and their page simply shows no route.
const proposable = CITIES.filter((city) => routesFor(city.name));
const VALID: Record<string, Set<unknown>> = Object.fromEntries([
  ...QUESTIONS.map((q) => [q.id, new Set(q.choices.map((c) => c.value))]),
  // The quick quiz no longer asks « Et le travail ? »: jobOf reads it from the profession.
  ["job", new Set(["remote", "cadre", "entre"])],
]);

describe("the typical weeks and discovery routes of each city", () => {
  it("gives every proposable city five typical weeks and a discovery day and week", () => {
    for (const city of proposable) {
      const routes = routesFor(city.name);
      expect(routes, city.name).toBeDefined();
      expect(routes?.weeks.length, city.name).toBe(5);
      expect(routes?.discovery.day.length, city.name).toBe(4);
      expect(routes?.discovery.week.length, city.name).toBe(7);
    }
  });

  it("keys every typical week to real quiz answers", () => {
    for (const city of proposable) {
      for (const week of routesFor(city.name)?.weeks ?? []) {
        const keys = Object.entries(week.for);
        expect(keys.length, `${city.name}: ${week.title}`).toBeGreaterThan(0);
        for (const [question, value] of keys) {
          expect(VALID[question]?.has(value), `${city.name}: ${question}=${String(value)}`).toBe(
            true,
          );
        }
      }
    }
  });

  it("fills seven days and names a base neighbourhood for every week", () => {
    for (const city of proposable) {
      for (const week of routesFor(city.name)?.weeks ?? []) {
        expect(week.base, city.name).toBeTruthy();
        expect(week.days.length, `${city.name}: ${week.title}`).toBe(7);
        for (const day of week.days) expect(day.trim().length, city.name).toBeGreaterThan(10);
      }
    }
  });

  it("backs every city's routes with dated sources", () => {
    for (const city of proposable) {
      const sources = routesFor(city.name)?.sources ?? [];
      expect(sources.length, city.name).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.url, city.name).toMatch(/^https:\/\//);
        expect(source.accessed, city.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("speaks to the reader with « vous » and never names a trait", () => {
    for (const city of proposable) {
      const routes = routesFor(city.name);
      const texts = [
        ...(routes?.weeks ?? []).flatMap((w) => [w.title, w.base, ...w.days, w.budget ?? ""]),
        ...(routes?.discovery.day ?? []),
        ...(routes?.discovery.week ?? []),
      ];
      // « Ta Mar » is a restaurant in Bissau, not a « ta » addressed to the reader.
      for (const text of texts)
        expect(text.replaceAll("Ta Mar", ""), city.name).not.toMatch(TRAIT_WORDS);
    }
  });

  it("knows nothing about a city that is not in the catalogue", () => {
    expect(routesFor("Atlantide")).toBeUndefined();
  });
});

describe("reading the way of working from today's answers", () => {
  it("reads remote work from a digital profession or a life on the move", () => {
    expect(jobOf({ profession: "tech" })).toBe("remote");
    expect(jobOf({ currentCity: "nomad" })).toBe("remote");
  });

  it("reads entrepreneurship from trade, craft or an investment project", () => {
    expect(jobOf({ profession: "trade" })).toBe("entre");
    expect(jobOf({ project: "investir" })).toBe("entre");
  });

  it("reads salaried work from the other professions, and nothing from no answer", () => {
    expect(jobOf({ profession: "finance" })).toBe("cadre");
    expect(jobOf({})).toBeUndefined();
  });

  it("picks the remote-work week for a developer", () => {
    expect(weekFor("Dakar", { profession: "tech", family: "celib" })?.for.job).toBe("remote");
  });
});

describe("picking the typical week that fits the reader's answers", () => {
  const city = "Dakar";

  it("picks the remote-work week for someone who works remotely", () => {
    expect(weekFor(city, { job: "remote" })?.for.job).toBe("remote");
  });

  it("picks the family week for someone moving with children", () => {
    expect(weekFor(city, { family: "parents", job: "cadre" })?.for.family).toBe("parents");
  });

  it("picks the trial week for someone who wants to test a few months", () => {
    expect(weekFor(city, { project: "tester" })?.for.project).toBe("tester");
  });

  it("falls back to the first week when no answer matches", () => {
    expect(weekFor(city, {})).toEqual(routesFor(city)?.weeks[0]);
  });
});
