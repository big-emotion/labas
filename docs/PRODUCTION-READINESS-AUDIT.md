# Production-readiness audit — Là-bas

Date: 2026-11-18 (second pass) · Audited: `audit/combined` = `main` (`1445f59`, v0.22.0) + PRs
#115, #116, #117 merged locally (`dd6e8b3`) · Skill: `labas-audit` v2.0.0

## 1. Scope and method

The first pass of the day scored `main` at **7.5 / 10**. Three pull requests then closed its
findings:

- [#115](https://github.com/big-emotion/labas/pull/115): the service P0s.
- [#116](https://github.com/big-emotion/labas/pull/116): the unsourced remarks.
- [#117](https://github.com/big-emotion/labas/pull/117): dead code, tokens and drift.

This pass measures their combination, merged locally, because none is on `main` yet. Scores are
therefore **what `main` scores once the three merge**, not what production serves today.

**Measured this run**

- **`make check`** on Node 24.22.3, combined branch:
  - lint, typecheck (0 errors), format, build (129 pages) green;
  - tests 400 / 401 passed. The one failure was a 5 s timeout in `src/lib/paths.test.ts`, which
    passes alone (11 / 11).
  - The same file already takes 6.6 s for one test on `origin/main`, so it is a pre-existing,
    load-dependent flaky test (P2), not a regression.
  - Each PR alone: `make check` green (401, 389 and 389 tests).
- `npm run build:server`: green.
- **CI** on the PRs: #115 and #116 green on `check`, `image` and `gitleaks`. #117 was still
  running when this was written.
- **Viewports**, local preview of the combined build, Playwright, read-only:
  - 8 pages (`/`, `/approfondir/`, `/ville/dakar/`, `/avis/`, `/villes/`, `/espace/`,
    `/confidentialite/`, `/methode/`) at 430, 768 and 1440 px: **0 px horizontal overflow**
    everywhere.
  - At 430 px: every visible chip at least 44 × 44 px; no unlabelled control.
  - After three answers the page reads « En tête pour l'instant : Abidjan, Cotonou, Grand-Bassam ».
- **Scans**: colour literals (0 outside `share-card.ts` and `theme-color`); knip `--production`
  with the new `knip.json` (0 unused files, 0 unused dependencies, 12 test-only exports); hosts,
  top-N and durations by `grep`.
- **Live, from the first pass** (unchanged by these PRs): every security header served, nginx
  version hidden, `HEAD /api/compte` → 403.

**`N/A`, with the reason — none counted as a pass**

- **Postgres backups**: nothing in the repository schedules or restores a dump. This is an
  operator action on the host (`docs/deploy.md:122-124`).
- **Trust of `x-real-ip`**: Traefik's entrypoint configuration is outside the repository.
- **Which Plausible instance**: the collector is `stats.big-emotion.com` (CSP, `analytics.ts:10`)
  while the Stats API host is documented as `stats.ethniafrica.com` (`deploy.md:133`). Possibly
  one instance under two names; the operator can say.
- **Production after these PRs**: not deployed. The live headers, the smoke check and the
  migration on the real database come with the next release.

## 2. The five questions

1. **Ready for real readers? — Conditional, on one operator action.** Both code P0s are closed
   (#115): a malformed id is a 404, a broken route a 500, and sensitive answers are kept only under
   their own box on every journey. One blocker remains: **backups not evidenced** while journeys
   and reactions are live.
2. **Is the data honest? — All eight checks pass (#116).**
   - Every safety, conflict and political `watch` remark carries a dated source; the test pattern
     now catches « guerre », « instabilité politique », « délinquan », « régime » and more.
   - Two remarks were reworded to what their sources say: Conakry and Nosy Be.
   - 354 / 1 840 scores are `editorial` (19.2 %), which is debt, not failure. No cap applies.
3. **Clone → running in one session? — Yes.** `README.md:81-123`; `engines` now says Node 24
   like `.nvmrc`, the Dockerfile and CI.
4. **Security and privacy posture?** Strong. Every header is served live. The browser loads from
   no third party, and colours come from tokens.

   The service:
   - checks Origin on every non-GET request, hashes tokens, signs links with `timingSafeEqual`
     and sets cookie flags;
   - validates every id as a UUID and catches any route failure (#115);
   - keeps sensitive answers per journey, under a separate, unticked box; journeys started from
     Mon espace before the fix had theirs erased by the migration (#115);
   - takes reports from signed-in readers only, each counted once, exported and erased with the
     space (#115);
   - answers the login link before the mail is sent, so its timing reveals nothing (#115);
   - throttles every mail route, with a limiter that forgets stale keys (#115).

   Lifetimes agree three ways, and `purge()` erasing reactions and marks after 3 years is now
   tested. `labas-db` is internal. Secrets: clean. Supply chain: Actions pinned by SHA, images
   (CI included, #117) by digest, Dependabot on. `main` is protected with the three jobs
   required.

   Remaining gaps: backups (P0, operator), `x-real-ip` trust (`N/A`), `strict: false` (P2).

5. **Close to 8–9 / 10? — 9.0.** Three actions take it to about 9.5:
   - **Evidence the backups**: scheduled off-server `pg_dump` plus a restore drill
     (Domain 2: 7 → 9).
   - **Confirm Traefik overwrites `X-Real-IP`** (Domain 2: 9 → 10).
   - **Move the 12 test-only exports' tests onto public functions** (Domains 5 and 7: 9 → 10).

   Turning on `strict: true` adds Domain 4: 9 → 10.

## 3. Overall score

**9.0 / 10** (from 7.5 this morning). Once #115–#117 merge, the code-side debt is paid; what
stands between this and 9.5 is one backup drill and one proxy check on the host.

## 4. Score per domain

| #   | Domain                        | Before | Now | Evidence                                                                                                                                                                                                                     |
| --- | ----------------------------- | ------ | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Static site & browser privacy | 9      | 9   | Headers served live (first pass). No third-party host in `dist`. P2: `style-src 'unsafe-inline'`, HSTS without `preload`.                                                                                                    |
| 2   | Service & personal data       | 4      | 7   | Both code P0s closed by #115, under test (`accounts.test.ts`, `reactions.test.ts`, `admin.test.ts`, `subscribe.test.ts`; 118 server-side tests). **P0 left: backups `N/A`.** `x-real-ip` trust `N/A`. P2: limiter in memory. |
| 3   | Secrets & public-repo hygiene | 10     | 10  | Unchanged: `.env*` ignored, gitleaks required and green, infra disclosure exits 0.                                                                                                                                           |
| 4   | CI & change management        | 9      | 9   | Postgres pinned by digest in `ci.yml:38`; the `image` job checks all 8 tables (#115). P2: `strict: false`.                                                                                                                   |
| 5   | Correctness & tests           | 8      | 9   | `make check` green on each PR; the tests the audit asked for are written first. −1 for 12 production-dead exports kept only by their tests (Step 3.7, 6–15 P1). P2: `paths.test.ts` timeout under load.                      |
| 6   | Deploy & release              | 9      | 10  | `engines` `>=24` (#117); version, tag and changelog agree; deploys green with smoke check; rollback documented.                                                                                                              |
| 7   | Architecture & boundaries     | 7      | 9   | Step 3.5: **0 P1** (colours on tokens, one `TOP_THREE`, one `SITE`, named `TENSION_FIT` / `ADVENTURE_AT_HOME`). Step 3.7: 12 P1, so −1. No unused file or dependency.                                                        |
| 8   | Data honesty                  | 4      | 9   | All eight checks pass (§9). Not 10: 19 % `editorial`, and the Nosy Be source is a 2022 report through a mirror.                                                                                                              |
| 9   | Reader experience             | 8      | 9   | Measured at 430 / 768 / 1440: no overflow on 8 pages, chips ≥ 44 px, no unlabelled control, the top three named after the third answer. « vous » pinned by tests. Not checked on production.                                 |
| 10  | Docs & newcomer flow          | 7      | 9   | Fixed: the compose comment, the news-retention wording, the `CLAUDE.md` reaction events, the two skill disagreements, `docs/accounts.md` (per-journey box, reports). P2 left: the two Plausible host names.                  |

**Mean: 90 / 10 = 9.0.**

## 5. Strengths

- Every finding of the morning's audit that code could close is closed, test-first, in three
  reviewable PRs.
- Consent is a property of each journey, not of a form: a later answer cannot widen what a reader
  agreed to.
- One request can no longer take the service down: ids are validated before any query, and a
  route failure is a 500.
- Moderation counts people, not connections, and the record of who reported is the reader's
  data: exported, and erased with the space.
- Every sensitive remark on a city page carries a dated source, and a test keeps it that way.

## 6. Gaps and risks

**P0**

- **Backups not evidenced** — `docs/deploy.md:122-124`. Saved journeys and public reactions live
  in one Postgres volume with no scheduled off-server dump and no restore drill.

**P1**

- **`x-real-ip` trust** (`N/A`) — both limiters key on it (`subscribe.ts:160`,
  `accounts.ts:442`). If Traefik passes a client-sent value, the per-connection limit can be
  dodged. The per-address limit and the session-gated reports hold regardless.
- **12 exports kept only by tests** (Step 3.7):
  - `GOALS`, `NEWS_AFTER`, `KEEP_FOR`
  - `HOLIDAYS`, `ACTIVITY_TAGS`
  - `profileOf`, `fingerprint`, `temperamentOf`, `neighbourhoodLine`
  - `weekFor`, `jobOf` (`week-pick.ts`), `absoluteUrl`

  Most are data tables their tests validate. Moving those tests onto the public functions
  removes the exports.

**P2**

- `paths.test.ts` hits Vitest's 5 s timeout when the full suite runs under load (one test takes
  6.6 s alone on `main`).
- Branch protection `strict: false`; HSTS without `preload`; `style-src 'unsafe-inline'`.
- The limiters live in memory: a restart resets the counts. Reports no longer depend on them.
- `KeepResults.astro` / `Newsletter.astro` share a 34-line form style block.
- Plausible is named under two hosts (§1).
- `npm audit`: a picomatch ReDoS through astro's build chain, not shipped at runtime.
- The Nosy Be source is a 2022 US trafficking report read through ecoi.net (state.gov refused the
  fetch). A newer report would be better.

### Hardcoded values (P0/P1)

None. Since the first pass:

- the four colour literals are `color-mix()` over `--thread`, `--saffron` and `--scrim`;
- the « top three » is `TOP_THREE` (`ranking.ts`);
- `labas.africa` is written once (`share.ts:4`);
- the reception values in `fit.ts` are named.

Admissible literals: `share-card.ts` (satori) and `theme-color` `#161a5c` (= `--night`).

P2, in chat only: `DAY` re-derived in `reactions.ts:46` and `subscribe.ts:346`; the Graph host
written twice in `subscribe.ts`.

### Dead code & redundancy

knip `--production` with `knip.json`: **0 unused files, 0 unused dependencies**. Twelve
production-dead exports remain, all imported by tests (P1, above). jscpd: the same 2-file form
style clone (P2). That is 0 P0 and 12 P1, so −1 on Domains 5 and 7.

## 7. Newcomer flow

`git clone` → `nvm use` (Node 24, now also `engines`) → `npm install` → `npm run dev` →
`make check` → `npm run build:server`. The service tests run against PGlite with no secret.
Documented in `README.md:81-123`.

## 8. Security and privacy posture

**Service, after #115.**

- `idIn()` accepts a real UUID only, on every `:id` route. `createHandler` wraps every route and
  answers 500 on failure (`subscribe.test.ts`: « answer 500 when the module breaks »).
- `journeys.sensitive` holds the per-journey choice; `keptOf()` strips sensitive answers on
  `sauvegarder`, `resultats`, `POST` and `PUT /parcours` unless it is set.
- The migration `consentPerJourney()` erases the sensitive answers of journeys created and
  confirmed in the same instant (those started from Mon espace), and keeps them on journeys saved
  through a form that asked. It is tested in « journeys kept before the per-journey box existed ».
- `reaction_reports(reaction_id, account_id)`: a session is needed, each reader counts once, the
  table is in the export, and it is cleared by « rétablir ».
- `POST /api/compte/lien` sends the mail after answering.

**Lifetimes, three-way** — unchanged and in agreement:

| What                 | Code    | `docs/accounts.md`      | `confidentialite.astro`                |
| -------------------- | ------- | ----------------------- | -------------------------------------- |
| Space                | 3 years | 3 years                 | trois ans                              |
| Unconfirmed save     | 7 days  | 7 days                  | 7 jours                                |
| Save link            | 24 h    | 24 hours                | 24 heures                              |
| Results link         | 7 days  | 7 days                  | 7 jours                                |
| Login link           | 15 min  | 15 minutes              | 15 minutes                             |
| Session              | 30 days | 30 days                 | 30 jours                               |
| Unpublished reaction | 7 days  | 7 days                  | 7 jours                                |
| News address         | 3 years | after last confirmation | after « dernière confirmation » (#117) |

The 3-year purge now has a test for reactions and marks (`reactions.test.ts`).

## 9. Data honesty

| #   | Check                             | Verdict | Evidence                                                                                                                                                                |
| --- | --------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Score labels                      | pass    | `{"editorial":354,"measured":94,"sourced":1391,"survey":1}`; 0 unlabelled, 0 sourced scores without a dated https source.                                               |
| 2   | Editorial never shown as measured | pass    | `ville/[slug].astro:31-36,446`; no question « mesure » anything.                                                                                                        |
| 3   | Sensitive remarks sourced         | pass    | 55 / 55 `sameSexRelations`, 3 / 3 `tensions`; **all 12 safety, conflict and political `watch` remarks now carry `watchSources`** (#116), pinned by `cities.test.ts:96`. |
| 4   | Travel advice is information      | pass    | Dated; not used by the ranking; `ranking.test.ts:31`.                                                                                                                   |
| 5   | Every answer orients the list     | pass    | `ranking.test.ts:213-250`.                                                                                                                                              |
| 6   | Temperament framing               | pass    | `TemperamentProfile.astro:12-13`; no archetype « vous êtes ».                                                                                                           |
| 7   | Quick-quiz lines                  | pass    | 115 / 115 (`lines.test.ts`).                                                                                                                                            |
| 8   | Photos                            | pass    | 112 / 112 licensed and credited; Bo, Buchanan and Teyateyaneng without a photo.                                                                                         |

All eight pass, so Domain 8 is in the 9–10 band, scored 9 (§4).

## 10. Prioritised actions

1. **Review and merge #115, then #116, then #117.** #117 needs a one-line rebase after #115: the
   import block of `accounts.ts`, `TOP_THREE` beside `type Answers`. Then cut a release
   (`/labas-release`); the migration of older journeys runs on the first start.
2. **Evidence the backups** on the host: a daily off-server `pg_dump`, one restore into a scratch
   database, dated in `docs/deploy.md`. (Domain 2: 7 → 9)
3. **Confirm Traefik overwrites `X-Real-IP`** (entrypoint `forwardedHeaders`), and record it in
   `docs/deploy.md`. (Domain 2)
4. Move the tests of the 12 test-only exports onto public functions. (Domains 5 and 7)
5. Turn on `strict: true` in branch protection. (Domain 4)
6. Raise `paths.test.ts`'s slow test timeout, or make it faster. (Domain 5)
7. Name one Plausible host in `analytics.ts`, `plausible.ts` and `deploy.md`. (Domain 10)
8. Replace the Nosy Be source with a current state.gov trafficking report. (Domain 8)

## 11. Conclusion

From 7.5 to 9.0 in one pass, with the code-side findings closed under test. Readers now get
exactly what the privacy page promises: sensitive answers stay in the browser without their own
box, and no request can take the service down. What separates 9.0 from 9.5 is no longer code: it
is a backup drill and a proxy setting on the host, and both take minutes.
