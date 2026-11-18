// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { type Mail, type Mailer } from "./subscribe";
import { createAccounts, migrate, type Db } from "./accounts";
import { deepl } from "./deepl";

const SITE = "https://labas.africa";
const REVIEW = "J'y ai vécu deux ans, la mer change tout.";

/**
 * The fakes sit at the edges only: the mail service, and DeepL behind `fetch`. Postgres is real
 * (PGlite), and every call goes through the service's routes.
 */
function fakeDeepl(answer: { status?: number; text?: string; source?: string } = {}) {
  const calls: { url: string; headers: Record<string, string>; body: Record<string, unknown> }[] =
    [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({
      url,
      headers: init.headers as Record<string, string>,
      body: JSON.parse(String(init.body)),
    });
    return new Response(
      JSON.stringify({
        translations: [
          {
            detected_source_language: answer.source ?? "FR",
            text: answer.text ?? "I lived there two years, the sea changes everything.",
          },
        ],
      }),
      { status: answer.status ?? 200 },
    );
  }) as typeof fetch;
  return { fetchImpl, calls };
}

let db: Db;
let sent: Mail[];
const mailer: Mailer = {
  async send(mail) {
    sent.push(mail);
  },
  async addToList() {},
  async removeFromList() {},
};

beforeEach(async () => {
  const pg = new PGlite();
  db = { query: (sql, params) => pg.query(sql, params as never[]) as never };
  await migrate(db);
  sent = [];
});

const request = (
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) => ({
  method,
  path: new URL(path, SITE).pathname,
  query: new URL(path, SITE).searchParams,
  headers: { origin: SITE, "x-real-ip": "connection-a", ...headers },
  body,
});

/** A review published the way a reader publishes one: written, then its e-mailed link opened. */
async function publishedReview(handle: ReturnType<typeof createAccounts>, text = REVIEW) {
  // Each from its own connection: the writing limit is not what these tests are about.
  await handle(
    request(
      "POST",
      "/api/compte/reactions",
      { city: "dakar", text, name: "Awa", email: `awa${sent.length}@exemple.fr` },
      { "x-real-ip": `writer-${sent.length}` },
    ),
  );
  const link = new URL(
    /https:\/\/labas\.africa\/api\/compte\/connexion\?t=[\w-]+/.exec(
      sent[sent.length - 1].text,
    )![0],
  );
  await handle(request("GET", link.pathname + link.search));
  const list = JSON.parse(
    (await handle(request("GET", "/api/compte/reactions?ville=dakar"))).body!,
  );
  return { id: list.reactions[0].id as string, list };
}

const translate = (
  handle: ReturnType<typeof createAccounts>,
  id: string,
  body: unknown = { target: "en" },
  headers: Record<string, string> = {},
) => handle(request("POST", `/api/compte/reactions/${id}/traduction`, body, headers));

describe("translating a review with DeepL", () => {
  it("sends the review's text only, and answers the translation with the language it read", async () => {
    const { fetchImpl, calls } = fakeDeepl();
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("key", fetchImpl),
    });
    const { id } = await publishedReview(handle);
    const response = await translate(handle, id);
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body!)).toEqual({
      text: "I lived there two years, the sea changes everything.",
      detectedSource: "fr",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.deepl.com/v2/translate");
    expect(calls[0].headers.authorization).toBe("DeepL-Auth-Key key");
    // No source language: DeepL detects it. Nothing but the text travels: no name, no journey.
    expect(calls[0].body).toEqual({ text: [REVIEW], target_lang: "EN-GB" });
  });

  it("asks DeepL once per review and language, then answers from its own copy", async () => {
    const { fetchImpl, calls } = fakeDeepl();
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("key", fetchImpl),
    });
    const { id } = await publishedReview(handle);
    await translate(handle, id);
    const again = await translate(handle, id, { target: "en" }, { "x-real-ip": "connection-b" });
    expect(JSON.parse(again.body!).text).toBe(
      "I lived there two years, the sea changes everything.",
    );
    expect(calls).toHaveLength(1);
    await translate(handle, id, { target: "fr" });
    expect(calls.map((c) => c.body.target_lang)).toEqual(["EN-GB", "FR"]);
  });

  it("forgets the translations with the review", async () => {
    const { fetchImpl } = fakeDeepl();
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("key", fetchImpl),
    });
    const { id } = await publishedReview(handle);
    await translate(handle, id);
    await db.query("delete from reactions where id = $1", [id]);
    expect((await db.query("select 1 from reaction_translations")).rows).toEqual([]);
  });

  it("uses the free API for a free key", async () => {
    const { fetchImpl, calls } = fakeDeepl();
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("abc:fx", fetchImpl),
    });
    await translate(handle, (await publishedReview(handle)).id);
    expect(calls[0].url).toBe("https://api-free.deepl.com/v2/translate");
  });

  it("translates only a published review, never a text the page sends", async () => {
    const { fetchImpl, calls } = fakeDeepl();
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("key", fetchImpl),
    });
    const missing = "00000000-0000-4000-8000-000000000000";
    expect((await translate(handle, missing)).status).toBe(404);
    expect((await translate(handle, missing, { target: "en", text: "free ride" })).status).toBe(
      404,
    );
    const { id } = await publishedReview(handle);
    expect((await translate(handle, id, { target: "de" })).status).toBe(400);
    expect(
      (await translate(handle, id, { target: "en" }, { origin: "https://x.example" })).status,
    ).toBe(403);
    await db.query("update reactions set hidden = true where id = $1", [id]);
    expect((await translate(handle, id)).status).toBe(404);
    expect(calls).toEqual([]);
  });

  it("slows down a connection that asks DeepL again and again", async () => {
    const { fetchImpl } = fakeDeepl();
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("key", fetchImpl),
    });
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const { id } = await publishedReview(handle, `Avis numéro ${i}`);
      statuses.push((await translate(handle, id)).status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it("says so when DeepL fails, and keeps nothing", async () => {
    const { fetchImpl } = fakeDeepl({ status: 456 });
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("key", fetchImpl),
    });
    const { id } = await publishedReview(handle);
    expect((await translate(handle, id)).status).toBe(502);
    expect((await db.query("select 1 from reaction_translations")).rows).toEqual([]);
  });

  it("is closed without a key, and the reviews say so", async () => {
    const handle = createAccounts({ db, mailer, siteUrl: SITE });
    const { id, list } = await publishedReview(handle);
    expect(list.translate).toBe(false);
    expect((await translate(handle, id)).status).toBe(503);
  });

  it("tells the page it can translate once a key is set", async () => {
    const { fetchImpl } = fakeDeepl();
    const handle = createAccounts({
      db,
      mailer,
      siteUrl: SITE,
      translate: deepl("key", fetchImpl),
    });
    expect((await publishedReview(handle)).list.translate).toBe(true);
  });
});
