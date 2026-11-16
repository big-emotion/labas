import { createHash, randomBytes } from "node:crypto";
import { cleanAnswers } from "../lib/keep";
import { loginLinkEmail, saveLinkEmail } from "./emails";
import type { Mailer } from "./subscribe";

/**
 * Saved journeys and « Mon espace » (decisions of 2026-11-16, docs/accounts.md): a magic link
 * by e-mail instead of a password, journeys kept with the reader's explicit consent — sensitive
 * answers included — and erased three years after the last visit.
 */

/** The one thing the module needs from Postgres; `pg` in production, PGlite in the tests. */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
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

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Three years after the last visit, as the privacy page promises. */
export const KEEP_FOR = 3 * 365 * DAY;
/** A save nobody confirmed by opening its link is someone else's mistake: gone after a week. */
const UNCONFIRMED_FOR = 7 * DAY;
const SAVE_LINK_FOR = DAY;
const LOGIN_LINK_FOR = 15 * MINUTE;
const SESSION_FOR = 30 * DAY;
const COOKIE = "labas_session";

export async function migrate(db: Db): Promise<void> {
  await db.query(`
    create table if not exists accounts (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      created_at timestamptz not null,
      confirmed_at timestamptz,
      last_seen_at timestamptz not null,
      consent_at timestamptz not null,
      news boolean not null default false
    )`);
  await db.query(`
    create table if not exists journeys (
      id uuid primary key default gen_random_uuid(),
      account_id uuid not null references accounts(id) on delete cascade,
      kind text not null check (kind in ('quick', 'deep')),
      answers jsonb not null,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      confirmed_at timestamptz
    )`);
  await db.query(`
    create table if not exists login_links (
      token_hash text primary key,
      account_id uuid not null references accounts(id) on delete cascade,
      journey_id uuid references journeys(id) on delete cascade,
      news boolean not null default false,
      expires_at timestamptz not null,
      used_at timestamptz
    )`);
  await db.query(`
    create table if not exists sessions (
      token_hash text primary key,
      account_id uuid not null references accounts(id) on delete cascade,
      expires_at timestamptz not null
    )`);
}

/** Erases what the privacy page says is erased; run at start and once a day. */
export async function purge(db: Db, now: number): Promise<void> {
  const at = (ms: number) => new Date(ms).toISOString();
  await db.query("delete from accounts where last_seen_at < $1", [at(now - KEEP_FOR)]);
  await db.query("delete from accounts where confirmed_at is null and created_at < $1", [
    at(now - UNCONFIRMED_FOR),
  ]);
  await db.query("delete from journeys where confirmed_at is null and created_at < $1", [
    at(now - UNCONFIRMED_FOR),
  ]);
  await db.query("delete from login_links where expires_at < $1", [at(now)]);
  await db.query("delete from sessions where expires_at < $1", [at(now)]);
}

const token = () => randomBytes(32).toString("base64url");
/** Tokens are stored hashed: a copy of the database opens no session and no link. */
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const isEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const json = (status: number, body: object, headers: Record<string, string> = {}): Response => ({
  status,
  headers: { "content-type": "application/json; charset=utf-8", ...headers },
  body: JSON.stringify(body),
});
const redirect = (location: string, headers: Record<string, string> = {}): Response => ({
  status: 303,
  headers: { location, ...headers },
});
const sessionCookie = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

function limiter(max: number, window: number) {
  const seen = new Map<string, number[]>();
  return (key: string, now: number): boolean => {
    const recent = (seen.get(key) ?? []).filter((at) => now - at < window);
    if (recent.length >= max) return false;
    seen.set(key, [...recent, now]);
    return true;
  };
}

interface Options {
  db: Db;
  mailer: Mailer;
  siteUrl: string;
  now?: () => number;
}

interface JourneyRow {
  id: string;
  kind: string;
  answers: unknown;
  created_at: string | Date;
  updated_at: string | Date;
}

