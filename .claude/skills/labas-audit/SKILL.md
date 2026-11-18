---
name: labas-audit
description: Production-readiness audit for Là-bas (this repo, labas.africa). Read-only, scored, evidence-based assessment over ten domains that answers five questions — is the site ready for real readers, is the data honest (sourced, dated, labelled), can a newcomer go clone-to-running in one session, what is the security and privacy posture (static site, the mail and accounts service, saved journeys in Postgres), and is the score close to 8–9/10. Writes docs/PRODUCTION-READINESS-AUDIT.md and nothing else. Use when the user asks "audit Là-bas", "is it ready", "production-readiness check", "score the project", or invokes /labas-audit.
metadata:
  author: Big Emotion
  version: "2.0.0"
---

# Là-bas Audit

Read-only audit of this repository. Adapted from `ethniafrica-audit` (itself folded from Google
SRE's Production Readiness Review) and cut to what Là-bas is:

- a static Astro site whose matching engine runs in the browser;
- one small Node service, `labas-subscribe` (`src/server/subscribe.ts`), that mails the news,
  mails results and holds saved journeys in Postgres (`src/server/accounts.ts`,
  `docs/accounts.md`) — the only server code;
- a public repository, deployed by `v*` tag to one VPS (`docs/deploy.md`).

**The repository is the authority.** When this skill and the code, `CLAUDE.md` or `docs/` disagree,
score against the repository, record the disagreement as a Domain 10 finding, and never let it
make a criterion easier. This skill has already gone stale once (it described a site with no server
code after the accounts module shipped), so checking it against the repository is part of every run.

This skill **never** edits source, bumps versions, tags, pushes, deploys, runs a migration or
writes to an external service. Fixes go through normal PRs, releases through `/labas-release`.

**Local footprint of a full run** — a clean tree in git terms stays the contract, but these appear
on disk:

- `docs/PRODUCTION-READINESS-AUDIT.md` — the only tracked file this skill writes.
- `dist/`, `.astro/` — refreshed by the build; `dist-server/` if `npm run build:server` is run.
- `node_modules/` — refreshed by `npm ci` when stale.
- `npx --yes` one-shot downloads (knip, jscpd) land in the npx cache, never in `package.json`.

All of these are gitignored. If any shows up in `git status --porcelain`, that is itself a Domain 3
finding.

## Measure outcomes, not configuration

- **A workflow file is not a gate.** Read the runs (`gh run list`) and the protection API
  (`gh api repos/big-emotion/labas/branches/main/protection`), not the YAML. A workflow or job that
  never ran, was skipped, ran red, or is not a required check scores as **absent**.
- **A header in `deploy/nginx.conf` is configuration; a header served by `https://labas.africa/`
  is an outcome.** The CI `image` job proves the container serves them; only a live read proves
  production does.
- **A promise on a page is a contract.** What `src/pages/confidentialite.astro` and
  `docs/accounts.md` promise readers (what is sent, what is kept, for how long, when it is erased)
  must be delivered by code and covered by a test. A promise nothing delivers is a P0, whatever
  the other scores.
- **A count is a measurement taken this run.** A number copied from a doc or a previous report is a
  claim; quote the command that produced it.
- **What could not be measured is `N/A`, with its reason, and `N/A` never counts as a pass.**

## Preconditions

Run from the repo root (`package.json` with `"name": "labas"`), on an up-to-date `main`
(`git fetch && git status -sb` shows no `behind`). A local `main` behind `origin/main` audits a
project that no longer exists: stop and say so.

## Inputs

- `--quick` — skip `make check`; rely on the last `ci.yml` run on `main` and mark every domain
  scored from it as such.
- `--no-build` — run `make check` without its build step (run the other targets one by one);
  Domains 5 and 6 then note that the build was not exercised.

Default: full audit.

## Step 1 — Snapshot

In parallel:

- `git status --porcelain`, `git log --oneline -15`, `git branch --show-current`.
- `git tag --sort=-creatordate | head -5` against `jq -r .version package.json` and the top entry
  of `CHANGELOG.md` — the three must agree on the last release.
- `jq '{name, version, engines, scripts}' package.json`, `cat .nvmrc` — `CLAUDE.md` says Node 24;
  `.nvmrc`, `engines` and the Dockerfile base image must agree with it.
- `ls .github/workflows docs src/server .claude/skills`.

## Step 2 — Read the previous report

`docs/PRODUCTION-READINESS-AUDIT.md` — update it in place and keep its structure; create it with
this structure if it does not exist:

1. Scope and method — what was measured, what is `N/A` and why
2. The five questions, answered
3. Overall score (X.X / 10) and one-line verdict
4. Score per domain (10 rows)
5. Strengths
6. Gaps and risks, each with `file:line` or run-id evidence, P0 / P1 / P2 — including the
   **Hardcoded values (P0/P1)** and **Dead code & redundancy** subsections from Steps 3.5 and 3.7
7. Newcomer flow (clone → running)
8. Security and privacy posture — the static site, the service, personal data
9. Data honesty — the Step 3.6 verdicts verbatim
10. Prioritised actions (15 max, each tied to an issue, a PR or a file)
11. Conclusion

Set `Date:` to today. Compare with the previous scores: a domain that dropped says why.

## Step 3 — Gather evidence

**Gates** (skip with `--quick`): `npm ci` if `node_modules` is stale, then `make check`
(infra disclosure, lint, typecheck, format, tests, build). Record the test count and the duration.
Also `npm run build:server` — the service bundle is not part of `make check`, only of the image.

**Always** (read-only):

- **CI outcomes**: `gh run list --workflow ci.yml --branch main --limit 5 --json conclusion,createdAt,headSha`
  and `gh run list --workflow deploy-production.yml --limit 3 --json conclusion,event,headBranch,createdAt`.
  For the last `ci.yml` run, read the conclusion of each job (`check`, `image`, `gitleaks`) with
  `gh run view <id> --json jobs` — a green run with a skipped job is not green for that job.
- **Branch protection on `main`, measured**: is a PR required, which checks are **required**. A job
  that is not in the required list does not block a merge, however green it is. Refused → `N/A`.
- **Secrets**: `git ls-files | grep -iE '\.env'` (only example files allowed);
  `git grep -nE '(ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|sk_[A-Za-z0-9]{16,}|eyJ[A-Za-z0-9_-]{30,})'`
  must return nothing; `.gitignore` covers every `.env*` variant a contributor or CI might create
  (`.env.local`, `.env.subscribe`), through repo rules rather than the auditor's global excludes.
- **Public-repo hygiene**: `./scripts/check-infra-disclosure.sh` green (no server name, IP or
  provider); `git grep -nE '/Users/|/home/[a-z]'` for workstation paths, outside `docs/deploy.md`'s
  documented `/home/ubuntu/labas/`.
- **Supply chain**: third-party Actions pinned by SHA
  (`git grep -nE "uses: .+@(v[0-9]+|main|master)" .github/workflows` — every hit is a finding, the
  same for container images pulled by tag in CI and `deploy/docker-compose.yml`);
  `npm audit --audit-level=moderate`, counted by severity.
- **Hooks**: `.husky/pre-commit` and `.husky/commit-msg` present, `commitlint` and `lint-staged`
  configured, `prepare` runs `husky`.

**The static site** (read each file, quote `file:line`):

- `deploy/nginx.conf` — HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, a CSP with `script-src 'self'`; then the live site,
  `curl -sI https://labas.africa/` (read-only GET), to confirm what production serves.
- **Every host the built site loads from**: after the build,
  `grep -rhoE '(src|href|action)="https?://[^"/]+' dist | sort | uniq -c` and the CSP's
  `connect-src`. Allowed: `labas.africa` and the Plausible collector. Anything else (a font CDN,
  an embed, a map tile server) is a P0 against `CLAUDE.md`; plain outbound links (`<a href>`) to
  sources are fine. `git grep -n "fonts.googleapis" src` must be empty.
- **What leaves the browser**: `git grep -nE "fetch\(|sendBeacon|XMLHttpRequest" -- src ':!*.test.ts'`.
  Each call must be one of: Plausible events (`src/lib/analytics.ts`, off unless
  `PUBLIC_PLAUSIBLE_DOMAIN` is set), the news sign-up and its unsubscribe page (`/api/nouveautes`,
  `/api/nouveautes/desinscrire`), « Recevoir par e-mail », or `/api/compte` (a signed-in reader, or a
  signed-out one leaving an address to save a journey, ask a login link or post a reaction).
  `analytics.test.ts` must assert that origin, family country, feeling at
  home, faith, health and same-sex-law answers are never sent; the shared and mailed result
  (`src/lib/share.ts`, `shared-result.ts`) must carry cities and percentages, never answers.
- No cookie set by the static site; the only cookie in the project is the service's
  `labas_session`.

**The mail and accounts service** (`src/server/`, `deploy/docker-compose.yml`, `Dockerfile`):

- Every mutating route checks `Origin` against the site URL (`subscribe.ts`, `accounts.ts`).
- Tokens (login links, sessions) are stored hashed; signed links use HMAC with a constant-time
  compare; the cookie is `HttpOnly; Secure; SameSite=Lax`.
- Sensitive answers (origin, faith, health, same-sex-law filter — GDPR art. 9) reach Postgres only
  after the separate, unticked consent box; answers pass through `cleanAnswers` (`src/lib/keep.ts`).
- « Recevoir mon lien de connexion » answers the same whether or not the address has a space (no
  account enumeration) — covered by `accounts.test.ts`.
- **Lifetimes, three-way**: the constants in `accounts.ts` (`KEEP_FOR`, link and session
  lifetimes), the table in `docs/accounts.md` and what `src/pages/confidentialite.astro` tells
  readers must agree, and `purge()` must enforce each one under test. A mismatch is a P0.
- **Throttling**: a route that sends an e-mail to an address anyone can type, with no rate limit
  anywhere on the path (service, nginx, Traefik), is a P1 (mail bombing, sender reputation, Microsoft 365
  quota). Quote where the limit lives, or that none exists.
- The service answers 503 without its secrets and starts no database without `LABAS_DB_PASSWORD`
  (the CI `image` job asserts both — read that it ran).
- `labas-db` sits on an `internal: true` network with no published port
  (`deploy/docker-compose.yml`).
- **Backups**: `docs/deploy.md` calls a daily off-server `pg_dump` a precondition for real readers
  saving journeys. Its existence on the host cannot be read from the repo: `N/A` unless the operator
  shows evidence, and question 1 cannot be « Yes » while saved journeys are open and it is `N/A`.

### Step 3.5 — Hardcoded values scan

**Scope:** `src/**/*.{ts,astro}`, `deploy/*`. Exclude `*.test.ts`, `src/data/**` (the data is
data), and `docs/`.

**Flag** (use these exact buckets):

- **Colour literals** — `CLAUDE.md`: colours come from the tokens in `src/styles/global.css`.
  A literal is admissible only where a CSS token cannot reach — the `satori` share image
  (`src/lib/share-card.ts`) and `<meta name="theme-color">` — and then it must match the token's
  value. Any other literal is a P1.
- **Engine weights & thresholds** — magic numbers in `ranking.ts`, `fit.ts`, `adaptive.ts`,
  `filters.ts`: a weight or cut-off with no named constant and no test that pins its effect.
- **Lifetimes & durations** — `* 60`, `* 1000`, `DAY` arithmetic outside the named constants of
  `accounts.ts`.
- **Hosts & URLs** — `labas.africa`, the Plausible collector, Microsoft Graph endpoints written outside the
  one place that defines each.
- **Size & truncation** — `slice(0, N)`, `.length > N`, top-N counts (the « top three » on the map,
  the « top five » the next question optimises) defined in more than one place.

**Scan:**

```bash
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src/components src/pages src/layouts src/lib | grep -vE '\.test\.ts|var\(--'
grep -rnE '\b[0-9]{3,}\b|\* (60|1000|24)\b' src/lib src/server | grep -vE '\.test\.ts'
grep -rnE 'slice\(0, ?[0-9]|\.length [<>]=? ?[0-9]' src/lib src/server src/pages | grep -vE '\.test\.ts'
grep -rnE 'https?://[a-z0-9.-]+' src/lib src/server src/pages src/components | grep -vE '\.test\.ts'
```

Read each hit before counting it. **Severity:** **P0** a value that contradicts a promise to readers
(a lifetime, a host that receives data); **P1** a colour literal, an engine threshold duplicated or
unnamed, a host written twice; **P2** an internal constant unlikely to change.

**Output:** flat list grouped by bucket, P0 first, `**Pn** path:line — value — why`. P0 and P1 go
under section 6 as **Hardcoded values (P0/P1)**; P2 stays in chat.

**Score impact** on Domain 7: 0 P0 and ≤ 5 P1 → none; 1–3 P0 or 6–15 P1 → −1; ≥ 4 P0 or > 15 P1 → −2.

### Step 3.6 — Data honesty

The domain-critical surface. Eight checks, each pass / fail / `N/A`:

1. **Score labels** — every score in `src/data/city-scores.json` carries a `confidence`, and every
   `measured` / `sourced` / `survey` score has at least one https source with an `accessed` date.
   Report the distribution:
   `jq '[.[] | .scores[] | .confidence] | group_by(.) | map({(.[0]): length}) | add' src/data/city-scores.json`.
   `editorial` scores are debt to burn down, not failures.
2. **Editorial never shown as measured** — `src/pages/ville/[slug].astro` and the result cards show
   the confidence label next to each score; no page says a question « mesure » anything.
3. **Sensitive remarks sourced** — every `sameSexRelations` and `tensions` entry in
   `src/data/countries.json` has a `label` naming the source and its year, a summary and at least
   one https source with `accessed`; the same for every safety or conflict remark (`watch` in
   `src/data/cities.json`). A published remark of these kinds with no dated source **caps Domain 8
   at 4**.
4. **Travel advice is information** — France Diplomatie / FCDO advice is dated and shown with its
   city, and never removes or greys one (`src/lib/advisory.ts`, `advisory.test.ts`, and
   `bestMatches` unaffected by it).
5. **Every answer orients the list** — each answer is one piece of evidence and the pieces
   multiply; no fact weighs without an answer that asks for it. Read the engine tests that pin it
   (`ranking.test.ts`, « each answer orients the list »: a tie before any answer, a late language
   answer that turns the list over); no test → fail. A failure **caps Domain 8 at 4**.
6. **Temperament framing** — the chapter is introduced only as « inspirée du Big Five, ce n'est pas
   un test de personnalité », and the archetype as preferences in « vous », never « vous êtes »:
   `git grep -n "vous êtes" -- src ':!*.test.ts'` and read each hit.
7. **Quick-quiz lines** — in `src/data/city-lines.json` every city has a `reputation` introduced as
   hearsay, a `surprise` and dated `sources` (`lines.test.ts`).
8. **Photos** — `src/data/photos.json`: free licence, author, Commons source for each; count the
   cities without a photo.

**Scoring Domain 8, literally:** all pass → 9–10; one failure or `N/A` → 7–8; two → 5–6; three or
more → ≤ 4. A failure is a failure however latent it is argued to be; do not net it against a strong
check or round a band up. The caps in checks 3 and 5 apply regardless of the rest.

### Step 3.7 — Dead code & redundancy

```bash
npx --yes knip --production --no-progress --reporter compact 2>&1 | tail -60
npx --yes knip --no-progress --reporter compact 2>&1 | tail -60
npx --yes jscpd src --min-tokens 50 --min-lines 5 --ignore "**/*.test.ts,src/data/**" --reporters consoleFull --silent 2>&1 | tail -40
```

Run tools via `npx --yes` only — never add them to `package.json` for an audit. Production mode
matters: in default mode a module imported only by its own test counts as used. Entry points that
are not imports: `src/pages/**` (Astro routes), `src/server/subscribe.ts` (the `build:server` entry),
`astro.config.mjs`, `scripts/*.ts`. `knip.json` declares the non-Astro ones (suffixed `!` for production
mode). A tool that cannot
resolve Astro without configuration is recorded as such and
its unreliable lines are read by hand, not counted.

**Flag:** files no route or entry point reaches; unused exports; unused dependencies; blocks
duplicated across the `*-dom.ts` modules or across pages; a `devDependency` that is in fact needed
at runtime by the service image.

**Severity:** **P0** a page nobody reaches that still ships, an unused runtime dependency in the
service image; **P1** a production-dead file under `src/lib`, an unused export, a duplicated block
≥ 30 lines across ≥ 3 files; **P2** the rest. Top 30 by impact under section 6 as **Dead code &
redundancy**.

**Score impact** on Domains 5 and 7: same thresholds as Step 3.5. When one hotspot shows in both
scans, count it once — the duplication subsumes the literal.

## Step 4 — Score

Ten domains, 1–10 each, equal weight; overall = mean, one decimal. **P0** blocks real readers,
**P1** must land before a public launch, **P2** nice to have.

| #   | Domain                        | What earns a high score                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Static site & browser privacy | Strict headers including a CSP, **served live**; the built site loads from no host but its own and the Plausible collector; nothing in the never-sent list leaves the browser, under test; shared and mailed results carry no answers; no cookie, no third-party embed, fonts self-hosted.                                                                                                                             |
| 2   | Service & personal data       | Origin check on every mutating route; hashed tokens, signed links, constant-time compare, cookie flags; consent before any sensitive answer is stored; no account enumeration; lifetimes agree three-way and `purge()` enforces them under test; a throttle on every route that sends mail; `labas-db` unreachable from the proxy; backups evidenced before journeys open to real readers.                             |
| 3   | Secrets & public-repo hygiene | No secret in history or tree; gitleaks a **required** check that ran green; infra-disclosure and workstation-path checks green; `.gitignore` covers every `.env*` variant, `dist-server/` and `.claude/worktrees/`; no audit artifact in `git status`.                                                                                                                                                                 |
| 4   | CI & change management        | The last `ci.yml` runs on `main` green on every job (`check`, `image`, `gitleaks`); `main` protected with those jobs required; Actions and CI images pinned by SHA; Husky hooks and commitlint in place.                                                                                                                                                                                                               |
| 5   | Correctness & tests           | `make check` green; the engine tests named in Step 3.6 pass; tests go through public functions (`rankCities`, `bestMatches`, the server's request handlers against PGlite) and not private helpers; no `.skip` / `.only` (`git grep -nE "\.(skip\|only)\(" -- 'src/**/*.test.ts'`); no production-dead code (Step 3.7).                                                                                                |
| 6   | Deploy & release              | A `v*` tag (or a manual run on a ref) is the only thing that deploys; the last deploy run green and its smoke check passed; version, tag and `CHANGELOG.md` agree; Node 24 everywhere; rollback by `workflow_dispatch` documented in `docs/deploy.md`; the image builds in CI before a tag can ship it.                                                                                                                |
| 7   | Architecture & boundaries     | KISS holds: no framework island, the service is the only server code and the browser never needs it to rank; data lives in `src/data/*.json`, logic in `src/lib`, DOM wiring in `*-dom.ts`; colours from tokens; no untunable or duplicated magic numbers (Step 3.5); no significant duplication (Step 3.7).                                                                                                           |
| 8   | Data honesty                  | Step 3.6, scored literally, with its two caps.                                                                                                                                                                                                                                                                                                                                                                         |
| 9   | Reader experience             | Mobile first: checked at 430 px, then 768, then 1440; every tap visibly changes something, and from the third answer the map colours every city and names the current top three; one form of address (« vous »; tests reject « tu »); plain French; « gratuit » / « payant » never written; accessible controls (labels, focus, `aria-pressed`). Score from the build and the pages; live checks are `N/A` unless run. |
| 10  | Docs & newcomer flow          | `README.md` gets a newcomer from clone to `npm run dev` and `make check`; `docs/deploy.md` matches the workflows and the compose file; `docs/accounts.md` matches `accounts.ts`; `CLAUDE.md` agrees with the code; every command a doc names exists in `package.json` or the `Makefile`; this skill agrees with the repository; docs in English.                                                                       |

**One defect, one severity.** When two domains surface the same defect, give it one canonical
severity, count it fully in its most causal domain and reference it from the others — otherwise one
gap drags the mean down several times and the domains stop ranking anything.

## Step 5 — The five questions

1. **Ready for real readers?** Yes / No / Conditional, with at most three blockers. A promise made
   to readers that nothing delivers is a « No » whatever the score.
2. **Is the data honest?** The eight checks, the failed ones named, the `editorial` share, and
   whether a cap applied.
3. **Clone → running in one session?** Walk `git clone`, `nvm use`, `npm ci`, `npm run dev`,
   `make check`, then the service: `npm run build:server` and the tests that run it against PGlite
   (no real database, no Microsoft 365 secret needed). Every step with no doc or only tribal knowledge is a P1.
4. **Security and privacy posture?** One paragraph: headers served live, what leaves the browser,
   the service (origin, tokens, consent, lifetimes, throttling, the internal database, backups),
   secrets, public-repo hygiene, supply chain, branch protection as measured.
5. **Close to 8–9/10?** The score, the gap, the three actions that close it.

## Step 6 — Write and report

Update `docs/PRODUCTION-READINESS-AUDIT.md` (English). In section 1, list what was measured and
every `N/A` with its reason. Then print at most 25 lines:

```
Là-bas Audit — <YYYY-MM-DD>
Score: X.X / 10 (target 8–9)

1. Ready for real readers? <verdict + reason>
2. Data honest? <failed checks, or "all eight pass"; editorial share>
3. Clone → running? <verdict + blocking step>
4. Security & privacy? <one line: headers, browser, service, secrets>
5. Distance to 8–9? <top 3 actions>

Full report: docs/PRODUCTION-READINESS-AUDIT.md
```

## Step 7 — Verification

Before reporting done:

- [ ] Every domain score cites evidence (command output, run id or `file:line`).
- [ ] The five questions are answered in section 2.
- [ ] CI jobs, branch protection, deploy and live headers were read as outcomes, not inferred from
      YAML or `nginx.conf`.
- [ ] Every `N/A` has its reason and was not counted as a pass.
- [ ] The three-way lifetime comparison (code, `docs/accounts.md`, privacy page) is in section 8.
- [ ] Step 3.5 ran: P0/P1 hardcoded values listed, Domain 7 reflects the penalty or the count is
      stated as below threshold.
- [ ] Step 3.6 ran: eight verdicts in section 9, Domain 8 scored by counting failures literally,
      caps applied where due.
- [ ] Step 3.7 ran, knip in production mode included: P0/P1 listed, Domains 5 and 7 reflect it,
      overlaps with Step 3.5 counted once.
- [ ] Cross-domain defects harmonised to one severity before the mean was computed.
- [ ] Every disagreement between this skill and the repository is recorded under Domain 10.
- [ ] `git status --porcelain` shows only `docs/PRODUCTION-READINESS-AUDIT.md` changed.

## Out of scope

Fixing what the audit finds; any write to GitHub settings, the VPS, Postgres, Microsoft 365, Plausible or
DNS; running a migration or `purge()` against a real database; load or Lighthouse runs against
production (read-only `curl -sI` is the only live request); editorial rewriting of city data.
