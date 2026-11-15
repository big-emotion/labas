---
name: labas-audit
description: Production-readiness audit for Là-bas (this repo, labas.africa). Read-only, scored, evidence-based assessment that answers five questions — is the site ready for real readers, is the data honest (sourced, dated, labelled), can a newcomer go clone-to-running in one session, what is the security and privacy posture, and is the score close to 8–9/10. Writes docs/PRODUCTION-READINESS-AUDIT.md and nothing else. Use when the user asks "audit Là-bas", "is it ready", "production-readiness check", "score the project", or invokes /labas-audit.
metadata:
  author: Big Emotion
  version: "1.0.0"
---

# Là-bas Audit

Read-only audit of this repository. Adapted from `ethniafrica-audit` and the Big Emotion
project-standard audit, cut to what Là-bas is: a static Astro site, no backend, no database, a
matching engine in the browser, a public repository, deployed by tag to one VPS.

**The repository is the authority.** When this skill and the code or `CLAUDE.md` disagree, score
against the repository, record the disagreement as a Domain 8 finding, and never let it make a
criterion easier.

This skill **never** edits source, bumps versions, tags, pushes, deploys or writes to an external
service. The only tracked file it writes is `docs/PRODUCTION-READINESS-AUDIT.md`. `dist/` and
`.astro/` are refreshed by the build (gitignored). Fixes go through normal PRs and releases
through `/labas-release`.

## Measure outcomes, not configuration

- **A workflow file is not a gate.** Read the runs (`gh run list`) and the protection API
  (`gh api repos/big-emotion/labas/branches/main/protection`), not the YAML. A workflow that never
  ran, was skipped, ran red, or is not a required check scores as **absent**.
- **What could not be measured is `N/A`, with its reason, and `N/A` never counts as a pass.**
- **A count is a measurement taken this run.** A number copied from a doc is a claim.

## Preconditions

Run from the repo root (`package.json` with `"name": "labas"`), on an up-to-date `main`
(`git fetch && git status`). Otherwise stop and say so.

Optional argument `--quick`: skip `make check` and rely on the last CI run on `main`; mark the
domains scored from it as such.

## Step 1 — Snapshot

In parallel: `git status --porcelain`, `git log --oneline -15`, `git tag --sort=-creatordate | head -5`,
`jq '{name, version, scripts}' package.json`, `ls .github/workflows docs`, `ls .claude/skills`.

## Step 2 — Read the previous report

If `docs/PRODUCTION-READINESS-AUDIT.md` exists, update it in place and keep its structure:

1. Scope and method (what was measured, what is `N/A` and why)
2. The five questions, answered
3. Overall score (X.X / 10) and one-line verdict
4. Score per domain (8 rows)
5. Strengths
6. Gaps and risks, each with `file:line` or run-id evidence, P0 / P1 / P2
7. Newcomer flow (clone → running)
8. Security and privacy posture
9. Data honesty
10. Prioritised actions (12 max)
11. Conclusion

Set `Date:` to today.

## Step 3 — Gather evidence

**Gates** (skip with `--quick`): `npm ci` if `node_modules` is stale, then `make check` (infra
disclosure, lint, typecheck, format, tests, build). Record the test count.

**Always** (read-only):

- CI outcomes: `gh run list --workflow ci.yml --branch main --limit 5` and
  `gh run list --workflow deploy-production.yml --limit 3` — last conclusion of each.
- Branch protection on `main`, measured: is a PR required, which checks are required. Refused →
  `N/A`.
- Secrets: `git ls-files | grep -iE '\.env'` (only example files allowed); token patterns
  `git grep -nE '(ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|sk_[A-Za-z0-9]{16,}|eyJ[A-Za-z0-9_-]{30,})'`
  must return nothing; is a secret scanner (gitleaks) a required CI check?
- Public-repo hygiene: `./scripts/check-infra-disclosure.sh` green (no server name, IP or
  provider); `git grep -nE '/Users/|/home/[a-z]'` for workstation paths.
- Supply chain: third-party Actions pinned by SHA (`git grep -nE "uses: .+@(v[0-9]+|main|master)" .github/workflows`);
  `npm audit --audit-level=moderate` counts by severity.
- Headers: `deploy/nginx.conf` — HSTS, `X-Content-Type-Options`, `Referrer-Policy`, a CSP; and
  the live site `curl -sI https://labas.africa/` (read-only GET) to confirm what is served.
- Privacy: `src/lib/analytics.ts` — nothing loads without `PUBLIC_PLAUSIBLE_DOMAIN`; origin,
  family country, feeling at home, faith, health and same-sex-law answers are never sent (its
  tests must say so); no cookie, no third-party embed, fonts self-hosted
  (`git grep -n "fonts.googleapis" src` must be empty).
- Engine audits, from the test run: every city can come first (`fit.test.ts`), realistic readers
  spread over many first cities, documented racism keeps Black readers out whatever their taste
  for adventure, a reader who gives no origin is protected, each project gets a coherent path
  (`adaptive.test.ts`).
