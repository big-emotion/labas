/**
 * The one piece of server code in Là-bas: it sends the e-mails a reader asks for — the news
 * sign-up and their results.
 *
 * Mail leaves through Microsoft Graph as the Là-bas mailbox of the Microsoft 365 tenant
 * (operator, 2026-11-17, replacing Mailjet), whose app secret a static page cannot hold, so this
 * small service holds it. The confirmation link carries the address, signed, and only a
 * confirmed address reaches the news list, kept in the site's own database (news.ts, double
 * opt-in). A results e-mail is drawn from the site's own result link, read with the site's own
 * code, so no text a visitor types can reach someone's inbox.
 *
 * Bundled with the site's data by `npm run build:server` (esbuild) into one file Node runs.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { SITE } from "../lib/share";
import { resultAt } from "../lib/shared-result";
import { type Db, createAccounts, migrate, purge, whenReady } from "./accounts";
import { plausibleStats } from "./plausible";
import { type Mail, confirmationEmail, resultsEmail } from "./emails";
import { limiter } from "./limiter";
import { newsList } from "./news";

export type { Mail } from "./emails";

export interface Config {
  /** The Entra app that may send as `sender` only (an application access policy says so). */
  tenantId: string;
  clientId: string;
  clientSecret: string;
  /** The Là-bas mailbox in the Microsoft 365 tenant. */
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

/**
 * The way out of the news: signed for one address, never expiring (the privacy page promises a
 * way out in every e-mail, whenever it is read), and signed apart so it confirms nothing.
 */
export function signLeave(email: string, secret: string): string {
  const payload = Buffer.from(email).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(`leave|${payload}`).digest("base64url")}`;
}

function readLeave(token: string, secret: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(`leave|${payload}`).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const email = Buffer.from(payload, "base64url").toString();
  return isEmail(email) ? email : null;
}

/** A page with a button, not an action: mail scanners open links, and must not unsubscribe anyone. */
export const leaveLink = (siteUrl: string, email: string, secret: string) =>
  `${siteUrl}/nouveautes/desinscription/#t=${signLeave(email, secret)}`;

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
    // Traefik replaces any client-sent X-Real-IP with the real address (docs/deploy.md).
    const connection = request.headers["x-real-ip"] ?? "unknown";
    if (!perConnection(connection, now())) return json(429, { error: "slow-down" });
    if (!perAddress(email, now())) return json(429, { error: "slow-down" });
    try {
      await mailer.send(send(email, form));
    } catch (error) {
      // The operator's log gets the mail service's answer, never the reader's address.
      console.error(String(error));
      return json(502, { error: "mail" });
    }
    return json(202, { ok: true });
  }

  const resultFrom = (link: unknown) => resultAt(link, config.siteUrl);

  return async (request: Request): Promise<Response> => {
    try {
      return await route(request);
    } catch (error) {
      // An unhandled rejection would stop the process, and every reader with it.
      console.error(String(error));
      return json(500, { error: "server" });
    }
  };

  async function route(request: Request): Promise<Response> {
    if (request.path === "/api/compte" || request.path.startsWith("/api/compte/")) {
      return accounts ? accounts(request) : json(503, { error: "closed" });
    }

    if (request.method === "POST" && request.path === "/api/nouveautes") {
      return guard(
        request,
        (form) => form.consent === true,
        (email) =>
          confirmationEmail(
            email,
            confirmLinkFor(email),
            leaveLink(config.siteUrl, email, config.secret),
          ),
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

    if (request.method === "POST" && request.path === "/api/nouveautes/desinscrire") {
      if (!configured) return json(503, { error: "closed" });
      if (request.headers.origin !== config.siteUrl) return json(403, { error: "origin" });
      const connection = request.headers["x-real-ip"] ?? "unknown";
      if (!perConnection(connection, now())) return json(429, { error: "slow-down" });
      const form = (request.body ?? {}) as Record<string, unknown>;
      const email = readLeave(String(form.t ?? ""), config.secret);
      if (!email) return json(400, { error: "link" });
      try {
        await mailer.removeFromList(email);
      } catch (error) {
        console.error(String(error));
        return json(502, { error: "list" });
      }
      return json(200, { ok: true });
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
  }
}

/**
 * Sends through Microsoft Graph with an app-only token (client credentials), minted once and
 * reused until a minute before it expires. Graph requires the From address to be the mailbox in
 * the URL.
 */
export function graph(config: Config, fetchImpl: typeof fetch = fetch): Pick<Mailer, "send"> {
  let token: { value: string; expiresAt: number } | null = null;
  const accessToken = async () => {
    if (token && token.expiresAt - 60_000 > Date.now()) return token.value;
    const response = await fetchImpl(
      `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      },
    );
    if (!response.ok) throw new Error(`Microsoft answered ${response.status} on the token`);
    const body = (await response.json()) as { access_token: string; expires_in: number };
    token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return token.value;
  };
  return {
    async send(mail) {
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.sender)}/sendMail`;
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${await accessToken()}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: mail.subject,
            body: { contentType: "HTML", content: mail.html },
            from: { emailAddress: { address: config.sender, name: "Là-bas" } },
            toRecipients: [{ emailAddress: { address: mail.to } }],
            replyTo: [{ emailAddress: { address: mail.replyTo ?? config.replyTo } }],
          },
          // A copy of every reader's mail in the mailbox would be one more place keeping it.
          saveToSentItems: false,
        }),
      });
      if (!response.ok) throw new Error(`Microsoft answered ${response.status} on sendMail`);
    },
  };
}

