---
name: labas-social
description: Produce a Là-bas social carousel (Instagram first, then TikTok, Facebook, LinkedIn) from an idea to a ready-to-post package, through three operator approvals. Eight carousel formats — the profile guessing game, a city and its twins (from one city or several), a European routine and its African cities, « saviez-vous », a city and the profile it suits, a themed top, a question to the audience, and how the site works. Every city a card names comes from the site's own ranking (npm run social). Never posts. Use when the user says "un carrousel", "une publication Instagram", "un post Là-bas", "prépare le post", "reprends le carrousel", or invokes /labas-social.
metadata:
  author: Big Emotion
  version: "0.2.0"
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
npm run social -- reveal '{"order":1,"crowds":0,"saturday":0}' 3   # formats 1, 3, 7
npm run social -- twins abidjan nightlife,culture 5                 # format 2
npm run social -- twins dakar+abidjan nightlife,culture,returnees 5 # format 2, several cities
```

`reveal` takes the quiz's answer keys (`Answers` in `src/lib/ranking.ts`) and prints the top
cities with the percentages the result card shows. `twins` takes a city slug and criterion keys
(`CRITERION_KEYS` in `src/lib/cities.ts`) and prints the closest cities in other countries,
leaving out unknown levels. Join slugs with `+` for « Vous êtes déjà allé à Dakar et à
Abidjan ? »: every source city's country is left out and the gap is summed over the sources, so
the cities that come first resemble all of them. Use two or three criteria: one 0–5 criterion
ties dozens of cities. Paste the exact command and its output into the piece's `research.md`.

If the ranking contradicts the idea (the operator's « calme, cadre, ordre → Abuja, Kigali » gives
Victoria, Praslin and Swakopmund on 2026-11-16), say so and let the operator choose: change the
answers, or keep the ranking's cities. Never hand-pick around it.

## The formats

| Format              | Shape                                                                                               | Mechanism                                                   | Line not to cross                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Devinette        | Card by card, preferences of a profile; « devinez la ville »; the top 3 last                        | Withheld answer: the reader guesses, so swipes              | Preferences in « vous aimez », never « vous êtes »; temperament is « inspiré du Big Five, ce n'est pas un test de personnalité »                 |
| 2. Ville jumelle    | A city (or two) the reader knows; the cities that resemble it, one per card                         | Recognition, then surprise: there is not one Africa         | Always « sur ce critère-là »; two cities close on nightlife are not alike overall                                                                |
| 3. Train-train      | A European routine (gym, brunch, after-work, quick trips); the African cities where it carries over | Identification: « c'est moi », sent to a friend             | Europe is not in the data: map the routine to quiz answers (`habits`, `rhythm`, `currentCity`…), never « Londres = Lagos »                       |
| 4. Saviez-vous      | One surprising fact about a city or neighbourhood                                                   | A flat statement that sounds impossible                     | Each fact sourced and dated; furthest from the quiz, and EthniAfrica's territory: use sparingly                                                  |
| 5. Ville → profil   | A city first, then « elle vous plaira si vous aimez… », from its scores and temperament             | Reversed guessing game: the reader checks « c'est moi ? »   | Preferences in « vous aimez », never « vous êtes »; every trait read from the city's scores, not from its reputation                             |
| 6. Top thématique   | Five cities on one theme (internet, flights, nightlife…)                                            | A ranked list: the reader looks for a city they know        | Quiz cities (`npm run social`), or a sourced list announced « hors quiz » on its first card, whose close card makes an honest, different promise |
| 7. Question/sondage | A question to the audience (« Dakar ou Abidjan pour un an ? »); the site's answer on the last card  | Commitment: an answer in the comments makes the post theirs | The last card is the site's answer from `npm run social`, said « selon le quiz »; never an invented vote or result                               |
| 8. Mode d'emploi    | How the quiz works, step by step                                                                    | Lower cost of trying: the reader knows what comes           | Only what the live site does today, checked on labas.africa before approval; no planned feature                                                  |

Before writing hooks, invoke `attention-architect` (global CLAUDE.md). Every loop a carousel
opens is closed on its last card or by the quiz.

## Simple, direct French

Operator, 2026-11-17, for every carousel: write the French people speak. Short sentences, common
words, one idea per sentence, subject–verb–object. Say « Vous parlez français », not « Vous
vivez en français »; « Vous aimez l'ordre », not « Vous aimez quand tout est à sa place »; no
nominal lists (« Sécurité, santé et écoles : non négociables ») when a verb says it (« Il vous
faut la sécurité, de bons hôpitaux… »). No turn of phrase, no wordplay, no literary register.
Reread every card, caption and alt text aloud before showing it: if it would sound odd said to a
cousin at the table, rewrite it.

## Data honesty on a card

From CLAUDE.md, applied to social copy: scores are editorial estimates, never « mesuré » or « les
données prouvent »; a percentage is « correspond à X % à ce profil »; any safety, discrimination,
LGBT-rights or conflict remark carries a dated source; travel advice never greys a city; never
write « gratuit » or « payant ».

## Conduct a piece

Each piece lives in `$LABAS_SOCIAL_DIR/production-instagram/<YYYY-MM-DD>-<slug>/`, its final
images in `$LABAS_SOCIAL_DIR/Instagram/NN-<slug>/` (NN: the post's number, two digits). The
operator sets `LABAS_SOCIAL_DIR` in their user settings; if it is unset, stop and ask for it.
Never write its value, or any path under it, into this repository: it is public.

Its `suivi.md` records the stage, each approval with its date and the operator's words, and the
next action, so another session can resume. On a resume, find the piece by subject; if several
match, ask. Never infer an approval from silence or a tool result.

| Stage    | Work                                                                                                                           | Stop                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Brief    | `brief.md`: format, angle, audience (diaspora settling, back-and-forth, investors), networks, destination link                 | **Approval 1** on the brief                |
| Research | `research.md`: the `npm run social` command and output; each claim → source → limit; image sources with credit and reuse terms | —                                          |
| Proof    | `cards.md`: the exact text of every card, then a preview rendered in the published look (Design below)                         | **Approval 2** on text, research and proof |
| Package  | `post.md`: final images in order and, per network, caption, first comment (or « aucun »), link placement, alt text per card    | **Approval 3** on the whole package        |
| Delivery | Hand over the files. Posting is a separate, explicit instruction; record each URL and date in `suivi.md`                       | —                                          |

The operator may merge approvals 1 and 2 (2026-11-19): then deliver brief, research, card text
and rendered preview together, and record in `suivi.md` that both were given at once.

A correction goes back to the earliest stage it touches: a new angle reopens the brief; a changed
city or claim reopens the proof; a caption change reopens only the package. Name what stays
approved.

### Design

Reuse the published look (operator, 2026-11-19); do not redesign it per post.

- **Renderer**: `$LABAS_SOCIAL_DIR/production-instagram/rendu/render.py <spec.json>` renders each
  card at 1080 × 1350 (4:5) through headless Chrome. Keep the piece's spec with its files.
- **Card kinds**:
  - `photo`: full-bleed photo, optional short text at the top, thin white frame.
  - `clue`: night background, small uppercase eyebrow (« Indice 1 sur 3 »), text in Fraunces.
  - `head`: a title with one phrase in saffron italic.
  - `city`: the city's name, big, over a saffron pill with the flag and the country.
  - `close`: wordmark, the question, a saffron button « Faites le quiz sur labas.africa »,
    « Abonnez-vous et partagez. », and the photo credits.
- **The first card is a photo only**: the most telling image of the city the carousel puts
  forward most, bright and beautiful; a dark or merely documentary picture is refused.
- **Colours** are the site's tokens in `src/styles/global.css`: `--night` (#161a5c) and
  `--saffron` (#ffb627); if the tokens change, the cards follow. Fonts are the site's
  (Fraunces, Nunito Sans).

Photos need a reuse licence and a credit. `src/data/photos.json` already credits one
Wikimedia Commons photo per site city (author, licence, source); credits go on the close card.
Record each photo's source, author and licence in `research.md`.

### Package

- Check the cards at phone width first, then larger.
- Instagram captions carry no clickable link: point to the profile link (« lien dans la bio »).
  Each network's bio link carries its own UTM:
  `https://labas.africa/?utm_source=<network>&utm_medium=bio`. Only where a link is clickable
  (a Facebook or LinkedIn caption, a story link) add `utm_campaign=<NN-slug>` for that post. Do
  not promise a page the site does not have.
- Alt text per card, in plain French, saying what the card shows.
- Keep each network's caption written for it; never copy one silently to another network.
