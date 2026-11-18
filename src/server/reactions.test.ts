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

describe("reacting from an English page", () => {
  it("mails the link in English, naming the city in English", async () => {
    await react({ city: "le-cap", locale: "en", back: "/en/city/le-cap/#reactions" });
    expect(mail.sent[0].subject).toBe("Publish your reaction to Cape Town");
    expect(linkIn(mail.sent[0])).toMatch(/&lang=en$/);
    expect((await follow()).response.headers.location).toBe("/en/city/le-cap/#reactions");
  });

  it("lands on the English space when there is no way back", async () => {
    await react({ locale: "en" });
    expect((await follow()).response.headers.location).toBe("/en/my-space/");
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

  it("hides a reaction reported by three different readers, each counted once", async () => {
    await signedIn();
    const [reaction] = (await thread()).reactions;
    const reportAs = (cookie: string) =>
      handle(
        request("POST", `/api/compte/reactions/${reaction.id}/signaler`, undefined, { cookie }),
      );
    const binta = (await signedIn("binta@exemple.fr")).cookie;
    const chris = (await signedIn("chris@exemple.fr")).cookie;
    const dede = (await signedIn("dede@exemple.fr")).cookie;
    await reportAs(binta);
    await reportAs(binta);
    await reportAs(chris);
    expect((await thread()).reactions.some((r: { id: string }) => r.id === reaction.id)).toBe(true);
    await reportAs(dede);
    expect((await thread()).reactions.some((r: { id: string }) => r.id === reaction.id)).toBe(
      false,
    );
    // Who reported is data about that reader: it is in their export, and goes with their space.
    const exported = JSON.parse(
      (await handle(request("GET", "/api/compte/export", undefined, { cookie: binta }))).body!,
    );
    expect(exported.reports).toEqual([{ reaction: reaction.id }]);
  });

  it("asks a reader to sign in before reporting: connections are too cheap to count", async () => {
    await signedIn();
    const [reaction] = (await thread()).reactions;
    const report = await handle(
      request("POST", `/api/compte/reactions/${reaction.id}/signaler`, undefined, {
        "x-real-ip": "anyone",
      }),
    );
    expect(report.status).toBe(401);
  });

  it("answers 404, never fails, for an id that is not a reaction", async () => {
    const { cookie } = await signedIn();
    for (const id of ["-".repeat(36), "00000000-0000-0000-0000-000000000000"]) {
      const paths = [
        ["POST", `/api/compte/reactions/${id}/signaler`, undefined],
        ["POST", `/api/compte/reactions/${id}/marques`, { mark: "coeur" }],
        ["DELETE", `/api/compte/reactions/${id}`, undefined],
      ] as const;
      for (const [method, path, body] of paths) {
        const response = await handle(request(method, path, body, { cookie }));
        expect([method, path, response.status]).toEqual([method, path, 404]);
      }
    }
    const signedOut = await handle(
      request("POST", `/api/compte/reactions/${"-".repeat(36)}/signaler`),
    );
    expect(signedOut.status).not.toBe(500);
  });

  it("erases reactions and marks with a space three years after its last visit", async () => {
    const { cookie } = await signedIn();
    const [reaction] = (await thread()).reactions;
    await handle(
      request(
        "POST",
        `/api/compte/reactions/${reaction.id}/marques`,
        { mark: "coeur" },
        { cookie },
      ),
    );
    clock += 3 * 365 * DAY + DAY;
    await purge(db, clock);
    expect((await db.query("select 1 from reactions")).rows).toEqual([]);
    expect((await db.query("select 1 from reaction_marks")).rows).toEqual([]);
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

describe("the reviews of every city (/avis)", () => {
  const everywhere = async (headers: Record<string, string> = {}) =>
    JSON.parse(
      (await handle(request("GET", "/api/compte/reactions", undefined, headers))).body ?? "{}",
    );

  it("lists the newest reviews of every city, each with its city", async () => {
    const { cookie } = await signedIn();
    clock += DAY;
    await react({ email: undefined, city: "accra", text: "Accra la nuit." }, { cookie });
    const { reactions, total } = await everywhere();
    expect(total).toBe(2);
    expect(reactions.map((r: { city: string }) => r.city)).toEqual(["accra", "dakar"]);
  });

  it("still refuses an unknown city when one is asked", async () => {
    expect((await handle(request("GET", "/api/compte/reactions?ville=atlantis"))).status).toBe(400);
  });
});

describe("answering a review", () => {
  const reply = (replyTo: string, fields: Record<string, unknown>, headers = {}) =>
    handle(request("POST", "/api/compte/reactions", { replyTo, ...fields }, headers));

  it("files a reply under the review, on its city, without counting it as a review", async () => {
    const { cookie } = await signedIn();
    const [review] = (await thread()).reactions;
    const response = await reply(review.id, { text: "Quel quartier ?", city: "accra" }, { cookie });
    expect(response.status).toBe(201);
    const after = await thread();
    expect(after.total).toBe(1);
    expect(after.reactions[0].replies).toHaveLength(1);
    expect(after.reactions[0].replies[0].text).toBe("Quel quartier ?");
    expect(after.reactions[0].replies[0].mention).toBeNull();
    expect((await thread("accra")).total).toBe(0);
  });

  it("keeps two levels: a reply to a reply joins the first review and names who it answers", async () => {
    const { cookie } = await signedIn();
    const [review] = (await thread()).reactions;
    await reply(review.id, { text: "Quel quartier ?", name: "Binta" }, { cookie });
    const [first] = (await thread()).reactions[0].replies;
    await reply(first.id, { text: "Les Almadies." }, { cookie });
    const replies = (await thread()).reactions[0].replies;
    expect(replies.map((r: { text: string }) => r.text)).toEqual([
      "Quel quartier ?",
      "Les Almadies.",
    ]);
    expect(replies[1].mention).toBe("Binta");
    expect(replies.every((r: { replies?: unknown }) => r.replies === undefined)).toBe(true);
  });

  it("carries no journey: a reply is a conversation, not a result", async () => {
    const { cookie } = await signedIn();
    const [review] = (await thread()).reactions;
    await reply(
      review.id,
      { text: "Merci !", link: "https://labas.africa/resultat/#r=x" },
      { cookie },
    );
    const [answer] = (await thread()).reactions[0].replies;
    expect(answer.top).toBeNull();
    expect(answer.profile).toBeNull();
  });

  it("asks a reader who is not signed in to confirm the address, like a review", async () => {
    await signedIn();
    const [review] = (await thread()).reactions;
    const response = await reply(review.id, { text: "Et le bruit ?", email: "omar@exemple.fr" });
    expect(response.status).toBe(202);
    expect((await thread()).reactions[0].replies).toEqual([]);
    await follow();
    expect((await thread()).reactions[0].replies).toHaveLength(1);
  });

  it("refuses a reply to a review that does not exist", async () => {
    const { cookie } = await signedIn();
    const missing = "00000000-0000-0000-0000-000000000000";
    expect((await reply(missing, { text: "Allô ?" }, { cookie })).status).toBe(400);
    expect((await reply("pas-un-id", { text: "Allô ?" }, { cookie })).status).toBe(400);
  });

  it("takes the replies away with the review they answer", async () => {
    const { cookie } = await signedIn();
    const [review] = (await thread()).reactions;
    await reply(review.id, { text: "Quel quartier ?" }, { cookie });
    await handle(request("DELETE", `/api/compte/reactions/${review.id}`, undefined, { cookie }));
    const { rows } = await db.query("select id from reactions");
    expect(rows).toHaveLength(0);
  });
});

describe("hearts and the few other marks on a review", () => {
  const mark = (id: string, value: string, headers: Record<string, string> = {}) =>
    handle(request("POST", `/api/compte/reactions/${id}/marques`, { mark: value }, headers));

  it("counts each mark once per reader, a second tap takes it back", async () => {
    const { cookie } = await signedIn();
    const other = await signedIn("binta@exemple.fr");
    const [, review] = (await thread()).reactions;
    await mark(review.id, "coeur", { cookie });
    await mark(review.id, "coeur", other);
    await mark(review.id, "merci", other);
    const seen = (await thread("dakar", { cookie })).reactions[1];
    expect(seen.marks).toEqual({ coeur: 2, merci: 1 });
    expect(seen.myMarks).toEqual(["coeur"]);
    expect(JSON.stringify(seen)).not.toContain("binta");

    const undo = await mark(review.id, "coeur", { cookie });
    expect(JSON.parse(undo.body!)).toEqual({ marks: { coeur: 1, merci: 1 }, mine: [] });
  });

  it("shows the counts to anyone, and marks nothing for a reader who is not signed in", async () => {
    const { cookie } = await signedIn();
    const [review] = (await thread()).reactions;
    await mark(review.id, "coeur", { cookie });
    expect((await mark(review.id, "coeur")).status).toBe(401);
    const seen = (await thread()).reactions[0];
    expect(seen.marks).toEqual({ coeur: 1 });
    expect(seen.myMarks).toEqual([]);
  });

  it("knows only its few marks, and only published reviews", async () => {
    const { cookie } = await signedIn();
    const [review] = (await thread()).reactions;
    expect((await mark(review.id, "colere", { cookie })).status).toBe(400);
    await react({ email: "omar@exemple.fr" });
    const { rows } = await db.query<{ id: string }>(
      "select id from reactions where published_at is null",
    );
    expect((await mark(rows[0].id, "coeur", { cookie })).status).toBe(404);
  });

  it("marks replies too, keeps marks in the export and erases them with the space", async () => {
    const { cookie } = await signedIn();
    const [review] = (await thread()).reactions;
    await handle(
      request("POST", "/api/compte/reactions", { replyTo: review.id, text: "Oui !" }, { cookie }),
    );
    const [answer] = (await thread()).reactions[0].replies;
    await mark(answer.id, "bravo", { cookie });
    expect((await thread()).reactions[0].replies[0].marks).toEqual({ bravo: 1 });
    const exported = JSON.parse(
      (await handle(request("GET", "/api/compte/export", undefined, { cookie }))).body!,
    );
    expect(exported.marks).toEqual([{ reaction: answer.id, mark: "bravo" }]);
    await handle(request("DELETE", "/api/compte", undefined, { cookie }));
    const { rows } = await db.query("select * from reaction_marks");
    expect(rows).toHaveLength(0);
  });
});
