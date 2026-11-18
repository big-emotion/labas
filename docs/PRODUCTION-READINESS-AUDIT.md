# Production-readiness audit — Là-bas

Date: 2026-11-18 · Commit audited: `1445f59` (`main`, v0.22.0) · Skill: `labas-audit` v2.0.0

## 1. Scope and method

Read-only audit of the repository at `origin/main` (`git fetch`: not behind), plus read-only reads
of GitHub (runs, jobs, branch protection) and of production (`curl -sI` on `https://labas.africa/`
and `/api/compte`). Nothing was fixed, pushed or deployed.

**Measured this run**

- `make check` on Node 24.22.3 (`nvm use`, after `npm ci`): green in 207 s — 38 test files,
  **389 tests**, 129 pages built, `astro check` 0 errors / 0 warnings / 0 hints.
  `npm run build:server`: green (`dist-server/subscribe.mjs`, 2.2 MB). A separate
  `npx vitest run src/server` passed 96 / 96, after one PGlite `beforeEach` failure on a first run
  under load (`accounts.test.ts:39`), so that file may be flaky.
- CI: the last 5 `ci.yml` runs on `main` are green. Run `44322034365` (`1445f59`) has jobs `check`,
  `image` and `gitleaks`, all `success`.
- Deploy: runs `44322242816` (v0.22.0), `44302406511` (v0.21.0) and `44058926557` (v0.20.0) are
  all `success`, and the v0.22.0 « Smoke check » step is `success`.
- Branch protection on `main` (API): PR required; required checks `check`, `image`, `gitleaks`;
  `enforce_admins: true`; force-push and deletion off; `strict: false`.
- Measured directly: live headers, the hosts the built site uses (`grep` over `dist`), outbound
  calls, secrets and `.gitignore` (`git check-ignore -v`), pins, `npm audit`, and the
  hardcoded-values, knip and jscpd scans.
- Delegated to two read-only sub-audits: the service routes and the eight data checks. Their
  findings were re-read in the code before scoring. The crash path and the consent bypass in §6
  were verified by hand.

**`N/A`, with the reason — none counted as a pass**

- **Postgres backups**: the repository holds one paragraph (`docs/deploy.md:122-124`) and no
  script, schedule or restore drill. Whether a dump runs on the host cannot be read from here.
- **Trust of `x-real-ip`**: both limiters key on it (`subscribe.ts:160`, `accounts.ts:442`).
  Whether Traefik overwrites a client-sent value depends on its entrypoint configuration, which is
  outside the repository.
- **Live mobile and accessibility checks** (430 / 768 / 1440 px): not run.
- **Which Plausible instance is live**: the CSP and `analytics.ts:10` name `stats.big-emotion.com`,
  while `deploy.md:133` and `plausible.ts:10` name `stats.ethniafrica.com` for the Stats API.
  Whether these are one instance under two names is not readable from the repository.
- **knip**: run in production mode, but with no knip configuration it cannot see the
  `build:server` entry or the scripts. Its false positives (`src/server/accounts.ts`, `emails.ts`,
  `news.ts`, `pg`, the self-hosted fonts, `src/lib/carousel.ts` used by `scripts/social.ts`,
  `resultAt`, `plausibleStats`) were checked by hand and not counted.

**Previous report**: 2026-11-16, v0.14.0, **7.7 / 10**. Since then eight releases (v0.15 to
v0.22) added public reactions, `/avis`, `/villes` and `/admin`, all new routes in the service.

## 2. The five questions

1. **Ready for real readers? — No.** Three blockers:
   - **One unauthenticated request crashes the service.**
     `POST /api/compte/reactions/<36 hyphens>/signaler` passes the route's
     `[0-9a-f-]{36}` (`accounts.ts:657`), Postgres rejects the value as a `uuid` (`:85`), and
     `handle()` is awaited with no try/catch (`subscribe.ts:367`) and no `unhandledRejection`
     handler anywhere in `src/server`. The route has no rate limit. Each crash also resets the
     in-memory mail limits, lifting the 3-a-day cap per address.
   - **Sensitive answers are stored without their box.** `POST /api/compte/parcours`
     (`accounts.ts:801-806`) and `PUT /api/compte/parcours/:id` (`:812-816`) store answers through
     `cleanAnswers` only, never `withoutSensitive`. The signed-in « Reprendre plus tard »
     (`account-dom.ts:89`) and the tab sync after « Reprendre » (`account-dom.ts:53`) therefore
     keep origin, faith, health and the same-sex-law filter with no box ticked. This breaks
     `confidentialite.astro:35,46` and `docs/accounts.md:20-23`, and no test covers it.
   - **Backups are not evidenced while saved journeys and public reactions are live.**
     `HEAD /api/compte` answers 403 from the Origin check, not the 503 of a closed module.
