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
  quiz opens on the project alone (operator, 2026-11-20; the languages and the family's origin
  are asked along the way); then, themes mixed, a follow-up comes right after its question and
  each answer picks the next question, one of those most likely to change the top three, at
  random among the questions as good as each other so that no two readers meet the same order;
  beside « question 7 » the quiz says how near it is (« on cherche », « on se rapproche »,
  « presque trouvé », from the questions that could still change the top three);
  it ends once no question can (« question 7 », no total), though never before the whole
  temperament chapter has been asked (operator, 2026-11-20), and
  the rest waits in /approfondir (operator 2026-11-17).
- **Every answer orients the list** (operator, 2026-11-16, like a guessing game): each answer is
  one piece of evidence and the pieces multiply (`scoreOf` in `src/lib/ranking.ts`), so a late
  answer still turns the list over. The daily language weighs most; the project and the origin
  weigh on their own (the family's region draws a settler, not a holidaymaker). No fact weighs
  without an answer that asks for it: nothing is inferred from an answer the reader did not give.
  One answer is not diluted by the others (operator, 2026-11-19 and 2026-11-20): what a reader
  says of their own takes a fixed share of the score, never a weight the other answers dilute.
- **A faith that is practised counts as present** (operator, 2026-11-20; `PRACTISED_SHARE` in
  `lib/fit.ts`): from 15 % of a country's population the faith fits fully, so a Muslim reader is
  not sent to Nouakchott ahead of Abidjan, Cotonou or Lomé; only where it is rare does it weigh.
  One demographic source (Pew), not a measure of religious freedom.
- **A settler lives on their profession** (operator, 2026-11-20): for « m'installer » and « un
  pied ici, un pied là-bas » the profession weighs like a non-negotiable, except when the reader
  asked for their family's country. The hiring fields (`src/data/city-life.json`) are patchy: a
  field nobody documented scores as one that does not hire, so add the field with its source
  rather than tune the weight.
- **One question on distance** (operator, 2026-11-20; `lib/reach.ts`, `NEAR` in `ranking.ts`):
  « Jusqu'où aimeriez-vous aller ? » replaces « vivre près de vos origines » and, for a reader
  who named an origin, « aller vers l'inconnu ». Asked just before the closing question, it
  settles the list by the reader's own word: « dans le pays de ma famille » (that country
  first), « dans la même région » (the region first, no advantage to the country, so its
  neighbours show), « là où la culture ressemble » (the regions close in culture come nearer)
  or « partout, surprenez-moi » (the origin weighs nothing). The first three also weigh the
  North Africa / sub-Saharan divide, both ways. Before that answer the origin holds a small
  share (`UNSAID_SHARE`): it weighs without deciding, so the map still shows cities the reader
  did not expect, which is the point of the site. A reader who names no origin is asked which
  regions draw them (`drawnTo`). No city ever leaves the list.
- **Closeness, never rejection** (operator, 2026-11-20): reader text says which cities came
  nearer and why (« un lien plus étroit avec vos origines »), never which region or city stepped
  back. « Pourquoi ces villes ? » recalls the family's region, its country and how far the
  reader would go; the faith is a tie, never named. A city outside what the family knows carries
  « À découvrir » (`Match.toDiscover`): a label, never a change to the order.
- **« Façon de vivre », not « tempérament »** (operator, 2026-11-20): the reader-facing word for
  the Big Five chapter and its profile; the code keeps `temperament`.
- **The first city hooks the reader** (operator, 2026-11-19, 2026-11-20 and 2026-11-22): above
  the cards only « Pourquoi ces villes ? » (`components/ResultWhy.astro`), folded to its question.
  Inside the first card: the name, its photo, the one-tap reaction with « Pas pour moi » under it;
  once the reader has tapped, « Vous connaissez … ? Laissez une information utile pour les
  prochains », which rises in with a saffron stroke and makes the filled button below pulse; then
  the one block of actions (`components/KeepResults.astro`, placed by
  `placeHook`): « Laisser une info utile sur … » as the one filled button, share, the e-mail, the
  full questionnaire as a link, WhatsApp and the rest folded. « Comment y aller » sits inside « Voir
  le détail ». The reviews block in that card is dark, framed in saffron. The goal is a written word on a city
  for the next reader. No other box asks for anything; cards 2 and 3 keep only their reaction row.
  The temperament and the one news sign-up come after the cities; the sign-up offered during the
  quiz closes when the quiz ends.
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
  `PUBLIC_PLAUSIBLE_DOMAIN` is set); origin, family country, the distance question, the regions that draw, faith, health and
  LGBT filters are never sent to it. « Pas pour moi » (operator, 2026-11-18) sets a city, a country
  or a region aside as a filter, never a score; the places are sensitive answers, and its event
  (`notForMeEvent`) carries only the place on the page and the level, never which one. A one-tap
  reaction (`tapEvent`) carries the place on the page, the city and the answer: the city is
  public there by the reader's own gesture; never a quiz answer. On a result page the same tap
  also posts the journey to the site's own server (operator, 2026-11-20: `quiz_outcomes`, to
  learn where the ranking goes wrong): the answers, sensitive ones included, the three cities
  and the reaction, with the day and no name, address, account or IP. This is the one case where
  sensitive answers leave the browser without a ticked box; the line under the buttons and the
  privacy page must say so, and nothing else may be added to that row but the site's version,
  set by the server (operator, 2026-11-20). /admin lists these rows for the operator. Shared or mailed results carry cities and percentages, never
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
  (`components/Reactions.astro`, operator 2026-11-18) need no e-mail: signed out, the operator
  reads each one in /admin before it goes online (operator, 2026-11-22). They are public: text,
  chosen name or « Utilisateur N », date and, unless its box keeps them back, the top 3 and the temperament
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
