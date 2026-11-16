# Production-readiness audit — Là-bas

Date: 2026-11-16 · Commit audited: `d6e48bf` (`main`, v0.14.0) · Skill: `labas-audit` v2.0.0

## 1. Scope and method

Read-only audit of the repository at `origin/main`, plus read-only reads of GitHub (runs, branch
protection) and of production (`curl -sI` on `https://labas.africa/`, `/espace/`, `/api/compte`).
Nothing was fixed, pushed or deployed.

**Measured this run**

- `make check` on Node 24.22.3 (`nvm use`): green in 113 s — 30 test files, **280 tests**, 125
  pages built, `astro check` 0 errors / 0 warnings / 64 hints. `npm run build:server`: green.
- CI: last 5 `ci.yml` runs on `main` green; jobs of run `43933543725` (`d6e48bf`): `check`,
  `image`, `gitleaks` all `success`.
- Deploy: runs `43933580021` (v0.14.0), `43896575315` (v0.13.3), `43894532562` (v0.13.2) all
  `success`; the v0.14.0 « Smoke check » step `success`.
- Branch protection on `main` (API): PR required, required checks `check`, `image`, `gitleaks`,
  `enforce_admins: true`, force-push and deletion off, `strict: false`.
- Live headers, built-site hosts, outbound calls, the service's code and tests, `npm audit`, the
  data files (script over `src/data/*.json`), and the hardcoded-values and dead-code scans.

**`N/A`, with the reason — none counted as a pass**

- **Postgres backups**: the repository holds one sentence (`docs/deploy.md:103`) and no script,
  schedule or restore drill; whether a dump runs on the host cannot be read from here.
- **Trust of `x-real-ip`**: the per-connection limit keys on that header; whether Traefik
  overwrites a client-sent value depends on its entrypoint configuration, outside the repository.
- **knip / jscpd** (Step 3.7): the one-shot `npx --yes` download was refused in this environment.
  Replaced by a manual scan of exports and imports; its findings are listed, its blind spots are
  not counted.
- **Live mobile and accessibility checks** (430 / 768 / 1440 px): not run.

**Previous report**: none in `docs/` (the first one, 6.5 / 10 on 2026-11-15 under the 8-domain v1
rubric, was removed in `a9233db`). The two rubrics differ; comparisons below are indicative.

## 2. The five questions

1. **Ready for real readers? — Conditional.** The quiz and the city pages are ready. Two blockers:
   - saved journeys are **live** (`HEAD /api/compte` answers 403 from the accounts module's Origin
     check, not the 503 of a closed module) while **no backup is evidenced** — a P0 by the
     deploy doc's own precondition (`docs/deploy.md:103`);
   - **21 safety and conflict remarks are published with no source of their own** (`watch` in
     `src/data/cities.json`, shown under « À savoir », `src/pages/ville/[slug].astro:174-175`).
2. **Is the data honest? — Seven of eight checks pass; check 3 fails, which caps Domain 8 at 4.**
   0 unlabelled scores, 0 sourced scores without a dated https source (the three `http://`
   sources of the last report are gone), all 8 racism entries and every `sameSexRelations` entry
   sourced, travel advice dated and never ranking. Score labels: 1 391 `sourced`, 94 `measured`,
   1 `survey`, **354 `editorial` (19 %)** — debt, not failure.
3. **Clone → running in one session? — Yes.** `README.md:81-122` walks `nvm use`, `npm install`,
   `npm run dev`, `make check` and the service (`npm run build:server`, its tests in `npm test`
   against PGlite — no database or Mailjet key needed). The only trap met this run: a shell on
   Node 22.14 fails `astro check`; `nvm use` fixes it and the README says so.
