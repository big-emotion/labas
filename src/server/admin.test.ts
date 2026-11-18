// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { type Mail, type Mailer } from "./subscribe";
import { createAccounts, migrate, type Db } from "./accounts";

const SITE = "https://labas.africa";
const ADMIN = "operateur@exemple.fr";

let db: Db;
let sent: Mail[];
let stats: () => Promise<object>;
let handle: ReturnType<typeof createAccounts>;

beforeEach(async () => {
  const pg = new PGlite();
  db = { query: (sql, params) => pg.query(sql, params as never[]) as never };
  await migrate(db);
  sent = [];
  const mailer: Mailer = {
    async send(mail) {
      sent.push(mail);
    },
    async addToList() {},
    async removeFromList() {},
  };
  stats = async () => ({ periods: [] });
  handle = createAccounts({
    db,
    mailer,
    siteUrl: SITE,
    admins: [ADMIN],
    stats: () => stats(),
    now: () => Date.UTC(2026, 10, 18, 12),
  });
});

let connection = 0;
const request = (method: string, path: string, body?: unknown, cookie = "") => ({
  method,
  path: new URL(path, SITE).pathname,
  query: new URL(path, SITE).searchParams,
  headers: { origin: SITE, "x-real-ip": `c${connection++}`, cookie },
  body,
});
const call = async (method: string, path: string, body?: unknown, cookie = "") => {
  const response = await handle(request(method, path, body, cookie));
  return { status: response.status, data: JSON.parse(response.body ?? "null") };
};
/** A reader who posts a review on a city and opens the link: published, signed in. */
async function reviewer(email: string, city = "dakar", text = "La mer change tout.") {
  await call("POST", "/api/compte/reactions", { email, city, text });
  const url = new URL(/https:\/\/\S+connexion\?t=[\w-]+/.exec(sent.at(-1)!.text)![0]);
  const response = await handle(request("GET", url.pathname + url.search));
  return (response.headers["set-cookie"] ?? "").split(";")[0];
}

describe("who may open the admin", () => {
  it("lets in the addresses listed, and nobody else", async () => {
    const admin = await reviewer(ADMIN);
    const reader = await reviewer("awa@exemple.fr");
    expect((await call("GET", "/api/compte/admin")).status).toBe(401);
    expect((await call("GET", "/api/compte/admin", undefined, reader)).status).toBe(403);
    expect((await call("GET", "/api/compte/admin", undefined, admin)).status).toBe(200);
  });

  it("mails a login link to a listed address that has no space yet, and to no other", async () => {
    await call("POST", "/api/compte/lien", { email: "inconnu@exemple.fr", back: "/admin/" });
    expect(sent).toHaveLength(0);
    await call("POST", "/api/compte/lien", { email: ADMIN.toUpperCase(), back: "/admin/" });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(ADMIN);
    const url = new URL(/https:\/\/\S+connexion\?t=[\w-]+/.exec(sent[0].text)![0]);
    const response = await handle(request("GET", url.pathname + url.search));
    expect(response.headers.location).toBe("/admin/");
    const cookie = (response.headers["set-cookie"] ?? "").split(";")[0];
    expect((await call("GET", "/api/compte/admin", undefined, cookie)).status).toBe(200);
  });

  it("stays shut when no address is listed", async () => {
    const closed = createAccounts({ db, siteUrl: SITE, mailer: { send: async () => {} } as never });
    const admin = await reviewer(ADMIN);
    const response = await closed(request("GET", "/api/compte/admin", undefined, admin));
    expect(response.status).toBe(403);
  });
});

