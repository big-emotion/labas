# Production-readiness audit — Là-bas

Date: 2026-11-15 (second run) · Skill: `/labas-audit` 1.0.0 · Commit audited: `origin/main` at
`v0.5.0` plus branch `chore/tidy` (nginx manifest type, legacy answer fields removed) · Live:
`v0.5.0`

## 1. Scope and method

Read-only audit of the repository and of what labas.africa serves, against the eight domains of
`.claude/skills/labas-audit/SKILL.md`. The first run scored 6.5 earlier the same day. Since then,
`v0.2.0` to `v0.5.0` have hardened the site and added features.

**Measured this run:**

- `make check` on the branch: infra disclosure, lint, typecheck (0 errors, 0 warnings), format,
  186 tests in 19 files, and the build of 121 pages. All green.
- The last five `ci.yml` runs on `main`: four `success`, one still running.
- The last three `deploy-production.yml` runs (`v0.3.0`, `v0.4.0`, `v0.5.0`): all `success`.
- Branch protection on `main`, read from the API: a pull request is required; `check`, `image`
  and `gitleaks` are required; admins are included.
- Token patterns and `.env` files over tracked files: none found.
- `scripts/check-infra-disclosure.sh`: green.
- Workstation paths, how Actions are pinned, and `npm audit`.
- The headers served by `https://labas.africa/`, read with a read-only `curl -sI`.
- The seven data-honesty checks over `src/data/*.json`.

**`N/A`:**

- Live accessibility and Lighthouse runs: not run. Reader experience is scored from the code and
  from the 430 px checks recorded in the PRs.
- Local full-history secret scan: not repeated here. It runs in CI on every PR as the required
  `gitleaks` check.

## 2. The five questions

1. **Ready for real readers?** **Yes**, for the open beta. There is no P0 and no P1 left. What
   remains is supply-chain tidiness and editorial debt.
2. **Is the data honest?** **All seven checks pass.**
   - Every one of the 1,840 scores that carry a level is labelled.
   - Every measured, sourced or survey score cites a dated `https://` source.
   - The eight documented racism or xenophobia cases each carry a label in the source's words and
     an `https` source.
   - Debt remains: 1,457 open lines in the three review lists, and three cities without a photo.
3. **Clone → running in one session?** **Yes.** `README.md` walks a newcomer through `nvm use`,
   `npm install`, `npm run dev` and `make check`. The gate is the same in CI.
