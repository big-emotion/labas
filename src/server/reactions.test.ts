// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { type Answers, bestMatches } from "../lib/ranking";
import { resultLink } from "../lib/shared-result";
import { type Mail, type Mailer } from "./subscribe";
import { createAccounts, migrate, purge, type Db } from "./accounts";

const SITE = "https://labas.africa";
const DAY = 24 * 60 * 60 * 1000;

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
  return { mailer, sent };
}

let db: Db;
let clock: number;
let mail: ReturnType<typeof recordingMailer>;
let handle: ReturnType<typeof createAccounts>;

beforeEach(async () => {
  const pg = new PGlite();
  db = { query: (sql, params) => pg.query(sql, params as never[]) as never };
  await migrate(db);
  clock = Date.UTC(2026, 10, 18, 12);
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
const react = (fields: Record<string, unknown>, headers: Record<string, string> = {}) =>
  handle(
    request(
      "POST",
      "/api/compte/reactions",
      {
        city: "dakar",
        text: "J'y ai vécu deux ans, la mer change tout.",
        email: "awa@exemple.fr",
        ...fields,
      },
      headers,
    ),
  );
const thread = async (city = "dakar", headers: Record<string, string> = {}) => {
  const response = await handle(
    request("GET", `/api/compte/reactions?ville=${city}`, undefined, headers),
  );
  return JSON.parse(response.body ?? "{}");
};
const linkIn = (m: Mail) =>
  /https:\/\/labas\.africa\/api\/compte\/connexion\?t=[\w.&=-]+/.exec(m.text)?.[0] ?? "";
async function follow(index = mail.sent.length - 1) {
  const url = new URL(linkIn(mail.sent[index]));
  const response = await handle(request("GET", url.pathname + url.search));
  return { response, cookie: (response.headers["set-cookie"] ?? "").split(";")[0] };
}
/** A reader who confirmed an address once, with an open session. */
async function signedIn(email = "awa@exemple.fr") {
  await react({ email });
  return { cookie: (await follow()).cookie };
}

describe("reacting to a city without being signed in", () => {
  it("keeps the reaction hidden and mails a link that publishes it", async () => {
    const response = await react({});
    expect(response.status).toBe(202);
    expect(JSON.parse(response.body!)).toEqual({ published: false });
    expect((await thread()).reactions).toEqual([]);
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0].to).toBe("awa@exemple.fr");
    expect(mail.sent[0].subject).toBe("Publiez votre réaction sur Dakar");

    await follow();
    const after = await thread();
    expect(after.total).toBe(1);
    expect(after.reactions[0].text).toBe("J'y ai vécu deux ans, la mer change tout.");
  });

  it("brings the reader back to the page the reaction was written on, signed in", async () => {
    await react({ back: "/ville/dakar/#reactions" });
    const { response, cookie } = await follow();
    expect(response.headers.location).toBe("/ville/dakar/#reactions");
    expect(cookie).toMatch(/^labas_session=/);
  });

  it("never sends the reader to another site", async () => {
    const elsewhere = [
      "https://evil.example/",
      "//evil.example/",
      "/\\evil.example",
      "javascript:x",
    ];
    for (const [i, back] of elsewhere.entries()) {
      await react({ back, email: `n${i}@exemple.fr` });
      expect((await follow()).response.headers.location).toBe("/espace/");
    }
  });

  it("asks the same single link of an address that already has a space", async () => {
    await signedIn();
    await react({ text: "Une seconde réaction, depuis un autre téléphone." });
    expect(mail.sent).toHaveLength(2);
    await follow();
    expect((await thread()).total).toBe(2);
  });
});

describe("reacting while signed in", () => {
  it("publishes at once, without any e-mail", async () => {
    const { cookie } = await signedIn();
    const response = await react(
      { email: undefined, text: "Encore mieux en saison sèche." },
      { cookie },
    );
    expect(response.status).toBe(201);
    expect(JSON.parse(response.body!).published).toBe(true);
    expect(mail.sent).toHaveLength(1);
    expect((await thread()).total).toBe(2);
  });
});

