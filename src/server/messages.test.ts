// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { type Config, type Mail, type Mailer, createHandler } from "./subscribe";
import { createAccounts, migrate, purge, type Db } from "./accounts";

const SITE = "https://labas.africa";
const ADMIN = "operateur@exemple.fr";
const TEAM = "equipe@exemple.fr";
const NOW = Date.UTC(2026, 10, 18, 12);
const DAY = 24 * 60 * 60 * 1000;

let db: Db;
let sent: Mail[];
let mailFails: boolean;
let handle: ReturnType<typeof createAccounts>;

beforeEach(async () => {
  const pg = new PGlite();
  db = { query: (sql, params) => pg.query(sql, params as never[]) as never };
  await migrate(db);
  sent = [];
  mailFails = false;
  const mailer: Mailer = {
    async send(mail) {
      if (mailFails) throw new Error("mail service down");
      sent.push(mail);
    },
    async addToList() {},
    async removeFromList() {},
  };
  handle = createAccounts({
    db,
    mailer,
    siteUrl: SITE,
    admins: [ADMIN],
    team: TEAM,
    now: () => NOW,
  });
});

let connection = 0;
const request = (method: string, path: string, body?: unknown, cookie = "", ip?: string) => ({
  method,
  path: new URL(path, SITE).pathname,
  query: new URL(path, SITE).searchParams,
  headers: { origin: SITE, "x-real-ip": ip ?? `c${connection++}`, cookie },
  body,
});
const call = async (method: string, path: string, body?: unknown, cookie = "", ip?: string) => {
  const response = await handle(request(method, path, body, cookie, ip));
  return { status: response.status, data: JSON.parse(response.body ?? "null") };
};
const send = (body: object, ip?: string) => call("POST", "/api/compte/messages", body, "", ip);
const stored = async () => (await db.query("select * from messages")).rows;

/** The operator, signed in through the usual magic link. */
async function operator() {
  await call("POST", "/api/compte/lien", { email: ADMIN });
  const url = new URL(/https:\/\/\S+connexion\?t=[\w-]+/.exec(sent.at(-1)!.text)![0]);
  const response = await handle(request("GET", url.pathname + url.search));
  sent = [];
  return (response.headers["set-cookie"] ?? "").split(";")[0];
}

describe("writing to the team from the feedback tab", () => {
  it("keeps the message and mails it to the team, never to the reader", async () => {
    const { status } = await send({ kind: "site", text: "Le quiz est clair.", page: "/villes/" });
    expect(status).toBe(202);
    expect(await stored()).toHaveLength(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(TEAM);
    expect(sent[0].replyTo).toBeUndefined();
    expect(sent[0].text).toContain("Le quiz est clair.");
    expect(sent[0].text).toContain("/villes/");
  });

  it("answers the reader through Reply-To when they gave an address", async () => {
    await send({ kind: "message", text: "Une question.", email: " Awa@Exemple.fr " });
    expect(sent[0].to).toBe(TEAM);
    expect(sent[0].replyTo).toBe("awa@exemple.fr");
  });

  it("writes the reader's text as text in the HTML mail", async () => {
    await send({ kind: "message", text: "<img src=x onerror=alert(1)>" });
    expect(sent[0].html).not.toContain("<img");
    expect(sent[0].html).toContain("&lt;img");
  });

  it("refuses an empty or too long text, an unknown kind and a wrong address", async () => {
    expect((await send({ kind: "site", text: "   " })).status).toBe(400);
    expect((await send({ kind: "site", text: "x".repeat(2001) })).status).toBe(400);
    expect((await send({ kind: "spam", text: "Bonjour" })).status).toBe(400);
    expect((await send({ kind: "site", text: "Bonjour", email: "pas-une-adresse" })).status).toBe(
      400,
    );
    expect(await stored()).toHaveLength(0);
  });

  it("keeps only a path of this site as the page", async () => {
    await send({ kind: "site", text: "Bonjour", page: "https://ailleurs.example/" });
    expect((await stored())[0].page).toBeNull();
  });

  it("tells a robot filling the hidden field that it worked, and keeps nothing", async () => {
    const { status } = await send({ kind: "site", text: "Achetez", website: "http://spam" });
    expect(status).toBe(202);
    expect(await stored()).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("refuses another site", async () => {
    const response = await handle({
      ...request("POST", "/api/compte/messages", { kind: "site", text: "Bonjour" }),
      headers: { origin: "https://ailleurs.example" },
    });
    expect(response.status).toBe(403);
  });

  it("slows down one connection, and one address", async () => {
    for (let i = 0; i < 5; i++) await send({ kind: "site", text: `Avis ${i}` }, "same");
    expect((await send({ kind: "site", text: "Encore" }, "same")).status).toBe(429);

    for (let i = 0; i < 3; i++)
      await send({ kind: "message", text: `Message ${i}`, email: "awa@exemple.fr" });
    expect((await send({ kind: "message", text: "Encore", email: "awa@exemple.fr" })).status).toBe(
      429,
    );
  });

  it("keeps the message when the mail fails: the operator still reads it in /admin", async () => {
    mailFails = true;
    expect((await send({ kind: "site", text: "Bonjour" })).status).toBe(202);
    expect(await stored()).toHaveLength(1);
  });

  it("is closed while the database is not there", async () => {
    const config: Config = {
      tenantId: "t",
      clientId: "c",
      clientSecret: "s",
      sender: "nouveautes@labas.africa",
      secret: "secret",
      siteUrl: SITE,
      replyTo: TEAM,
    };
    const service = createHandler(config, { send: async () => {} } as never);
    const response = await service(
      request("POST", "/api/compte/messages", { kind: "site", text: "Bonjour" }),
    );
    expect(response.status).toBe(503);
  });

  it("is erased a year after it was sent", async () => {
    await send({ kind: "site", text: "Bonjour" });
    await purge(db, NOW + 364 * DAY);
    expect(await stored()).toHaveLength(1);
    await purge(db, NOW + 366 * DAY);
    expect(await stored()).toHaveLength(0);
  });
});

describe("the messages in /admin", () => {
  it("lists them newest first, with the address only when one was given, to the operator only", async () => {
    const admin = await operator();
    await send({ kind: "site", text: "Premier", page: "/" });
    await send({ kind: "message", text: "Second", email: "awa@exemple.fr", page: "/avis/" });

    const { data } = await call("GET", "/api/compte/admin", undefined, admin);
    expect(data.messages.map((m: { text: string }) => m.text)).toEqual(["Second", "Premier"]);
    expect(data.messages[0]).toMatchObject({
      kind: "message",
      page: "/avis/",
      email: "awa@exemple.fr",
    });
    expect(data.messages[1]).toMatchObject({ kind: "site", page: "/", email: null });
    expect(data.messages[1].createdAt).toBe(new Date(NOW).toISOString());
  });

  it("lets the operator delete one, and nobody else", async () => {
    const admin = await operator();
    await send({ kind: "site", text: "Bonjour" });
    const { data } = await call("GET", "/api/compte/admin", undefined, admin);
    const path = `/api/compte/admin/messages/${data.messages[0].id}`;

    expect((await call("DELETE", path)).status).toBe(401);
    expect(
      (await call("DELETE", "/api/compte/admin/messages/not-a-uuid", undefined, admin)).status,
    ).toBe(404);
    expect((await call("DELETE", path, undefined, admin)).status).toBe(200);
    expect(await stored()).toHaveLength(0);
    expect((await call("DELETE", path, undefined, admin)).status).toBe(404);
  });
});