4. **Security and privacy posture?** Strong on the browser and the service, with one gap that
   matters. Production serves HSTS, a strict CSP (`script-src 'self'` + the Plausible collector),
   `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and `Permissions-Policy`; the built site
   loads no third-party resource; the never-sent answers and the shared result are pinned by
   tests. The service checks Origin, hashes tokens, signs links with a constant-time compare, sets
   `HttpOnly; Secure; SameSite=Lax`, asks consent before storing GDPR art. 9 answers, does not
   reveal who has a space, throttles every mail-sending route, and keeps Postgres on an internal
   network; its lifetimes agree three ways and `purge()` is tested. Gaps: **backups not
   evidenced (P0)**, `.gitignore` misses `.env.local` / `.env.subscribe` (P1), Actions and images
   pinned by tag with no Dependabot (P1). `main` is protected with the three jobs required and
   admins included.
5. **Close to 8–9 / 10? — 7.7.** The three actions that close it: source the 21 `watch` remarks
   (Domain 8: 4 → 9, +0.5), evidence the backups with a restore drill (Domain 2: 6 → 9, +0.3),
   ignore every `.env*` and pin Actions/images with Dependabot (Domains 3 and 4: +0.2).

## 3. Overall score

**7.7 / 10** — a well-gated, well-tested site whose two remaining blockers are one editorial
sourcing pass and one operational proof (backups), both cheap.

## 4. Score per domain

| #   | Domain                        | Score | Evidence                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Static site & browser privacy | 9     | Live headers complete (`deploy/nginx.conf:16-21`, confirmed by `curl -sI`); built site loads only from itself (one canonical `<link>`, outbound `<a>` only); `analytics.test.ts:58,65`; `shared-result.test.ts:31`; no cookie. P2: `style-src 'unsafe-inline'`, `server: nginx/1.27.5`.                      |
| 2   | Service & personal data       | 6     | Origin `accounts.ts:208`, `subscribe.ts:124`; hashed tokens `accounts.ts:113-114`; HMAC `subscribe.ts:62-71`; cookie `accounts.ts:127`; tests `accounts.test.ts:90,97,139,151,251`, `subscribe.test.ts:116,280`; `labas-db` internal. **P0: backups not evidenced while accounts are live.**                 |
| 3   | Secrets & public-repo hygiene | 8     | No `.env` tracked, token grep empty, gitleaks required and green, infra disclosure green. P1: `.gitignore:17-18` ignores only `.env` and `.env.production` (`git check-ignore` fails on `.env.local`, `.env.subscribe`).                                                                                     |
| 4   | CI & change management        | 8     | Runs and protection above; Husky `pre-commit` / `commit-msg`, `commitlint.config.mjs`, `lint-staged.config.mjs`. P1: 6 `uses:` on `@v4` (`ci.yml:12,13,24,75`, `deploy-production.yml:30,34`), images by tag, no `.github/dependabot.yml`. P2: `strict: false`.                                              |
| 5   | Correctness & tests           | 9     | `make check` green, 280 tests; engine tests in `fit.test.ts:556-600`, `adaptive.test.ts`; handlers tested against PGlite; no `.skip` / `.only`. `npm audit`: 0 high/critical, 9 moderate + 1 low, all dev/build-time (`--omit=dev`: 1 low). Dead code: 2 P1 (below threshold).                               |
| 6   | Deploy & release              | 9     | Tag `v0.14.0` = `package.json` 0.14.0 = `CHANGELOG.md:9`; last 3 deploys green with smoke check; rollback in `docs/deploy.md`; the `image` job is required before a tag ships. P2: `engines` says `>=22.23.4` while `.nvmrc` and the Dockerfile say 24 (explained in `README.md:81`).                        |
| 7   | Architecture & boundaries     | 8     | KISS holds: one server module, ranking entirely in the browser, data / lib / `*-dom.ts` split. 9 − 1 for 7 hardcoded-value P1 (Step 3.5). P2: `limiter`, `HOUR`, `DAY` duplicated in `subscribe.ts:55-56,82` and `accounts.ts:30-32,129`.                                                                    |
| 8   | Data honesty                  | 4     | Check 3 fails → cap at 4 (Step 3.6). The seven other checks pass.                                                                                                                                                                                                                                            |
| 9   | Reader experience             | 8     | « vous » pinned (`questions.test.ts:17`); map lights and names the top three from the third answer (`index.astro:358-370`, `answersBeforeLight`); `aria-pressed` on the chip controls (27 uses across `index.astro`, `approfondir.astro`, `ville/[slug].astro`, `choices-dom.ts`). Live mobile / a11y `N/A`. |
| 10  | Docs & newcomer flow          | 8     | README newcomer path complete; `docs/deploy.md` matches the workflows and compose file; `docs/accounts.md` matches `accounts.ts`. P2 disagreements listed in §6.                                                                                                                                             |

**Mean: 77 / 10 = 7.7.** Against the v1 report (6.5): CI 4 → 8, deploy 6 → 9, secrets 6 → 8,
security 6 → 9 (static site). **Data honesty 8 → 4** dropped because v2 inspects the `watch`
remarks, which v1 never read — the remarks did not get worse, the rubric got stricter.

## 5. Strengths

- Every gate is measured, not configured: three required jobs, all green, admins included.
- The CI `image` job tests the real containers: headers served, 503 without secrets, a real
  Postgres migrated, nginx config valid.
- The privacy contract is code: never-sent answers, shared links without answers, consent before
  art. 9 data, lifetimes enforced by `purge()` under test and identical in code, docs and page.
- Data: 1 486 scores carry a dated https source; every racism and same-sex-law remark is sourced.
- Release discipline: version, tag and changelog agree; every deploy has a smoke check.

## 6. Gaps and risks

**P0**

- **Backups not evidenced while saved journeys are live** — `docs/deploy.md:103` makes a daily
  off-server `pg_dump` a precondition; nothing in the repository schedules, verifies or restores
  it. Live: `HEAD https://labas.africa/api/compte` → 403 (accounts module running).