describe("what a reaction shows", () => {
  it("shows the chosen name, or a stable « Utilisateur » number, and the date", async () => {
    const { cookie } = await signedIn();
    await react({ email: undefined, name: "Awa de Lyon" }, { cookie });
    const [named, anonymous] = (await thread()).reactions;
    expect(named.name).toBe("Awa de Lyon");
    expect(anonymous.name).toMatch(/^Utilisateur \d{4}$/);
    expect(named.createdAt).toBe(new Date(clock).toISOString());
  });

  it("lists the newest first", async () => {
    const { cookie } = await signedIn();
    clock += DAY;
    await react({ email: undefined, text: "La plus récente." }, { cookie });
    expect((await thread()).reactions[0].text).toBe("La plus récente.");
  });

  // The reader's top 3 and temperament are public by default; one box keeps them back.
  const TEMPERAMENT = { saturday: 1, adventure: "seeking", order: 0.5, together: 1, friction: 1 };
  const linkOf = (answers: Answers) => resultLink(answers, bestMatches(answers, 3));

  it("joins the top three and the temperament drawn from the result link, never an answer", async () => {
    await react({ link: linkOf({ project: "installer", ...TEMPERAMENT } as Answers) });
    await follow();
    const [reaction] = (await thread()).reactions;
    expect(reaction.top).toHaveLength(3);
    expect(Object.keys(reaction.top[0]).sort()).toEqual(["name", "percent", "slug"]);
    expect(reaction.profile.name).toBeTruthy();
    expect(reaction.profile.traits).toHaveLength(5);
    expect(Object.keys(reaction.profile.traits[0]).sort()).toEqual(["name", "range", "value"]);
    expect(JSON.stringify(reaction)).not.toContain("installer");
  });

  it("joins the top three alone when the temperament was not answered", async () => {
    await react({ link: linkOf({ project: "installer" } as Answers) });
    await follow();
    const [reaction] = (await thread()).reactions;
    expect(reaction.top).toHaveLength(3);
    expect(reaction.profile).toBeNull();
  });

  it("keeps the top three and the temperament back when the reader asks", async () => {
    await react({ link: linkOf(TEMPERAMENT as Answers), private: true });
    await follow();
    const [reaction] = (await thread()).reactions;
    expect(reaction.top).toBeNull();
    expect(reaction.profile).toBeNull();
  });

  it("drops a link that is not a result of this site", async () => {
    await react({ link: "https://evil.example/resultat/#r=x" });
    await follow();
    expect((await thread()).reactions[0].top).toBeNull();
    expect((await thread()).reactions[0].profile).toBeNull();
  });

  it("tells the author which reactions are theirs, and nobody else", async () => {
    const { cookie } = await signedIn();
    expect((await thread("dakar", { cookie })).reactions[0].mine).toBe(true);
    expect((await thread()).reactions[0].mine).toBe(false);
  });
});

describe("refusing what does not belong", () => {
  it("refuses an unknown city, an empty or over-long text, and a missing address", async () => {
    expect((await react({ city: "atlantis" })).status).toBe(400);
    expect((await react({ text: "   " })).status).toBe(400);
    expect((await react({ text: "x".repeat(1001) })).status).toBe(400);
    expect((await react({ email: "pas-une-adresse" })).status).toBe(400);
    expect((await react({ name: "x".repeat(41) })).status).toBe(400);
    expect(mail.sent).toHaveLength(0);
  });

  it("refuses a reaction posted from another site", async () => {
    expect((await react({}, { origin: "https://evil.example" })).status).toBe(403);
  });

  it("slows down a flood from one connection", async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await react({ email: `n${i}@exemple.fr` })).status);
    expect(statuses.at(-1)).toBe(429);
  });
});

describe("removing a reaction", () => {
  it("lets the author delete their own reaction, and nobody else", async () => {
    const { cookie } = await signedIn();
    const other = await signedIn("binta@exemple.fr");
    const [, mine] = (await thread()).reactions;
    const path = `/api/compte/reactions/${mine.id}`;
    expect((await handle(request("DELETE", path, undefined, other))).status).toBe(404);
    expect((await handle(request("DELETE", path, undefined, { cookie }))).status).toBe(200);
    expect((await thread()).total).toBe(1);
  });

  it("hides a reaction reported from three different connections", async () => {
    await signedIn();
    const [reaction] = (await thread()).reactions;
    const report = (ip: string) =>
      handle(
        request("POST", `/api/compte/reactions/${reaction.id}/signaler`, undefined, {
          "x-real-ip": ip,
        }),
      );
    await report("a");
    await report("a");
    await report("b");
    expect((await thread()).total).toBe(1);
    await report("c");
    expect((await thread()).total).toBe(0);
  });

  it("erases reactions with the space, and keeps them in the export", async () => {
    const { cookie } = await signedIn();
    const exported = JSON.parse(
      (await handle(request("GET", "/api/compte/export", undefined, { cookie }))).body!,
    );
    expect(exported.reactions[0].city).toBe("dakar");
    await handle(request("DELETE", "/api/compte", undefined, { cookie }));
    expect((await thread()).total).toBe(0);
  });

  it("erases an unpublished reaction after a week", async () => {
    await react({});
    clock += 8 * DAY;
    await purge(db, clock);
    const { rows } = await db.query("select id from reactions");
    expect(rows).toHaveLength(0);
  });
});

describe("signing in from any page", () => {
  it("brings a login link back to the page it was asked from", async () => {
    await signedIn();
    await handle(
      request("POST", "/api/compte/lien", { email: "awa@exemple.fr", back: "/ville/accra/" }),
    );
    expect((await follow()).response.headers.location).toBe("/ville/accra/");
  });
});
