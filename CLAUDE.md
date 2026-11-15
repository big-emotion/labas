# CLAUDE.md

Là-bas is a one-page static Astro site: ten chip questions rank 115 African cities live in
the browser. `README.md` covers the product, the data caveat and the roadmap.

## Rules

- **Reader-facing text is French**, plain and everyday; docs, comments and commits are English.
- **Mobile first**: design and check at 430 px, then 768, then 1440. Every tap must visibly
  change something: from the third answer the map colours every city by its score and names
  the current top three (« En tête pour l'instant », V3 mockup, operator 2026-11-15). The free
  quiz asks its questions in a fixed order of four chapters so the reader sees « question 7
  sur 18 »; adaptive picking is kept for /approfondir only.
- **Test first** (Vitest, `src/**/*.test.ts`), through the public functions `rankCities` and
  `bestMatches`, never through private helpers. KISS: no framework island, no backend.
- **Data honesty**: scores in `src/data/cities.json` are editorial estimates. Never present them
  as measured, present the temperament chapter only as « inspirée du Big Five, ce n'est pas un test de
  personnalité » and its archetype as preferences in « tu », never as « tu es », and add a dated source
  with any safety, racism, LGBT-rights or conflict remark. Travel advice (France Diplomatie,
  FCDO) is shown with each city as dated information and never removes or greys a city
  (operator, 2026-11-15: it is written for visitors who have never been there).
- **Privacy**: nothing leaves the browser. Fonts are self-hosted; do not add Google Fonts,
  trackers with cookies, or third-party embeds.
- Colours come from the tokens in `src/styles/global.css`, never literals in components.

## Commands

```bash
nvm use            # Node 24
npm run dev
make check         # the gate: lint, typecheck, format:check, tests, build
npx vitest run src/lib/ranking.test.ts
```

Commits follow Conventional Commits, without `Co-Authored-By` trailers.