- **21 safety / conflict remarks without a source** — `src/data/cities.json` `watch` (e.g.
  Mogadiscio « Attentats réguliers dans la ville », Bamako « Insécurité liée aux groupes armés et
  régime militaire », Bangui, Juba, Niamey, Ouagadougou, Ségou, Bobo-Dioulasso). Shown at
  `src/pages/ville/[slug].astro:174-175` and on the result cards (`ResultCards.astro:93`). The
  dated sources exist on each city's `safety` score in `city-scores.json` (e.g. Mogadiscio: France
  Diplomatie; Juba: UK FCDO) but are not attached to the remark, and `cities.test.ts:85` checks only
  the remark's length.

**P1**

- `.gitignore:17-18` — `.env.local`, `.env.subscribe`, `.env.development` are not ignored in a
  public repository agents push to.
- Supply chain — Actions on `@v4` (`ci.yml:12,13,24,75`, `deploy-production.yml:30,34`), images by
  tag (`Dockerfile:3,20,27`, `deploy/docker-compose.yml:56`, gitleaks `ci.yml:78`), no Dependabot.
- Per-connection limit keyed on a header (`subscribe.ts:132`, `accounts.ts:211`): safe only if
  Traefik overwrites a client-sent `X-Real-IP` (`N/A` from the repository). The per-address limit
  holds regardless.

**P2**

- `server: nginx/1.27.5` served live (`server_tokens off;` missing); HSTS without `preload`;
  `style-src 'unsafe-inline'`.
- Branch protection `strict: false` (a PR can merge on a base that moved since its checks ran).
- The limiter is in memory: a restart resets the counts.
- `CLAUDE.md:3` still says « ten chip questions » (the quiz asks 18); `src/lib/adaptive.ts:8-10`
  says the next question reshuffles the « top three » while the code uses the top five
  (`adaptive.ts:64,72`, matching `CLAUDE.md`).
- « gratuit » appears once in route data (`src/data/city-routes.json:3305`, a free horse race) —
  not about the site's price, so outside the rule's intent, noted for the literal reading.

### Hardcoded values (P0/P1)

Colour literals:

- **P1** `src/pages/espace/index.astro:453` — `rgb(8 10 40 / 0.7)` — overlay outside the tokens.
- **P1** `src/pages/index.astro:632` — `rgba(241, 240, 255, 0.08)` — `--thread` at 8 %, written out.
- **P1** `src/pages/index.astro:774` — `rgba(255, 182, 39, 0.5)` — `--saffron` at 50 %, written out.
- **P1** `src/pages/index.astro:920` — `rgb(8 10 40 / 0.55)` — overlay outside the tokens.
- Admissible: `share-card.ts:16-21,254` (satori; values equal `--night`, `--night-deep`,
  `--night-lift`, `--thread`, `--thread-dim`, `--saffron`) and `theme-color` `#161a5c` (= `--night`).

