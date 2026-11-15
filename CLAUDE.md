# CLAUDE.md

Là-bas is a one-page static Astro site: ten chip questions rank 115 African cities live in
the browser. `README.md` covers the product, the data caveat and the roadmap.

## Rules

- **Reader-facing text is French**, plain and everyday; docs, comments and commits are English.
- **Mobile first**: design and check at 430 px, then 768, then 1440. Every tap must visibly
  change something: while the reader answers, the map colours every city by its score but names
  none; the top three are named only with the result (decided 2026-11-15).
- **Test first** (Vitest, `src/**/*.test.ts`), through the public functions `rankCities` and
  `bestMatches`, never through private helpers. KISS: no framework island, no backend.
- **Data honesty**: scores in `src/data/cities.json` are editorial estimates. Never present them
  as measured, never claim a question "measures" a personality trait, and add a dated source
  with any safety, racism, LGBT-rights or conflict remark. `unsafe` cities are never proposed.
- **Privacy**: answers are computed and kept in the browser. The only thing sent is one
  anonymous, cookieless Plausible event per level-1 answer (`src/lib/analytics.ts`, only when
  `PUBLIC_PLAUSIBLE_DOMAIN` is set); health and LGBT filters are never sent. Fonts are
  self-hosted; do not add Google Fonts, trackers with cookies, or third-party embeds.
- Colours come from the tokens in `src/styles/global.css`, never literals in components.

## Commands

```bash
nvm use            # Node 24
npm run dev
make check         # the gate: lint, typecheck, format:check, tests, build
npx vitest run src/lib/ranking.test.ts
```

Commits follow Conventional Commits, without `Co-Authored-By` trailers.