2. **Is the data honest? — Seven of eight checks pass; check 3 still fails, so Domain 8 is capped
   at 4.** The gap shrank from 21 unsourced safety or conflict remarks to **5** (Khartoum,
   Port-Soudan, Antananarivo, Conakry, Bissau). A test now guards the rest (`cities.test.ts:95-110`),
   but its `SENSITIVE_REMARK` pattern misses « guerre », « instabilit » and « délinquan ».
   **354 of 1 840** scores are `editorial` (**19.2 %**), which is debt, not failure.
3. **Clone → running in one session? — Yes.** `README.md:81-123` walks through `nvm use`,
   `npm install`, `npm run dev`, `make check`, `npm run build:server` and the service tests
   against PGlite. No database and no Microsoft 365 secret are needed. No undocumented step came up.
4. **Security and privacy posture?** The browser side is strong and the service has regressed.
   Production serves HSTS, a strict CSP (`script-src 'self'` plus the Plausible collector),
   `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and `Permissions-Policy`, and no longer
   names the nginx version. The built site loads from no other host, and reaction text is rendered
   with `textContent`. The service checks Origin on every non-GET request, hashes tokens, signs
   news links with `timingSafeEqual`, and sets `HttpOnly; Secure; SameSite=Lax`. Its lifetimes
   agree three ways and `purge()` enforces them under test. `labas-db` sits on an internal network
   with no published port. **Against that:** the crash route (P0), the consent bypass on the
   journey routes (P0) and the unevidenced backups (P0). Secrets and supply chain are now clean:
   `.env*` is ignored, Actions are pinned by SHA, images by digest, and Dependabot covers four
   ecosystems. `main` is protected with the three jobs required and admins included.
5. **Close to 8–9 / 10? — 7.5.** Three actions close the gap. First, validate ids as UUID, catch
   in `handle()` and throttle `signaler`. Second, strip sensitive answers on `/parcours` unless the
   journey carries its own consent, with a test. Together these take Domain 2 from 4 to 8
   (+0.4). Third, source the 5 `watch` remarks and widen `SENSITIVE_REMARK`, which takes
   Domain 8 from 4 to 9 (+0.5). With the backups evidenced as well, the measured score is about 8.5.

## 3. Overall score

**7.5 / 10** (was 7.7) — the gates, supply chain and data sourcing all improved, but the new
reactions and journey routes shipped one remote crash and one broken consent promise.

## 4. Score per domain

| #   | Domain                        | Score | Evidence                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ----------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Static site & browser privacy | 9     | `curl -sI`: every header served, `server: nginx` without a version. `dist`: only `labas.africa` canonicals load, everything else is an outbound `<a>`. No `fonts.googleapis`, no `document.cookie`. Browser calls: `Newsletter.astro:134`, `desinscription.astro:50`, `keep-dom.ts:101`, `account-dom.ts:16`, all first-party. P2: `style-src 'unsafe-inline'`, HSTS without `preload`.       |
| 2   | Service & personal data       | 4     | Strong base (§8), but **three P0s**: the crash on `signaler`, sensitive answers stored on `/parcours` without the box, and backups `N/A` while live. P2: a timing gap on the login link, limiters never pruned, `consent_at` stamped on accounts opened by a reaction (`accounts.ts:291-296`).                                                                                                |
| 3   | Secrets & public-repo hygiene | 10    | No `.env*` tracked, token grep empty, `.gitignore:17` `.env*` (checked with `git check-ignore -v` on `.env.local` / `.env.subscribe` / `.env.development`), `dist-server/` and `.claude/worktrees/` ignored. gitleaks is required and green. Infra-disclosure exits 0. The only path hits are `docs/deploy.md` and a URL.                                                                     |
| 4   | CI & change management        | 9     | All jobs green, three required checks, admins enforced. Actions pinned by SHA (`ci.yml:12,13,24,76`, `deploy-production.yml:30,34`), images by digest, `.github/dependabot.yml` covers actions, npm, docker and compose. Husky `pre-commit` / `commit-msg`, commitlint, lint-staged. P2: `postgres:17-alpine` by tag in `ci.yml:38`; `strict: false`.                                         |
| 5   | Correctness & tests           | 8     | `make check` green, 389 tests; engine tests `ranking.test.ts:213-250`; handlers tested against PGlite; no `.skip` / `.only`. −1 for 13 production-dead exports (Step 3.7). No test covers the two P0 paths (counted in Domain 2). `npm audit`: 19 high / 8 moderate, of which 10 high under `--omit=dev`, all one picomatch ReDoS through `astro`'s build chain, not shipped at runtime (P2). |
| 6   | Deploy & release              | 9     | `v0.22.0` = `package.json` 0.22.0 = `CHANGELOG.md:9`. The last 3 deploys are green with the smoke check passing. Rollback: `docs/deploy.md:143`, `workflow_dispatch` at `deploy-production.yml:9`. `image` is required before a tag ships. P2: `engines` `>=22.23.4` vs Node 24 in `.nvmrc` / Dockerfile (explained in `README.md:81`).                                                       |
| 7   | Architecture & boundaries     | 7     | KISS holds: one service, ranking entirely in the browser, the data / lib / `*-dom.ts` split. 9 − 1 for 7 hardcoded-value P1 (Step 3.5), − 1 for 13 dead-code P1 (Step 3.7), no overlap between the two.                                                                                                                                                                                       |
| 8   | Data honesty                  | 4     | Check 3 fails, so the cap of 4 applies (Step 3.6). The seven other checks pass.                                                                                                                                                                                                                                                                                                               |
| 9   | Reader experience             | 8     | « vous » pinned by tests; the map names the top three from the third answer (`index.astro:365`); `aria-pressed` in `index.astro` (18), `approfondir.astro` (5), `ville/[slug].astro` (3), `choices-dom.ts`, `reactions-dom.ts`, `Reactions.astro`; « gratuit » / « payant » absent from pages and components. Live mobile and accessibility checks `N/A`.                                     |
| 10  | Docs & newcomer flow          | 7     | README newcomer path complete, `deploy.md` matches the workflows, `accounts.md` documents reactions, avis and admin. Several P2 disagreements (§6), including two in this skill.                                                                                                                                                                                                              |

**Mean: 75 / 10 = 7.5.** Against 2026-11-16 (7.7): Secrets 8 → 10 (`.env*` ignored), CI 8 → 9
(SHA pins, Dependabot), Data honesty stays at 4 (21 → 5 unsourced remarks, but the cap is binary).
**Service 6 → 4**: two new P0s in the routes added since v0.14.0. **Architecture 8 → 7**: knip ran
this time (it was `N/A`) and measured 13 unused exports where the manual scan found 2.
**Correctness 9 → 8**: the same dead-code count. **Docs 8 → 7**: new drift around the new features.

## 5. Strengths

- Every gate is an outcome: three required jobs, all green, admins included; the deploy is a tag
  and a smoke check.
- Last audit's hygiene list is closed: `.env*` ignored, every Action pinned by SHA, images by
  digest, Dependabot on four ecosystems, `server_tokens off` served live.
- The CI `image` job tests the real containers: headers served, 503 without secrets, a real
  Postgres migrated, nginx config valid.
- Data sourcing advanced: 1 486 scores with a dated https source, every country remark sourced,
  `watchSources` added and guarded by a test, unsourced safety remarks down from 21 to 5.
- Reactions are well built for privacy: no address or account id in the public payload, top three
  and temperament recomputed and withheld on request (`reactions.test.ts:164-197`), hearts as
  counts only, `textContent` everywhere.
- The engine rule « every answer orients the list » is pinned by seven named tests
  (`ranking.test.ts:213-250`).

## 6. Gaps and risks

**P0**

- **Remote crash on demand** — `accounts.ts:657`: `[0-9a-f-]{36}` lets a non-UUID reach
  `update reactions … where id = $1` on a `uuid` column (`:85`). Postgres throws, and the throw is
  unhandled because `subscribe.ts:367` awaits `handle()` without a try/catch. The route needs no
  session and has no limit, only a dedupe on (id, connection). The same loose pattern guards
  `:706`, `:750` and `:811`, which a signed-in reader or admin can also hit. A crash loop wipes
  the in-memory limiters (`subscribe.ts:110`, `accounts.ts:203`), so the per-address mail cap
  stops holding. Fix: test against the existing `UUID` (`:238`) on every `:id` route, wrap
  `handle()` and answer 500, throttle `signaler`, and add tests.
- **Sensitive answers stored without their box** — `POST /api/compte/parcours`
  (`accounts.ts:801-806`) and `PUT /api/compte/parcours/:id` (`:812-816`) apply `cleanAnswers`
  but not `withoutSensitive` (used only at `:480`). The browser calls them from the signed-in
  « Reprendre plus tard » (`account-dom.ts:89`) and from every answer after « Reprendre »
  (`syncJourney`, `account-dom.ts:47-55`), including on an account opened only to post a reaction.
  The privacy page promises the opposite (`confidentialite.astro:35,46`), so does
  `docs/accounts.md:20-23`, and no test covers it. Fix: store a per-journey sensitive consent,
  strip sensitive answers without it, and test both routes.
- **Backups not evidenced while saved journeys and reactions are live** — `docs/deploy.md:122-124`
  makes a daily off-server `pg_dump` a precondition. Nothing in the repository schedules, verifies
  or restores it.
- **5 safety / conflict `watch` remarks without a source** (Data honesty check 3, counted in
  Domain 8): Khartoum, Port-Soudan, Antananarivo, Conakry and Bissau have no `watchSources`. They
  get past `cities.test.ts:96` because `SENSITIVE_REMARK` has no `guerre`, `instabilit` or
  `délinquan`. Seven political or harassment remarks are borderline: Lomé, Malabo, Bata, Asmara,
  Massaoua, Nosy Be, Le Caire.

**P1**

- **One person can hide any review** — three reports from different connections hide a reaction
  (`docs/accounts.md:63`). `signaler` needs no session, and the connection key is `x-real-ip`,
  so three addresses from one IPv6 /64 are enough. The `reportedBy` Set (`accounts.ts:273`) is
  never pruned.
- **Per-connection key from a header** (`subscribe.ts:160`, `accounts.ts:442`): safe only if
  Traefik overwrites a client-sent `X-Real-IP` (`N/A` from the repository). The per-address limit
  holds regardless, until a crash resets it (P0 above).

**P2**

- « Recevoir mon lien de connexion » awaits the Graph send for a known address (`accounts.ts:514`)
  and answers at once for an unknown one. The timing gap shows who has a space
  (`docs/accounts.md:27`). `admin.test.ts:67-78` counts mails but does not compare the answers.
- `consent_at` is stamped on accounts opened by a reaction or an admin login
  (`accounts.ts:291-296`), where no consent was asked.
- No test erases reactions or marks through the 3-year `purge()` (the FK cascade at `:87` is
  untested), and no limit is stated for hidden reactions.
- The CI `image` job checks 4 tables (`ci.yml:47`), not `reactions`, `reaction_marks` or
  `news_subscribers`.
- Display names are not checked against impersonation (« Utilisateur 1234 », « Là-bas »;
  `accounts.ts:598,605`).
- `npm audit`: picomatch ReDoS through `astro` (build-time only). npm's « fix » is a downgrade to
  astro 5.3. Track it through Dependabot.
- `@eslint/js` sits in `dependencies`, not `devDependencies`. It is not shipped, since the service
  is bundled.
- `postgres:17-alpine` is pulled by tag in `ci.yml:38`; branch protection is `strict: false`;
  HSTS has no `preload`; `style-src 'unsafe-inline'`.
- Drift:
  - `deploy/docker-compose.yml:32-33` says Traefik sends the service `/api/nouveautes` and
    `/api/resultats`, but the rule at `:46` also routes `/api/compte`.
  - The news-address retention is « last confirmation » in `docs/accounts.md:127` and
    « inscription » in `confidentialite.astro:170-171`.
  - `CLAUDE.md` says reaction events carry « the place and the city slug only », but
    `analytics.ts:117` also sends `statut` (which `docs/accounts.md:66-69` documents).
  - Plausible has two host names (§1).
  - `engines` `>=22.23.4` against Node 24.
- **This skill vs the repository** (Domain 10):
  - The skill's list of allowed browser calls leaves out `/api/nouveautes/desinscrire`
    (`desinscription.astro:50`) and the reaction posts that signed-out readers send.
  - Step 3.7 does not tell knip that `src/server/subscribe.ts` and `scripts/social.ts` are entries,
    so a bare run reports the whole service as unused.

### Hardcoded values (P0/P1)

Colour literals (all four unchanged since the last audit):

- **P1** `src/pages/index.astro:652` — `rgba(241, 240, 255, 0.08)` — `--thread` at 8 %, written out.
- **P1** `src/pages/index.astro:794` — `rgba(255, 182, 39, 0.5)` — `--saffron` at 50 %, written out.
- **P1** `src/pages/index.astro:940` — `rgb(8 10 40 / 0.55)` — an overlay outside the tokens.
- **P1** `src/pages/espace/index.astro:472` — `rgb(8 10 40 / 0.7)` — an overlay outside the tokens.
- Admissible: `share-card.ts` (satori) and `theme-color` `#161a5c` (`index.astro:39`,
  `Page.astro:24`, equal to `--night`).