Hosts & URLs:

- **P1** `src/lib/shared-result.ts:27` — `const SITE = "https://labas.africa"` — duplicates the
  exported `SITE` of `src/lib/share.ts:4`.

Size & truncation:

- **P1** the « top three » is defined four times: `adaptive.ts:5` (`TOP = 3`),
  `approfondir.astro:130` (`TOP = 3`), `index.astro:358` (`slice(0, 3)`), `share-image.ts:81`.

Engine weights & thresholds:

- **P1** `src/lib/fit.ts:327,372` — reception values `0 / 0.5 / 1` and the `0.5` anti-Black
  multiplier are unnamed, yet they carry a product promise (pinned by `fit.test.ts:556-600`).

Total: 0 P0, 7 P1 → Domain 7 −1. P2 (in chat only): `ranking.ts:759,765` card counts,
`subscribe.ts:267` re-derives a day, `subscribe.ts:249` default reply-to address.

### Dead code & redundancy

knip / jscpd `N/A` (download refused); manual scan of exports against imports in `src/**`:

- **P1** `src/lib/cities.ts` `POPULATION_LABELS` — exported, referenced nowhere.
- **P1** `src/lib/filters.ts` `activeFilterCount` — exported, referenced nowhere.
- **P2** `limiter` duplicated (`subscribe.ts:82`, `accounts.ts:129`, ~9 lines); about 50 exports
  used only inside their own file or its test (mostly types) could drop `export`.

0 P0, 2 P1 → below the penalty threshold.

## 7. Newcomer flow

`git clone` → `nvm use` (Node 24) → `npm install` → `npm run dev` (`http://localhost:4321`) →
`make check` (113 s here) → `npm run build:server`. The service's tests run in `npm test` against
PGlite. Documented end to end in `README.md:81-122`; no undocumented step met. One trap: running
without `nvm use` fails `astro check` on Node 22.14 with an explicit message.

## 8. Security and privacy posture

