# Production-readiness audit — Là-bas

Date: 2026-11-15 · Skill: `/labas-audit` 1.0.0 · Commit audited: `origin/main` after PR #25 ·
Live: `v0.1.4`

## 1. Scope and method

Read-only audit of the repository and of what labas.africa serves, against the eight domains of
`.claude/skills/labas-audit/SKILL.md`.

**Measured this run:** `make check` (infra disclosure, lint, typecheck, format, 149 tests in 14
files, build — green); the last five `ci.yml` runs on `main` and the last three
`deploy-production.yml` runs (all `success`); branch protection on `main` (API: "Branch not
protected"); secrets and token patterns over tracked files; `scripts/check-infra-disclosure.sh`;
workstation paths; Action pinning; `npm audit`; the headers served by `https://labas.africa/`
(read-only `curl -sI`); the seven data-honesty checks over `src/data/*.json`; the form of address
across `src/`.

**`N/A`:** live accessibility and Lighthouse runs (not run; scored from code and from the browser
checks recorded in the PRs at 430 px); full-history secret scan (no scanner installed — see §6).

## 2. The five questions

1. **Ready for real readers?** **Conditional.** Ready for the current field tests. Before a public
   launch: protect `main` and require CI; add HSTS and a CSP; add a secret scanner as a required
   check.
2. **Is the data honest?** **Six of seven checks pass.** 1,499 scores carry a level, every one
   labelled (1,391 sourced, 94 measured, 1 survey, 13 editorial); three `sourced` scores cite an
   `http://` page instead of `https://`. The eight documented racism or xenophobia cases carry a
   label in the source's words with its name and year. Debt: about 1,450 open lines in the three
   review lists; three cities without a photo.
3. **Clone → running in one session?** **Yes.** `README.md` walks `nvm use`, `npm install`,
   `npm run dev` and `make check`; the gate is the same in CI.
4. **Security and privacy posture?** Strong on privacy, weak on hardening. A static site with no
   server code; nothing sensitive leaves the browser (origin, family country, feeling at home,
   faith, health and same-sex-law answers are excluded from analytics, which stays off until
   configured); fonts self-hosted, no embed. But only two security headers are served (no HSTS,
   no CSP, no frame protection), `main` is unprotected, Actions are pinned by tag not SHA, no
   secret scanner, and two critical advisories sit in dev dependencies (vitest, tinypool).
5. **Close to 8–9/10?** **6.5 / 10.** The three actions in §10 that close most of the gap: protect
   `main` with CI and gitleaks required (domains 2 and 3), security headers (domain 1), release
   discipline with version and changelog plus the dev-dependency bump (domains 4 and 5).

## 3. Overall score

**6.5 / 10** — a sound, honest product on a young delivery chain; the gaps are hardening and
process, not the product.

## 4. Score per domain

| #   | Domain                        | Score | Evidence                                                                                                                                                                                |
| --- | ----------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Security & privacy            | 6     | Live headers: `x-content-type-options`, `referrer-policy` only (`deploy/nginx.conf:11-12`); no HSTS, CSP or `X-Frame-Options`. Privacy: `src/lib/analytics.ts:21-28`, no embed.         |
| 2   | Secrets & public-repo hygiene | 6     | No secret or `.env` tracked; infra-disclosure check green (PR #25); no secret scanner; `.gitignore` lacked `.claude/worktrees/` (fixed with this skill's PR).                           |
| 3   | CI & change management        | 4     | CI green on `main` (5/5); `main` not protected; Actions on tags (`ci.yml:12-13,24`, `deploy-production.yml:30,34`); no Husky, commitlint or lint-staged.                                |
| 4   | Correctness & tests           | 8     | 149 tests green; engine audits pass (every city can come first, realistic readers, reception rule, paths by project); critical advisories in `vitest` / `tinypool` (dev only).          |
| 5   | Deploy & release              | 6     | `v0.1.2`–`v0.1.4` deployed green with smoke retry; rollback by `workflow_dispatch` documented; `package.json` stays `0.0.1`, no `CHANGELOG.md`, tags pushed by hand.                    |
| 6   | Data honesty                  | 8     | Check 1 fails on three `http://` sources (Niamey returnees, Santo António healthcare and schools); checks 2–7 pass (see §9).                                                            |
| 7   | Reader experience             | 7     | One form of address (« vous », no « tu » left in `src/`); direct questions with a one-line stake (`questions.test.ts`); mobile checked at 430 px in PRs #18, #20, #24; live a11y `N/A`. |
| 8   | Docs & newcomer flow          | 7     | README newcomer path complete; `docs/deploy.md` matches the workflows; `CLAUDE.md:21` still says the archetype is phrased « in tu » while line 8 and the site use « vous ».             |

## 5. Strengths

- An engine with its own audits as tests: every city reachable, realistic readers spread, no
  reader sent where anti-Black racism is documented (with or without an origin given), a path that
  fits the project.
- Data with provenance: every score labelled, every documented case quoted in its source's words.
- Privacy by construction: computed in the browser, sensitive answers never sent.
- A one-command gate (`make check`) shared by contributors and CI, and a tag-only deploy.

## 6. Gaps and risks

**P1**

- `main` is not protected: anyone with write access can push without CI (domain 3).
- No HSTS, no CSP, no frame protection served (domain 1, `deploy/nginx.conf`).
- No secret scanner in CI on a public repository where agents push (domain 2).
- Third-party Actions pinned by tag (`@v4`), not SHA (domain 3).
- Critical advisories in dev dependencies: `vitest` (direct) and `tinypool` — fix available
  (domain 4).
- Release discipline: version and changelog do not follow the tags (domain 5).

**P2**

- Three `sourced` scores cite `http://` pages (domain 6).
- `CLAUDE.md:21` contradicts the « vous » rule (domain 8).
- Eight moderate advisories in the eslint toolchain (dev only).
- `docs/deploy.md:13` names the app directory `/home/ubuntu/labas/` — not a coordinate, but worth
  keeping generic.

## 7. Newcomer flow

`git clone` → `nvm use` (Node 24) → `npm install` → `npm run dev` (http://localhost:4321) →
`make check`. Documented in `README.md:83-113`. No database, no secret needed to run or test; the
legal host is an optional build variable.

## 8. Security and privacy posture

Static nginx container behind the shared reverse proxy; no server-side code, no form, no account.
Served headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`. Missing: `Strict-Transport-Security`, `Content-Security-Policy`
(the page loads only same-origin scripts, fonts and photos, plus the Plausible script when
configured), `X-Frame-Options` / `frame-ancestors`. Analytics: cookieless, off until
`PUBLIC_PLAUSIBLE_DOMAIN` is set, sensitive answers never sent. Secrets: none tracked; deploy
credentials in GitHub variables and secrets. Supply chain: Actions by tag, no Dependabot, two
critical dev-only advisories. Branch protection: none.

## 9. Data honesty

| #   | Check                                                                                | Verdict                                                                                           |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1   | Every labelled score; sourced scores with a dated https source                       | **Fail** — 3 `http://` sources                                                                    |
| 2   | Editorial scores never presented as measured                                         | Pass — the city page shows the confidence label                                                   |
| 3   | Racism and xenophobia cases quoted in the source's words, with name, year and source | Pass — 8 / 8                                                                                      |
| 4   | Travel advice dated and informative, never removing a city                           | Pass — `advisory.ts`, `bestMatches` and tests                                                     |
| 5   | Every city has a hearsay reputation, a surprise and dated sources                    | Pass — 115 / 115                                                                                  |
| 6   | Photos freely licensed with author and source                                        | Pass — 112 / 115 (Bo, Buchanan, Teyateyaneng without)                                             |
| 7   | Review lists                                                                         | Debt — about 1,450 open lines across `scores-review.md`, `city-lines-review.md`, `life-review.md` |

## 10. Prioritised actions

1. Protect `main`: pull request required, `check` and `image` required (domain 3).
2. Add gitleaks to CI and make it required (domain 2).
3. Serve HSTS, a CSP and `frame-ancestors` from `deploy/nginx.conf` (domain 1).
4. Bump `vitest` to clear the critical advisories (domain 4).
5. `/labas-release`: version and `CHANGELOG.md` follow each tag (domain 5).
6. Husky with commitlint and lint-staged (domain 3).
7. Pin Actions by SHA and enable Dependabot for Actions and npm (domain 3).
8. Replace the three `http://` sources with `https://` (domain 6).
9. Fix `CLAUDE.md:21` to « vous » (domain 8).
10. Burn down the review lists, starting with safety, racism and conflict lines (domain 6).

## 11. Conclusion

Là-bas is honest and private by design, and its engine is guarded by tests that encode the
operator's principles. What stands between it and a public launch is hardening and process:
branch protection, secret scanning, security headers, release discipline. Actions 1 to 5 would
bring the score to about 8.
