---
name: labas-translate
description: Produce the English (Over There) counterpart of every new or changed French reader-facing text on Là-bas — interface copy, prose pages, data overlays, routes — following the site's conventions, glossary and honesty rules, then check the English build for leftover French. Works from the git diff since main or a given ref. Use when the user says "traduis", "traduis en anglais", "translate", "version anglaise", "English version", "ajoute l'anglais", after any change to reader text, or invokes /labas-translate [ref].
metadata:
  author: Big Emotion
  version: "1.0.0"
---

# Là-bas translate

French is the source; English follows in the same change (CLAUDE.md, « Languages »). This skill
takes the French a change added or altered and writes its English counterpart where the site
expects it. It does not rewrite the French, and it does not translate the admin.

## When to activate

"traduis", "translate", "version anglaise", "English version", "ajoute l'anglais",
`/labas-translate [ref]`, and as the last step of any change that touches reader-facing text.

## Step 1 — Find the French that changed

```bash
ref=${1:-main}
git diff "$ref"... --stat -- src/ public/manifest.webmanifest
git diff "$ref"... -- src/components src/layouts src/pages src/lib src/data src/server/emails.ts
```

List every reader-facing string added or changed: text in `.astro` markup, `aria-label`,
`title`, `alt`, `description` props, strings in client `<script>` blocks, messages returned by
`src/lib/*` to the page, data fields shown to readers, e-mail subjects and bodies. Skip comments,
logs, test names, CSS and everything under `src/pages/admin.astro` and the admin components.

## Step 2 — Put the English where it lives

| Kind of text                                                       | Where the English goes                                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Short interface copy in a component or layout                      | a `COPY: Bilingual<{…}>` object next to the code (`src/i18n/locale.ts`), picked with `localeOfPath(Astro.url.pathname)`; `src/layouts/Page.astro` is the model            |
| Copy used by a client `<script>`                                   | the same `Bilingual` object, picked in the browser with `pageLocale()` (reads `<html lang>`)                                                                              |
| A text a lib module returns (`src/lib/*`)                          | the function takes a `locale: Locale` argument and returns either side; its test covers both (`siteDescription` in `src/lib/share.ts`)                                    |
| A prose page (method, privacy, legal notice…)                      | a separate file under `src/pages/en/` at the English address, same structure and facts, a comment saying which French page it mirrors (`src/pages/en/legal-notice.astro`) |
| A new page                                                         | its entry in `ROUTES` (`src/i18n/routes.ts`) with an English address in English words, then the English page under `src/pages/en/` at that address                        |
| City card fields (tagline, pitch, watch, language label, currency) | `src/data/en/cities.json`, keyed by the French city name, read by `cityCopy`                                                                                              |
| Criterion label, means, doesNotMean, rubric                        | `src/data/en/criteria.json`, keyed by criterion key, read by `criterionCopy`                                                                                              |
| City, country or region names                                      | `src/i18n/places.ts`, only when the English name differs                                                                                                                  |
| Internal links                                                     | always `pathFor(route, locale, slug?)`, never a hard-coded path; a link to the other language uses `counterpart()` since it may cross domains                             |

`Bilingual<T>` is `Record<Locale, T>`: give the English side the French side's keys and
TypeScript refuses a missing one. Keep the French text byte for byte as it was unless the
change asked for French edits too.

Long city data (`city-life`, `city-lines`, `city-holiday`, the neighbourhood notes) stays French
until the operator decides to translate it; English city pages say so. Do not translate it in
passing.

## Step 3 — Write it

- **Glossary first**: [`glossary.md`](glossary.md). Use its terms as they are; add a row for any
  new term that will recur (a button label, a section name).
- **British English**: colour, neighbourhood, travellers, programme, licence (noun), "18 November
  2026", "12%". Plain and warm, short sentences, the words a reader would say. No marketing gloss
  ("unlock", "seamless", "curated", "journey of a lifetime"), no exclamation marks the French
  does not have.
- **Faithful**: same facts, same figures, same order, same caveats. A French sentence that
  hedges stays hedged. Do not add a promise the French does not make.
- **« vous » → "you"**; preferences are "you like", "you prefer", never "you are".
- **Honesty rules carry over word for word in meaning**: scores are editorial estimates, never
  "measured" unless the data says measured; the temperament is "inspired by the Big Five; it is
  not a personality test"; every safety, discrimination, LGBT-rights or conflict remark keeps its
  dated source; travel advice (France Diplomatie, FCDO) is dated information that never removes
  a city. Never write "free" or "paid" for the site's parts.
- **Keep** proper names (France Diplomatie, CNIL, DeepL SE), local place names, currencies, and
  quoted button labels matched to the real English button.
- Where a French text quotes another French label (« Recevoir par e-mail »), quote the English
  label in double quotes ("Get it by email").

## Step 4 — Check

```bash
nvm use && make check
# Leftover French on English pages, counted per page. City pages hold French data on purpose:
# check their interface (header, buttons, headings) by eye.
french='\b(vous|votre|vos|nous|les|des|une|pour|avec|ville|villes|réponses?|parcours|avis|espace)\b'
for page in $(find dist/en -name index.html -not -path 'dist/en/city/*'); do
  words=$(sed -e 's/<script.*<\/script>//g' -e 's/<style.*<\/style>//g' -e 's/<[^>]*>/ /g' "$page" \
    | grep -oiE "$french" | sort | uniq -c | sort -rn | head -5 | tr -s ' \n' ' ')
  if [ -n "$words" ]; then echo "$page:$words"; fi
done
```

A hit is fine when it is a proper name, text the decision keeps French (the criterion grids
until `src/data/en/criteria.json` is filled), a quoted French title (« Mentions légales » as the
reference link) or a local word; anything else is a miss. Then open `npm run dev` at 430 px on
the French page and its `/en/` counterpart and press the language switch both ways: it lands on
the same page, with the result's `#…` kept.

## Step 5 — Commit

The English ships in the same pull request as the French, in its own Conventional Commit when
that reads better: `feat(i18n): english <what>`. No `Co-Authored-By` trailer.

## Adding a third language later

1. Add it to `LOCALES` in `src/i18n/locale.ts`. TypeScript then lists every `Bilingual` object,
   `BRAND`, `LANGUAGE_TAG`, `INTL_LOCALE` and `ROUTES` entry that lacks the new side: fill
   them all (`npx astro check`).
2. `src/i18n/routes.ts` and `pageLocale()` assume two languages (`/en` is the only built
   prefix): generalise them to one prefix per language before building its pages, test first in
   `src/i18n/routes.test.ts`.
3. Overlays: `src/data/<lang>/` beside `src/data/en/`, and a branch in `cityCopy`,
   `criterionCopy` and `places.ts`.
4. Prose pages under `src/pages/<lang>/`, a glossary file for that language, the language switch
   becomes a short list, and nginx gets a server block if the language has its own domain
   (`deploy/nginx.conf`, docs/deploy.md).

## Out of scope

The admin (French only), the French source text, the long city data, social carousels
(`labas-social`), and anything that is not text a reader sees.