4. **Security and privacy posture?** Strong.
   - Static site with strict headers, all served live: HSTS, a CSP limited to `'self'` and the
     Plausible collector, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and
     `Permissions-Policy`.
   - Nothing sensitive leaves the browser. Answers are kept in the reader's own `localStorage`
     and can be forgotten.
   - Analytics are cookieless. They never receive origin, family country, feeling at home, faith,
     health or same-sex-law answers.
   - Share pictures are drawn at build time.
   - `main` is protected and gitleaks is a required check.
   - Left open: Actions pinned by tag rather than SHA (the operator's choice), no Dependabot, and
     nine moderate advisories in dev or build-time dependencies.
5. **Close to 8–9/10?** **8.4 / 10.** Three actions close most of the remaining gap:
   - Dependabot for npm and Actions (domain 3).
   - Clear the build-time advisories (domain 4).
   - Start the review lists, beginning with the safety, racism and conflict lines (domain 6).

## 3. Overall score

**8.4 / 10** (up from 6.5). The product is sound and honest, and its delivery chain is now
hardened. What remains is maintenance and editorial work.

## 4. Score per domain

| #   | Domain                        | Score | Evidence                                                                                                                                                                                                                                                          |
| --- | ----------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Security & privacy            | 9     | Six security headers served live (`deploy/nginx.conf`). Sensitive answers are excluded in `src/lib/analytics.ts`. Answers stay in the reader's browser (`src/lib/keep.ts`). Fonts and share pictures are self-hosted.                                             |
| 2   | Secrets & public-repo hygiene | 9     | No secret or `.env` file tracked. gitleaks runs in `ci.yml` as a required check. `check-infra-disclosure.sh` is green, in CI and in pre-commit. `.gitignore` covers worktrees. Only P2: `docs/deploy.md:13` names a generic app directory.                        |
| 3   | CI & change management        | 7     | `main` is protected with three required checks, admins included. Husky runs commitlint and lint-staged. Six `uses:` are pinned by tag (`ci.yml` ×4, `deploy-production.yml` ×2), by the operator's choice. No Dependabot.                                         |
| 4   | Correctness & tests           | 8     | 186 tests green, including the engine audits: every city can come first, readers spread across first cities, reception rule, a path per project, share pictures (format, size, weight). `npm audit` reports 9 moderate advisories, all in dev or build-time code. |
| 5   | Deploy & release              | 9     | `v0.3.0`, `v0.4.0` and `v0.5.0` deployed green. `package.json` and `CHANGELOG.md` follow each tag through `/labas-release`. Rollback is documented in `docs/deploy.md`.                                                                                           |
| 6   | Data honesty                  | 9     | All seven checks pass (see §9). The review lists are debt, not failures.                                                                                                                                                                                          |
| 7   | Reader experience             | 8     | One form of address, « vous », enforced by tests. Direct questions, each with its stake. Checked at 430 px in the PRs. `v0.5.0` acted on beta feedback: answers kept and resumed, results kept, the duplicate question removed. Live accessibility is `N/A`.      |
| 8   | Docs & newcomer flow          | 8     | The README newcomer path is complete, and the brand section links to the design system. `docs/deploy.md` matches the workflows. `CLAUDE.md` agrees with the code, « vous » included.                                                                              |

## 5. Strengths

- The engine audits itself in its tests. Every city can be reached. No one is sent where
  anti-Black racism is documented. Each project gets a coherent path.
- Every one of the 1,840 scores carries its confidence. Every documented case is quoted in its
  source's words.
- Privacy is built in: everything is computed and kept in the browser, and sensitive answers are
  never sent.
- One gate, `make check`, serves contributors and CI. `main` is protected. Only a tag deploys,
  and each tag comes with its version and changelog.

## 6. Gaps and risks

**P1:** none.

**P2**

- No Dependabot for npm or Actions (domain 3).
- Actions pinned by tag, not SHA: 4 in `ci.yml` and 2 in `deploy-production.yml`. This is the
  operator's choice, recorded here (domain 3).
- Nine moderate advisories in dev or build-time dependencies (domain 4):
  - `fflate`, through `satori`. It runs only at build time, to draw the share pictures from the
    repository's own data.
  - `minimatch`, through `typescript-eslint`.

  None of this code ships to readers.

- 1,457 open lines in the review lists (domain 6): 829 in `scores-review.md`, 357 in
  `life-review.md`, 271 in `city-lines-review.md`.
- Three cities without a photo: Bo, Buchanan and Teyateyaneng (domain 6).
- `docs/deploy.md:13` names a generic app directory (domain 2).

## 7. Newcomer flow

`git clone` → `nvm use` (Node 24) → `npm install` → `npm run dev` (http://localhost:4321) →
`make check`. This is documented in `README.md`. No database and no secret are needed to run or
test.

## 8. Security and privacy posture

- **Hosting:** a static nginx container behind the shared reverse proxy. There is no server-side
  code and no account. Nothing collects reader data: the « keep » option opens the reader's own
  mail client.
- **Headers served:** `Strict-Transport-Security`; `Content-Security-Policy`, with scripts and
  connections limited to `'self'` and the Plausible collector, and `frame-ancestors 'none'`;
  `X-Frame-Options: DENY`; `X-Content-Type-Options: nosniff`; `Referrer-Policy`;
  `Permissions-Policy`.
- **Redirects:** relative, so folder redirects stay on https.
- **Analytics:** cookieless. Sensitive answers are never sent.
- **Secrets:** none tracked. gitleaks is required on every PR. Deploy credentials sit in GitHub
  variables and secrets.
- **Supply chain:** Actions pinned by tag, no Dependabot, and nine moderate advisories in dev or
  build-time code only.
- **Branch protection:** a pull request is required, three checks are required, and admins are
  included.

## 9. Data honesty

| #   | Check                                                                                | Verdict                                                      |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | Every labelled score; sourced scores with a dated https source                       | Pass: 1,840 / 1,840 labelled, 0 without a dated https source |
| 2   | Editorial scores never presented as measured                                         | Pass: the city page shows the confidence label               |
| 3   | Racism and xenophobia cases quoted in the source's words, with name, year and source | Pass: 8 / 8                                                  |
| 4   | Travel advice dated and informative, never removing a city                           | Pass: `advisory.ts`, `bestMatches` and their tests           |
| 5   | Every city has a hearsay reputation, a surprise and dated sources                    | Pass: `lines.test.ts`                                        |
| 6   | Photos freely licensed with author and source                                        | Pass: 112 / 112 photos (Bo, Buchanan, Teyateyaneng without)  |
| 7   | Review lists                                                                         | Debt: 1,457 open lines across the three lists                |

## 10. Prioritised actions

1. Enable Dependabot for npm and Actions (domain 3).
2. Clear the build-time advisories when `satori` and `typescript-eslint` release fixes
   (domain 4).
3. Work through the review lists, starting with the safety, racism and conflict lines (domain 6).
4. Find freely licensed photos for Bo, Buchanan and Teyateyaneng (domain 6).
5. Run a live accessibility and Lighthouse pass at 430 px (domain 7).
6. If the operator changes their mind, pin the Actions by SHA (domain 3).

## 11. Conclusion

In one day, Là-bas went from a sound product on a young delivery chain to a protected, scanned and
versioned site with strict headers. Its data stays honest by design. What stands between it and 9
is maintenance (Dependabot, advisories) and editorial work (the review lists), not risk to
readers.