describe("every review, for moderation", () => {
  it("lists reviews and replies of every city, reported and hidden ones included, never an address", async () => {
    const admin = await reviewer(ADMIN);
    const awa = await reviewer("awa@exemple.fr", "accra", "Accra la nuit.");
    const {
      data: { reactions },
    } = await call("GET", "/api/compte/reactions?ville=accra");
    await call("POST", "/api/compte/reactions", { replyTo: reactions[0].id, text: "Où ?" }, admin);
    for (const ip of ["a", "b", "c"])
      await handle({
        ...request("POST", `/api/compte/reactions/${reactions[0].id}/signaler`),
        headers: { origin: SITE, "x-real-ip": ip },
      });

    const { data } = await call("GET", "/api/compte/admin", undefined, admin);
    expect(data.reviews).toHaveLength(3);
    const accra = data.reviews.find((r: { text: string }) => r.text === "Accra la nuit.");
    expect(accra).toMatchObject({ city: "accra", reports: 3, hidden: true, replyTo: null });
    const reply = data.reviews.find((r: { text: string }) => r.text === "Où ?");
    expect(reply.replyTo).toBe(accra.id);
    expect(JSON.stringify(data)).not.toContain("@exemple.fr");
    expect(awa).toBeTruthy();
  });
});

describe("moderating a review", () => {
  async function setup() {
    const admin = await reviewer(ADMIN);
    await reviewer("awa@exemple.fr");
    const {
      data: { reactions },
    } = await call("GET", "/api/compte/reactions?ville=dakar");
    const awas = reactions.find((r: { mine: boolean }) => !r.mine) ?? reactions[0];
    return { admin, id: awas.id as string };
  }
  const publicCount = async () =>
    (await call("GET", "/api/compte/reactions?ville=dakar")).data.total;

  it("hides a review from everyone, then restores it", async () => {
    const { admin, id } = await setup();
    expect(await publicCount()).toBe(2);
    await call("POST", `/api/compte/admin/reactions/${id}`, { action: "masquer" }, admin);
    expect(await publicCount()).toBe(1);
    await call("POST", `/api/compte/admin/reactions/${id}`, { action: "retablir" }, admin);
    expect(await publicCount()).toBe(2);
  });

  it("restoring a reported review clears its reports", async () => {
    const { admin, id } = await setup();
    for (const ip of ["a", "b", "c"])
      await handle({
        ...request("POST", `/api/compte/reactions/${id}/signaler`),
        headers: { origin: SITE, "x-real-ip": ip },
      });
    expect(await publicCount()).toBe(1);
    await call("POST", `/api/compte/admin/reactions/${id}`, { action: "retablir" }, admin);
    expect(await publicCount()).toBe(2);
    const { data } = await call("GET", "/api/compte/admin", undefined, admin);
    expect(data.reviews.find((r: { id: string }) => r.id === id).reports).toBe(0);
  });

  it("deletes a review for good", async () => {
    const { admin, id } = await setup();
    expect(
      (await call("DELETE", `/api/compte/admin/reactions/${id}`, undefined, admin)).status,
    ).toBe(200);
    expect(await publicCount()).toBe(1);
  });

  it("refuses these actions to a reader, and an unknown action", async () => {
    const { admin, id } = await setup();
    const reader = await reviewer("binta@exemple.fr");
    const path = `/api/compte/admin/reactions/${id}`;
    expect((await call("DELETE", path, undefined, reader)).status).toBe(403);
    expect((await call("POST", path, { action: "publier" }, admin)).status).toBe(400);
  });
});

describe("the audience figures", () => {
  it("answers what the stats source returns, to the admin only", async () => {
    const admin = await reviewer(ADMIN);
    stats = async () => ({ periods: [{ label: "7 jours", visitors: 12 }] });
    const { status, data } = await call("GET", "/api/compte/admin/stats", undefined, admin);
    expect(status).toBe(200);
    expect(data.periods[0].visitors).toBe(12);
  });

  it("says the source failed rather than inventing figures", async () => {
    const admin = await reviewer(ADMIN);
    stats = async () => {
      throw new Error("plausible down");
    };
    expect((await call("GET", "/api/compte/admin/stats", undefined, admin)).status).toBe(502);
  });

  it("says when no stats source is configured", async () => {
    const bare = createAccounts({
      db,
      siteUrl: SITE,
      admins: [ADMIN],
      mailer: { send: async (m: Mail) => void sent.push(m) } as never,
    });
    const admin = await reviewer(ADMIN);
    expect((await bare(request("GET", "/api/compte/admin/stats", undefined, admin))).status).toBe(
      503,
    );
  });
});