Hosts & URLs:

- **P1** `labas.africa` is written three times: `share.ts:4` (`SITE`), `shared-result.ts:27`
  (`SITE` again), and `subscribe.ts:304` (the `SITE_URL` default).

Size & truncation:

- **P1** the « top three » is a literal in six places: `adaptive.ts:5` (`TOP = 3`),
  `ranking.ts:859`, `index.astro:365`, `approfondir.astro:131`, `share-image.ts:81` and
  `accounts.ts:619` (each a `slice(0, 3)`).

Engine weights & thresholds:

- **P1** `src/lib/fit.ts:342,388` — the reception values `0 / 0.5 / 1` are unnamed, yet they carry
  a product promise.

Total: 0 P0 and 7 P1, which takes 1 off Domain 7. P2 (in chat only): `DAY` re-derived in
`reactions.ts:46` and `subscribe.ts:346`; the Graph host written twice (`subscribe.ts:260,272`);
the default reply-to address (`subscribe.ts:305`).

### Dead code & redundancy

knip `--production` (false positives excluded, §1) and jscpd (27 clones, 335 lines, 1.57 %):

- **P1** 13 unused exports, each referenced only inside its own file:
  - `cities.ts`: `POPULATION_LABELS`, `slugOf`, `isAdvisedAgainst`
  - `filters.ts`: `activeFilterCount`
  - `fit.ts`: `fingerprint`, `tensionFor`
  - `newsletter.ts`: `NEWS_AFTER`
  - `ranking.ts`: `TEMPERAMENT_KEYS`, `profileOf`
  - `holiday.ts`: `ACTIVITY_TAGS`, `HOLIDAYS`
  - `routes.ts` / `week-pick.ts`: `jobOf` (exported twice)
  - `share.ts`: `absoluteUrl`

  (`cards-dom.ts` helpers and `city-temperament.ts` exports are also reported; they are listed with
  the P2s below.)

