import type { Goals } from "../lib/admin";

/**
 * The audience figures of /admin, read from Plausible's Stats API v2 with a key kept on the
 * server (operator, 2026-11-18). Nothing of Plausible is embedded in the page: the site keeps no
 * third-party frame. The full dashboard stays one link away.
 */

interface Options {
  /** Where Plausible answers, e.g. https://stats.ethniafrica.com. */
  host: string;
  /** The site as Plausible names it, e.g. labas.africa. */
  site: string;
  apiKey: string;
  fetch?: typeof globalThis.fetch;
  /** Milliseconds before a silent Plausible counts as down, so /admin never hangs on it. */
  timeout?: number;
}

interface Row {
  metrics: number[];
  dimensions: string[];
}

export interface Period {
  label: string;
  visitors: number;
  pageviews: number;
  goals: Goals;
}

export interface Dashboard {
  periods: Period[];
  pages: { page: string; visitors: number }[];
  reviewedCities: { city: string; events: number }[];
  link: string;
}

const PERIODS = [
  { label: "7 jours", range: "7d" },
  { label: "30 jours", range: "30d" },
];
const TOP = 8;

export function plausibleStats({
  host,
  site,
  apiKey,
  fetch = globalThis.fetch,
  timeout = 5000,
}: Options) {
  async function query(body: Record<string, unknown>): Promise<Row[]> {
    // The error names the host and the cause: a container that cannot reach its own server's
    // public address times out silently, and the log is the only place that can say so.
    const response = await fetch(`${host}/api/v2/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ site_id: site, ...body }),
      signal: AbortSignal.timeout(timeout),
    }).catch((error: unknown) => {
      const cause = error instanceof Error && error.cause ? ` (${String(error.cause)})` : "";
      throw new Error(
        `Plausible at ${host} unreachable (timeout ${timeout} ms): ${String(error)}${cause}`,
      );
    });
    if (!response.ok) throw new Error(`Plausible answered ${response.status}`);
    return ((await response.json()) as { results: Row[] }).results;
  }

  async function period({ label, range }: (typeof PERIODS)[number]): Promise<Period> {
    const [[total], goals] = await Promise.all([
      query({ metrics: ["visitors", "pageviews"], date_range: range }),
      query({ metrics: ["visitors", "events"], date_range: range, dimensions: ["event:goal"] }),
    ]);
    return {
      label,
      visitors: total?.metrics[0] ?? 0,
      pageviews: total?.metrics[1] ?? 0,
      goals: Object.fromEntries(
        goals.map((row) => [
          row.dimensions[0],
          { visitors: row.metrics[0], events: row.metrics[1] },
        ]),
      ),
    };
  }

  return async (): Promise<Dashboard> => {
    const [periods, pages, cities] = await Promise.all([
      Promise.all(PERIODS.map(period)),
      query({
        metrics: ["visitors"],
        date_range: "30d",
        dimensions: ["event:page"],
        order_by: [["visitors", "desc"]],
        pagination: { limit: TOP },
      }),
      query({
        metrics: ["events"],
        date_range: "30d",
        dimensions: ["event:props:ville"],
        filters: [["is", "event:goal", ["Réaction envoyée"]]],
        order_by: [["events", "desc"]],
        pagination: { limit: TOP },
      }),
    ]);
    return {
      periods,
      pages: pages.map((row) => ({ page: row.dimensions[0], visitors: row.metrics[0] })),
      reviewedCities: cities.map((row) => ({ city: row.dimensions[0], events: row.metrics[0] })),
      link: `${host}/${encodeURIComponent(site)}`,
    };
  };
}
