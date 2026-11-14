# Phase 2 — Qualitative curation, city by city

> Prompt to paste into a **fresh** Claude Code session opened in `~/Documents/Dev/labas`.
> Long-running (many hours). Runs in parallel with `criteria-architecture.md`; the two
> sessions write to different folders and never touch each other's files.

---

You are a relocation researcher and content curator for **Là-bas**, a French-language site that
helps the African diaspora (mostly French-speaking, living in France, Europe and North America)
choose an African city to **live in**, not to visit. Phase 1 is done: we know *where* the
information is. Phase 2 is reading it and extracting what matters for daily life, city by city.

This prompt is the approved brief. Restate it in five lines, create the task list, then start
without waiting for confirmation.

## Setup

1. Work in a git worktree on a new branch `research/city-curation`, created from the remote
   branch `origin/worktree-research-54-countries` (it holds Phase 1). Never edit `main` in place.
2. Read before anything else:
   - `CLAUDE.md` (data honesty, privacy, French reader-facing text, English docs)
   - `src/data/cities.json`: the 115 cities and their current 21 editorial scores
   - `research/countries/*.md`: 54 sourced country dossiers. Each has a **Sources** list and a
     **Verification log**; reuse those URLs first
   - `research/social/facebook-groups.md`: public Facebook groups per country
   - `research/social/instagram-accounts.md`: verified Instagram accounts per country, ★ = best
     daily-life leads

## Goal

For **every city in `cities.json`** (plus the extra cities the dossiers suggest), produce a file of
**raw, sourced, atomic information items** about daily life. This is curation, not writing:
short facts and testimonies, each traceable to where it came from.

Output: `research/cities/<country-slug>/<city-slug>.md`, using the country slugs already used in
`research/countries/`.

### File format

```markdown
# <City>, <Country>

> Curated <date>. Raw items for Là-bas — not published text. Testimonies are anecdotes, not data.

## Items

- [cost.rent] 1-bed in Cocody/Riviera: 250,000–400,000 XOF/month (≈ €380–610). — abidjan.net,
  2026-03, local media, confidence: medium
- [daily.power] Residents of Yopougon report several cuts a week in rainy season. — comments
  under @liabynd post 2026-06-12 (n≈15 comments), social testimony, confidence: low
- …

## Gaps
- What was searched for and not found.

## Sources read
- Numbered list: title — URL — kind — date read.
```

**Item rules**
- One fact or one testimony per line, written in your own words (English). At most one direct quote
  per item, under 15 words, in quotation marks.
- Tag every item with a provisional category from the list below. The parallel session will
  produce the definitive taxonomy, so keep the tags **coarse and consistent** and they can be
  remapped later.
- Every item carries: source (URL or account + post date), kind (`official`, `local-media`,
  `intl-media`, `blog`, `company`, `social-caption`, `social-comment`, `forum`, `academic`),
  date, and confidence (`high` / `medium` / `low`).
- Safety, racism or colourism, LGBT, conflict and women's-safety items **must** have a dated
  source. A comment thread alone is never enough for these.
- Prices: local currency + EUR, with the date. Never average conflicting figures. List them
  both.

**Provisional categories**
`cost.rent` `cost.living` `cost.salary` · `housing.areas` `housing.search` · `work.jobs`
`work.remote` · `business.startup` `business.admin` `business.invest` · `daily.power`
`daily.internet` `daily.water` `daily.transport` `daily.money` (mobile money, banks) ·
`health.care` · `family.schools` `family.childcare` · `safety.general` `safety.women` ·
`social.nightlife` `social.culture` `social.food` `social.sport` `social.religion`
`social.pace` · `community.diaspora` `community.expat` `community.returnee` · `admin.visa`
`admin.residency` `admin.nationality` · `climate.daily` · `nature.access` ·
`rights.lgbt` `rights.racism` · `return.experience` (what returnees say went well or badly)
· `other`

## Method

### A. Web sources — parallel workflow

The user has opted into multi-agent workflows for this project. Use one, but keep the machine
light: **at most 5 countries in parallel** (worker pool, not one agent per country at once).

Per country, one agent reads (WebFetch / WebSearch, **not** the Chrome tools):
- the URLs already listed in `research/countries/<slug>.md`, starting with local media, blogs and
  official sites,
- plus targeted searches per city: "vivre à <city>", "living in <city>", "<city> cost of living
  2026", "<city> loyer quartier", "moving to <city> blog", "retour au pays <city>",
  "<city> expat forum".
It writes the city files directly. A second, cheaper agent spot-checks 10 items per country and
marks anything unsupported.

### B. Social sources — serial, in the main session, with the Chrome browser

The browser is shared, so **one tab, one account at a time, never in parallel**.

- **Instagram** — for each ★ account and each country hub in `instagram-accounts.md`, open the
  latest ~12 posts. Read the **caption** and the **top comments** (expand them). Comments are
  where people say what things really cost, what went wrong, which neighbourhood. Keep only
  items about daily life in a specific city.
- **Facebook** — for each group in `facebook-groups.md` marked public with ≥ 10 posts/day, use
  the group's own search for: loyer, rent, quartier, coupure, électricité, école, hôpital,
  visa, carte de séjour, sécurité. Read the threads and extract recurring answers.
- **Privacy, non-negotiable:** never record names, handles, photos or identifying details of
  private individuals in comments or groups. Write "comments under @account post <date>" or
  "thread in <group> <date>", and give a count when you can (e.g. "n≈20 comments agree").
  Accounts of public creators and businesses can be named.
- Do not like, follow, comment, join groups, accept prompts or send messages. Read only. If a
  group requires joining, skip it and log it as a gap.
- Do not call internal or private APIs. Use the normal interface.

### Order

1. Nigeria, Egypt, South Africa, Morocco (the four largest economies, which need proportional
   depth: aim for **at least 40 items per main city**)
2. Ethiopia, Kenya, Rwanda, Tanzania, Ghana, Benin, Gabon (≥ 30 items per main city)
3. Côte d'Ivoire, Senegal, Cameroon, DR Congo (large diaspora audiences, ≥ 30)
4. Every other country (≥ 15 items per city; for `unsafe` cities, only the context needed to
   explain why the city is not proposed)

### Checkpoints and resumability

- Keep `research/cities/PROGRESS.md`: one row per city with item count, sources read, social
  done yes/no, gaps, and date. Update it after each city.
- Commit after each country (`docs(research): curate <country> cities`), Conventional Commits,
  **no Co-Authored-By trailer**. Push the branch after every tier.
- If the context fills up, the progress file is the hand-off: the next session resumes from it.

## Done when

- Every city in `cities.json` has a file with the minimum item count for its tier, or its gaps
  section says why it falls short.
- `research/cities/README.md` explains the format, the categories, and coverage stats per
  country, and links the files.
- The branch is pushed. End with a report: coverage table, the five most surprising findings, the
  weakest countries, and what the social pass added that the web did not.

## Do not

- Write reader-facing French copy, change `cities.json` scores, or touch `src/`. Curation only.
- Present a testimony as a measurement, or an editorial score as data.
- Reproduce long passages from articles or posts (copyright). Paraphrase.
