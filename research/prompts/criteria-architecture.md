# Criteria architecture — what Là-bas matches on, and why

> Prompt to paste into a **fresh** Claude Code session opened in `~/Documents/Dev/labas`.
> Runs in parallel with `phase-2-city-curation.md`. It writes only under `docs/criteria/` and never
> touches `research/cities/`.

---

You are a product data architect who also knows decision science, urban liveability indices
and personality psychology. Your job is to design the **criteria architecture** behind Là-bas:
the coherent set of criteria the whole site relies on when it says *"cette ville te correspond
parce que…"*.

Là-bas asks the reader questions (an adaptive quiz, one question per screen; later also a
free-text "tell us your situation" entry) and ranks African cities. Every recommendation has to be
explainable in plain French by criteria that are defined, sourced and honest.

This prompt is the approved brief. Restate it in five lines, create the task list, then start
without waiting for confirmation. This is an **analysis and design** deliverable: no change to
`src/`.

## Setup

1. Work in a git worktree on a new branch `docs/criteria-architecture`, created from
   `origin/worktree-research-54-countries`. Never edit `main` in place.
2. Read:
   - `CLAUDE.md` and `README.md`: product, data-honesty rules, privacy, mobile-first
   - `src/data/cities.json`: the 115 cities and their **21 current scores** (the baseline to
     analyse, keep or replace)
   - `src/lib/ranking.ts`, `src/lib/questions.ts`, `src/lib/ranking.test.ts`: how answers become
     weights today
   - `research/countries/*.md`: each dossier ends with **"Proposed scores"** (15 dimensions with
     justifications), **"Questions that would discriminate between this country's cities"** and a
     **Big Five reading**. Mine all 54 for recurring dimensions and recurring gaps
   - `research/social/*.md`: what diaspora and returnee communities actually discuss (housing,
     money, family, admin, power cuts, safety, belonging)

## What to deliver

`docs/criteria/architecture.md` (the analysis and the design) plus
`docs/criteria/schema.ts` (a proposed TypeScript type model, **not wired into the app**).

### 1. Benchmark (with sources)

How do existing liveability and relocation frameworks structure their criteria? Cover at least:
EIU Global Liveability Index, Mercer Quality of Living, OECD Better Life Index, Numbeo indices,
Nomad List, InterNations Expat Insider, Teleport city scores, the UN-Habitat City Prosperity
Index, and Afrobarometer (for Africa-specific perceptions). For each, give the dimensions,
how they are measured, what they miss for an African-diaspora returnee, and what is reusable.
Use WebSearch/WebFetch and cite with dates.

### 2. The person side

List exhaustively what about the **reader** should drive a match, grouped into:
- **Hard constraints** (dealbreakers): budget ceiling, language, family situation, health needs,
  passport / nationality / right of residence, LGBT safety, religion-related needs, …
- **Life project**: work locally / remote / start a business / retire / study / reconnect with
  roots / invest; timeline; trial stay vs permanent move
- **Preferences**: city size, pace, climate, sea / nature, nightlife, culture, food, community
- **Roots and belonging**: country of origin, ties, "rediscover vs discover", wish for a
  diaspora/returnee network
- **Temperament**: how a Big Five reading can inform fit (tolerance of noise, chaos and
  bureaucracy; need for novelty; sociability), **without ever claiming to measure a trait**.
  State the evidence and its limits, and write the exact wording rules the site must follow.

For each person criterion: why it matters (with evidence from the research or the literature),
how a quiz question or free text can capture it, and whether it is a filter, a weight, or an
explanation-only signal.

### 3. The city side

Define each city criterion with:
- a plain-French name for readers and an English key for code,
- what it means and what it does **not** mean,
- sub-indicators and the **best available source** for each (e.g. Numbeo or local listings
  for rent, Ookla for internet, World Bank / ESMAP for electricity reliability, ACLED and
  FCDO / France Diplomatie for safety, ILGA World for LGBT law, WHO / national data for health,
  AEFE for French schools, StartupBlink for ecosystems), with update frequency and coverage
  for African secondary cities (often poor: say so),
- a **0–5 rubric with written anchors** (what a 1, a 3 and a 5 look like), so two editors would
  score the same city the same way,
- provenance fields: source, date, confidence, editor,
- whether it applies at **country** or **city** level (visa rules are national; rent is not).

Map every one of the current 21 scores and the dossiers' 15 proposed dimensions onto this set:
keep, merge, split, rename or drop, with the reason. Add what is missing. Candidates seen in the
research include power and water reliability, mobile money, admin friction, schooling options,
healthcare, returnee community, women's daily experience, perception of the diaspora
("bengiste", "repat", "obroni"), cost of setting up versus cost of living, and flight access to
Europe.

### 4. The matching layer

- How person criteria map onto city criteria (a matrix), including which answers set **hard
  filters**, which set **weights**, and which only change the **explanation**.
- How to handle missing data (a city with no reliable figure) without penalising it unfairly or
  pretending.
- How `unsafe` cities stay ranked but never proposed, and how that is explained.
- How to keep the current behaviour that "every tap visibly changes something" in the adaptive
  quiz: propose a question bank where each question is tied to the criteria it informs, with a
  rule for choosing the next question (e.g. the one that best separates the current top
  candidates). Include 30–50 candidate questions in plain French, phone-sized answers.
- How the free-text entry would be mapped to the same criteria (a structured extraction
  target), so both entry modes share one model.
- The explanation contract: for each recommended city, which 2–3 criteria are shown as "parce
  que…", and which drawback is always shown ("à savoir avant de partir").

### 5. Data model

`docs/criteria/schema.ts`: types for `Criterion`, `CriterionScore` (value, rubric level, source,
date, confidence), `City`, `Country` (country-level facts), `PersonProfile`, `Answer`, `Match`
and `Explanation`. Include a short migration note from today's `cities.json` shape. Keep it
simple (KISS): no backend, still computed in the browser.

### 6. Honesty and risk

Where could this architecture mislead a reader? Which criteria rest on thin data for most
African cities? What must be labelled as an estimate? What must never be scored (and only
described)?

## Method

- Analysis can use a small workflow (the user opted in): for example, parallel agents mining
  the 54 dossiers by region for dimensions and gaps, then one synthesis. Keep it under 10
  agents and do not use the Chrome browser (the curation session uses it).
- Every claim about a framework or a data source carries a link and a date.
- Commit as you go (`docs(criteria): …`, Conventional Commits, **no Co-Authored-By trailer**),
  push the branch at the end.

## Done when

`architecture.md` and `schema.ts` exist, the 21 current scores are each accounted for, every
city criterion has a rubric and a named source, the question bank is mapped to criteria, and the
final report lists the 5 decisions the user must take (with a recommendation for each).
