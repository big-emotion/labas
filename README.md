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
> five is still unknown and counts as a neutral 2.5. Editors' doubts are listed in
> `docs/criteria/scores-review.md` and `docs/criteria/city-lines-review.md`; clear them before a
> public launch. Cities that French or UK travel advice warns against are ranked but never
> proposed, and the rule is derived from the stored advice, not set by hand.

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
src/pages/index.astro       the free quiz, one question at a time: a bordered map coloured by score,
                            « C'est prêt », « Tes trois villes »
src/pages/approfondir.astro the fuller questionnaire, one question at a time (adaptive.ts)
src/pages/ville/[slug]      one page per city: every criterion with its sources
src/pages/methode.astro     the rubric, the confidence levels, what is never scored
```

Weights come from the prototype so its results stay recognisable. An unanswered question
drops out of the score; tapping a pressed chip clears it. The page speaks to the reader with
« tu ». The only ordering rule is the score. The design behind all this, and what comes next,
is in [`docs/criteria/architecture.md`](docs/criteria/architecture.md).

### Questions left out of the one-screen form

The prototype asked 24 questions over several steps. These were cut to fit one screen and can
come back if they earn their place: past trips and known regions, family ties and the
"rediscover or discover" choice, a city already in mind, four of the five temperament
questions (novelty, order, competition, stress tolerance), career ambition, travel needs,
investment plans and leisure.

---

## Requirements

- Node.js 24 (`.nvmrc`; Astro 7 needs ≥ 22.23.4) — `nvm use`
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

---

## Brand

- **Name:** Là-bas — the word the diaspora already uses for the continent.
- **Mark:** the grave accent of « là » drawn as a dotted flight path landing on a saffron city
  (`src/components/Wordmark.astro`, `public/favicon.svg`). Sketch quality: the final logo should
  be redrawn as outlined vectors.
- **Type:** Fraunces, Nunito Sans, JetBrains Mono — self-hosted, so no visit reaches Google.
- **Colour:** night blue (`#161A5C`) and saffron (`#FFB627`), coral for second rank.

## Roadmap

1. Clear the review lists, then launch publicly.
2. Shareable result link and a 1080 × 1920 story image.
3. Personal coaching behind « Aller plus loin » (the questionnaire is open to everyone for now).
4. The free-text entry, with explicit consent (docs/criteria/architecture.md §7).

---

## Contributors

| Role                 | GitHub                                   |
| -------------------- | ---------------------------------------- |
| Creator & maintainer | [@jean-noe](https://github.com/jean-noe) |
