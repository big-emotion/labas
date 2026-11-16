/**
 * The one piece of server code in Là-bas: it sends the e-mails a reader asks for — the news
 * sign-up and their results.
 *
 * Mailjet's API needs a secret key, which a static page cannot hold, so this small service holds
 * it (operator's choice, 2026-11-16, over a third-party form). It keeps no database: the
 * confirmation link carries the address, signed, and only a confirmed address reaches the
 * Mailjet list (double opt-in). A results e-mail is drawn from the site's own result link, read
 * with the site's own code, so no text a visitor types can reach someone's inbox.
 *
 * Bundled with the site's data by `npm run build:server` (esbuild) into one file Node runs.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { readShared, sharedResult } from "../lib/shared-result";
import { type Db, createAccounts, migrate, purge } from "./accounts";
import { type Mail, confirmationEmail, resultsEmail } from "./emails";

export type { Mail } from "./emails";

export interface Config {
  apiKey: string;
  apiSecret: string;
  listId: string;
  /** A sender address validated in the Mailjet account. */
  sender: string;
  /** Signs the confirmation links. */
  secret: string;
  siteUrl: string;
  /** Where readers' replies go: the operator's own mailbox. */
  replyTo: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
  addToList(email: string): Promise<void>;
  removeFromList(email: string): Promise<void>;
}