/** The HTTP shell around the handler: small bodies only, JSON in, JSON or a redirect out. */
function start(port: number) {
  const config: Config = {
    tenantId: process.env.GRAPH_TENANT_ID ?? "",
    clientId: process.env.GRAPH_CLIENT_ID ?? "",
    clientSecret: process.env.GRAPH_CLIENT_SECRET ?? "",
    sender: process.env.MAIL_SENDER ?? "",
    secret: process.env.SUBSCRIBE_SECRET ?? "",
    siteUrl: process.env.SITE_URL ?? SITE,
    replyTo: process.env.REPLY_TO ?? "hello@big-emotion.com",
  };
  const pool = process.env.DATABASE_URL
    ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
    : null;
  const db: Db | null = pool && { query: (sql, params) => pool.query(sql, params) as never };
  // The news list lives in the database: without one, a confirmation link says it failed.
  const noList = async () => {
    throw new Error("no database for the news list");
  };
  const mailer: Mailer = {
    ...graph(config),
    ...(db ? newsList(db) : { addToList: noList, removeFromList: noList }),
  };
  let accounts: AccountsHandler | undefined;
  // One handler for the life of the process: its limits must remember every request.
  const handle = createHandler(config, mailer, Date.now, (request) =>
    accounts ? accounts(request) : Promise.resolve(json(503, { error: "closed" })),
  );
  // Without a database, or while it cannot be reached, the results e-mail keeps working and
  // /api/compte answers 503: saved journeys are an extra, never a reason to go down.
  if (db && Object.values(config).every(Boolean)) {
    whenReady(() => migrate(db))
      .then(() => {
        const { PLAUSIBLE_API_KEY, PLAUSIBLE_SITE, PLAUSIBLE_API_HOST } = process.env;
        accounts = createAccounts({
          db,
          mailer,
          siteUrl: config.siteUrl,
          admins: (process.env.ADMIN_EMAILS ?? "").split(","),
          team: config.replyTo,
          stats:
            PLAUSIBLE_API_KEY && PLAUSIBLE_SITE && PLAUSIBLE_API_HOST
              ? plausibleStats({
                  host: PLAUSIBLE_API_HOST,
                  site: PLAUSIBLE_SITE,
                  apiKey: PLAUSIBLE_API_KEY,
                })
              : undefined,
        });
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
      // Room for a full questionnaire's answers beside the result link.
      if (raw.length > 8192) return outgoing.writeHead(413).end();
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
