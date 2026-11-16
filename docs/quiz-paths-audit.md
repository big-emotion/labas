# Quiz paths audit

Operator, 2026-11-16, after a « D'abord des vacances » run: the questions do not follow a logical
path, some do not fit what was already answered, and every reader gets about the same fifteen
questions. This audit plays the quiz many ways and records what each reader is really asked.

## How it was measured

A throwaway script played the quick quiz 300 times (60 per project, answers varied
deterministically) through `nextFreeQuestion`, then the full questionnaire once per project
through `nextQuestion`, with a solo, childless reader. Numbers below come from those runs on
`main` at v0.9.0.

## Findings

### 1. One fixed set of questions, only the order moves

| Project                 | Quick quiz | Full questionnaire after it | Total |
| ----------------------- | ---------- | --------------------------- | ----- |
| S'installer             | 16–18      | 23                          | ~40   |
| Un pied ici, un pied là | 16–18      | 23                          | ~40   |
| Tester quelques mois    | 16–18      | 23                          | ~40   |
| D'abord des vacances    | 16–17      | 24                          | ~40   |
| Investir sans y vivre   | 8          | 22                          | 30    |

For the four projects other than investing, every quick-quiz question is asked to every reader;
`when` conditions only remove `profession` for holidays and the temperament block for investors.
The picker (« the question that changes the top five the most ») only reorders that fixed set:
18 to 31 distinct orders per project, always the same questions.

### 2. The order breaks the story

The picker ignores chapters, so the reader jumps between them. Typical positions (mean over 60
runs):

- `languages` is always question 3, before anything about the reader's history.
- « D'où vient votre famille ? » comes around question 10 to 12, and « Vivre près de vos
  origines ? » around 13: the family questions arrive after the temperament ones, in the middle of
  « Votre quotidien ».
- The counter shows the chapter of each question, so the chapter name changes almost every time.

### 3. Questions that contradict an earlier answer

| What the reader said                | What is still asked                                                                                                                                                            | Runs            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| « Je préfère ne pas dire » (family) | « Vivre près de vos origines ? », then faith; the full questionnaire asks the origin again                                                                                     | 41/300          |
| Only « Caraïbes, Amériques »        | « Vivre près de vos origines… » (no African region to be near)                                                                                                                 | 62/300          |
| Alone or a couple, no children      | « La santé et l'école » among the non-negotiables; « Des enfants à scolariser ? » in the full questionnaire                                                                    | 136/300, always |
| On holiday                          | « Ma carrière », « Retrouver d'autres repats » among the non-negotiables                                                                                                       | always          |
| On holiday                          | Full questionnaire: allers-retours vers l'Europe, caution et loyers d'avance, « un emploi sur place » to give up, « votre quartier aujourd'hui », « vous vivez où », scolarité | always          |
| Investing without living there      | Full questionnaire: « En semaine, après le travail ? », mobility, habits, schools, « Là-bas, votre rythme »                                                                    | always          |
| Passport already given              | « Pour un premier séjour, vous voulez éviter le visa ? »                                                                                                                       | always          |

### 4. Questions worded for someone who lives there, asked to a holidaymaker

« Votre budget sur place ? », « Au quotidien, avez-vous besoin que tout soit organisé ? »,
« Pour avancer, vous comptez plutôt sur vous ou sur les autres ? », « Coupures de courant,
démarches lentes… » and « Quelle taille de ville ? » are asked as if the reader moved there. They
are not wrong for a trip, but they read wrong.

### 5. What the holiday path never asks

Where the reader leaves from (flights), how long they stay, when (season, and so climate), what
they want to live (beach, safari, desert, hiking, nights out, history), their daily budget.
These are the questions that decide a holiday, and none exists today.

### 6. The full questionnaire repeats the general bank

Once the profile questions are answered, it asks the same general bank to everyone (22 to 24
questions), in the « most decisive » order, with the contradictions above.

## Why it happens

- The quiz is one list of questions with a few `when` conditions, not paths. A condition can hide
  a whole question but never a choice, and conditions only look at one earlier answer.
- « Most decisive next » was designed so every tap moves the map. It works, but on its own it
  also decides the order, with no notion of chapter or of what must come first.
- Nothing checks coherence: the tests check that each question is asked once and that conditional
  questions come after their condition, not that a question makes sense after the answers given.

## Proposal (for review, nothing is built)

Still deterministic, no language model. KISS: data and rules, plus a test that plays every path.

1. **A path per project.** The first answer chooses a path, and each path is an ordered list of
   chapters, each with its own questions:

   | Path                    | Opening questions (decisive, fixed order)                          | Then                                                                                | Quick quiz |
   | ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------- |
   | Vacances                | D'où partez-vous ? · Combien de temps ? · Ce que vous voulez vivre | Avec qui · Budget par jour · Quand · Langues · Passeport · Samedi soir · Découverte | ~10        |
   | Tester quelques mois    | Combien de temps ? · Votre métier ou travail à distance · Langues  | Budget · Avec qui · Tempérament (5) · Paysage                                       | ~12        |
   | Un pied ici, un pied là | D'où partez-vous ? · Allers-retours par an · Votre métier          | Langues · Budget · Avec qui · Tempérament (5) · Paysage                             | ~12        |
   | S'installer             | Votre métier · Avec qui · Langues                                  | Origines (if wanted) · Tempérament (5) · Budget · Paysage · Non-négociables         | ~14        |
   | Investir                | Secteur · Passeport · Langues                                      | Origines (if wanted) · Non-négociables                                              | ~7         |

   Inside a chapter the « most decisive » picker can still choose the order; chapters keep theirs.

2. **Coherence rules as data**, on questions and on choices:
   - a question or a choice can `require` earlier answers (« La santé et l'école » requires
     children; « Des enfants à scolariser ? » too; « Vivre près de vos origines » requires an
     African region; faith requires « Beaucoup » or « Un peu »);
   - a question is skipped when an earlier answer already gives it (the passport answers the visa
     question; « Je préfère ne pas dire » is remembered as an answer, not as a skip, so it is never
     asked again).

3. **Holiday questions** (with step E, the holiday research): departure, length, season,
   activities, daily budget. Each must pull on city data, as today.

4. **A coherence test** replaces this throwaway script: it plays every path with every answer of
   its first three questions and fails if a question or a choice is shown while its rules say it
   should not, or if a path is longer than its target.

5. **The full questionnaire** keeps only what the path did not ask and what fits the project.

## Decisions for the operator

1. The five paths and their opening questions above: right questions, right lengths?
2. Should the five temperament questions stay in every path except investing, or shrink to two
   (Saturday night, discovery) for holidays?
3. « Je préfère ne pas dire »: keep the answer and skip everything about origins and faith, as
   proposed?