interface Request {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Record<string, string | undefined>;
  body: unknown;
}
interface Response {
  status: number;
  headers: Record<string, string>;
  body?: string;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** A confirmation link works for a week, then the reader signs up again. */
const LINK_LIFETIME = 7 * DAY;

export function signToken(email: string, issuedAt: number, secret: string): string {
  const payload = Buffer.from(`${email}|${issuedAt}`).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

/** The address a link was signed for, or null when it was changed, signed elsewhere or is too old. */
export function readToken(token: string, secret: string, now: number): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const [email, issuedAt] = Buffer.from(payload, "base64url").toString().split("|");
  const age = now - Number(issuedAt);
  return age >= 0 && age <= LINK_LIFETIME && isEmail(email) ? email : null;
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Counts attempts per key in a sliding window; in memory, which is enough for one container. */
function limiter(max: number, window: number) {
  const seen = new Map<string, number[]>();
  return (key: string, now: number): boolean => {
    const recent = (seen.get(key) ?? []).filter((at) => now - at < window);
    if (recent.length >= max) return false;
    seen.set(key, [...recent, now]);
    return true;
  };
}

const json = (status: number, body: object): Response => ({
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
const redirect = (location: string): Response => ({ status: 303, headers: { location } });

/** The saved-journeys module (accounts.ts), present only when the database is configured. */
export type AccountsHandler = (request: Request) => Promise<Response>;

export function createHandler(
  config: Config,
  mailer: Mailer,
  now: () => number = Date.now,
  accounts?: AccountsHandler,
) {
  // Per connection: a person retrying is fine, a script is not.
  const perConnection = limiter(5, HOUR);
  // Per address: nobody can use Là-bas to flood someone else's inbox with confirmations.
  const perAddress = limiter(3, DAY);
  const configured = Object.values(config).every(Boolean);

  const confirmLinkFor = (email: string) =>
    `${config.siteUrl}/api/nouveautes/confirmer?t=${signToken(email, now(), config.secret)}`;

  /** What both forms share: the service is open, the form comes from the site, a real address, the limits. */
  async function guard(
    request: Request,
    valid: (form: Record<string, unknown>) => boolean,
    send: (email: string, form: Record<string, unknown>) => Mail,
  ): Promise<Response> {
    if (!configured) return json(503, { error: "closed" });
    if (request.headers.origin !== config.siteUrl) return json(403, { error: "origin" });
    const form = (request.body ?? {}) as Record<string, unknown>;
    const email = String(form.email ?? "")
      .trim()
      .toLowerCase();
    if (!isEmail(email) || !valid(form)) return json(400, { error: "form" });
    // The hidden field only robots fill: they are told it worked.
    if (form.website) return json(202, { ok: true });
    const connection = request.headers["x-real-ip"] ?? "unknown";
    if (!perConnection(connection, now())) return json(429, { error: "slow-down" });
    if (!perAddress(email, now())) return json(429, { error: "slow-down" });
    try {
      await mailer.send(send(email, form));
    } catch (error) {
      // The operator's log gets Mailjet's answer, never the reader's address.
      console.error(String(error));
      return json(502, { error: "mail" });
    }
    return json(202, { ok: true });
  }

  /** The reader's result from its link on this site, or null for anything else. */
  function resultFrom(link: unknown) {
    try {
      const url = new URL(String(link));
      if (url.origin !== config.siteUrl || url.pathname !== "/resultat/") return null;
      const payload = readShared(url.hash);
      return payload && sharedResult(payload);
    } catch {
      return null;
    }
  }

  return async (request: Request): Promise<Response> => {
    if (request.path === "/api/compte" || request.path.startsWith("/api/compte/")) {
      return accounts ? accounts(request) : json(503, { error: "closed" });
    }

    if (request.method === "POST" && request.path === "/api/nouveautes") {
      return guard(
        request,
        (form) => form.consent === true,
        (email) => confirmationEmail(email, confirmLinkFor(email)),
      );
    }

    if (request.method === "POST" && request.path === "/api/resultats") {
      return guard(
        request,
        (form) => resultFrom(form.link) !== null,
        (email, form) =>
          resultsEmail(
            email,
            resultFrom(form.link)!,
            String(form.link),
            config.siteUrl,
            form.news === true ? confirmLinkFor(email) : undefined,
          ),
      );
    }

    if (request.method === "GET" && request.path === "/api/nouveautes/confirmer") {
      const email = configured
        ? readToken(request.query.get("t") ?? "", config.secret, now())
        : null;
      if (!email) return redirect("/nouveautes/lien-invalide/");
      try {
        await mailer.addToList(email);
      } catch (error) {
        console.error(String(error));
        return redirect("/nouveautes/lien-invalide/");
      }
      return redirect("/nouveautes/confirmee/");
    }

    return json(404, { error: "not-found" });
  };
}

export function mailjet(config: Config, fetchImpl: typeof fetch = fetch): Mailer {
  const authorization = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`;
  const call = async (url: string, body: object) => {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Mailjet answered ${response.status} on ${url}`);
  };
  return {
    send: (mail) =>
      call("https://api.mailjet.com/v3.1/send", {
        Messages: [
          {
            From: { Email: config.sender, Name: "Là-bas" },
            ReplyTo: { Email: config.replyTo },
            To: [{ Email: mail.to }],
            Subject: mail.subject,
            TextPart: mail.text,
            HTMLPart: mail.html,
          },
        ],
      }),
    addToList: (email) =>
      call(`https://api.mailjet.com/v3/REST/contactslist/${config.listId}/managecontact`, {
        Email: email,
        Action: "addforce",
      }),
    removeFromList: (email) =>
      call(`https://api.mailjet.com/v3/REST/contactslist/${config.listId}/managecontact`, {
        Email: email,
        Action: "remove",
      }),
  };
}

/** The HTTP shell around the handler: small bodies only, JSON in, JSON or a redirect out. */
function start(port: number) {
  const config: Config = {
    apiKey: process.env.MAILJET_API_KEY ?? "",
    apiSecret: process.env.MAILJET_SECRET_KEY ?? "",
    listId: process.env.MAILJET_LIST_ID ?? "",
    sender: process.env.MAILJET_SENDER ?? "",
    secret: process.env.SUBSCRIBE_SECRET ?? "",
    siteUrl: process.env.SITE_URL ?? "https://labas.africa",
    replyTo: process.env.REPLY_TO ?? "hello@big-emotion.com",
  };
  const mailer = mailjet(config);
  let accounts: AccountsHandler | undefined;
  // One handler for the life of the process: its limits must remember every request.
  const handle = createHandler(config, mailer, Date.now, (request) =>
    accounts ? accounts(request) : Promise.resolve(json(503, { error: "closed" })),
  );
  // Without a database, or if it cannot be reached, the e-mail routes keep working and
  // /api/compte answers 503: saved journeys are an extra, never a reason to go down.
  if (process.env.DATABASE_URL && Object.values(config).every(Boolean)) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    const db: Db = { query: (sql, params) => pool.query(sql, params) as never };
    migrate(db)
      .then(() => {
        accounts = createAccounts({ db, mailer, siteUrl: config.siteUrl });
        const sweep = () => purge(db, Date.now()).catch((e) => console.error(String(e)));
        sweep();
        setInterval(sweep, 24 * 60 * 60 * 1000);
      })
      .catch((error) => console.error(`accounts off: ${String(error)}`));
  }
  createServer(async (incoming, outgoing) => {
    let raw = "";
    for await (const chunk of incoming) {
      raw += chunk;
      if (raw.length > 2048) return outgoing.writeHead(413).end();
    }
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      return outgoing.writeHead(400).end();
    }
    const url = new URL(incoming.url ?? "/", "http://localhost");
    const headers = Object.fromEntries(
      Object.entries(incoming.headers).map(([name, value]) => [name, String(value)]),
    );
    const response = await handle({
      method: incoming.method ?? "GET",
      path: url.pathname,
      query: url.searchParams,
      headers,
      body,
    });
    outgoing.writeHead(response.status, response.headers).end(response.body);
  }).listen(port);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) start(Number(process.env.PORT ?? 8080));