- **P2** A form block of 34–36 lines is duplicated between `KeepResults.astro:170-203` and
  `Newsletter.astro:195-230` (CSS, 2 files).
- **P2** Smaller clones: `accounts.ts:202-210`, `:449-471`; `filters.ts:100-106` / `:133-138`.
- **P2** 8 unused exported types; `cards-dom.ts` (`percent`, `clone`, `setText`, `fillList`,
  `detailFor`) and `city-temperament.ts` (3) exported but used only inside their own file.

0 P0 and 13 P1, which takes 1 off Domains 5 and 7. No hotspot shows in both scans.

## 7. Newcomer flow

`git clone` → `nvm use` (Node 24) → `npm install` → `npm run dev` (`http://localhost:4321`) →
`make check` (207 s here) → `npm run build:server`. The service's tests run in `npm test` against
PGlite. It is documented end to end in `README.md:81-123`, and every command named exists in
`package.json` or the `Makefile`. No undocumented step came up.

## 8. Security and privacy posture

**Static site.** The live headers are as in §2. CSP `connect-src` allows `'self'` and
`stats.big-emotion.com`. Browser calls are all first-party; Plausible loads only when
`PUBLIC_PLAUSIBLE_DOMAIN` is set (`analytics.ts`, `NEVER_SENT` built from `SENSITIVE_ANSWERS`).
No cookie is set by the static site; the only cookie is the service's `labas_session`.

