# Prompt mode — "Raconte-nous ta situation"

> Design note, 2026-11-15. Status: **prototype removed on 2026-11-15**. The operator chose to
> bring free text through ChatGPT and Claude versions of Là-bas later, rather than a keyword
> reader on the site. The rules and options below still apply to that work. Decision owner: the
> operator. Context: `docs/criteria/architecture.md` §4.5 says free text must fill the same
> `Answers` as the quiz; the operator prefers a local open-source model if feasible.

## What the mode has to do

A reader types a few sentences ("On a deux enfants, je suis infirmière, on veut la mer et pas
trop cher, on parle français"). The site turns them into the quiz's `Answers`, **shows what it
understood as chips the reader can correct**, then ranks cities with the same `rankCities`.
The text never decides anything the reader cannot see and change.

Hard rules carried over from the repo:

- **Nothing leaves the browser.** The text is not sent anywhere and not stored.
- **Never infer a sensitive filter.** `excludeCriminalising` stays opt-in and is never set from
  text; health, religion and origin are not guessed either (architecture §2.1).
- **Preferences, not traits**: the reader is never told what kind of person they are.

## Options

| Option                                                                                 | How                                                                   | Privacy                                                                         | Cost and weight                                                                    | Quality on French free text                                                              | Phones                                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| A. Rules in the browser                                                                | French keyword and pattern table → `Answers`, plain TypeScript        | Text never leaves the page                                                      | 0 €, a few KB                                                                      | Good on the 10 quiz topics (they have a small vocabulary); misses irony and long detours | Everywhere                                                          |
| B. Small model in the browser (WebLLM / MLC, e.g. Qwen2.5-1.5B or Llama-3.2-1B, 4-bit) | Model downloaded once, runs on WebGPU, prompted to fill a JSON schema | Text never leaves the page                                                      | 0 € server, but **0.9–1.2 GB download** and several seconds per answer on a laptop | Better on detours and nuance; still needs the chips to catch errors                      | WebGPU on recent iOS and Android browsers only, slow, battery heavy |
| C. Small model on a server (e.g. Ollama on the existing VPS)                           | Text posted to an endpoint                                            | **Text leaves the browser** — breaks the repo rule, needs a privacy-page change | VPS CPU or a GPU; abuse protection                                                 | Same model quality as B, faster                                                          | Everywhere                                                          |
| D. Hosted API (e.g. a Claude model)                                                    | Text posted to a third party                                          | Leaves the browser **and** goes to a third party                                | Per-call cost                                                                      | Best                                                                                     | Everywhere                                                          |

## Recommendation

**Start with A, keep B as an opt-in upgrade, rule out C and D for now.**

- A answers the real need (the quiz has ten questions with small vocabularies), weighs nothing,
  works on a phone at 430 px, and keeps the privacy promise without exceptions. It is fully
  testable through one public function, so it fits the repo's test-first rule.
- B is the "local open-source model" the operator asked for, but a one-gigabyte download is not
  a first-visit experience on a phone. It makes sense later as a desktop-only "comprendre
  mieux" button that refines A's chips, with the download announced before it starts.
- C and D would each need the "nothing leaves the browser" rule to change; that is a product
  decision, not a technical one.

## The prototype, removed

Option A ran as `/raconte` (`src/pages/raconte.astro`, `src/lib/situation.ts` and its tests), off
the menu and out of search engines, until v0.5.1. It read keywords into the quiz's
answers, showed them as chips the reader could remove, and listed three cities. Removed on
2026-11-15: a keyword list understands little, and the ChatGPT and Claude versions will do the
reading better. The code is in the git history (tag `v0.5.1`).

## Open questions for the operator

1. Do we want B at all, or is A plus editable chips enough for level 1?
2. If B: which model licence is acceptable (Apache-2.0 Qwen vs Llama community licence)?
3. Should the free text also feed the deep questionnaire (§4.4), or stay a quick-quiz entry?
