// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CITIES } from "../lib/cities";
import type { Match } from "../lib/ranking";
import { resultLink } from "../lib/shared-result";
import {
  type Config,
  type Mail,
  type Mailer,
  createHandler,
  graph,
  readToken,
  signToken,
} from "./subscribe";

const CONFIG: Config = {
  tenantId: "tenant",
  clientId: "client",
  clientSecret: "client-secret",
  sender: "nouveautes@labas.africa",
  secret: "a-long-random-secret-for-tests",
  siteUrl: "https://labas.africa",
  replyTo: "hello@big-emotion.com",
};
const DAY = 24 * 60 * 60 * 1000;

/** The only fake: the e-mail service at the edge of the system. */
function recordingMailer(fail = false) {
  const sent: (Mail & { email: string; link: string })[] = [];
  const listed: string[] = [];
  const mailer: Mailer = {
    async send(mail) {
      if (fail) throw new Error("mail service down");
      const link =
        /https:\/\/labas\.africa\/api\/nouveautes\/confirmer\?t=[\w.-]+/.exec(mail.text)?.[0] ?? "";
      sent.push({ ...mail, email: mail.to, link });
    },
    async addToList(email) {
      listed.push(email);
    },
    async removeFromList() {},
  };
  return { mailer, sent, listed };
}

const post = (body: unknown, headers: Record<string, string> = {}) => ({
  method: "POST",
  path: "/api/nouveautes",
  query: new URLSearchParams(),
  headers: { origin: "https://labas.africa", "x-real-ip": "connection-a", ...headers },
  body,
});
const confirm = (token: string) => ({
  method: "GET",
  path: "/api/nouveautes/confirmer",
  query: new URLSearchParams({ t: token }),
  headers: {},
  body: undefined,
});
const SIGN_UP = { email: "Awa@Exemple.fr ", consent: true };

describe("signing up for the news", () => {
  it("sends a confirmation link and adds nobody to the list yet", async () => {
    const { mailer, sent, listed } = recordingMailer();
    const response = await createHandler(CONFIG, mailer)(post(SIGN_UP));
    expect(response.status).toBe(202);
    expect(sent).toHaveLength(1);
    expect(sent[0].email).toBe("awa@exemple.fr");
    expect(sent[0].link).toMatch(/^https:\/\/labas\.africa\/api\/nouveautes\/confirmer\?t=/);
    expect(listed).toEqual([]);
  });

  it("refuses without the box ticked", async () => {
    const { mailer, sent } = recordingMailer();
    const response = await createHandler(CONFIG, mailer)(post({ email: "awa@exemple.fr" }));
    expect(response.status).toBe(400);
    expect(sent).toEqual([]);
  });

  it("refuses an address that is not one", async () => {
    const { mailer, sent } = recordingMailer();
    for (const email of [
      "",
      "awa",
      "awa@",
      "@exemple.fr",
      "a b@exemple.fr",
      "x".repeat(250) + "@a.fr",
    ]) {
      const response = await createHandler(CONFIG, mailer)(post({ email, consent: true }));
      expect(response.status, email).toBe(400);
    }
    expect(sent).toEqual([]);
  });

  it("answers a robot that fills the hidden field as if it worked, and sends nothing", async () => {
    const { mailer, sent } = recordingMailer();
    const response = await createHandler(
      CONFIG,
      mailer,
    )(post({ ...SIGN_UP, website: "spam.example" }));
    expect(response.status).toBe(202);
    expect(sent).toEqual([]);
  });

  it("refuses a form posted from another site", async () => {
    const { mailer, sent } = recordingMailer();
    const response = await createHandler(
      CONFIG,
      mailer,
    )(post(SIGN_UP, { origin: "https://evil.example" }));
    expect(response.status).toBe(403);
    expect(sent).toEqual([]);
  });

  it("slows down one connection that signs up again and again", async () => {
    const { mailer } = recordingMailer();
    const handler = createHandler(CONFIG, mailer);
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await handler(post({ email: `n${i}@exemple.fr`, consent: true }))).status);
    }
    expect(statuses).toEqual([202, 202, 202, 202, 202, 429]);
  });

  it("never mails the same address more than three times a day, whoever asks", async () => {
    const { mailer, sent } = recordingMailer();
    const handler = createHandler(CONFIG, mailer);
    for (let i = 0; i < 5; i++) {
      await handler(post(SIGN_UP, { "x-real-ip": `connection-${i}` }));
    }
    expect(sent).toHaveLength(3);
  });

  it("says so when the e-mail service fails, so the page can show its error", async () => {
    const { mailer } = recordingMailer(true);
    const response = await createHandler(CONFIG, mailer)(post(SIGN_UP));
    expect(response.status).toBe(502);
  });

  it("is closed until it is configured", async () => {
    const { mailer, sent } = recordingMailer();
    const response = await createHandler({ ...CONFIG, clientSecret: "" }, mailer)(post(SIGN_UP));
    expect(response.status).toBe(503);
    expect(sent).toEqual([]);
  });
});