**Service, route by route.**

- Origin check: on every non-GET request (`accounts.ts:439`) and on the news routes
  (`subscribe.ts:151,210`).
- Tokens: stored as SHA-256 (`accounts.ts:172-174`). News links are HMAC-signed and compared with
  `timingSafeEqual` (`subscribe.ts:70-98`). The cookie is `HttpOnly; Secure; SameSite=Lax`
  (`accounts.ts:186-187`).
- Admin: the `ADMIN_EMAILS` list, checked after the session (`:664-669`). Tested: 401, 403, 200,
  and shut when the list is empty (`admin.test.ts:59-86`).
- Throttles: every route that mails a typed address is limited per connection and per address
  (`subscribe.ts:161-162`; `accounts.ts:452,477,504,610`). Marks: 120 / hour.
- Reactions: the public payload holds no address or account id (`:335-347`), and reaction text is
  rendered with `textContent` (`reactions-dom.ts:236-253`).
- Gaps: the P0 crash, the P0 consent bypass on `/parcours`, and the P1 report abuse (§6).

**Lifetimes, three-way** — code, docs and privacy page agree. Enforcement:

| What                          | `accounts.ts` / `subscribe.ts` | `docs/accounts.md`         | `confidentialite.astro`  | Enforced / tested                          |
| ----------------------------- | ------------------------------ | -------------------------- | ------------------------ | ------------------------------------------ |
| A space, 3 years              | `accounts.ts:37`               | :125                       | :58                      | `purge` :157, `accounts.test.ts:313`       |
| Unconfirmed account / journey | 7 days, `:39`                  | :123                       | :59-60                   | `purge` :158/:161, test :313               |
| Save link                     | 24 h, `:40`                    | :120                       | :61                      | expiry test :141; row purge :167 untested  |
| Results link                  | 7 days, `:42`                  | :119                       | :61-62                   | test :297                                  |
| Login link                    | 15 min, `:43`                  | :121                       | :60-61                   | test :141                                  |
| Session                       | 30 days, `:44`                 | :122                       | :62, :182                | test :115; row purge :168 untested         |
| Unpublished reaction          | 7 days (`:39`, via :164, :645) | :124                       | :83                      | `reactions.test.ts:265`                    |
| Published reaction            | FK cascade with the space :87  | —                          | :87                      | DELETE tested :255; purge cascade untested |
| News confirmation link        | 7 days, `subscribe.ts:62`      | :126                       | :164                     | `subscribe.test.ts:164`                    |
| News address                  | 3 years, `:169`                | :127 « last confirmation » | :170-171 « inscription » | `news.test.ts:40` — wording differs (P2)   |

