---
name: labas-social
description: Produce a Là-bas social carousel (Instagram first, then TikTok, Facebook, LinkedIn) from an idea to a ready-to-post package, through three operator approvals. Four carousel formats — the profile guessing game, a city and its twins, a European routine and its African cities, and « saviez-vous ». Every city a card names comes from the site's own ranking (npm run social). Never posts. Use when the user says "un carrousel", "une publication Instagram", "un post Là-bas", "prépare le post", "reprends le carrousel", or invokes /labas-social.
metadata:
  author: Big Emotion
  version: "0.1.0"
---

# Là-bas social carousels

Adapted from EthniAfrica's `ethniafrica-social-production`: same three approvals, same progress
file, same claim-to-source discipline. Left out on purpose (KISS): the name corpus, Confluence,
helper scripts for checkpoints and packaging, and the history archive. Add one only when a
carousel shows it is missing.

Talk to the operator in French, with « vous » in every public line (CLAUDE.md). Internal files
are English. The operator is learning communication on purpose: state the mechanism behind every
editorial choice in plain French.

## The one rule only Là-bas has

**A card names only cities the site gives.** The reader who swipes is promised « faites le quiz »;
if the quiz then gives other cities, the post lied. So the cities come from the ranking, never
from intuition:

```sh
npm run social -- reveal '{"order":1,"crowds":0,"saturday":0}' 3   # formats 1 and 3
npm run social -- twins abidjan nightlife,culture 5                 # format 2
```

`reveal` takes the quiz's answer keys (`Answers` in `src/lib/ranking.ts`) and prints the top
cities with the percentages the result card shows. `twins` takes a city slug and criterion keys
(`CRITERION_KEYS` in `src/lib/cities.ts`) and prints the closest cities in other countries,
leaving out unknown levels. Use two or three criteria: one 0–5 criterion ties dozens of cities.
Paste the exact command and its output into the piece's `research.md`.

If the ranking contradicts the idea (the operator's « calme, cadre, ordre → Abuja, Kigali » gives
Victoria, Praslin and Swakopmund on 2026-11-16), say so and let the operator choose: change the
answers, or keep the ranking's cities. Never hand-pick around it.

## The four formats

| Format           | Shape                                                                                               | Mechanism                                           | Line not to cross                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1. Devinette     | Card by card, preferences of a profile; « devinez la ville »; the top 3 last                        | Withheld answer: the reader guesses, so swipes      | Preferences in « vous aimez », never « vous êtes »; temperament is « inspiré du Big Five, ce n'est pas un test de personnalité » |
| 2. Ville jumelle | A city or neighbourhood the reader knows; the cities that resemble it, one per card                 | Recognition, then surprise: there is not one Africa | Always « sur ce critère-là »; two cities close on nightlife are not alike overall                                                |
| 3. Train-train   | A European routine (gym, brunch, after-work, quick trips); the African cities where it carries over | Identification: « c'est moi », sent to a friend     | Europe is not in the data: map the routine to quiz answers (`habits`, `rhythm`, `currentCity`…), never « Londres = Lagos »       |
| 4. Saviez-vous   | One surprising fact about a city or neighbourhood                                                   | A flat statement that sounds impossible             | Each fact sourced and dated; furthest from the quiz, and EthniAfrica's territory: use sparingly                                  |

Before writing hooks, invoke `attention-architect` (global CLAUDE.md). Every loop a carousel
opens is closed on its last card or by the quiz.

## Data honesty on a card

From CLAUDE.md, applied to social copy: scores are editorial estimates, never « mesuré » or « les
données prouvent »; a percentage is « correspond à X % à ce profil »; any safety, discrimination,
LGBT-rights or conflict remark carries a dated source; travel advice never greys a city; never
write « gratuit » or « payant ».

## Conduct a piece

Each piece lives in `.local/productions/<YYYY-MM-DD>-<slug>/` (gitignored: the repository is
public). Its `suivi.md` records the stage, each approval with its date and the operator's words,
and the next action, so another session can resume. On a resume, find the piece by subject; if
several match, ask. Never infer an approval from silence or a tool result.

| Stage    | Work                                                                                                                           | Stop                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Brief    | `brief.md`: format, angle, audience (diaspora settling, back-and-forth, investors), networks, destination link                 | **Approval 1** on the brief                |
| Research | `research.md`: the `npm run social` command and output; each claim → source → limit; image sources with credit and reuse terms | —                                          |
| Proof    | `cards.md`: the exact text of every card, then a visual proof in the accepted card design                                      | **Approval 2** on text, research and proof |
| Package  | `post.md`: final images in order and, per network, caption, first comment (or « aucun »), link placement, alt text per card    | **Approval 3** on the whole package        |
| Delivery | Hand over the files. Posting is a separate, explicit instruction; record each URL and date in `suivi.md`                       | —                                          |

A correction goes back to the earliest stage it touches: a new angle reopens the brief; a changed
city or claim reopens the proof; a caption change reopens only the package. Name what stays
approved.

### Design

Direction set by the operator (2026-11-16), the brief for every card until a design system
replaces it:

- **Very minimal.** Sober type, but readable at phone size; little text per card.
- **Full-bleed photo** of the city or neighbourhood on every card; the text sits on it, never
  on a plain background.
- **Logo as a discreet watermark**, never a header or a banner.
- **The first card is only a photo**: the most telling image of the city or neighbourhood the
  carousel puts forward most. No title, no hook text on it.
- **Only beautiful photos that make people want to go**: well lit, bright, aesthetic. A dark,
  grey or merely documentary picture is refused, even if it is accurate.

Photos need a reuse licence and a credit. `src/data/photos.json` already credits one
Wikimedia Commons photo per site city (author, licence, source); a CC BY-SA photo is credited in
the caption or on the last card. Record each photo's source, author and licence in
`research.md`.

No accepted card template exists yet (2026-11-16). Until the operator accepts one — commissioned
like EthniAfrica's, through Claude Design, from `docs/social/card-brief.md` — stop after approval 2's
text and research, and say the visual proof is waiting. Colours come from the tokens in
`src/styles/global.css`; fonts are the site's (Fraunces, Nunito Sans).

### Package

- Check the cards at phone width first (the feed is 1080 × 1350, 4:5), then larger.
- Instagram captions carry no clickable link: point to the profile link (« lien dans la bio »),
  which is `https://labas.africa`. Do not promise a page the site does not have.
- Alt text per card, in plain French, saying what the card shows.
- Keep each network's caption written for it; never copy one silently to another network.
