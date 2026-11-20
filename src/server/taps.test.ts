// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { type Mailer } from "./subscribe";
import { createAccounts, migrate, purge, type Db } from "./accounts";

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

// Operator, 2026-11-20: what a reader answered, the cities they were shown and how they
// reacted, kept to learn where the ranking goes wrong. No name, no address, no account.
describe("what a reaction teaches the ranking", () => {
  const journey = {
    kind: "quick",
    answers: { project: "installer", origin: ["ouest"], faith: "muslim", forged: "x" },
    top: ["dakar", "abidjan", "cotonou"],
  };
  const outcomes = async () =>
    (await db.query<Record<string, unknown>>("select * from quiz_outcomes order by id")).rows;

  it("keeps the answers, the three cities and the reaction, with the day and nothing else", async () => {
    await tap({ city: "dakar", kind: "suits", journey });
    const rows = await outcomes();
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]).sort()).toEqual(
      ["answers", "city", "created_on", "id", "kind", "reaction", "top"].sort(),
    );
    expect(rows[0]).toMatchObject({
      kind: "quick",
      city: "dakar",
      reaction: "suits",
      top: ["dakar", "abidjan", "cotonou"],
      // The family's region and the faith are kept: the reader is told so beside the buttons.
      answers: { project: "installer", origin: ["ouest"], faith: "muslim" },
    });
    expect(new Date(rows[0].created_on as string).toISOString().slice(11)).toBe("00:00:00.000Z");
  });

  it("keeps a change of mind and a withdrawal as what they are", async () => {
    await tap({ city: "dakar", kind: "like", journey });
    await tap({ city: "dakar", kind: "not", was: "like", journey });
    await tap({ city: "dakar", kind: null, was: "not", journey });
    expect((await outcomes()).map((row) => row.reaction)).toEqual(["like", "not", null]);
  });

  it("drops what is not an answer of the quiz or a city of the site", async () => {
    await tap({ city: "dakar", kind: "like", journey: { ...journey, top: ["dakar", "paris", 3] } });
    const [row] = await outcomes();
    expect(row.answers).not.toHaveProperty("forged");
    expect(row.top).toEqual(["dakar"]);
  });

  it("keeps nothing when a tap comes without a journey: a city page, the cities list", async () => {
    await tap({ city: "dakar", kind: "like" });
    await tap({
      city: "dakar",
      kind: "suits",
      was: "like",
      journey: { kind: "other", answers: {} },
    });
    expect(await outcomes()).toEqual([]);
  });

  it("is erased three years later", async () => {
    await tap({ city: "dakar", kind: "like", journey });
    await purge(db, clock + 3 * 365 * 24 * HOUR - HOUR);
    expect(await outcomes()).toHaveLength(1);
    await purge(db, clock + 3 * 365 * 24 * HOUR + 48 * HOUR);
    expect(await outcomes()).toEqual([]);
  });
});
