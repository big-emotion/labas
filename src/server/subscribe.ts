/**
 * The one piece of server code in Là-bas: it signs readers up for the news by e-mail.
 *
 * Mailjet's API needs a secret key, which a static page cannot hold, so this small service holds
 * it (operator's choice, 2026-11-16, over a third-party form). It keeps no database: the
 * confirmation link carries the address, signed, and only a confirmed address reaches the
 * Mailjet list (double opt-in). It receives the address and the ticked box, nothing else.
 *
 * One file with no local imports, so Node runs it as is: `node src/server/subscribe.ts`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

export interface Config {
  apiKey: string;
  apiSecret: string;
  listId: string;
  /** A sender address validated in the Mailjet account. */
  sender: string;
  /** Signs the confirmation links. */
  secret: string;
  siteUrl: string;
}

export interface Mailer {
  sendConfirmation(email: string, link: string): Promise<void>;
  addToList(email: string): Promise<void>;
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

export function createHandler(config: Config, mailer: Mailer, now: () => number = Date.now) {
  // Per connection: a person retrying is fine, a script is not.
  const perConnection = limiter(5, HOUR);
  // Per address: nobody can use Là-bas to flood someone else's inbox with confirmations.
  const perAddress = limiter(3, DAY);
  const configured = Object.values(config).every(Boolean);

  return async (request: Request): Promise<Response> => {
    if (request.method === "POST" && request.path === "/api/nouveautes") {
      if (!configured) return json(503, { error: "closed" });
      if (request.headers.origin !== config.siteUrl) return json(403, { error: "origin" });
      const form = (request.body ?? {}) as {
        email?: unknown;
        consent?: unknown;
        website?: unknown;
      };
      const email = String(form.email ?? "")
        .trim()
        .toLowerCase();
      if (form.consent !== true || !isEmail(email)) return json(400, { error: "form" });
      // The hidden field only robots fill: they are told it worked.
      if (form.website) return json(202, { ok: true });
      const connection = request.headers["x-real-ip"] ?? "unknown";
      if (!perConnection(connection, now())) return json(429, { error: "slow-down" });
      if (!perAddress(email, now())) return json(429, { error: "slow-down" });
      const link = `${config.siteUrl}/api/nouveautes/confirmer?t=${signToken(email, now(), config.secret)}`;
      try {
        await mailer.sendConfirmation(email, link);
      } catch (error) {
        // The operator's log gets Mailjet's answer, never the reader's address.
        console.error(String(error));
        return json(502, { error: "mail" });
      }
      return json(202, { ok: true });
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

const CONFIRMATION_TEXT = (link: string) => `Bonjour,

Vous avez demandé à recevoir les nouveautés de Là-bas : nouvelles villes, questionnaire amélioré, un e-mail par mois au plus.

Pour confirmer, ouvrez ce lien :
${link}

Vous n'avez rien demandé ? Ignorez ce message : vous ne recevrez rien d'autre.

Là-bas est édité par Big Emotion · labas.africa. Nous gardons votre adresse, rien d'autre, et ne la vendons ni ne la prêtons.`;

const CONFIRMATION_HTML = (
  link: string,
) => `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f0ff;font-family:Arial,sans-serif;color:#1d1b3a">
<div style="max-width:560px;margin:24px auto;background:#161a5c;color:#f1f0ff;border-radius:20px;padding:32px">
<p style="margin:0 0 16px;font-family:Georgia,serif;font-weight:900;font-size:32px">Là<span style="color:#ffb627">-</span>bas</p>
<p>Bonjour,</p>
<p>Vous avez demandé à recevoir les nouveautés de Là-bas : nouvelles villes, questionnaire amélioré, un e-mail par mois au plus. Pour confirmer, touchez le bouton.</p>
<p><a href="${link}" style="display:inline-block;padding:16px 26px;border-radius:999px;background:#ffb627;color:#1d1b3a;font-weight:800;text-decoration:none">Je confirme mon inscription</a></p>
<p style="color:#b4b8ea;font-size:15px">Vous n'avez rien demandé ? Ignorez ce message : vous ne recevrez rien d'autre.</p>
</div>
<p style="max-width:560px;margin:0 auto 24px;font-size:13px;color:#4a4870">Là-bas est édité par Big Emotion · labas.africa · Nous gardons votre adresse, rien d'autre, et ne la vendons ni ne la prêtons.</p>
</body></html>`;

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
    sendConfirmation: (email, link) =>
      call("https://api.mailjet.com/v3.1/send", {
        Messages: [
          {
            From: { Email: config.sender, Name: "Là-bas" },
            To: [{ Email: email }],
            Subject: "Confirmez votre inscription aux nouveautés de Là-bas",
            TextPart: CONFIRMATION_TEXT(link),
            HTMLPart: CONFIRMATION_HTML(link),
          },
        ],
      }),
    addToList: (email) =>
      call(`https://api.mailjet.com/v3/REST/contactslist/${config.listId}/managecontact`, {
        Email: email,
        Action: "addforce",
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
  };
  const handle = createHandler(config, mailjet(config));
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