**Personal data at rest.** Postgres holds GDPR art. 9 answers, which **can now arrive without
consent** through `/parcours` (P0). It also holds public reactions. There is **no evidenced backup
and no restore drill** (P0). `labas-db` is only on `labas-internal` (`internal: true`, no
published port; `docker-compose.yml:55-69`), and CI asserts the 503 without secrets
(`ci.yml:27-33`).

**Secrets and supply chain.** See Domains 3 and 4. Both are clean apart from P2s.

## 9. Data honesty

| #   | Check                             | Verdict  | Evidence                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Score labels                      | pass     | `{"editorial":354,"measured":94,"sourced":1391,"survey":1}` of 1 840. 0 scores without `confidence`; 0 measured / sourced / survey scores without a dated https source. 19.2 % `editorial` is debt.                                                                                                                  |
| 2   | Editorial never shown as measured | pass     | `ville/[slug].astro:31-36,446` labels every score. Result cards show closeness dots, not raw scores, and are covered by `SourcesNote`. No question « mesure » anything (`methode.astro:26` « ne mesure aucun trait »).                                                                                               |
| 3   | Sensitive remarks sourced         | **fail** | 55 / 55 `sameSexRelations` and 3 / 3 `tensions` entries sourced and dated. **5 safety / conflict `watch` remarks with no `watchSources`**: Khartoum, Port-Soudan, Antananarivo, Conakry, Bissau. The test regex misses them (`cities.test.ts:96`). Cap: 4.                                                           |
| 4   | Travel advice is information      | pass     | All 115 advisories dated (`advisory.ts`); no advisory field in `ranking.ts`, `fit.ts`, `filters.ts`, `adaptive.ts`; `ranking.test.ts:31` keeps Kinshasa in `bestMatches`. Note: `going.ts:32` hides the « Y aller » links for advised-against cities (operator rule); the city itself is neither greyed nor removed. |
| 5   | Every answer orients the list     | pass     | `scoreOf` (`ranking.ts:812-826`), a weighted geometric mean. `ranking.test.ts:213` « each answer orients the list »: `:232` a tie before any answer, `:242` Arabic at the 13th answer turns the top three over, `:250` nothing assumed from a withheld origin.                                                       |
| 6   | Temperament framing               | pass     | `TemperamentProfile.astro:12-13`, `avis.astro:81,182`, `Reactions.astro:166`. The « vous êtes » hits are process phrases (« là où vous vous êtes arrêté », « dites qui vous êtes »), none an archetype claim.                                                                                                        |
| 7   | Quick-quiz lines                  | pass     | 115 / 115 cities with `reputation` (all « On dit » / « On connaît »), `surprise` and dated https sources (`lines.test.ts:12,20,26,37`).                                                                                                                                                                              |
| 8   | Photos                            | pass     | 112 / 112 with a free licence, an author and a Commons source (`photos.test.ts`). 3 cities without a photo: Bo, Buchanan, Teyateyaneng.                                                                                                                                                                              |

