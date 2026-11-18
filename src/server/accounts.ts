import { createHash, randomBytes } from "node:crypto";
import { CITIES } from "../lib/cities";
import { FEEDBACK_KINDS, MESSAGE_MAX } from "../lib/feedback";
import { cleanAnswers, SENSITIVE_ANSWERS, withoutSensitive } from "../lib/keep";
import { TOP_THREE, type Answers } from "../lib/ranking";
import { MARKS } from "../lib/reactions";
import { resultAt } from "../lib/shared-result";
import {
  loginLinkEmail,
  reactionLinkEmail,
  resultsEmail,
  saveLinkEmail,
  teamMessageEmail,
} from "./emails";
import { limiter } from "./limiter";
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
/** The results e-mail is kept and reopened: its button lasts as long as an unconfirmed space. */
const RESULTS_LINK_FOR = UNCONFIRMED_FOR;
const LOGIN_LINK_FOR = 15 * MINUTE;
const SESSION_FOR = 30 * DAY;
const COOKIE = "labas_session";
const REACTION_MAX = 1000;
const NAME_MAX = 40;
/** Three readers, not three clicks: one reader alone cannot take a reaction down. */
const REPORTS_TO_HIDE = 3;
/** Long enough to answer and learn from, short enough not to become an archive (operator, 2026-11-18). */
const MESSAGES_FOR = 365 * DAY;

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
  // Reactions belong to a city, not to a ranking: the ranking differs for everyone (operator,
  // 2026-11-18). Published once the address is confirmed; `seq` orders two within the same instant.
  await db.query(`
    create table if not exists reactions (
      id uuid primary key default gen_random_uuid(),
      seq bigint generated always as identity,
      account_id uuid not null references accounts(id) on delete cascade,
      city text not null,
      text text not null,
      name text,
      top jsonb,
      created_at timestamptz not null,
      published_at timestamptz,
      reports integer not null default 0
    )`);
  await db.query(
    "create index if not exists reactions_by_city on reactions (city, published_at desc)",
  );
  await db.query(
    "alter table login_links add column if not exists reaction_id uuid references reactions(id) on delete cascade",
  );
  await db.query("alter table login_links add column if not exists back text");
  await db.query("alter table reactions add column if not exists profile jsonb");
  // Two levels, never a tree (operator, 2026-11-18): a reply always hangs on the first review,
  // and `mention` names the reply it answers when it answers one.
  await db.query(
    "alter table reactions add column if not exists parent_id uuid references reactions(id) on delete cascade",
  );
  await db.query("alter table reactions add column if not exists mention text");
  await db.query("create index if not exists reactions_by_parent on reactions (parent_id)");
  // Hidden by the operator from /admin; restoring clears this and the reports alike.
  await db.query(
    "alter table reactions add column if not exists hidden boolean not null default false",
  );
  // Who marked is kept only so that a second tap takes the mark back; only counts are shown.
  await db.query(`
    create table if not exists reaction_marks (
      reaction_id uuid not null references reactions(id) on delete cascade,
      account_id uuid not null references accounts(id) on delete cascade,
      mark text not null,
      primary key (reaction_id, account_id, mark)
    )`);
  // Who reported is kept so that a reader counts once, across restarts; erased with the space.
  await db.query(`
    create table if not exists reaction_reports (
      reaction_id uuid not null references reactions(id) on delete cascade,
      account_id uuid not null references accounts(id) on delete cascade,
      primary key (reaction_id, account_id)
    )`);
  // The feedback tab: private words to the team, apart from the public reviews and from any
  // account, so they leave nothing behind when a space is erased and need no login.
  await db.query(`
    create table if not exists messages (
      id uuid primary key default gen_random_uuid(),
      seq bigint generated always as identity,
      kind text not null check (kind in ('site', 'message')),
      text text not null,
      page text,
      email text,
      created_at timestamptz not null
    )`);
  await consentPerJourney(db);
  await db.query(`
    create table if not exists news_subscribers (
      email text primary key,
      confirmed_at timestamptz not null
    )`);
  await db.query(`
    create table if not exists sessions (
      token_hash text primary key,
      account_id uuid not null references accounts(id) on delete cascade,
      expires_at timestamptz not null
    )`);
}

