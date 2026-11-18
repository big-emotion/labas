// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { QUESTIONS } from "../lib/questions";
import { type Answers, bestMatches } from "../lib/ranking";
import { resultLink } from "../lib/shared-result";
import { type Mail, type Mailer } from "./subscribe";
import { createAccounts, migrate, purge, whenReady, type Db } from "./accounts";

const SITE = "https://labas.africa";
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const YEAR = 365 * DAY;

const firstChoice = (id: string) => QUESTIONS.find((q) => q.id === id)!.choices[0].value;
/** A journey with a sensitive answer (origin) and a forged key the server must drop. */
const ANSWERS = { origin: [firstChoice("origin")], order: 1, forged: "x" };

/** The only fake: the e-mail service at the edge of the system. Postgres is real (PGlite). */
function recordingMailer() {
  const sent: Mail[] = [];
  const mailer: Mailer = {
    async send(mail) {
      sent.push(mail);
    },
    async addToList() {},
    async removeFromList() {},
  };
  const linkIn = (mail: Mail) =>
    /https:\/\/labas\.africa\/api\/compte\/connexion\?t=[\w.&=-]+/.exec(mail.text)?.[0] ?? "";
  return { mailer, sent, linkIn };
}

let db: Db;
let clock: number;
let mail: ReturnType<typeof recordingMailer>;
let handle: ReturnType<typeof createAccounts>;

beforeEach(async () => {
  const pg = new PGlite();
  db = { query: (sql, params) => pg.query(sql, params as never[]) as never };
  await migrate(db);
  clock = Date.UTC(2026, 10, 16, 12);
  mail = recordingMailer();
  handle = createAccounts({ db, mailer: mail.mailer, siteUrl: SITE, now: () => clock });
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
const save = (email = "awa@exemple.fr", extra: Record<string, unknown> = {}) =>
  handle(
    request("POST", "/api/compte/sauvegarder", {
      email,
      consent: true,
      sensitive: true,
      journey: { kind: "quick", answers: ANSWERS },
      ...extra,
    }),
  );
/** Opens the link of the last e-mail and returns the session cookie it sets. */
async function follow(index = mail.sent.length - 1) {
  const url = new URL(mail.linkIn(mail.sent[index]));
  const response = await handle(request("GET", url.pathname + url.search));
  const cookie = response.headers["set-cookie"] ?? "";
  return { response, cookie: cookie.split(";")[0] };
}
const asMember = (cookie: string) => ({ cookie });

describe("saving a journey to come back later", () => {
  it("keeps the journey, unconfirmed, and mails a link to take it up again", async () => {
    const response = await save();
    expect(response.status).toBe(202);
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0].to).toBe("awa@exemple.fr");
    expect(mail.sent[0].subject).toBe("Votre lien pour reprendre sur Là-bas");
    expect(mail.linkIn(mail.sent[0])).not.toBe("");
    const { rows } = await db.query<{ confirmed_at: string | null }>(
      "select confirmed_at from accounts",
    );
    expect(rows).toEqual([{ confirmed_at: null }]);
  });

  it("keeps the sensitive answers only with their own, separate box", async () => {
    await save("awa@exemple.fr", { sensitive: false });
    const cookie = (await follow()).cookie;
    const space = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    expect(space.journeys[0].answers).toEqual({ order: 1 });
  });

  it("stores nothing without the explicit consent box", async () => {
    const response = await save("awa@exemple.fr", { consent: false });
    expect(response.status).toBe(400);
    expect(mail.sent).toEqual([]);
    expect((await db.query("select 1 from accounts")).rows).toEqual([]);
  });

  it("refuses a form posted from another site", async () => {
    const response = await handle(
      request(
        "POST",
        "/api/compte/sauvegarder",
        { email: "a@b.fr", consent: true },
        {
          origin: "https://evil.example",
        },
      ),
    );
    expect(response.status).toBe(403);
  });
});

