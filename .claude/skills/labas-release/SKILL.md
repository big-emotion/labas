---
name: labas-release
description: Prepare and ship a Là-bas production release to labas.africa. Proposes the next semver version from the commits since the last tag, bumps package.json, updates CHANGELOG.md (Keep a Changelog), lands both through a pull request on the protected main, then — after explicit confirmation — tags the merge commit and pushes the tag, which is the deploy, and checks the live site. Use when the user says "release Là-bas", "déploie", "mets en ligne", "cut a release", "bump version", or invokes /labas-release.
metadata:
  author: Big Emotion
  version: "1.0.0"
---

# Là-bas Release

Adapted from `ethniafrica-release` to Là-bas's model: **pushing a `v*` tag is the deploy**
(`.github/workflows/deploy-production.yml`, see `docs/deploy.md`). Pushing `main` deploys nothing.
There is no GitHub Release to publish.

`main` is protected (pull request required; `check`, `image` and `gitleaks` required, admins
included), so the version bump lands through a pull request before the tag.

**Nothing deploys without an explicit « go » from the user at Step 6.** Until then the work is a
branch and a pull request.

## When to activate

"release Là-bas", "déploie", "mets en ligne", "cut a release", "bump version", or
`/labas-release [patch|minor|major|<version>]`.

## Preconditions — stop on the first failure, change nothing

1. Repo root (`package.json` `"name": "labas"`), clean tree (`git status --porcelain` empty).
2. Up to date: `git fetch origin`; work from `origin/main`.
3. CI green on `origin/main`: `gh run list --workflow ci.yml --branch main --limit 1` is `success`.
4. Something to ship: `git log --oneline <last_tag>..origin/main` is not empty.
5. No open pull request the user expects in this release is left out — list open PRs
   (`gh pr list`) and ask if any should go first.

## Step 1 — Versions

- `last_tag` = `git tag --sort=-v:refname | head -1` (e.g. `v0.1.4`).
- Current version = the higher of `package.json` `.version` and `last_tag` (they drifted before
  this skill existed; the tag wins).
- Proposal from Conventional Commits since `last_tag`: `feat!` or `BREAKING CHANGE` → major,
  `feat` → minor, otherwise patch. While the version is `0.x`, a major proposal becomes minor.
- Show the proposal with the commit list; **wait for the user to confirm or override.**

## Step 2 — Changelog

`CHANGELOG.md` at the root, [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), English.
Create it if missing with an `[Unreleased]` section. Add `[<version>] - <YYYY-MM-DD>` with:

| Section  | From                              |
| -------- | --------------------------------- |
| Added    | `feat`                            |
| Changed  | `refactor`, `perf`, `style`       |
| Fixed    | `fix`                             |
| Security | `security`, secret or header work |
| Removed  | `revert`, removals                |

Skip merge commits and noisy `chore`, `ci`, `docs`, `test` lines unless they matter to a reader or
an operator. Write each line for a reader of the site, not as a commit subject. Link references at
the bottom: `[<version>]: https://github.com/big-emotion/labas/compare/<last_tag>...v<version>`.

## Step 3 — Release branch and pull request

```bash
git switch -c release/v<version> origin/main
npm version <version> --no-git-tag-version   # package.json and package-lock.json
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): v<version>"
git push -u origin release/v<version>
```

Open the PR and **capture its number from the command's output** — never guess it (another
session may open a PR at the same moment):

```bash
url=$(gh pr create --base main --head release/v<version> --title "chore(release): v<version>" --body-file <changelog section>)
n=${url##*/}
```

## Step 4 — Wait for CI and merge

Wait until `gh pr checks "$n"` has no pending check. All of `check`, `image`, `gitleaks` must
pass; on a failure stop and report. Then `gh pr merge "$n" --merge` and confirm
`gh pr view "$n" --json state` is `MERGED`.

## Step 5 — Prepare the tag (local)

```bash
git fetch origin
git tag -a v<version> -m "v<version>: <one-line summary>" origin/main
```

Check the tag points at the release merge commit (`git log -1 v<version>`).

## Step 6 — Confirm, then deploy

Show: version, the changelog section, the commit the tag points at, and « pousser ce tag met le
site en ligne ». **Wait for an explicit go.** Then:

```bash
git push origin v<version>
```

Find the deploy run (`gh run list --workflow deploy-production.yml --limit 1`), watch it
(`gh run watch <id> --exit-status`). On failure: report the failing step, and point to the
rollback in `docs/deploy.md` (Actions → Deploy production → Run workflow on the previous tag).

## Step 7 — Verify live

`curl -s -o /dev/null -w "%{http_code}" https://labas.africa/` is `200`, and one string that
this release changed is present in the served page. Report the version, the deploy run, and
what readers will see.

## Out of scope

Editing code beyond the version and changelog; changing branch protection; publishing to social
networks; rolling back without the user asking.
