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

> ⚠️ **City scores are estimates, not survey results.**
>
> The 0–5 scores in `src/data/cities.json` were written by hand for the first prototype. Before
> public launch, every remark on safety, racism, LGBT rights or conflict needs a dated source,
> and a method page must explain how scores are set. Cities flagged `unsafe` (conflict zones)
> are ranked but never proposed.

---

## How it works

```
src/data/cities.json   115 cities: coordinates, 21 scores, languages, climates, texts
        │
src/lib/ranking.ts     answers ──▶ criterion weights ──▶ weighted score per city (0–1)
        │                          + reasons and drawbacks in plain French
src/pages/index.astro  chips ──▶ rankCities() on every tap ──▶ map, pinned top three, cards
```

Weights come from the prototype so its results stay recognisable. An unanswered question
drops out of the score; tapping a pressed chip clears it.

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

1. Source the sensitive remarks and publish `/methode`, `/mentions-legales`, `/confidentialite`.
2. Shareable result link and a 1080 × 1920 story image.
3. One page per city (`/ville/<slug>`), for search and for each Instagram post.

---

## Contributors

| Role                 | GitHub                                   |
| -------------------- | ---------------------------------------- |
| Creator & maintainer | [@jean-noe](https://github.com/jean-noe) |