describe("the link in the e-mail", () => {
  it("confirms the address, opens a 30-day session and lands in Mon espace", async () => {
    await save();
    const { response, cookie } = await follow();
    expect(response.status).toBe(303);
    expect(response.headers.location).toBe("/espace/");
    expect(response.headers["set-cookie"]).toMatch(
      /^labas_session=[\w-]+; Path=\/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax$/,
    );
    const space = await handle(request("GET", "/api/compte", undefined, asMember(cookie)));
    expect(space.status).toBe(200);
    const body = JSON.parse(space.body!);
    expect(body.email).toBe("awa@exemple.fr");
    expect(body.journeys).toHaveLength(1);
    // The sensitive answer is kept, as consented; the forged key is not.
    expect(body.journeys[0].answers).toEqual({ origin: ANSWERS.origin, order: 1 });
    expect(body.keptUntil).toBe(new Date(clock + 3 * YEAR).toISOString());
  });

  it("works once only", async () => {
    await save();
    await follow();
    const again = await follow();
    expect(again.response.headers.location).toBe("/espace/lien-expire/");
    expect(again.cookie).toBe("");
  });

  it("expires: 24 hours after a save, 15 minutes after a login request", async () => {
    await save();
    clock += 25 * 60 * MINUTE;
    expect((await follow()).response.headers.location).toBe("/espace/lien-expire/");

    await handle(request("POST", "/api/compte/lien", { email: "awa@exemple.fr" }));
    clock += 16 * MINUTE;
    expect((await follow()).response.headers.location).toBe("/espace/lien-expire/");
  });
});

describe("asking for a login link without waiting for the mail", () => {
  it("answers at once for a known address, as for an unknown one, while the mail is still on its way", async () => {
    await save();
    await follow();
    let sending = false;
    const slow = createAccounts({
      db,
      siteUrl: SITE,
      now: () => clock,
      mailer: {
        ...mail.mailer,
        send: () => {
          sending = true;
          return new Promise(() => {});
        },
      },
    });
    const ask = (email: string) =>
      slow(request("POST", "/api/compte/lien", { email }, { "x-real-ip": email }));
    const known = await ask("awa@exemple.fr");
    const unknown = await ask("personne@exemple.fr");
    expect(sending).toBe(true);
    expect([known.status, known.body]).toEqual([unknown.status, unknown.body]);
  });
});

describe("asking for a login link from Mon espace", () => {
  it("mails a link to a known address and answers the same for an unknown one", async () => {
    await save();
    await follow();
    const known = await handle(request("POST", "/api/compte/lien", { email: "awa@exemple.fr" }));
    const unknown = await handle(request("POST", "/api/compte/lien", { email: "eve@exemple.fr" }));
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(known.body).toBe(unknown.body);
    expect(mail.sent.map((m) => m.to)).toEqual(["awa@exemple.fr", "awa@exemple.fr"]);
    expect(mail.sent[1].subject).toBe("Votre lien de connexion à Là-bas");
  });
});