One failure, with a cap: **Domain 8 = 4**.

## 10. Prioritised actions

1. **Close the crash route**: `UUID` check on every `:id` route (`accounts.ts:657,706,750,811`),
   a try/catch around `handle()` that answers 500 (`subscribe.ts:367`), a per-connection limit on
   `signaler`, and a test that posts a malformed id. (Domain 2)
2. **Keep the consent promise on `/parcours`**: store a per-journey sensitive consent, apply
   `withoutSensitive` in `POST` / `PUT /api/compte/parcours` without it, ask for the box in the
   signed-in « Reprendre plus tard », and test both routes. (Domain 2)
3. **Source the 5 `watch` remarks** (France Diplomatie / FCDO, dated) and add `guerre`,
   `instabilit` and `délinquan` to `SENSITIVE_REMARK` (`cities.test.ts:96`). (Domain 8: 4 → 9)
4. **Evidence the Postgres backups**: a scheduled off-server `pg_dump` and a restore drill on a
   scratch database, dated in `docs/deploy.md`. (Domain 2)
5. **Make reports harder to abuse**: require a session, or key reports on a /64, and prune
   `reportedBy` and the limiter maps. (Domain 2)
6. **Verify Traefik overwrites `X-Real-IP`**, or key on the address it sets; add a test. (Domain 2)
7. Make « Recevoir mon lien de connexion » answer in the same time whether or not a mail is sent,
   and assert identical answers in `admin.test.ts`. (Domain 2)
8. Test the 3-year purge cascade over reactions and marks; check every table in the CI `image`
   job (`ci.yml:47`). (Domains 2, 4)
9. Delete or un-export the 13 dead exports; share the form CSS of `KeepResults` / `Newsletter`.
   (Domains 5, 7)
10. Replace the four colour literals with `color-mix()` over the tokens; define one `TOP_THREE`;
    import `SITE` in `shared-result.ts` and `subscribe.ts`; name the reception values in `fit.ts`.
    (Domain 7)
11. Fix the drift: the compose comment (`:32-33`), the news-retention wording, the `statut` line in
    `CLAUDE.md`, one Plausible host name, `engines`. (Domain 10)
12. Update this skill: allow `/api/nouveautes/desinscrire` and the signed-out reaction posts in
    the browser-calls list, and give knip its entries (`src/server/subscribe.ts`,
    `scripts/social.ts`). (Domain 10)
13. Pin `postgres:17-alpine` in `ci.yml:38` by digest; consider `strict: true`. (Domain 4)

## 11. Conclusion

At 7.5, Là-bas moved sideways. The hygiene and supply-chain debts are paid (Domains 3 and 4 at 10
and 9), and the unsourced safety remarks fell from 21 to 5. The features shipped since v0.14
(reactions, `/avis`, `/admin`) are careful about what they show, but brought two P0s in the
service. One request can take the whole service down, and two journey routes keep sensitive
answers that the privacy page says need a box. Both are small code fixes with tests. With them,
the five sources and a backup drill, the measured score is about 8.5.