describe("confirming the address", () => {
  it("adds the address to the list and lands on the thank-you page", async () => {
    const { mailer, sent, listed } = recordingMailer();
    const handler = createHandler(CONFIG, mailer);
    await handler(post(SIGN_UP));
    const token = new URL(sent[0].link).searchParams.get("t")!;
    const response = await handler(confirm(token));
    expect(response.status).toBe(303);
    expect(response.headers.location).toBe("/nouveautes/confirmee/");
    expect(listed).toEqual(["awa@exemple.fr"]);
  });

  it("adds nobody from a changed, foreign or expired link", async () => {
    const { mailer, listed } = recordingMailer();
    const now = Date.now();
    const handler = createHandler(CONFIG, mailer, () => now);
    const good = signToken("awa@exemple.fr", now, CONFIG.secret);
    const tampered = good.replace(
      /^[^.]+/,
      Buffer.from("eve@exemple.fr|" + now).toString("base64url"),
    );
    const foreign = signToken("awa@exemple.fr", now, "another-secret");
    const expired = signToken("awa@exemple.fr", now - 8 * DAY, CONFIG.secret);
    for (const token of [tampered, foreign, expired, "", "not-a-token"]) {
      const response = await handler(confirm(token));
      expect(response.headers.location, token).toBe("/nouveautes/lien-invalide/");
    }
    expect(listed).toEqual([]);
  });

  it("reads back the address from a link signed within the week", () => {
    const now = Date.now();
    expect(readToken(signToken("awa@exemple.fr", now - 6 * DAY, "s"), "s", now)).toBe(
      "awa@exemple.fr",
    );
  });
});

describe("the Microsoft Graph connection", () => {
  const MAIL = {
    to: "awa@exemple.fr",
    subject: "Confirmez",
    text: "Lien : https://labas.africa/api/nouveautes/confirmer?t=x",
    html: "<a>Je confirme mon inscription</a>",
  };

  it("sends as the Là-bas mailbox with an app-only token, minted once for several mails", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init! });
      return String(url).includes("/oauth2/")
        ? Response.json({ access_token: "token-1", expires_in: 3600 })
        : new Response(null, { status: 202 });
    };
    const service = graph(CONFIG, fakeFetch as typeof fetch);
    await service.send(MAIL);
    await service.send(MAIL);

    expect(calls.map((c) => c.url)).toEqual([
      "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
      "https://graph.microsoft.com/v1.0/users/nouveautes%40labas.africa/sendMail",
      "https://graph.microsoft.com/v1.0/users/nouveautes%40labas.africa/sendMail",
    ]);
    const grant = new URLSearchParams(String(calls[0].init.body));
    expect(grant.get("grant_type")).toBe("client_credentials");
    expect(grant.get("client_id")).toBe("client");
    expect(grant.get("scope")).toBe("https://graph.microsoft.com/.default");
    expect(new Headers(calls[1].init.headers).get("authorization")).toBe("Bearer token-1");

    const { message, saveToSentItems } = JSON.parse(String(calls[1].init.body));
    expect(saveToSentItems).toBe(false);
    expect(message.from).toEqual({
      emailAddress: { address: "nouveautes@labas.africa", name: "Là-bas" },
    });
    expect(message.toRecipients).toEqual([{ emailAddress: { address: "awa@exemple.fr" } }]);
    expect(message.replyTo).toEqual([{ emailAddress: { address: "hello@big-emotion.com" } }]);
    expect(message.subject).toBe("Confirmez");
    expect(message.body).toEqual({ contentType: "HTML", content: MAIL.html });
  });

  it("fails loudly when Microsoft refuses", async () => {
    const refusing = async () => new Response("bad", { status: 401 });
    await expect(graph(CONFIG, refusing as typeof fetch).send(MAIL)).rejects.toThrow(/401/);
  });
});