describe("Mon espace", () => {
  async function member() {
    await save();
    return (await follow()).cookie;
  }

  it("is closed without a session", async () => {
    expect((await handle(request("GET", "/api/compte"))).status).toBe(401);
  });

  it("saves each answer as the quiz goes, for the owner only", async () => {
    const cookie = await member();
    const { journeys } = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    const id = journeys[0].id;
    const update = await handle(
      request("PUT", `/api/compte/parcours/${id}`, { answers: { order: 0 } }, asMember(cookie)),
    );
    expect(update.status).toBe(200);
    const after = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    expect(after.journeys[0].answers).toEqual({ order: 0 });

    await save("eve@exemple.fr");
    const eve = (await follow()).cookie;
    const theft = await handle(
      request("PUT", `/api/compte/parcours/${id}`, { answers: {} }, asMember(eve)),
    );
    expect(theft.status).toBe(404);
  });

  it("keeps sensitive answers of a journey started from Mon espace only with its own box", async () => {
    const cookie = await member();
    const start = async (extra: Record<string, unknown>) => {
      const created = await handle(
        request(
          "POST",
          "/api/compte/parcours",
          { kind: "quick", answers: ANSWERS, ...extra },
          asMember(cookie),
        ),
      );
      return JSON.parse(created.body!).id as string;
    };
    const answersOf = async (id: string) => {
      const space = JSON.parse(
        (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
      );
      return space.journeys.find((j: { id: string }) => j.id === id).answers;
    };

    const unboxed = await start({});
    expect(await answersOf(unboxed)).toEqual({ order: 1 });
    // Answering the question again later does not slip it in either.
    await handle(
      request("PUT", `/api/compte/parcours/${unboxed}`, { answers: ANSWERS }, asMember(cookie)),
    );
    expect(await answersOf(unboxed)).toEqual({ order: 1 });

    const boxed = await start({ sensitive: true });
    expect((await answersOf(boxed)).origin).toEqual(ANSWERS.origin);
  });

  it("keeps sensitive answers on a journey saved with the consent box, as the quiz goes", async () => {
    const cookie = await member();
    const { journeys } = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    await handle(
      request(
        "PUT",
        `/api/compte/parcours/${journeys[0].id}`,
        { answers: { ...ANSWERS, order: 0 } },
        asMember(cookie),
      ),
    );
    const after = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    expect(after.journeys[0].answers).toEqual({ origin: ANSWERS.origin, order: 0 });
  });

  it("answers 404, never fails, for an id that is not a journey", async () => {
    const cookie = await member();
    for (const id of ["-".repeat(36), "00000000-0000-0000-0000-000000000000"]) {
      const put = await handle(
        request("PUT", `/api/compte/parcours/${id}`, { answers: {} }, asMember(cookie)),
      );
      expect(put.status).toBe(404);
      const del = await handle(
        request("DELETE", `/api/compte/parcours/${id}`, undefined, asMember(cookie)),
      );
      expect(del.status).toBe(404);
    }
  });

  it("does not show a journey someone saved under this address until its link is opened", async () => {
    const cookie = await member();
    await save("awa@exemple.fr");
    const space = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    expect(space.journeys).toHaveLength(1);
  });

  it("downloads everything kept about the reader", async () => {
    const cookie = await member();
    const download = await handle(
      request("GET", "/api/compte/export", undefined, asMember(cookie)),
    );
    expect(download.headers["content-disposition"]).toMatch(/attachment/);
    const data = JSON.parse(download.body!);
    expect(data.email).toBe("awa@exemple.fr");
    expect(data.journeys[0].answers.origin).toEqual(ANSWERS.origin);
  });

  it("deletes one journey, then the whole space, at once", async () => {
    const cookie = await member();
    const { journeys } = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    await handle(
      request("DELETE", `/api/compte/parcours/${journeys[0].id}`, undefined, asMember(cookie)),
    );
    const after = JSON.parse(
      (await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!,
    );
    expect(after.journeys).toEqual([]);

    const gone = await handle(request("DELETE", "/api/compte", undefined, asMember(cookie)));
    expect(gone.status).toBe(200);
    expect(gone.headers["set-cookie"]).toMatch(/Max-Age=0/);
    for (const table of ["accounts", "journeys", "sessions", "login_links"]) {
      expect((await db.query(`select 1 from ${table}`)).rows, table).toEqual([]);
    }
    expect((await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).status).toBe(
      401,
    );
  });

  it("logs out", async () => {
    const cookie = await member();
    await handle(request("POST", "/api/compte/deconnexion", undefined, asMember(cookie)));
    expect((await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).status).toBe(
      401,
    );
  });
});

describe("« Recevoir par e-mail » opens a space in the same gesture (operator, 2026-11-17)", () => {
  const answers = { ...ANSWERS, project: firstChoice("project") } as Answers;
  const link = resultLink(answers, bestMatches(answers, 3));
  const sendResults = (extra: Record<string, unknown> = {}) =>
    handle(
      request("POST", "/api/compte/resultats", {
        email: "awa@exemple.fr",
        link,
        journey: { kind: "quick", answers },
        ...extra,
      }),
    );
  const spaceOf = async (cookie: string) =>
    JSON.parse((await handle(request("GET", "/api/compte", undefined, asMember(cookie)))).body!);

  it("mails the top three with a button that opens the full result in Mon espace", async () => {
    expect((await sendResults()).status).toBe(202);
    expect(mail.sent).toHaveLength(1);
    const names = bestMatches(answers, 3).map((m) => m.city.name);
    expect(mail.sent[0].subject).toBe(`Vos villes d'Afrique : ${names.join(", ")}`);
    expect(mail.sent[0].html).toContain("Voir mes résultats");

    const { response, cookie } = await follow();
    const space = await spaceOf(cookie);
    expect(space.journeys).toHaveLength(1);
    expect(response.headers.location).toBe(`/espace/?ouvrir=${space.journeys[0].id}`);
  });

  it("keeps origin, faith and health only with their own box ticked", async () => {
    await sendResults();
    const without = await spaceOf((await follow()).cookie);
    expect(without.journeys[0].answers).toEqual({ order: 1, project: answers.project });

    await sendResults({ email: "eve@exemple.fr", sensitive: true });
    const kept = await spaceOf((await follow()).cookie);
    expect(kept.journeys[0].answers.origin).toEqual(ANSWERS.origin);
  });

  it("sends nothing for a result that is not a link of this site", async () => {
    const response = await sendResults({ link: "https://spam.example/resultat/#r=abc" });
    expect(response.status).toBe(400);
    expect(mail.sent).toEqual([]);
    expect((await db.query("select 1 from accounts")).rows).toEqual([]);
  });

  it("lets the button work for seven days, then brings a signed-in reader back to Mon espace", async () => {
    await sendResults();
    clock += 6 * DAY;
    const { cookie } = await follow();
    expect(cookie).not.toBe("");

    const button = new URL(mail.linkIn(mail.sent[0]));
    const again = await handle(
      request("GET", button.pathname + button.search, undefined, asMember(cookie)),
    );
    expect(again.headers.location).toBe("/espace/");
    expect((await follow()).response.headers.location).toBe("/espace/lien-expire/");
  });
});

describe("journeys kept before the per-journey box existed", () => {
  it("erases the sensitive answers a journey from Mon espace kept without a box, and nothing else", async () => {
    await db.query("alter table journeys drop column sensitive");
    await db.query(
      `insert into accounts (id, email, created_at, confirmed_at, last_seen_at, consent_at)
       values ('11111111-1111-4111-8111-111111111111', 'awa@exemple.fr', now(), now(), now(), now())`,
    );
    const keep = (answers: object, created: string, confirmed: string | null) =>
      db.query(
        `insert into journeys (account_id, kind, answers, created_at, updated_at, confirmed_at)
         values ('11111111-1111-4111-8111-111111111111', 'quick', $1, $2, $2, $3)`,
        [JSON.stringify(answers), created, confirmed],
      );
    const kept = { origin: ANSWERS.origin, order: 1 };
    // Started from Mon espace: created and confirmed in the same instant.
    await keep(kept, "2026-11-17T10:00:00.000Z", "2026-11-17T10:00:00.000Z");
    // Saved with the consent box, confirmed later from the e-mail.
    await keep(kept, "2026-11-17T10:00:00.000Z", "2026-11-17T11:00:00.000Z");
    await migrate(db);
    const { rows } = await db.query<{ answers: object; sensitive: boolean }>(
      "select answers, sensitive from journeys order by confirmed_at",
    );
    expect(rows).toEqual([
      { answers: { order: 1 }, sensitive: false },
      { answers: kept, sensitive: true },
    ]);
  });
});

describe("keeping data no longer than promised", () => {
  it("erases a space three years after the last visit, and unconfirmed saves after seven days", async () => {
    await save("awa@exemple.fr");
    await follow();
    await save("eve@exemple.fr");
    clock += 8 * DAY;
    await purge(db, clock);
    const emails = (await db.query<{ email: string }>("select email from accounts")).rows;
    expect(emails.map((r) => r.email)).toEqual(["awa@exemple.fr"]);

    clock += 3 * YEAR;
    await purge(db, clock);
    expect((await db.query("select 1 from accounts")).rows).toEqual([]);
    expect((await db.query("select 1 from journeys")).rows).toEqual([]);
  });
});

describe("starting beside a database that is still booting", () => {
  it("keeps trying until the database answers, waiting a little longer each time", async () => {
    const waits: number[] = [];
    let attempts = 0;
    const ready = await whenReady(
      async () => {
        attempts += 1;
        if (attempts < 4) throw new Error("ECONNREFUSED");
        return "up";
      },
      async (ms) => {
        waits.push(ms);
      },
    );
    expect(ready).toBe("up");
    expect(waits).toEqual([2000, 4000, 8000]);
  });

  it("never waits more than a minute between two tries", async () => {
    const waits: number[] = [];
    let attempts = 0;
    await whenReady(
      async () => {
        attempts += 1;
        if (attempts < 9) throw new Error("ECONNREFUSED");
      },
      async (ms) => {
        waits.push(ms);
      },
    );
    expect(Math.max(...waits)).toBe(60_000);
  });
});