/**
 * Sensitive answers are kept per journey, only when that journey's own box was ticked (operator,
 * 2026-11-18). Journeys from before the column: one saved with the consent box or by e-mail and
 * already holding sensitive answers had them with consent; one started from Mon espace (created
 * and confirmed in the same instant) never asked, so its sensitive answers are erased.
 */
async function consentPerJourney(db: Db): Promise<void> {
  const { rows } = await db.query(
    `select 1 from information_schema.columns
     where table_name = 'journeys' and column_name = 'sensitive'`,
  );
  if (rows.length) return;
  await db.query("alter table journeys add column sensitive boolean");
  await db.query(
    `update journeys set sensitive =
       (confirmed_at is null or confirmed_at <> created_at) and answers ?| $1::text[]`,
    [SENSITIVE_ANSWERS],
  );
  await db.query("update journeys set answers = answers - $1::text[] where not sensitive", [
    SENSITIVE_ANSWERS,
  ]);
  await db.query("alter table journeys alter column sensitive set default false");
  await db.query("alter table journeys alter column sensitive set not null");
}

/**
 * Retries a first step until it works. On a first deploy Postgres initialises its files for a few
 * seconds while the service is already up; giving up then left saved journeys off for good.
 */
export async function whenReady<T>(
  attempt: () => Promise<T>,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((done) => setTimeout(done, ms)),
): Promise<T> {
  for (let wait = 2000; ; wait = Math.min(wait * 2, 60_000)) {
    try {
      return await attempt();
    } catch (error) {
      console.error(`database not ready: ${String(error)}`);
      await sleep(wait);
    }
  }
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
  await db.query("delete from reactions where published_at is null and created_at < $1", [
    at(now - UNCONFIRMED_FOR),
  ]);
  await db.query("delete from login_links where expires_at < $1", [at(now)]);
  await db.query("delete from sessions where expires_at < $1", [at(now)]);
  await db.query("delete from news_subscribers where confirmed_at < $1", [at(now - KEEP_FOR)]);
  await db.query("delete from messages where created_at < $1", [at(now - MESSAGES_FOR)]);
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

/**
 * Where a link may bring the reader back: a path of this site only. « //host » and « /\\host » are
 * read by browsers as another site, so they are refused like any full address.
 */
function backOf(value: unknown): string | null {
  const back = String(value ?? "");
  return /^\/(?![/\\])[^\s\\]{0,300}$/.test(back) ? back : null;
}

/** A stable stand-in for a reader who gave no name: the same number on each of their reactions. */
const anonymousName = (accountId: string) =>
  `Utilisateur ${1000 + (parseInt(hash(accountId).slice(0, 8), 16) % 9000)}`;

interface Options {
  db: Db;
  mailer: Mailer;
  siteUrl: string;
  now?: () => number;
  /** Addresses that open /admin; none means the admin stays shut. */
  admins?: string[];
  /** The audience figures of /admin (plausible.ts); absent until a Stats API key is set. */
  stats?: () => Promise<object>;
  /** The team's mailbox, where the feedback tab's messages are mailed; absent, they are only kept. */
  team?: string;
}

interface ReactionRow {
  id: string;
  account_id: string;
  city: string;
  text: string;
  name: string | null;
  top: unknown;
  profile: unknown;
  parent_id: string | null;
  mention: string | null;
  created_at: string | Date;
  published_at: string | Date | null;
}

interface MessageRow {
  id: string;
  kind: string;
  text: string;
  page: string | null;
  email: string | null;
  created_at: string | Date;
}

/** What a journey may keep: the sensitive answers only under their own box. */
const keptOf = (answers: Answers, sensitive: boolean) =>
  sensitive ? answers : withoutSensitive(answers);

const MARK_KEYS: readonly string[] = MARKS.map((m) => m.key);
const ID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID = new RegExp(`^${ID}$`);
/** The id in a path, only when it is one: anything else would reach Postgres and fail there. */
const idIn = (path: string, before: string, after = "") =>
  new RegExp(`^${before}(${ID})${after}$`).exec(path)?.[1];
/** The reviews of every city on /avis: enough for a beta, filtered in the browser. */
const LATEST = 200;

interface LinkOptions {
  journeyId?: string | null;
  reactionId?: string | null;
  news?: boolean;
  /** Only picks where the link lands; the token alone authorises. */
  toResults?: boolean;
  back?: string | null;
}

interface JourneyRow {
  id: string;
  kind: string;
  answers: unknown;
  created_at: string | Date;
  updated_at: string | Date;
}

export function createAccounts({
  db,
  mailer,
  siteUrl,
  now = Date.now,
  admins = [],
  stats,
  team,
}: Options) {
  const adminAddresses = new Set(admins.map((a) => a.trim().toLowerCase()).filter(Boolean));
  const perConnection = limiter(5, HOUR);
  const perAddress = limiter(3, DAY);
  // Generous for a person, short for a script tapping every heart on the site.
  const perMark = limiter(120, HOUR);
  // Apart from the others: a reader who just saved a journey can still write to the team.
  const messagesPerConnection = limiter(5, HOUR);
  const messagesPerAddress = limiter(3, DAY);
  const at = (offset = 0) => new Date(now() + offset).toISOString();
  const iso = (value: string | Date) => new Date(value).toISOString();

  async function issueLink(accountId: string, lifetime: number, options: LinkOptions = {}) {
    const { journeyId = null, reactionId = null, news = false, toResults = false } = options;
    const secret = token();
    // The way back is stored with the token, not written in the link: nobody can retarget it.
    await db.query(
      `insert into login_links (token_hash, account_id, journey_id, reaction_id, news, back, expires_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [hash(secret), accountId, journeyId, reactionId, news, options.back ?? null, at(lifetime)],
    );
    return `${siteUrl}/api/compte/connexion?t=${secret}${toResults ? "&vers=resultats" : ""}`;
  }

  /** The account behind an address, created unconfirmed when it is new. */
  async function accountFor(email: string): Promise<string> {
    await db.query(
      `insert into accounts (email, created_at, last_seen_at, consent_at) values ($1, $2, $2, $2)
       on conflict (email) do nothing`,
      [email, at()],
    );
    return (await db.query<{ id: string }>("select id from accounts where email = $1", [email]))
      .rows[0].id;
  }

  /** An unconfirmed journey under this address. */
  async function keepJourney(email: string, kind: string, answers: Answers, sensitive: boolean) {
    const accountId = await accountFor(email);
    const saved = await db.query<{ id: string }>(
      `insert into journeys (account_id, kind, answers, sensitive, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $5) returning id`,
      [accountId, kind, JSON.stringify(keptOf(answers, sensitive)), sensitive, at()],
    );
    return { accountId, journeyId: saved.rows[0].id };
  }

  const reactionColumns =
    "id, account_id, city, text, name, top, profile, parent_id, mention, created_at, published_at";
  const displayName = (r: { name: string | null; account_id: string }) =>
    r.name ?? anonymousName(r.account_id);

  type Marks = { counts: Record<string, number>; mine: string[] };
  /** Counts for everyone; the reader's own marks only so their taps show as taken. */
  async function marksOf(ids: string[], readerId: string | undefined) {
    const marks = new Map<string, Marks>(ids.map((id) => [id, { counts: {}, mine: [] }]));
    if (!ids.length) return marks;
    const { rows } = await db.query<{ reaction_id: string; mark: string; account_id: string }>(
      "select reaction_id, mark, account_id from reaction_marks where reaction_id = any($1) order by mark",
      [ids],
    );
    for (const row of rows) {
      const entry = marks.get(row.reaction_id)!;
      entry.counts[row.mark] = (entry.counts[row.mark] ?? 0) + 1;
      if (row.account_id === readerId) entry.mine.push(row.mark);
    }
    return marks;
  }

  /** What anyone may read of a reaction: never the address, never the account. */
  const publicReaction = (r: ReactionRow, readerId: string | undefined, marks?: Marks) => ({
    id: r.id,
    city: r.city,
    name: displayName(r),
    text: r.text,
    top: r.top ?? null,
    profile: r.profile ?? null,
    createdAt: iso(r.published_at ?? r.created_at),
    mine: r.account_id === readerId,
    marks: marks?.counts ?? {},
    myMarks: marks?.mine ?? [],
    mention: r.mention ?? null,
  });

  /** Reviews with their replies hung under them, oldest reply first, and every mark counted. */
  async function threadsOf(reviews: ReactionRow[], readerId: string | undefined) {
    const { rows: replies } = reviews.length
      ? await db.query<ReactionRow>(
          `select ${reactionColumns} from reactions
           where parent_id = any($1) and published_at is not null and reports < $2 and not hidden
           order by published_at, seq`,
          [reviews.map((r) => r.id), REPORTS_TO_HIDE],
        )
      : { rows: [] };
    const marks = await marksOf(
      [...reviews, ...replies].map((r) => r.id),
      readerId,
    );
    return reviews.map((review) => ({
      ...publicReaction(review, readerId, marks.get(review.id)),
      replies: replies
        .filter((reply) => reply.parent_id === review.id)
        .map((reply) => publicReaction(reply, readerId, marks.get(reply.id))),
    }));
  }

  async function reactionsOf(accountId: string) {
    const { rows } = await db.query<ReactionRow>(
      `select ${reactionColumns} from reactions where account_id = $1 order by seq`,
      [accountId],
    );
    return rows.map((r) => ({
      id: r.id,
      city: r.city,
      text: r.text,
      name: r.name,
      top: r.top,
      profile: r.profile,
      replyTo: r.parent_id,
      createdAt: iso(r.created_at),
      publishedAt: r.published_at ? iso(r.published_at) : null,
    }));
  }

  const emailOf = (form: Record<string, unknown>) =>
    String(form.email ?? "")
      .trim()
      .toLowerCase();
  const kindOf = (form: Record<string, unknown>) =>
    String((form.journey as { kind?: unknown } | undefined)?.kind);

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

  /** A published review or reply, or undefined when there is nothing to answer. */
  async function reviewToAnswer(id: unknown) {
    if (typeof id !== "string" || !UUID.test(id)) return undefined;
    const { rows } = await db.query<ReactionRow>(
      `select ${reactionColumns} from reactions
       where id = $1 and published_at is not null and reports < $2 and not hidden`,
      [id, REPORTS_TO_HIDE],
    );
    return rows[0];
  }

  return async (request: Request): Promise<Response> => {
    const { method, path } = request;
    // Every change comes from the site itself; the session cookie alone authorises nothing else.
    if (method !== "GET" && request.headers.origin !== siteUrl)
      return json(403, { error: "origin" });
    const form = (request.body ?? {}) as Record<string, unknown>;
    const connection = request.headers["x-real-ip"] ?? "unknown";

    const answersOf = (form: Record<string, unknown>) =>
      cleanAnswers((form.journey as { answers?: unknown } | undefined)?.answers);

    if (method === "POST" && path === "/api/compte/sauvegarder") {
      const email = emailOf(form);
      if (!isEmail(email) || form.consent !== true || !["quick", "deep"].includes(kindOf(form)))
        return json(400, { error: "form" });
      if (form.website) return json(202, { ok: true });
      if (!perConnection(connection, now()) || !perAddress(email, now()))
        return json(429, { error: "slow-down" });
      const { accountId, journeyId } = await keepJourney(
        email,
        kindOf(form),
        answersOf(form),
        form.sensitive === true,
      );
      try {
        const link = await issueLink(accountId, SAVE_LINK_FOR, {
          journeyId,
          news: form.news === true,
        });
        await mailer.send(saveLinkEmail(email, link));
      } catch (error) {
        console.error(String(error));
        return json(502, { error: "mail" });
      }
      return json(202, { ok: true });
    }

    // « Recevoir par e-mail »: the top three by e-mail, and the journey kept so that the button
    // opens the full result. Asking for the e-mail is the request to keep it; the sensitive
    // answers need their own box (operator, 2026-11-17).
    if (method === "POST" && path === "/api/compte/resultats") {
      const email = emailOf(form);
      const result = resultAt(form.link, siteUrl);
      if (!isEmail(email) || !result || !["quick", "deep"].includes(kindOf(form)))
        return json(400, { error: "form" });
      if (form.website) return json(202, { ok: true });
      if (!perConnection(connection, now()) || !perAddress(email, now()))
        return json(429, { error: "slow-down" });
      const sensitive = form.sensitive === true;
      const { accountId, journeyId } = await keepJourney(
        email,
        kindOf(form),
        answersOf(form),
        sensitive,
      );
      try {
        const link = await issueLink(accountId, RESULTS_LINK_FOR, {
          journeyId,
          news: form.news === true,
          toResults: true,
        });
        await mailer.send(
          resultsEmail(email, result, String(form.link), siteUrl, undefined, {
            link,
            sensitiveLeftOut: !sensitive,
          }),
        );
      } catch (error) {
        console.error(String(error));
        return json(502, { error: "mail" });
      }
      return json(202, { ok: true });
    }

    if (method === "POST" && path === "/api/compte/lien") {
      const email = emailOf(form);
      if (!isEmail(email)) return json(400, { error: "form" });
      if (!perConnection(connection, now()) || !perAddress(email, now()))
        return json(429, { error: "slow-down" });
      const existing = (
        await db.query<{ id: string }>("select id from accounts where email = $1", [email])
      ).rows[0]?.id;
      // An admin address gets its space on first login: /admin would be unreachable otherwise.
      const accountId = existing ?? (adminAddresses.has(email) ? await accountFor(email) : null);
      // The same answer whether the address has a space or not, and as fast: the mail goes out
      // after the answer, or waiting for it would tell who uses Là-bas.
      if (accountId) {
        const link = await issueLink(accountId, LOGIN_LINK_FOR, { back: backOf(form.back) });
        mailer.send(loginLinkEmail(email, link)).catch((error) => console.error(String(error)));
      }
      return json(202, { ok: true });
    }

    if (method === "GET" && path === "/api/compte/connexion") {
      const { rows } = await db.query<{
        account_id: string;
        journey_id: string | null;
        reaction_id: string | null;
        news: boolean;
        back: string | null;
      }>(
        `update login_links set used_at = $2
         where token_hash = $1 and used_at is null and expires_at > $2
         returning account_id, journey_id, reaction_id, news, back`,
        [hash(request.query.get("t") ?? ""), at()],
      );
      const link = rows[0];
      // A used or old button still leads a reader who is signed in on this browser to their space.
      if (!link) return redirect((await member(request)) ? "/espace/" : "/espace/lien-expire/");
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
      if (link.reaction_id)
        await db.query(
          "update reactions set published_at = coalesce(published_at, $2) where id = $1",
          [link.reaction_id, at()],
        );
      if (link.news) await mailer.addToList(account.email).catch((e) => console.error(String(e)));
      const session = token();
      await db.query(
        "insert into sessions (token_hash, account_id, expires_at) values ($1, $2, $3)",
        [hash(session), link.account_id, at(SESSION_FOR)],
      );
      const landing = link.back
        ? link.back
        : link.journey_id && request.query.get("vers") === "resultats"
          ? `/espace/?ouvrir=${link.journey_id}`
          : "/espace/";
      return redirect(landing, { "set-cookie": sessionCookie(session, SESSION_FOR / 1000) });
    }

    if (path === "/api/compte/reactions" && method === "GET") {
      // Without a city: the newest reviews of every city, for /avis.
      const city = request.query.get("ville");
      if (city !== null && !CITIES.some((c) => c.slug === city))
        return json(400, { error: "form" });
      const reader = await member(request);
      const { rows } = await db.query<ReactionRow>(
        `select ${reactionColumns} from reactions
         where ($1::text is null or city = $1) and parent_id is null
           and published_at is not null and reports < $2 and not hidden
         order by published_at desc, seq desc limit $3`,
        [city, REPORTS_TO_HIDE, LATEST],
      );
      return json(200, { total: rows.length, reactions: await threadsOf(rows, reader?.id) });
    }

    // Someone signed in publishes at once; anyone else confirms the address once, by e-mail,
    // and the link that publishes also signs them in (operator, 2026-11-18).
    if (path === "/api/compte/reactions" && method === "POST") {
      // A reply lives on the city of the review it answers, whatever the form says.
      const parent = form.replyTo === undefined ? null : await reviewToAnswer(form.replyTo);
      if (parent === undefined) return json(400, { error: "form" });
      const city = CITIES.find((c) => c.slug === (parent ? parent.city : form.city));
      const text = String(form.text ?? "").trim();
      const name = String(form.name ?? "").trim() || null;
      const reader = await member(request);
      const email = emailOf(form);
      if (
        !city ||
        !text ||
        text.length > REACTION_MAX ||
        (name && name.length > NAME_MAX) ||
        (!reader && !isEmail(email))
      )
        return json(400, { error: "form" });
      if (form.website) return json(202, { published: false });
      if (!perConnection(connection, now()) || (!reader && !perAddress(email, now())))
        return json(429, { error: "slow-down" });
      // The top three and the temperament are public unless the reader keeps them back
      // (operator, 2026-11-18). Both are recomputed from a result link of this site, so no typed
      // text poses as one and no other answer travels.
      // A reply carries no journey: it answers a person, it does not present a result.
      const result = form.private === true || parent ? null : resultAt(form.link, siteUrl);
      const top =
        result?.cities
          .slice(0, TOP_THREE)
          .map((c) => ({ slug: c.city.slug, name: c.city.name, percent: c.percent })) ?? null;
      const profile = result?.archetype
        ? { name: result.archetype.name, traits: result.archetype.traits }
        : null;
      const accountId = reader ? reader.id : await accountFor(email);
      const { rows } = await db.query<ReactionRow>(
        `insert into reactions
           (account_id, city, text, name, top, profile, parent_id, mention, created_at, published_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning ${reactionColumns}`,
        [
          accountId,
          city.slug,
          text,
          name,
          top && JSON.stringify(top),
          profile && JSON.stringify(profile),
          parent ? (parent.parent_id ?? parent.id) : null,
          parent?.parent_id ? displayName(parent) : null,
          at(),
          reader ? at() : null,
        ],
      );
      if (reader)
        return json(201, { published: true, reaction: publicReaction(rows[0], reader.id) });
      try {
        const link = await issueLink(accountId, UNCONFIRMED_FOR, {
          reactionId: rows[0].id,
          back: backOf(form.back),
        });
        await mailer.send(reactionLinkEmail(email, link, city.name));
      } catch (error) {
        console.error(String(error));
        return json(502, { error: "mail" });
      }
      return json(202, { published: false });
    }

    // The feedback tab (operator, 2026-11-18): kept for /admin and mailed to the team, never to
    // the reader. Kept first, so a failing mail service loses nothing.
    if (method === "POST" && path === "/api/compte/messages") {
      const kind = FEEDBACK_KINDS.find((k) => k === form.kind);
      const text = String(form.text ?? "").trim();
      const email = emailOf(form) || null;
      if (!kind || !text || text.length > MESSAGE_MAX || (email && !isEmail(email)))
        return json(400, { error: "form" });
      if (form.website) return json(202, { ok: true });
      if (!messagesPerConnection(connection, now()) || (email && !messagesPerAddress(email, now())))
        return json(429, { error: "slow-down" });
      const page = backOf(form.page);
      await db.query(
        "insert into messages (kind, text, page, email, created_at) values ($1, $2, $3, $4, $5)",
        [kind, text, page, email, at()],
      );
      if (team)
        await mailer
          .send(teamMessageEmail(team, { kind, text, page, email }))
          .catch((error) => console.error(String(error)));
      return json(202, { ok: true });
    }

    const reader = await member(request);
    if (!reader) return json(401, { error: "login" });

    // Signed in only: connections are too cheap to count, a confirmed address is not.
    const reported = idIn(path, "/api/compte/reactions/", "/signaler");
    if (reported && method === "POST") {
      if (!(await reviewToAnswer(reported))) return json(404, { error: "not-found" });
      const { rows } = await db.query(
        `insert into reaction_reports (reaction_id, account_id) values ($1, $2)
         on conflict do nothing returning reaction_id`,
        [reported, reader.id],
      );
      if (rows.length)
        await db.query("update reactions set reports = reports + 1 where id = $1", [reported]);
      return json(202, { ok: true });
    }

    // /admin: every published review and reply, for the operator only, never a reviewer's
    // address; and the feedback tab's messages.
    if (path === "/api/compte/admin" || path.startsWith("/api/compte/admin/")) {
      if (!adminAddresses.has(reader.email.toLowerCase())) return json(403, { error: "admin" });

      if (method === "GET" && path === "/api/compte/admin") {
        const { rows } = await db.query<ReactionRow & { reports: number; hidden: boolean }>(
          `select ${reactionColumns}, reports, hidden from reactions
           where published_at is not null order by published_at desc, seq desc`,
        );
        const marks = await marksOf(
          rows.map((r) => r.id),
          undefined,
        );
        // The operator's own inbox: the address is there because the reader gave it for an answer.
        const { rows: messages } = await db.query<MessageRow>(
          "select id, kind, text, page, email, created_at from messages order by created_at desc, seq desc",
        );
        return json(200, {
          messages: messages.map((m) => ({
            id: m.id,
            kind: m.kind,
            text: m.text,
            page: m.page,
            email: m.email,
            createdAt: iso(m.created_at),
          })),
          reviews: rows.map((r) => ({
            id: r.id,
            city: r.city,
            name: displayName(r),
            text: r.text,
            createdAt: iso(r.published_at ?? r.created_at),
            reports: r.reports,
            hidden: r.hidden || r.reports >= REPORTS_TO_HIDE,
            replyTo: r.parent_id,
            mention: r.mention,
            marks: marks.get(r.id)!.counts,
          })),
        });
      }

      if (method === "GET" && path === "/api/compte/admin/stats") {
        if (!stats) return json(503, { error: "no-stats" });
        try {
          return json(200, await stats());
        } catch (error) {
          console.error(String(error));
          return json(502, { error: "stats" });
        }
      }

      const message = idIn(path, "/api/compte/admin/messages/");
      if (message && method === "DELETE") {
        const { rows } = await db.query("delete from messages where id = $1 returning id", [
          message,
        ]);
        return rows.length ? json(200, { ok: true }) : json(404, { error: "not-found" });
      }

      const target = idIn(path, "/api/compte/admin/reactions/");
      if (target && method === "DELETE") {
        const { rows } = await db.query("delete from reactions where id = $1 returning id", [
          target,
        ]);
        return rows.length ? json(200, { ok: true }) : json(404, { error: "not-found" });
      }
      if (target && method === "POST") {
        // « rétablir » also forgets the reports: the operator has read it and keeps it.
        const change = {
          masquer: "hidden = true",
          retablir: "hidden = false, reports = 0",
        }[String(form.action)];
        if (!change) return json(400, { error: "form" });
        const { rows } = await db.query(
          `update reactions set ${change} where id = $1 returning id`,
          [target],
        );
        // Forgetting the reports forgets who made them: the count and its readers go together.
        if (rows.length && form.action === "retablir")
          await db.query("delete from reaction_reports where reaction_id = $1", [target]);
        return rows.length ? json(200, { ok: true }) : json(404, { error: "not-found" });
      }
      return json(404, { error: "not-found" });
    }

    // A tap on a mark puts it, a second tap takes it back.
    const marked = idIn(path, "/api/compte/reactions/", "/marques");
    if (marked && method === "POST") {
      const mark = String(form.mark ?? "");
      if (!MARK_KEYS.includes(mark)) return json(400, { error: "form" });
      if (!(await reviewToAnswer(marked))) return json(404, { error: "not-found" });
      if (!perMark(reader.id, now())) return json(429, { error: "slow-down" });
      const { rows } = await db.query(
        `delete from reaction_marks where reaction_id = $1 and account_id = $2 and mark = $3
         returning mark`,
        [marked, reader.id, mark],
      );
      if (!rows.length)
        await db.query(
          "insert into reaction_marks (reaction_id, account_id, mark) values ($1, $2, $3)",
          [marked, reader.id, mark],
        );
      const marks = (await marksOf([marked], reader.id)).get(marked)!;
      return json(200, { marks: marks.counts, mine: marks.mine });
    }

    const reaction = idIn(path, "/api/compte/reactions/");
    if (reaction && method === "DELETE") {
      const { rows } = await db.query(
        "delete from reactions where id = $1 and account_id = $2 returning id",
        [reaction, reader.id],
      );
      return rows.length ? json(200, { ok: true }) : json(404, { error: "not-found" });
    }

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
        {
          email: reader.email,
          exportedAt: at(),
          journeys: await journeysOf(reader.id),
          reactions: await reactionsOf(reader.id),
          marks: (
            await db.query<{ reaction_id: string; mark: string }>(
              "select reaction_id, mark from reaction_marks where account_id = $1 order by mark",
              [reader.id],
            )
          ).rows.map((m) => ({ reaction: m.reaction_id, mark: m.mark })),
          reports: (
            await db.query<{ reaction_id: string }>(
              "select reaction_id from reaction_reports where account_id = $1 order by reaction_id",
              [reader.id],
            )
          ).rows.map((r) => ({ reaction: r.reaction_id })),
        },
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
      const sensitive = form.sensitive === true;
      const answers = keptOf(cleanAnswers(form.answers), sensitive);
      const { rows } = await db.query<{ id: string }>(
        `insert into journeys (account_id, kind, answers, sensitive, created_at, updated_at, confirmed_at)
         values ($1, $2, $3, $4, $5, $5, $5) returning id`,
        [reader.id, form.kind, JSON.stringify(answers), sensitive, at()],
      );
      return json(201, { id: rows[0].id });
    }

    const one = idIn(path, "/api/compte/parcours/");
    if (one && method === "PUT") {
      // The journey keeps the choice made when it was saved: a later answer cannot widen it.
      const { rows } = await db.query<{ sensitive: boolean }>(
        "select sensitive from journeys where id = $1 and account_id = $2 and confirmed_at is not null",
        [one, reader.id],
      );
      if (!rows[0]) return json(404, { error: "not-found" });
      const answers = keptOf(cleanAnswers(form.answers), rows[0].sensitive);
      await db.query("update journeys set answers = $2, updated_at = $3 where id = $1", [
        one,
        JSON.stringify(answers),
        at(),
      ]);
      return json(200, { ok: true });
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
