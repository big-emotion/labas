// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  type Config,
  type Mailer,
  createHandler,
  mailjet,
  readToken,
  signToken,
} from "./subscribe";

const CONFIG: Config = {
  apiKey: "key",
  apiSecret: "secret",
  listId: "123",
  sender: "nouveautes@labas.africa",
  secret: "a-long-random-secret-for-tests",
  siteUrl: "https://labas.africa",
};
const DAY = 24 * 60 * 60 * 1000;

/** The only fake: the e-mail service at the edge of the system. */
function recordingMailer(fail = false) {
  const sent: { email: string; link: string }[] = [];
  const listed: string[] = [];
  const mailer: Mailer = {
    async sendConfirmation(email, link) {
      if (fail) throw new Error("mailjet down");
      sent.push({ email, link });
    },
    async addToList(email) {
      listed.push(email);
    },
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
    const response = await createHandler({ ...CONFIG, apiKey: "" }, mailer)(post(SIGN_UP));
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

describe("the Mailjet connection", () => {
  it("sends the confirmation through the Send API and lists through managecontact", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init! });
      return new Response("{}", { status: 200 });
    };
    const service = mailjet(CONFIG, fakeFetch as typeof fetch);
    await service.sendConfirmation(
      "awa@exemple.fr",
      "https://labas.africa/api/nouveautes/confirmer?t=x",
    );
    await service.addToList("awa@exemple.fr");

    expect(calls[0].url).toBe("https://api.mailjet.com/v3.1/send");
    const message = JSON.parse(String(calls[0].init.body)).Messages[0];
    expect(message.From).toEqual({ Email: "nouveautes@labas.africa", Name: "Là-bas" });
    expect(message.To).toEqual([{ Email: "awa@exemple.fr" }]);
    expect(message.TextPart).toContain("https://labas.africa/api/nouveautes/confirmer?t=x");
    expect(message.HTMLPart).toContain("Je confirme mon inscription");

    expect(calls[1].url).toBe("https://api.mailjet.com/v3/REST/contactslist/123/managecontact");
    expect(JSON.parse(String(calls[1].init.body))).toEqual({
      Email: "awa@exemple.fr",
      Action: "addforce",
    });
    const auth = new Headers(calls[1].init.headers).get("authorization");
    expect(auth).toBe(`Basic ${Buffer.from("key:secret").toString("base64")}`);
  });

  it("fails loudly when Mailjet refuses", async () => {
    const refusing = async () => new Response("bad", { status: 401 });
    await expect(
      mailjet(CONFIG, refusing as typeof fetch).addToList("awa@exemple.fr"),
    ).rejects.toThrow(/401/);
  });
});
