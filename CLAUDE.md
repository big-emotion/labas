# CLAUDE.md

Là-bas is a one-page static Astro site: ten chip questions rank 115 African cities live in
the browser. `README.md` covers the product, the data caveat and the roadmap.

## Rules

- **Beta, everything open** (operator, 2026-11-15): a quick quiz (`/`) and a deep
  questionnaire (`/approfondir`), both free. A paid part is a V2 idea, not built; never write
  « gratuit » or « payant » on the site.

- **Reader-facing text is French**, plain and everyday, addressed with « vous » (decided
  2026-11-15; tests reject « tu »); docs, comments and commits are English.
- **Mobile first**: design and check at 430 px, then 768, then 1440. Every tap must visibly
  change something: from the third answer the map colours every city by its score and names
  the current top three (« En tête pour l'instant », V3 mockup, operator 2026-11-15). The free
  quiz asks every question (« question 7 sur 18 »), opening on the project; then each answer
  picks the next question, the one most likely to change the top five (operator 2026-11-15).
- **Every answer orients the list** (operator, 2026-11-16, like a guessing game): each answer is
  one piece of evidence and the pieces multiply (`scoreOf` in `src/lib/ranking.ts`), so a late
  answer still turns the list over. The daily language weighs most; the project and the origin
  weigh on their own (the family's region draws a settler, not a holidaymaker). No fact weighs
  without an answer that asks for it: nothing is inferred from an answer the reader did not give.
- **Test first** (Vitest, `src/**/*.test.ts`), through the public functions `rankCities` and
  `bestMatches`, never through private helpers. KISS: no framework island, no backend.
- **Data honesty**: scores in `src/data/cities.json` are editorial estimates. Never present them
  as measured, present the temperament chapter only as « inspirée du Big Five, ce n'est pas un test de
  personnalité » and its archetype as preferences in « vous », never as « vous êtes », and add a dated source
  with any safety, discrimination, LGBT-rights or conflict remark. Travel advice (France Diplomatie,
  FCDO) is shown with each city as dated information and never removes or greys a city
  (operator, 2026-11-15: it is written for visitors who have never been there).
- **Privacy**: answers are computed and kept in the browser (localStorage, so the full
  questionnaire resumes the quick quiz). What is sent: anonymous, cookieless Plausible events,
  one per quick-quiz answer (with the reader's path and the question's rank in it) plus the steps in `GOALS` (`src/lib/analytics.ts`, only when
  `PUBLIC_PLAUSIBLE_DOMAIN` is set); origin, family country, feeling at home, faith, health and
  LGBT filters are never sent. Shared or mailed results carry cities and percentages, never
  answers. The news sign-up (`components/Newsletter.astro` → `src/server/subscribe.ts`, the only
  server code) sends the e-mail address and the ticked box, nothing from the quiz; double opt-in,
  no partner box until partners are named (operator, 2026-11-16). « Recevoir par e-mail » posts
  the result link (temperament and cities, as when shared) to `/api/resultats`; the service draws
  the e-mail from that link with the site's own code, so no typed text reaches an inbox.
  Saved journeys (`src/server/accounts.ts`, Postgres, `docs/accounts.md`) store answers —
  sensitive ones included — only with the explicit consent box; magic-link login, no password;
  erased 3 years after the last visit. Never send them to analytics, partners or an e-mail. Fonts are self-hosted;
  do not add Google Fonts, trackers with cookies, or third-party embeds.
- Colours come from the tokens in `src/styles/global.css`, never literals in components.

## Commands

```bash
nvm use            # Node 24
npm run dev
make check         # the gate: lint, typecheck, format:check, tests, build
npx vitest run src/lib/ranking.test.ts
```

Commits follow Conventional Commits, without `Co-Authored-By` trailers.