**Static site.** Live headers as in §2; CSP `connect-src` limited to self and
`stats.big-emotion.com` (the live script's collector). Outbound calls from the browser:
`Newsletter.astro:134` (`/api/nouveautes`), `keep-dom.ts:128` (`/api/resultats`),
`account-dom.ts:16` (`/api/compte`) — all first-party; Plausible only when
`PUBLIC_PLAUSIBLE_DOMAIN` is set (`analytics.ts`, `NEVER_SENT` at line 21).

**Service.** Origin check on every non-GET (`accounts.ts:208-209`) and on both mail forms
(`subscribe.ts:124`); tokens hashed (`accounts.ts:113-114`); links HMAC-signed with
`timingSafeEqual` (`subscribe.ts:62-71`); cookie `HttpOnly; Secure; SameSite=Lax`
(`accounts.ts:127`); consent required (`accounts.ts:220`, test `:90`); answers through
`cleanAnswers` (`accounts.ts:238,343,353`); same answer for known and unknown addresses (test
`:151`); throttles 5 / hour per connection and 3 / day per address on every mail route
(`subscribe.ts:109-134`, `accounts.ts:155-156,225,254`); `labas-db` on `labas-internal`
(`internal: true`, no published port).

**Lifetimes, three-way** — all agree:

| What              | `accounts.ts`                    | `docs/accounts.md` | `confidentialite.astro` | Test                   |
| ----------------- | -------------------------------- | ------------------ | ----------------------- | ---------------------- |
| Link after a save | `SAVE_LINK_FOR = DAY` (:37)      | 24 hours           | —                       | `accounts.test.ts:139` |
| Login link        | `15 * MINUTE` (:38)              | 15 minutes         | —                       | `accounts.test.ts:139` |
| Session           | `30 * DAY` (:39)                 | 30 days            | 30 jours (:139)         | `accounts.test.ts:113` |
| Unconfirmed save  | `7 * DAY` (:36)                  | 7 days             | 7 jours (:49)           | `accounts.test.ts:251` |
| A space           | `KEEP_FOR = 3 * 365 * DAY` (:34) | 3 years            | trois ans (:48)         | `accounts.test.ts:251` |

**Personal data at rest.** Postgres holds art. 9 answers with consent; **no evidenced backup and
no restore drill** (P0, §6).

**Secrets and supply chain.** See Domains 3 and 4.

## 9. Data honesty

| #   | Check                             | Verdict  | Evidence                                                                                                                                                                                                                |
| --- | --------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Score labels                      | pass     | 0 scores without `confidence`; 0 `measured`/`sourced`/`survey` without a dated https source. 354 `editorial` (19 %) — debt.                                                                                             |
| 2   | Editorial never shown as measured | pass     | `ville/[slug].astro:30,430` labels every score; no page says a question « mesure » (`methode.astro:26` says it measures no trait).                                                                                      |
| 3   | Sensitive remarks sourced         | **fail** | 8 / 8 racism entries and every `sameSexRelations` sourced; **21 safety / conflict `watch` remarks with no source** (§6). Cap → 4.                                                                                       |
| 4   | Travel advice is information      | pass     | Dated (`advisory.ts:33-36`, test `advisory.test.ts:12`); absent from `ranking.ts`, `fit.ts`, `filters.ts`.                                                                                                              |
| 5   | Reception first                   | pass     | `fit.test.ts:556-600`: three readers (West African, Caribbean, no origin) kept out of documented anti-Black countries in the top 5. Note: enforced by weight (`RECEPTION_WEIGHT = 8`, `ranking.ts:405`), not exclusion. |
| 6   | Temperament framing               | pass     | `TemperamentProfile.astro:12`; the 8 « vous êtes » hits are process phrases (« là où vous vous êtes arrêté »), none an archetype.                                                                                       |
| 7   | Quick-quiz lines                  | pass     | 115 / 115 cities with `reputation`, `surprise`, dated https sources.                                                                                                                                                    |
| 8   | Photos                            | pass     | 112 / 112 with licence, author, Commons source; 3 cities without a photo.                                                                                                                                               |

One failure, with a cap → **Domain 8 = 4**.

## 10. Prioritised actions

1. **Attach dated sources to the `watch` remarks** — at least the 21 safety / conflict ones, from
   the sources already on each city's `safety` score; show them beside « À savoir »; extend
   `cities.test.ts:85` so a safety remark without a dated source fails. (Domain 8: 4 → 9.)
2. **Evidence the Postgres backups** — a scheduled off-server `pg_dump`, a restore drill on a
   scratch database, its date recorded in `docs/deploy.md`. (Domain 2: 6 → 9.)
3. **Ignore every `.env*`** in `.gitignore` except an example file. (Domain 3.)
4. **Pin Actions and images by SHA / digest and add `.github/dependabot.yml`** (actions, npm,
   docker). (Domain 4.)
5. **Verify `X-Real-IP` cannot be forged through Traefik**, or key the limit on the address
   Traefik sets in `X-Forwarded-For`; add a test. (Domain 2.)
6. Replace the four colour literals with tokens (`color-mix()` over `--night` / `--thread` /
   `--saffron`). (Domain 7.)
7. One `TOP_THREE` constant for the map, the result and the share image; import `SITE` in
   `shared-result.ts`; name the reception values in `fit.ts`. (Domain 7.)
8. Delete `POPULATION_LABELS` and `activeFilterCount`; share one `limiter`. (Domains 5, 7.)
9. `server_tokens off;` in `deploy/nginx.conf`; consider `strict: true` on branch protection.
10. Update `CLAUDE.md:3` (« ten chip questions ») and the `adaptive.ts:8-10` comment (top five).

## 11. Conclusion

At 7.7, Là-bas is close to its 8–9 target. The browser side, the gates and the release
discipline already hold at 9. The distance is two items, both cheap and both about honesty to
the reader: sourcing the 21 safety remarks (the largest single lever, +0.5) and proving the saved
journeys can be restored. With those and the two hygiene fixes, the measured score is about 8.8,
and every security domain reaches 9.
