// @vitest-environment node
import { describe, expect, it } from "vitest";
import { plausibleStats } from "./plausible";

interface Query {
  site_id: string;
  metrics: string[];
  date_range: string;
  dimensions?: string[];
  filters?: unknown[];
}

/** Plausible's Stats API v2, answering from a table: the only fake, at the edge of the system. */
function fakePlausible(answer: (query: Query) => { metrics: number[]; dimensions: string[] }[]) {
  const seen: { url: string; auth: string; query: Query }[] = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const query = JSON.parse(String(init?.body)) as Query;
    seen.push({
      url: String(url),
      auth: new Headers(init?.headers).get("authorization") ?? "",
      query,
    });
    return new Response(JSON.stringify({ results: answer(query) }), { status: 200 });
  };
  return { fetch: fetch as typeof globalThis.fetch, seen };
}

const PLAUSIBLE = { host: "https://stats.exemple.org", site: "labas.africa", apiKey: "k" };

function figures(query: Query) {
  const days = query.date_range === "7d" ? 1 : 4;
  const dimension = query.dimensions?.[0];
  if (!dimension) return [{ metrics: [100 * days, 300 * days], dimensions: [] }];
  if (dimension === "event:goal")
    return [
      { metrics: [40 * days, 90 * days], dimensions: ["Réponse"] },
      { metrics: [20 * days, 20 * days], dimensions: ["Questionnaire 1 terminé"] },
      { metrics: [3 * days, 4 * days], dimensions: ["Réaction envoyée"] },
    ];
  if (dimension === "event:page")
    return [
      { metrics: [80], dimensions: ["/"] },
      { metrics: [12], dimensions: ["/ville/dakar/"] },
    ];
  return [{ metrics: [5], dimensions: ["dakar"] }];
}

describe("the audience figures from Plausible", () => {
  it("asks the Stats API of the site with the key", async () => {
    const { fetch, seen } = fakePlausible(figures);
    await plausibleStats({ ...PLAUSIBLE, fetch })();
    expect(seen.length).toBeGreaterThan(0);
    for (const call of seen) {
      expect(call.url).toBe("https://stats.exemple.org/api/v2/query");
      expect(call.auth).toBe("Bearer k");
      expect(call.query.site_id).toBe("labas.africa");
    }
  });

  it("gives visitors, pages viewed and every goal, over 7 and 30 days", async () => {
    const { fetch } = fakePlausible(figures);
    const { periods } = await plausibleStats({ ...PLAUSIBLE, fetch })();
    expect(periods.map((p) => p.label)).toEqual(["7 jours", "30 jours"]);
    expect(periods[1]).toMatchObject({ visitors: 400, pageviews: 1200 });
    expect(periods[1].goals["Réponse"]).toEqual({ visitors: 160, events: 360 });
    expect(periods[0].goals["Réaction envoyée"]).toEqual({ visitors: 3, events: 4 });
  });

  it("names the most read pages and the cities reviewed, over 30 days", async () => {
    const { fetch, seen } = fakePlausible(figures);
    const dashboard = await plausibleStats({ ...PLAUSIBLE, fetch })();
    expect(dashboard.pages).toEqual([
      { page: "/", visitors: 80 },
      { page: "/ville/dakar/", visitors: 12 },
    ]);
    expect(dashboard.reviewedCities).toEqual([{ city: "dakar", events: 5 }]);
    const byCity = seen.find((s) => s.query.dimensions?.[0] === "event:props:ville")!;
    expect(byCity.query.filters).toEqual([["is", "event:goal", ["Réaction envoyée"]]]);
    expect(dashboard.link).toBe("https://stats.exemple.org/labas.africa");
  });

  it("fails loudly when Plausible refuses, rather than showing zeros", async () => {
    const fetch = (async () => new Response("no", { status: 401 })) as typeof globalThis.fetch;
    await expect(plausibleStats({ ...PLAUSIBLE, fetch })()).rejects.toThrow(/401/);
  });

  it("gives up on a Plausible that never answers, naming the host", async () => {
    const silent = ((_url: string | URL | Request, init?: RequestInit) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason)),
      )) as typeof globalThis.fetch;
    const stats = plausibleStats({ ...PLAUSIBLE, fetch: silent, timeout: 20 });
    await expect(stats()).rejects.toThrow(/stats\.exemple\.org.*20 ms/);
  });
});
