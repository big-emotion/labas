# Là-bas

> **Find the African city that resembles you. A one-screen quiz for the diaspora looking towards the continent.**

```
10 questions (tap a chip)  ──▶  115 cities scored in the browser  ──▶  live map + your top three
```

Là-bas asks ten short questions — project, budget, family, work, language, city size,
landscape, climate, Saturday night, non-negotiables — and ranks 115 cities across the 54
African countries as the reader answers. Every tap re-lights the map. The site is in French;
its audience is the French-speaking diaspora first.

---

## What Là-bas is — and isn't

**Là-bas is:**

- a single page: the form, the map and the results on one screen, no steps;
- fully static: every score is computed in the reader's browser, nothing is stored or sent;
- honest about each city: every result carries what to watch out for.

**Là-bas is not:**

- travel or safety advice: city scores are editorial estimates (see below);
- a personality test: one question about Saturday night is compared with a city's social
  energy, and the page never claims to measure a trait;
- part of [EthniAfrica](https://github.com/big-emotion/EthniAfrica). It is a separate project that
  shares its typography.

---

> ⚠️ **City scores are sourced, but not all of them, and not for ever.**
>
> Each of the 16 criteria is scored 0–5 on a written rubric (`src/data/criteria.json`, shown on
> `/methode`), with a justification, a confidence level and dated sources. About one score in
> five is still unknown and counts as a neutral 2.5. French and UK travel advice is shown with
> each city as dated information; it never removes or greys a city.

---

## How it works

```
src/data/cities.json        115 cities: who they are (coordinates, size, pitch, « à savoir »)
src/data/criteria.json      the 16 criteria: plain-French label, meaning, rubric 1 / 3 / 5
src/data/city-scores.json   per city: 16 scores (level, justification, confidence, sources)
        │                   and facts (languages, climate, landscape, travel advice)
src/data/countries.json     per country: paperwork, visa, dual nationality, same-sex law…
src/data/city-lines.json    per city: « On dit », « Ce qui pourrait te surprendre »,
        │                   neighbourhoods, own « pourquoi toi » sentences, sources
src/data/africa-borders.json Natural Earth 1:50m borders (public domain), projected like the dots
src/data/photos.json        per city: a Wikimedia Commons photo (public/photos) and its credit
src/lib/ranking.ts          answers ──▶ weights ──▶ weighted score (0–1), coverage, filters
        │                   + reasons, drawbacks and « pourquoi toi » lines (portrait.ts)
src/pages/index.astro       the quick quiz, one question at a time: a bordered map coloured by score,
                            « C'est prêt », « Tes trois villes »
src/pages/approfondir.astro the fuller questionnaire, one question at a time (adaptive.ts)
src/pages/ville/[slug]      one page per city: every criterion with its sources
src/pages/methode.astro     the rubric, the confidence levels, what is never scored
```

Weights come from the prototype so its results stay recognisable. An unanswered question
drops out of the score; tapping a pressed chip clears it. The page speaks to the reader with
« vous ». The only ordering rule is the score. The design behind all this, and what comes next,
is in [`docs/criteria/architecture.md`](docs/criteria/architecture.md).

### Questions left out of the one-screen form

The prototype asked 24 questions over several steps. These were cut to fit one screen and can
come back if they earn their place: past trips and known regions, family ties and the
"rediscover or discover" choice, a city already in mind, four of the five temperament
questions (novelty, order, competition, stress tolerance), career ambition, travel needs,
investment plans and leisure.

---

## Requirements

- Node.js 24 (`.nvmrc`, `engines`; the Dockerfile and CI use 24 too) — `nvm use`
- npm

## Setup

```bash
nvm use
npm install
npm run dev        # http://localhost:4321
```

## Legal notice

`/mentions-legales` must name the host, but this public repository never does. Set the host at
build time:

```bash
LEGAL_HOST_NAME="…" LEGAL_HOST_ADDRESS="…" npm run build
```

Without them the page describes the host's role instead of naming it.

## Development

```bash
make check         # lint + typecheck + format:check + tests + build
npm test           # Vitest, src/**/*.test.ts
npm run test:watch
```

`make check` is the gate before every push; CI runs the same command on pull requests.

### Adding what people say about a city

A first-hand account (a screenshot, a message, a photo) goes through the project skill
[`labas-testimony`](.claude/skills/labas-testimony/SKILL.md): it is filed anonymously in
`src/data/city-testimonies.json` and moves the score it bears on: by one level on one account,
further when a second account or a public source backs it.
`npm run testimony -- <city slug>` shows where two agree, and
`npm run testimony -- gaps` what people tell that the site has no field for.

### Adding or changing text

The site is bilingual: French (Là-bas, the source) and British English (Over There, under `/en/`
until overthere.africa is live). Every change to reader-facing text ships both languages in the
same pull request; the admin stays French only. The project skill
[`labas-translate`](.claude/skills/labas-translate/SKILL.md) says where each kind of text lives
(`Bilingual` copy next to the code, overlays in `src/data/en/`, one prose page per language under
`src/pages/en/`, addresses in `src/i18n/routes.ts`), keeps the fixed terms in its
[glossary](.claude/skills/labas-translate/glossary.md) and checks the English build for leftover
French. A missing English text is a type error, so `make check` catches it.

### The server part

The site is static, except for one small Node service, `src/server/`. It handles:

- the e-mails a reader asks for: the news sign-up with double opt-in, and their results
  (`subscribe.ts`, `emails.ts`, Microsoft Graph; the news list in Postgres, `news.ts`);
- saved journeys and « Mon espace », with Postgres and a login link sent by e-mail (`accounts.ts`,
  rationale in [`docs/accounts.md`](docs/accounts.md)).

`npm run build:server` bundles it into `dist-server/subscribe.mjs`. Its tests run in `npm test`,
against a real Postgres (PGlite). Without its secrets it answers 503, and the site works the same.
Setup, secrets and backups are in [`docs/deploy.md`](docs/deploy.md).

---

## Brand

- **Name:** Là-bas — the word the diaspora already uses for the continent.
- **Mark:** the grave accent of « là » drawn as Africa, in saffron, at the end of a dotted flight
  path (`src/components/Wordmark.astro`, `public/favicon.svg`).
- **Type:** Fraunces, Nunito Sans, JetBrains Mono — self-hosted, so no visit reaches Google.
- **Colour:** night blue (`#161A5C`) and saffron (`#FFB627`), coral for what counts against.
- **Design system:** tokens, type, components and usage rules, built from this code:
  <https://claude.ai/artifact/XUL4V2mUjGZuWr64bn5XBP> (private; ask the maintainer for access).
- **Share pictures:** drawn at build time by `src/lib/share-card.ts` (satori, resvg, sharp) — one
  for the home page, one per city with its credited photo, served from `/og/`. No page calls a
  third party to draw them.

## Roadmap

1. Clear the review lists, then launch publicly.
2. Shareable result link and a 1080 × 1920 story image.
3. Personal coaching behind « Aller plus loin » (the questionnaire is open to everyone for now).
4. The free-text entry, with explicit consent.

---

## Contributors

| Role                 | GitHub                                   |
| -------------------- | ---------------------------------------- |
| Creator & maintainer | [@jean-noe](https://github.com/jean-noe) |