export function createAccounts({ db, mailer, siteUrl, now = Date.now }: Options) {
  const perConnection = limiter(5, HOUR);
  const perAddress = limiter(3, DAY);
  const at = (offset = 0) => new Date(now() + offset).toISOString();
  const iso = (value: string | Date) => new Date(value).toISOString();

  async function mailLink(
    accountId: string,
    email: string,
    lifetime: number,
    journeyId: string | null,
    news: boolean,
  ) {
    const secret = token();
    await db.query(
      "insert into login_links (token_hash, account_id, journey_id, news, expires_at) values ($1, $2, $3, $4, $5)",
      [hash(secret), accountId, journeyId, news, at(lifetime)],
    );
    const link = `${siteUrl}/api/compte/connexion?t=${secret}`;
    await mailer.send(journeyId ? saveLinkEmail(email, link) : loginLinkEmail(email, link));
  }

  /** The reader behind the session cookie, kept alive by the visit. */
  async function member(request: Request): Promise<{ id: string; email: string } | null> {
    const value = /(?:^|;\s*)labas_session=([\w-]+)/.exec(request.headers.cookie ?? "")?.[1];
    if (!value) return null;
    const { rows } = await db.query<{ id: string; email: string }>(
      `select a.id, a.email from sessions s join accounts a on a.id = s.account_id
       where s.token_hash = $1 and s.expires_at > $2`,
      [hash(value), at()],
    );
    if (!rows[0]) return null;
    await db.query("update accounts set last_seen_at = $1 where id = $2", [at(), rows[0].id]);
    return rows[0];
  }

  async function journeysOf(accountId: string) {
    const { rows } = await db.query<JourneyRow>(
      `select id, kind, answers, created_at, updated_at from journeys
       where account_id = $1 and confirmed_at is not null order by updated_at desc`,
      [accountId],
    );
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      answers: r.answers,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));
  }

  return async (request: Request): Promise<Response> => {
    const { method, path } = request;
    // Every change comes from the site itself; the session cookie alone authorises nothing else.
    if (method !== "GET" && request.headers.origin !== siteUrl)
      return json(403, { error: "origin" });
    const form = (request.body ?? {}) as Record<string, unknown>;
    const connection = request.headers["x-real-ip"] ?? "unknown";

    if (method === "POST" && path === "/api/compte/sauvegarder") {
      const email = String(form.email ?? "")
        .trim()
        .toLowerCase();
      const journey = (form.journey ?? {}) as { kind?: unknown; answers?: unknown };
      if (
        !isEmail(email) ||
        form.consent !== true ||
        !["quick", "deep"].includes(String(journey.kind))
      )
        return json(400, { error: "form" });
      if (form.website) return json(202, { ok: true });
      if (!perConnection(connection, now()) || !perAddress(email, now()))
        return json(429, { error: "slow-down" });
      await db.query(
        `insert into accounts (email, created_at, last_seen_at, consent_at) values ($1, $2, $2, $2)
         on conflict (email) do nothing`,
        [email, at()],
      );
      const account = (
        await db.query<{ id: string }>("select id from accounts where email = $1", [email])
      ).rows[0];
      const saved = await db.query<{ id: string }>(
        `insert into journeys (account_id, kind, answers, created_at, updated_at)
         values ($1, $2, $3, $4, $4) returning id`,
        [account.id, journey.kind, JSON.stringify(cleanAnswers(journey.answers)), at()],
      );
      try {
        await mailLink(account.id, email, SAVE_LINK_FOR, saved.rows[0].id, form.news === true);
      } catch (error) {
        console.error(String(error));
        return json(502, { error: "mail" });
      }
      return json(202, { ok: true });
    }

    if (method === "POST" && path === "/api/compte/lien") {
      const email = String(form.email ?? "")
        .trim()
        .toLowerCase();
      if (!isEmail(email)) return json(400, { error: "form" });
      if (!perConnection(connection, now()) || !perAddress(email, now()))
        return json(429, { error: "slow-down" });
      const account = (
        await db.query<{ id: string }>("select id from accounts where email = $1", [email])
      ).rows[0];
      // The same answer whether the address has a space or not: nobody learns who uses Là-bas.
      if (account) {
        try {
          await mailLink(account.id, email, LOGIN_LINK_FOR, null, false);
        } catch (error) {
          console.error(String(error));
        }
      }
      return json(202, { ok: true });
    }

    if (method === "GET" && path === "/api/compte/connexion") {
      const { rows } = await db.query<{
        account_id: string;
        journey_id: string | null;
        news: boolean;
      }>(
        `update login_links set used_at = $2
         where token_hash = $1 and used_at is null and expires_at > $2
         returning account_id, journey_id, news`,
        [hash(request.query.get("t") ?? ""), at()],
      );
      const link = rows[0];
      if (!link) return redirect("/espace/lien-expire/");
      const account = (
        await db.query<{ email: string }>(
          `update accounts set confirmed_at = coalesce(confirmed_at, $2), last_seen_at = $2,
             news = news or $3 where id = $1 returning email`,
          [link.account_id, at(), link.news],
        )
      ).rows[0];
      if (link.journey_id)
        await db.query("update journeys set confirmed_at = $2 where id = $1", [
          link.journey_id,
          at(),
        ]);
      if (link.news) await mailer.addToList(account.email).catch((e) => console.error(String(e)));
      const session = token();
      await db.query(
        "insert into sessions (token_hash, account_id, expires_at) values ($1, $2, $3)",
        [hash(session), link.account_id, at(SESSION_FOR)],
      );
      return redirect("/espace/", { "set-cookie": sessionCookie(session, SESSION_FOR / 1000) });
    }

    const reader = await member(request);
    if (!reader) return json(401, { error: "login" });

    if (method === "GET" && path === "/api/compte") {
      const { rows } = await db.query<{ news: boolean }>(
        "select news from accounts where id = $1",
        [reader.id],
      );
      return json(200, {
        email: reader.email,
        news: rows[0].news,
        keptUntil: at(KEEP_FOR),
        journeys: await journeysOf(reader.id),
      });
    }

    if (method === "GET" && path === "/api/compte/export") {
      return json(
        200,
        { email: reader.email, exportedAt: at(), journeys: await journeysOf(reader.id) },
        { "content-disposition": 'attachment; filename="la-bas-mes-donnees.json"' },
      );
    }

    if (method === "PATCH" && path === "/api/compte") {
      if (typeof form.news !== "boolean") return json(400, { error: "form" });
      await db.query("update accounts set news = $2 where id = $1", [reader.id, form.news]);
      const change = form.news
        ? mailer.addToList(reader.email)
        : mailer.removeFromList(reader.email);
      await change.catch((e) => console.error(String(e)));
      return json(200, { ok: true });
    }

    if (method === "POST" && path === "/api/compte/parcours") {
      if (!["quick", "deep"].includes(String(form.kind))) return json(400, { error: "form" });
      const { rows } = await db.query<{ id: string }>(
        `insert into journeys (account_id, kind, answers, created_at, updated_at, confirmed_at)
         values ($1, $2, $3, $4, $4, $4) returning id`,
        [reader.id, form.kind, JSON.stringify(cleanAnswers(form.answers)), at()],
      );
      return json(201, { id: rows[0].id });
    }

    const one = /^\/api\/compte\/parcours\/([0-9a-f-]{36})$/.exec(path)?.[1];
    if (one && method === "PUT") {
      const { rows } = await db.query(
        `update journeys set answers = $3, updated_at = $4
         where id = $1 and account_id = $2 and confirmed_at is not null returning id`,
        [one, reader.id, JSON.stringify(cleanAnswers(form.answers)), at()],
      );
      return rows.length ? json(200, { ok: true }) : json(404, { error: "not-found" });
    }
    if (one && method === "DELETE") {
      const { rows } = await db.query(
        "delete from journeys where id = $1 and account_id = $2 returning id",
        [one, reader.id],
      );
      return rows.length ? json(200, { ok: true }) : json(404, { error: "not-found" });
    }

    if (method === "DELETE" && path === "/api/compte") {
      await db.query("delete from accounts where id = $1", [reader.id]);
      await mailer.removeFromList(reader.email).catch((e) => console.error(String(e)));
      return json(200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
    }

    if (method === "POST" && path === "/api/compte/deconnexion") {
      const value =
        /(?:^|;\s*)labas_session=([\w-]+)/.exec(request.headers.cookie ?? "")?.[1] ?? "";
      await db.query("delete from sessions where token_hash = $1", [hash(value)]);
      return json(200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
    }

    return json(404, { error: "not-found" });
  };
}
