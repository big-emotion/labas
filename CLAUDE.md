# CLAUDE.md

Là-bas is a one-page static Astro site: adaptive chip questions rank 115 African cities live in
the browser. `README.md` covers the product, the data caveat and the roadmap.

## Rules

- **Beta, everything open** (operator, 2026-11-15): a quick quiz (`/`) and a deep
  questionnaire (`/approfondir`), both free. A paid part is a V2 idea, not built; never write
  « gratuit » or « payant » on the site.

- **Reader-facing text is French**, plain and everyday, addressed with « vous » (decided
  2026-11-15; tests reject « tu »); docs, comments and commits are English.
- **Languages** (operator, 2026-11-18): French is the source, English (Over There) follows in
  British English. Every reader-facing text ships in French and English in the same change
  (`Bilingual` copy in `src/i18n/locale.ts`, links through `pathFor` in `src/i18n/routes.ts`, one
  prose page per language); the admin stays French only, and the long city data stays French
  until it is translated. Run the `labas-translate` skill on every text change.
- **Mobile first**: design and check at 430 px, then 768, then 1440. Every tap must visibly
  change something: from the third answer the map colours every city by its score and names
  the current top three (« En tête pour l'instant », V3 mockup, operator 2026-11-15). The free
  quiz opens on the project, the languages and the family's origin; then, themes mixed, a
  follow-up comes right after its question and each answer picks the next question, the one most
  likely to change the top three; it ends once no question can (« question 7 », no total), though never before the whole
  temperament chapter has been asked (operator, 2026-11-20), and
  the rest waits in /approfondir (operator 2026-11-17).
- **Every answer orients the list** (operator, 2026-11-16, like a guessing game): each answer is
  one piece of evidence and the pieces multiply (`scoreOf` in `src/lib/ranking.ts`), so a late
  answer still turns the list over. The daily language weighs most; the project and the origin
  weigh on their own (the family's region draws a settler, not a holidaymaker). No fact weighs
  without an answer that asks for it: nothing is inferred from an answer the reader did not give.
  One answer is not diluted by the others (operator, 2026-11-19 and 2026-11-20): once a reader
  says living near their own matters (« Beaucoup » or « Un peu »), the family's region, its
  country and their faith each take a fixed share of the score (`ORIGIN_SHARE`, `COUNTRY_SHARE`,
  `FAITH_SHARE`, together at most `NEAR_ONES_OWN_MOST`), so the family's region comes first and
  the temperament orders the cities inside it; « Beaucoup » or « terrain connu » also weighs the
  North Africa / sub-Saharan divide, both ways (`DIVIDE_SHARE`). The origin alone never does
  this, and no city leaves the list. The family's country and the faith are asked in the quick
  quiz, right after the origin, so the paths part ways from the fourth question.
- **Closeness, never rejection** (operator, 2026-11-20): reader text says which cities came
  nearer and why (« un lien plus étroit avec vos origines »), never which region or city stepped
  back. « Pourquoi ces villes ? » recalls the family's region, its country and the wish to live
  near one's own; the faith is a tie, never named.
- **The first city hooks the reader** (operator, 2026-11-19 and 2026-11-20): above the cards
  only « Pourquoi ces villes ? » (`components/ResultWhy.astro`), folded to its question. Inside
  the first card, right under the city's name: the one-tap reaction, then the one block of
  actions (`components/KeepResults.astro`, placed by `placeHook`): the full questionnaire, share,
  WhatsApp, the e-mail, a review. No other box asks for anything; cards 2 and 3 keep only their
  reaction row. The temperament and the one news sign-up come after the cities; the sign-up
  offered during the quiz closes when the quiz ends.
- **One-tap reactions are public counts** (operator, 2026-11-20; `lib/taps.ts`, « taps » in the
  code since `reactions` means the written reviews): « J'aime », « Ça me correspond », « Ça ne me
  correspond pas » on every result card, city page and the cities list, no account. The server
  keeps a count per city and answer and nothing about who tapped; the reader's own answer stays
  in localStorage. A count of zero is never shown. /villes and /avis sort and filter by them.
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
  LGBT filters are never sent. « Pas pour moi » (operator, 2026-11-18) sets a city, a country
  or a region aside as a filter, never a score; the places are sensitive answers, and its event
  (`notForMeEvent`) carries only the place on the page and the level, never which one. A one-tap
  reaction (`tapEvent`) carries the place on the page, the city and the answer: the city is
  public there by the reader's own gesture; never a quiz answer. Shared or mailed results carry cities and percentages, never
  answers. The news sign-up (`components/Newsletter.astro` → `src/server/subscribe.ts`, the only
  server code) sends the e-mail address and the ticked box, nothing from the quiz; double opt-in,
  no partner box until partners are named (operator, 2026-11-16). « Recevoir par e-mail » opens a
  space in the same gesture (operator, 2026-11-17): it posts the result link and the journey to
  `/api/compte/resultats`; the e-mail, drawn from the link with the site's own code, carries the
  top three and a 7-day login link to the full result, so no typed text reaches an inbox. The
  sensitive answers are kept only with their own box ticked, otherwise they never leave the browser.
  Saved journeys (`src/server/accounts.ts`, Postgres, `docs/accounts.md`) store answers
  at the reader's request, and sensitive ones only with the explicit box that names them; magic-link login, no password;
  erased 3 years after the last visit. Never send them to analytics, partners or an e-mail. Reactions on a city
  (`components/Reactions.astro`, operator 2026-11-18) are public: text, chosen name or
  « Utilisateur N », date and, unless its box keeps them back, the top 3 and the temperament
  recomputed from the result link; never an answer, never the address. Their Plausible events (`reactionEvent`) carry the place
  and the city slug, plus whether a sent reaction went online at once; never its text. `/avis` (operator 2026-11-18) lists every city's reviews for anyone;
  replies are two levels, carry no journey, and hearts and the few friendly marks need a session
  and show as counts only, never who left them. A review is translated only when a reader
  presses the button (operator 2026-11-18): its public text alone goes to DeepL SE (EU), once per
  language, and the translation is kept with the review and deleted with it. The « Votre avis » feedback tab
  (`components/Feedback.astro`, operator 2026-11-18) sends only its kind, text, page path and an
  optional e-mail, kept 1 year for /admin and mailed to the team; never published, never a quiz
  answer. Fonts are self-hosted;
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