- Hooks: `.husky/` with pre-commit and commit-msg, `commitlint` and `lint-staged` configured.

**Data honesty** — the domain-critical surface; seven checks, each pass / fail / `N/A`:

1. Every score in `src/data/city-scores.json` with a level carries a confidence label, and every
   `measured` / `sourced` / `survey` score has at least one https source with an `accessed` date.
2. No score is presented as measured on the site when its confidence is `editorial`
   (`src/pages/ville/[slug].astro` shows the label).
3. Every documented racism or xenophobia case in `src/data/countries.json` has a `label` in the
   source's own words with its name and year, and at least one https source.
4. Travel advice is dated and shown as information, never removes a city
   (`src/lib/advisory.ts`, `bestMatches`).
5. Quick-quiz lines (`src/data/city-lines.json`): every city has a reputation introduced as
   hearsay, a surprise and dated sources (`lines.test.ts`).
6. Photos (`src/data/photos.json`): free licence, author, Commons source for each; count the
   cities without one.
7. Open review lists: count unresolved items in `docs/criteria/*-review.md`; they are debt, not
   failures, unless a claim is published as fact without a source.

## Step 4 — Score

Eight domains, 1–10 each, equal weight; overall = mean, one decimal. P0 blocks real readers, P1
must land before a public launch, P2 nice to have. One defect, one canonical severity, counted in
its most causal domain.

| #   | Domain                        | What earns a high score                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Security & privacy            | Static site, no server code; strict headers including a CSP, served live; nothing sensitive leaves the browser; analytics off until configured and cookieless; no third-party embed.                                                                                                                           |
| 2   | Secrets & public-repo hygiene | No secret in history or tree; gitleaks a **required** check; infra-disclosure and workstation-path checks green; `.gitignore` covers `.env*` and `.claude/worktrees/`.                                                                                                                                         |
| 3   | CI & change management        | Last `ci.yml` runs on `main` green; `main` protected with the CI checks required; Actions SHA-pinned; hooks in place.                                                                                                                                                                                          |
| 4   | Correctness & tests           | `make check` green; the engine audits above pass; tests go through public functions (`rankCities`, `bestMatches`, `freeQuestions`); no growing skip list.                                                                                                                                                      |
| 5   | Deploy & release              | A `v*` tag is the only thing that deploys; last deploy run green and its smoke check passed; `package.json` version and `CHANGELOG.md` follow the tags; rollback by `workflow_dispatch` documented in `docs/deploy.md`.                                                                                        |
| 6   | Data honesty                  | Step 3 data checks, scored literally: all pass → 9–10; one failure or `N/A` → 7–8; two → 5–6; three or more → ≤ 4. A published unsourced safety, racism, LGBT or conflict claim caps the domain at 4.                                                                                                          |
| 7   | Reader experience             | Mobile first (430 px) holds; one form of address across the site (« vous » since 2026-11-15); plain French; questions direct, each with its one-line stake; accessible controls (labels, focus, `aria-pressed`). Score from the build and a read of `src/pages/index.astro`; live checks are `N/A` unless run. |
| 8   | Docs & newcomer flow          | `README.md` gets a newcomer from clone to `npm run dev` and `make check`; `docs/deploy.md` matches the workflows; `CLAUDE.md` agrees with the code; every command a doc names exists.                                                                                                                          |

## Step 5 — The five questions

1. **Ready for real readers?** Yes / No / Conditional, with at most three blockers.
2. **Is the data honest?** The seven checks, the failed ones named.
3. **Clone → running in one session?** Walk `git clone`, `nvm use`, `npm ci`, `npm run dev`,
   `make check`; every undocumented step is a P1.
4. **Security and privacy posture?** One paragraph: headers, secrets, public-repo hygiene, what
   leaves the browser, supply chain, branch protection as measured.
5. **Close to 8–9/10?** The score, the gap, the three actions that close it.

## Step 6 — Write and report

Update the report (English). Then print at most 25 lines:

```
Là-bas Audit — <YYYY-MM-DD>
Score: X.X / 10 (target 8–9)

1. Ready for real readers? <verdict + reason>
2. Data honest? <failed checks, or "all seven pass">
3. Clone → running? <verdict + blocking step>
4. Security & privacy? <one line>
5. Distance to 8–9? <top 3 actions>

Full report: docs/PRODUCTION-READINESS-AUDIT.md
```

## Verification

- [ ] Every domain score cites evidence (command output, run id or `file:line`).
- [ ] CI, protection and deploy were read as outcomes, not inferred from YAML.
- [ ] Every `N/A` has its reason and was not counted as a pass.
- [ ] `git status --porcelain` shows only `docs/PRODUCTION-READINESS-AUDIT.md` changed.

## Out of scope

Fixing what the audit finds; any write to GitHub settings, the VPS, Plausible or DNS; load or
Lighthouse runs against production; editorial rewriting of city data.
