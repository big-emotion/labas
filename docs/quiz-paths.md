# Quiz paths

Follows `quiz-paths-audit.md`. Operator, 2026-11-16: coherence first, the number of questions
after; keep the five temperament questions on every path but investing (the site matches cities
to people); « Je préfère ne pas dire » about the family skips every question about origins;
changing an earlier answer re-routes the rest of the path; YAGNI and KISS. For review before
code.

## The shape

The first answer, the project, picks a path. A path is an ordered list of chapters; inside a
chapter the « most decisive next » picker keeps choosing the order, so every tap still moves the
map. Chapters never interleave.

| Chapter                | Holiday | Testing | Both feet | Settling | Investing |
| ---------------------- | ------- | ------- | --------- | -------- | --------- |
| 1. Le projet           | ●       | ●       | ●         | ●        | ●         |
| 2. Le voyage / la vie  | ●       | ●       | ●         | ●        | ●         |
| 3. Votre tempérament   | ●       | ●       | ●         | ●        |           |
| 4. Votre histoire      | ●       | ●       | ●         | ●        | ●         |
| 5. Vos non-négociables | ●       | ●       | ●         | ●        | ●         |

## The questions of each path

Existing questions keep their wording unless said; « new » ones pull on data every city already
has.

**Chapter 2, per path**

| Path      | Questions                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Holiday   | **new** « Combien de temps ? » · **new** « Ce que vous voulez vivre » · Avec qui · Budget sur place · Langues · Passeport · Taille de ville                                    |
| Testing   | Votre métier · Avec qui · Budget · Langues · Passeport · Taille de ville · Paysage                                                                                             |
| Both feet | **moved from the full questionnaire** « Combien d'allers-retours vers l'Europe par an ? » · Votre métier · Avec qui · Budget · Langues · Passeport · Taille de ville · Paysage |
| Settling  | Votre métier · Avec qui · Budget · Langues · Passeport · Taille de ville · Paysage                                                                                             |
| Investing | Langues · Passeport · Taille de ville                                                                                                                                          |

- **« Combien de temps ? »** (holiday): un long week-end · une semaine · deux à trois semaines ·
  un mois ou plus → short stays pull hard towards direct flights (`flights`), long ones barely.
- **« Ce que vous voulez vivre »** (holiday, up to 3): la plage ou une île · le désert ou la
  savane · la montagne et la nature · faire la fête · l'histoire et la mémoire · la culture et les
  musées → `settings` (ocean, island, desert, savanna, mountains, forest), `nightlife`, `history`,
  `culture`. It replaces « Quel paysage autour de vous ? » on this path.
- Deferred to step E (no data yet): where the reader leaves from, the season, safaris and
  activities by place.

**Chapter 3** — the five temperament questions, unchanged, on every path but investing.

**Chapter 4** — D'où vient votre famille · De quel pays · Vivre près de vos origines · Votre
religion, with the rules below.

**Chapter 5** — « Sur quoi ne voulez-vous pas transiger ? », last, with its choices filtered by
the path.

## Coherence rules

A rule hides a question or a choice; nothing hidden is ever counted.

| Rule                                                                                                                                                                                                                                                                                                                                                                        | Why                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| « Je préfère ne pas dire » (family) is kept as an answer: country, origins and religion are skipped, here and in the full questionnaire                                                                                                                                                                                                                                     | The reader declined; never ask again         |
| « De quel pays » only after an African region                                                                                                                                                                                                                                                                                                                               | Unchanged                                    |
| « Vivre près de vos origines » after any region, Caribbean and Americas included                                                                                                                                                                                                                                                                                            | The matching has an affinity for each region |
| Religion only after « Beaucoup » or « Un peu »                                                                                                                                                                                                                                                                                                                              | Unchanged                                    |
| « Pour fonder une famille » not offered on holiday                                                                                                                                                                                                                                                                                                                          | Not a holiday answer                         |
| Non-negotiables: « La santé et l'école » only with children or a family to start; « Ma carrière » only when the reader works there; « Retrouver d'autres repats » not on holiday                                                                                                                                                                                            | Choices that do not fit the reader           |
| Full questionnaire: schools only with children; allers-retours and the cash to settle only when living there; « Un emploi sur place » among what one gives up only when working there; daily-life questions (quartier, déplacements, habitudes, « vous vivez où ») not for investors; « éviter le visa » only on holiday or testing; « après le travail » not for investors | Same reasons, in the second set              |

## Going back

Going back and changing an answer re-runs the path from that question: the questions that no
longer fit disappear, their answers are dropped (not counted, not stored), and the next question
is chosen again from there. Answers that still fit are kept.

## How it is tested

One test plays every path with every answer of its first questions, then random answers to the
rest, and fails when a hidden question or choice is shown, when a dropped answer still counts,
when chapters interleave, or when a question is asked twice. A second test goes back, changes an
early answer and checks the path re-routes.

## Then

Count the questions of each path once these are agreed, and trim the ones that move the ranking
least if a path feels long.
