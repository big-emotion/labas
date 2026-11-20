// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { type Mailer } from "./subscribe";
import { createAccounts, migrate, type Db } from "./accounts";

const SITE = "https://labas.africa";
const HOUR = 60 * 60 * 1000;
const silent: Mailer = { async send() {}, async addToList() {}, async removeFromList() {} };

let db: Db;
let clock: number;
let handle: ReturnType<typeof createAccounts>;

beforeEach(async () => {
  const pg = new PGlite();
  db = { query: (sql, params) => pg.query(sql, params as never[]) as never };
  await migrate(db);
  clock = Date.UTC(2026, 10, 20, 12);
  handle = createAccounts({ db, mailer: silent, siteUrl: SITE, now: () => clock });
});

const request = (method: string, body?: unknown, headers: Record<string, string> = {}) => ({
  method,
  path: "/api/compte/taps",
  query: new URLSearchParams(),
  headers: { origin: SITE, "x-real-ip": "connection-a", ...headers },
  body,
});
const tap = (body: unknown, headers: Record<string, string> = {}) =>
  handle(request("POST", body, headers));
const counts = async () => JSON.parse((await handle(request("GET"))).body ?? "{}").taps;

describe("a one-tap reaction on a city", () => {
  it("counts a tap without any account and shows it to everyone", async () => {
    const response = await tap({ city: "abidjan", kind: "like" });
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body!).taps).toEqual({ like: 1, suits: 0, not: 0 });
    await tap({ city: "abidjan", kind: "suits" }, { "x-real-ip": "connection-b" });
    expect(await counts()).toEqual({ abidjan: { like: 1, suits: 1, not: 0 } });
  });

  it("moves the count when the reader changes their mind, and takes it back on a second tap", async () => {
    await tap({ city: "dakar", kind: "like" });
    await tap({ city: "dakar", kind: "not", was: "like" });
    expect(await counts()).toEqual({ dakar: { like: 0, suits: 0, not: 1 } });
    await tap({ city: "dakar", kind: null, was: "not" });
    expect(await counts()).toEqual({});
  });

  it("never counts below zero", async () => {
    await tap({ city: "dakar", kind: null, was: "like" });
    expect(await counts()).toEqual({});
  });

  it("refuses an unknown city or reaction", async () => {
    expect((await tap({ city: "paris", kind: "like" })).status).toBe(400);
    expect((await tap({ city: "dakar", kind: "love" })).status).toBe(400);
    expect((await tap({ city: "dakar", kind: "like", was: "love" })).status).toBe(400);
    expect((await tap({ city: "dakar" })).status).toBe(400);
  });

  it("keeps only the city and the count: nothing about who tapped", async () => {
    await tap({
      city: "dakar",
      kind: "like",
      email: "awa@exemple.fr",
      answers: { origin: "ouest" },
    });
    const { rows } = await db.query<Record<string, unknown>>("select * from city_taps");
    expect(rows).toEqual([{ city: "dakar", kind: "like", count: 1 }]);
  });

  it("slows a script down, per connection, and lets it start again an hour later", async () => {
    for (let i = 0; i < 60; i++) await tap({ city: "dakar", kind: "like" });
    expect((await tap({ city: "dakar", kind: "like" })).status).toBe(429);
    expect(
      (await tap({ city: "dakar", kind: "like" }, { "x-real-ip": "connection-b" })).status,
    ).toBe(200);
    clock += HOUR;
    expect((await tap({ city: "dakar", kind: "like" })).status).toBe(200);
  });

  it("accepts a tap only from the site itself", async () => {
    expect(
      (await tap({ city: "dakar", kind: "like" }, { origin: "https://ailleurs.example" })).status,
    ).toBe(403);
  });
});