describe("receiving one's results by e-mail", () => {
  const top = CITIES.slice(0, 3).map((city, i) => ({ city, score: 0.9 - i / 10 }) as Match);
  const link = resultLink({ order: 1, together: 0.5 }, top);
  const ask = (body: Record<string, unknown>, headers: Record<string, string> = {}) => ({
    ...post(body, headers),
    path: "/api/resultats",
  });

  it("sends the three cities, their percentages, their pages and the result link", async () => {
    const { mailer, sent, listed } = recordingMailer();
    const response = await createHandler(CONFIG, mailer)(ask({ email: "awa@exemple.fr", link }));
    expect(response.status).toBe(202);
    expect(sent).toHaveLength(1);
    const mail = sent[0];
    expect(mail.to).toBe("awa@exemple.fr");
    expect(mail.subject).toBe(`Vos villes d'Afrique : ${top.map((m) => m.city.name).join(", ")}`);
    for (const [i, m] of top.entries()) {
      expect(mail.text).toContain(`${i + 1}. ${m.city.name} (${m.city.country}) · ${90 - i * 10}`);
      expect(mail.html).toContain(`https://labas.africa/ville/${m.city.slug}/`);
    }
    expect(mail.text).toContain(link);
    expect(mail.link).toBe("");
    expect(listed).toEqual([]);
  });

  it("adds the news confirmation link to the same e-mail only when the box is ticked", async () => {
    const { mailer, sent } = recordingMailer();
    await createHandler(CONFIG, mailer)(ask({ email: "awa@exemple.fr", link, news: true }));
    expect(sent).toHaveLength(1);
    expect(sent[0].link).toMatch(/confirmer\?t=/);
    expect(sent[0].html).toContain("Je confirme mon inscription");
  });

  it("sends nothing the reader did not produce: only a result link of this site", async () => {
    const { mailer, sent } = recordingMailer();
    const handler = createHandler(CONFIG, mailer);
    const forged = [
      "https://spam.example/resultat/#r=abc",
      "https://labas.africa/resultat/#r=not-base64-json",
      "https://labas.africa/resultat/#r=" +
        Buffer.from(
          JSON.stringify({ temperament: {}, cities: [{ slug: "atlantis", percent: 99 }] }),
        ).toString("base64url"),
      "",
    ];
    for (const bad of forged) {
      const response = await handler(ask({ email: "awa@exemple.fr", link: bad }));
      expect(response.status, bad).toBe(400);
    }
    expect(sent).toEqual([]);
  });

  it("shares the limits of the news sign-up, per connection and per address", async () => {
    const { mailer, sent } = recordingMailer();
    const handler = createHandler(CONFIG, mailer);
    await handler(post(SIGN_UP));
    await handler(ask({ email: "awa@exemple.fr", link }, { "x-real-ip": "connection-b" }));
    await handler(ask({ email: "awa@exemple.fr", link }, { "x-real-ip": "connection-c" }));
    const fourth = await handler(
      ask({ email: "awa@exemple.fr", link }, { "x-real-ip": "connection-d" }),
    );
    expect(fourth.status).toBe(429);
    expect(sent).toHaveLength(3);
  });

  it("refuses another site, a robot and a closed service like the sign-up does", async () => {
    const { mailer, sent } = recordingMailer();
    expect(
      (
        await createHandler(
          CONFIG,
          mailer,
        )(ask({ email: "awa@exemple.fr", link }, { origin: "https://evil.example" }))
      ).status,
    ).toBe(403);
    expect(
      (await createHandler(CONFIG, mailer)(ask({ email: "awa@exemple.fr", link, website: "x" })))
        .status,
    ).toBe(202);
    expect(
      (
        await createHandler(
          { ...CONFIG, clientSecret: "" },
          mailer,
        )(ask({ email: "awa@exemple.fr", link }))
      ).status,
    ).toBe(503);
    expect(sent).toEqual([]);
  });
});

describe("the accounts routes", () => {
  it("stay closed while the database is not configured", async () => {
    const { mailer } = recordingMailer();
    const response = await createHandler(
      CONFIG,
      mailer,
    )({
      ...post({ email: "awa@exemple.fr", consent: true }),
      path: "/api/compte/sauvegarder",
    });
    expect(response.status).toBe(503);
  });

  it("are handed to the accounts module when it is there", async () => {
    const { mailer } = recordingMailer();
    const accounts = async () => ({ status: 418, headers: {} });
    const response = await createHandler(
      CONFIG,
      mailer,
      Date.now,
      accounts,
    )({
      ...post({}),
      path: "/api/compte",
    });
    expect(response.status).toBe(418);
  });
});
