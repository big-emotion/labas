# Cities on the temperament axes

Operator, 2026-11-15: rank cities by temperament, adapt the second question set to the profile
that emerges, and show the profile at the end, with the reason each city gets its percentage.
This note covers step 1: what exists, which axes, and how a city gets a temperament profile.
Steps 2 to 4 (profiles, adaptive questions, display) each get their own PR.

## What exists today

- Five questions, one per axis, inspired by the Big Five (`src/lib/temperament.ts`). Each
  answer is 0, 0.5 or 1:

  | Axis          | Question key | 0 ↔ 1                                                     |
  | ------------- | ------------ | --------------------------------------------------------- |
  | Extraversion  | `saturday`   | calm ↔ crowds, music, home late                           |
  | Openness      | `adventure`  | familiar ground ↔ a region never seen                     |
  | Conscience    | `order`      | improvise, everything negotiated ↔ need everything square |
  | Agreeableness | `together`   | count on oneself ↔ count on others                        |
  | Stability     | `friction`   | outages and delays wear me out ↔ amuse me                 |

- The archetype (Conquête, Lien, Fondation, Exploration, Refuge) is the closest of five points
  on these axes. It is shown as preferences (« Vous aimez… »), never as a verdict.
- **Cities have no temperament of their own.** The answers only pull on practical city
  criteria (`ranking.ts`: `saturday` → nightlife and pace, `order` → paperwork and comfort,
  `together` → welcome, `friction` → comfort and paperwork). The card's « Tempérament x % » is
  that matching run on the five answers alone.
- The second set (`/approfondir`, `deep-questions.ts`) already picks the next question that
  would reshuffle the top three the most, but every reader draws from the same bank.

## Decision: keep the five axes

Operator, 2026-11-15: keep the site's axes; the Big Five stays the reference behind them, not a
sixth model. An axis is added only if the city profiles cannot be told apart without it.

## How a city gets a profile

A city is not one temperament: Abidjan has calm, family neighbourhoods, and Kigali has a lively
street or two. What differs is how much of the city carries each aura. So a city is scored per
neighbourhood, and a reader fits a city as much as the share of it that suits them.

1. **Per neighbourhood, per axis: 0, 0.5 or 1**, read from the neighbourhood sheets
   (`research/cities/<country>/<city>.neighbourhoods.md`): its « Feel » line, its places and its
   « Fits » line (which already names quiz answers such as « Tranquille chez moi » or « Vibre
   jour et nuit »). Each rating cites the sheet line it comes from.

   | Axis          | What 1 means for a neighbourhood                                                                     |
   | ------------- | ---------------------------------------------------------------------------------------------------- |
   | Extraversion  | it goes out: bars, maquis, music, late nights, crowds                                                |
   | Openness      | it is unfamiliar to a reader raised in Europe: few expats and returnees, little European-style offer |
   | Conscience    | it runs as planned: orderly streets, reliable services, little bargaining                            |
   | Agreeableness | people lean on each other: neighbourhood life, associations, welcome                                 |
   | Stability     | daily life demands composure: outages, floods, traffic, slow paperwork                               |

2. **Per city, per axis: the share of its neighbourhoods at each value** (0, 0.5, 1). Every
   neighbourhood counts the same; the sheets give no population figures to weigh them by, and
   a weighting nobody can source would look more precise than it is.

3. **Fit of a reader to a city, per axis: how much of the city suits the reader's answer.** A
   neighbourhood at the reader's value counts 1, one half-step away 0.5, at the opposite end 0;
   the city's fit is the mean over its neighbourhoods. A calm reader fits
   Kigali on Extraversion because most of its neighbourhoods are quiet, and still fits Abidjan
   in part, through Cocody Riviera. The temperament score is the mean over the axes answered.

4. **Why, for each result:** the same shares give the sentence shown beside the percentage,
   e.g. « Calme : 11 quartiers sur 14 », « Ça bouge : 3 quartiers sur 14 » (step 4).

Cities without a neighbourhood sheet (the 24 that travel advice warns against are never
proposed) get one city-level rating per axis from their city file, marked editorial.

## Data honesty

- The profile is an editorial estimate from sourced sheets, dated, and presented as such:
  « inspirée du Big Five, ce n'est pas un test de personnalité ».
- Openness and Stability are read from the city, not from its people: no line ever says a
  population is lazy, hostile or closed. A rating describes streets, services and offer.
- The reception rule still wins: a city where anti-Black racism is documented is never
  proposed to a reader of sub-Saharan or Caribbean family, whatever their profile.

## Next steps

2. Rate the neighbourhoods (research workflow, three cities at a time), store the shares in
   `src/data/city-temperament.json`, and switch the temperament score to them, test-first
   through `rankCities` and `bestMatches`.
3. Write the profile-specific question bank as a doc for review before any code: for each
   project and emerging profile, which questions sharpen the match (e.g. holidays + goes out
   late → what kind of night, music, beach or city).
4. Pick second-set questions by profile, then show the profile and the per-city reason.
