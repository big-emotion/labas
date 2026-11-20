# Saved journeys and « Mon espace »

Decided with the operator on 2026-11-16; « Recevoir par e-mail » opens a space since 2026-11-17. Code: `src/server/accounts.ts`, tested against a real Postgres
(PGlite) in `accounts.test.ts`. Mockup: the « sauvegarder et reprendre » canvas (7 boards).

## Why it works this way

- **A link by e-mail, never a password.** No password to store, leak or reset. The service already
  mails signed links for the news, so the reader learns one gesture. A Google or Microsoft login was
  set aside: each provider means an application to register and screens to review, for little gain at
  this stage.
- **« Recevoir par e-mail » opens the space in the same gesture** (operator, 2026-11-17). Before,
  the e-mail carried a `#r=` link with the top three only, and readers who came back from it found
  neither the rest of the ranking nor why each city fits. Now the e-mail stays short (the top
  three) and its button is a login link that lands on the full result, recomputed from the kept
  answers. Asking for the e-mail is the request that justifies keeping the result; the sensitive
  answers still need their own box, and without it they never leave the browser
  (`resultsMailBody`), and the server strips them again (`withoutSensitive`). The road not taken:
  a permanent link to the result alone, simpler but readable by anyone holding the e-mail.
- **Sensitive answers are kept, with explicit consent.** Origin, faith, health and the same-sex-law
  filter are special-category data (GDPR art. 9). They are stored only after the reader ticks a
  separate, unticked box that names them, on every form that keeps a journey (« Reprendre plus
  tard » signed in or not, « Recevoir par e-mail »). The choice is stored per journey
  (`journeys.sensitive`), so answers given later to a journey kept without the box are stripped
  too (`keptOf` in `accounts.ts`, decided 2026-11-18 after the audit found `/parcours` storing them
  without one). Journeys from before the column were migrated: one started from Mon espace had its
  sensitive answers erased. They are never sent to a partner, to analytics or into an e-mail.
- **Saving under someone else's address does nothing visible.** A save creates an unconfirmed journey,
  and only opening the link from that address confirms it. Until then it does not show in Mon espace,
  and it is erased after 7 days.
- **Nothing reveals who uses Là-bas.** « Recevoir mon lien de connexion » gives the same answer
  whether or not the address has a space, and as fast: the mail is sent after the answer.
- **Tokens are stored hashed.** A copy of the database opens no session and no link.

## Reactions on a city

Decided with the operator on 2026-11-18. Code: the `/api/compte/reactions` routes in
`src/server/accounts.ts`, tested in `reactions.test.ts`; the block is `components/Reactions.astro`.

- **On a city, not on a ranking.** A ranking differs for every reader; a city is the same for
  all, so its thread is worth reading. The full thread sits on the city page, right after the
  photo; result pages show the first city's three latest reactions inside its card, under its
  pitch, on every screen. The other two cards carry a count, and every city of the full list a
  « Voir les réactions » link in its detail. A preview in the map column was tried and dropped
  (operator, 2026-11-18): it shrank the map for little gain.
- **High and light.** Reactions are what the operator wants to learn from, so the block sits
  above the fold and on `--thread`, the one light surface of the site.
- **One e-mail, once.** A signed-out reader leaves an address; the reaction waits, unpublished,
  and the link that publishes it also confirms the address and opens a session. A signed-in
  reader publishes at once. An address that already has a space gets the same link, which is
  also a login.
- **Back where it was asked.** A link may carry a way back, stored with the token rather than
  written in the URL, and only a path of this site (`backOf`). « Recevoir mon lien de connexion »
  uses it too.
- **The journey is public by default, one box keeps it back** (operator, 2026-11-18): the top 3
  and the temperament (archetype and five traits) show under the reaction unless « Ne pas rendre
  public » is ticked. Both are recomputed from the result link with `resultAt`, so no answer and no
  forged text is published; the temperament is the one a shared result link already carries. The
  city page uses the last result shown in this browser; the shared result page offers none, since
  that result is someone else's.
- **One line, then the detail.** Under the text, a single line shows the first city, the
  temperament and « +2 villes »; a tap opens the three cities and the five traits. Three layouts
  were mocked up (a reveal button, pills by the name, this line); the panel always open outweighed
  the reaction itself, and pills by the name did not fit at 430 px (operator, 2026-11-18).
- **Back to the city page.** The link that publishes a reaction written on a result page lands on
  the city page: the quick quiz cannot be redrawn from a link, it starts over.
- **Moderation, minimal.** Authors delete their own reactions; three reports from different
  signed-in readers hide one (operator, 2026-11-18: connections were too cheap to count, one
  person with three addresses could hide any review). `reaction_reports` keeps who reported so
  that each counts once across restarts; it is in the export, goes with the space, and « rétablir »
  clears it. The road not taken: a review queue before publication, too slow for a beta whose
  point is to hear readers.
- **Measured, anonymously.** Three Plausible goals (`reactionEvent` in `src/lib/analytics.ts`):
  « Réaction : formulaire ouvert », « Réaction envoyée » (statut: published at once or waiting for
  its link) and « Réactions consultées », each with `lieu` and `ville`. Publication by the e-mailed
  link happens on the server and is not counted.
- **Display names** are optional, 40 characters at most; without one, « Utilisateur » and a number
  stable for the account. The address is never shown.

## One-tap reactions on a city

Decided with the operator on 2026-11-20. Code: `src/lib/taps.ts`, `src/lib/taps-dom.ts`, the
`/api/compte/taps` routes and the `city_taps` table.

- **No account, on purpose.** Asking for a login before a tap would cost most of the taps, and
  the reader's first result is where the site asks for a reaction.
- **Counts only.** `city_taps` holds one row per city and answer. The reader's own answer lives
  in their browser (`labas:taps` in localStorage) and travels with the next tap as `was`, so the
  server can move a count without ever knowing who tapped. There is nothing to export or erase.
- **The road not taken**: a row per browser identifier would stop a second count from the same
  browser, but it would keep a pseudonymous trace of which cities a browser reacted to, and a
  script can mint identifiers anyway. The per-connection limit is the only real guard; a
  determined reader can still count more than once.

## What a reaction teaches (`quiz_outcomes`)

Decided with the operator on 2026-11-20. A tap on a result page posts, with the reaction, the
journey that led to it: `{ kind, answers, top }`. The server keeps one row per tap: the day, the
questionnaire, the city, the reaction (null when taken back), the cleaned answers and the three
city slugs. It is the site's learning data: where readers say « ça ne me correspond pas », for
which answers.

- **Sensitive answers are kept**, by the operator's decision, because the origin and the distance
  a reader accepts are what the ranking most needs to learn. The reader is told under the buttons
  before tapping, and on the privacy page.
- **No way back to a reader**: no account, address, IP or time of day, and no key shared between
  two rows. A row can therefore not be found or erased on request; every row is erased after
  three years (`purge`).
- **Only from a result**: a tap on a city page or in the cities list sends no journey.
- **The site's version** (operator, 2026-11-20): each row carries the version that ranked the
  cities, set by the server from `package.json`, never by the browser. Three versions went out
  on 2026-11-20, so the day could not tell which ranking a reader reacted to. Rows kept before
  v0.28.0 have none.
- **Read in /admin** (« Réactions », `GET /api/compte/admin/outcomes`, the 2 000 newest): the
  reactions by version and by city, and each « ça ne me correspond pas » with its answers. Until
  then the table was written and never read. Nothing feeds the ranking by itself: a change of
  weight is still a decision, a test and a release.

## The avis space (`/avis`, `/villes`)

Decided with the operator on 2026-11-18: another way in than the quiz. Code: `src/pages/avis.astro`,
the search in `src/lib/review-search.ts`, the list in `Reactions.astro` (mode `everywhere`).

- **Read by anyone, newest first.** `GET /api/compte/reactions` without `ville` returns up to the
  1 000 newest reviews of every city; the page filters, sorts and pages them in the browser. The
  road not taken: a server-side search and pagination, premature while the whole list fits in one
  answer, and heavy because the temperament order is computed from each author's profile. Past
  the cap, page on the server.
- **Region, then city.** A region shows its cities in a list, the most reviewed first with their
  count (« Dakar (12) »); picking one keeps only its reviews and shows a card for the city (name,
  country, its pitch, a link to its page). The list of cities that used to sit under the filters
  is gone (operator, 2026-11-18): it looked like a filter and left the page.
- **Sorts and pages.** Plus récents (default), plus anciens, plus aimés, moins aimés (every
  friendly mark counts the same), plus de réponses; twenty reviews a page, numbered.
- **Place filters are strict, the temperament only orders.** A reader asking for Dakar wants Dakar;
  a temperament puts the closest authors first (same archetype, then nearest on the five traits),
  the chosen sort orders those equally close, and the others stay below « Moins proches », so a
  young list never answers « nothing found ». The filters and the page sit in the address, so a
  city page links to `/avis/?ville=…`.
- **Replies, two levels, never a tree.** A reply hangs on the first review (`parent_id`); a reply
  to a reply hangs there too and names whom it answers (`mention`). A reply carries no journey and
  follows the review's rules: signed in it goes online at once, otherwise one e-mailed link
  publishes it and signs the reader in. Deleting or hiding a review takes its replies with it.
- **Marks, friendly only.** A heart first, then 👍 🙏 😂 💡 behind « + »; no thumbs down, a reply is
  for disagreeing. One of each per space, a second tap takes it back, so marking needs a session.
  Only counts are public; `reaction_marks` keeps who marked to allow the undo, is in the export and
  goes with the space. At most 120 marks an hour per space.
- **`/villes`** lists every city by region, static, for whoever wants a city page without the quiz.

## Translating a review (DeepL)

Decided with the operator on 2026-11-18, with the English site. Code: `src/server/deepl.ts` and
the `/traduction` route in `accounts.ts`, tested in `translation.test.ts`; the button is in
`reactions-dom.ts`.

- **On request, one review at a time.** Under each review and reply, « Traduire » (« Translate »)
  shows it in the page's language, and « Voir l'original » brings the original back. Nothing is
  translated unless a reader asks: most reviews will be read by readers of their own language.
- **Only the text, looked up by id.** The route takes a review's id and a target (`fr` or `en`),
  never a text: the service cannot be used as a free translation proxy, and the name, the journey
  and the answers never reach DeepL. No source language is sent: DeepL detects it, and when it is
  already the page's, the page says « Déjà en français » / « Already in English ».
- **Once per review and language.** The copy is kept in `reaction_translations` (review, target,
  text, detected language, date), deleted with the review by the foreign key, so it goes when the
  review, its thread or the space goes. Reviews are never edited, so a copy never goes stale. A
  connection may send 30 reviews an hour to DeepL; copies already kept do not count.
- **Off without a key.** Without `DEEPL_API_KEY` the route answers 503 and `GET
/api/compte/reactions` says `translate: false`, so the page shows no button.
- **Measured, anonymously.** « Réaction traduite » with `lieu` and `ville`, like the other
  reaction goals; never the text or the languages.

## In the reader's language

Decided with the operator on 2026-11-18. Every form that makes the service write an e-mail (news
sign-up, « Recevoir par e-mail », « Reprendre plus tard », a login link, a reaction) sends the
page's `locale` (`fr` or `en`; anything else reads as French). The e-mail is written in it, and
its links open the pages in that language (`pageUrl` in `emails.ts`: `SITE_URL` plus the built
path, English under `/en/`; once `EN_SITE_URL` names the English domain, English links, sign-in
links included so the session cookie lands there, use it with the bare English paths). The links the service signs carry `lang=en` when they come
from English, so the redirects after them (`/en/my-space/`, `/en/my-space/link-expired/`,
`/en/news/confirmed/`, `/en/news/invalid-link/`) stay in English; `lang` only picks a page, the
token alone authorises. `news_subscribers.locale` keeps the language of the last confirmation, so
the news can be written in it. « Utilisateur 1234 » is stored and served in French and shown as
« User 1234 » on English pages. The feedback tab's mail to the team and `/admin` stay French.

## The feedback tab (« Votre avis »)

Decided with the operator on 2026-11-18. Code: the `/api/compte/messages` route in `accounts.ts`,
tested in `messages.test.ts`; the tab is `components/Feedback.astro`, mounted by `layouts/Page.astro`
and `index.astro` on every page but `/admin`.

- **Private, unlike `/avis`.** A review of the site or a message to the team, never published.
  The site had no contact form; a `mailto:` alone loses readers who have no mail app set up.
- **A tab at the edge, not a button in the page** (the Hotjar/Usabilla pattern): on the right edge,
  vertically centred, from 768 px; bottom right on a phone, above the gesture area, opening a bottom
  sheet. A plain panel rather than a modal `<dialog>`, so the reader still sees what they comment
  on. The page keeps 64 px at its end on a phone so the tab never covers its last button.
- **What travels.** The kind, the text (2000 characters at most), the page's path, and an address
  only when the reader wants an answer. Nothing from the quiz (`feedbackBody` in
  `src/lib/feedback.ts`). The page path is kept only when it is a path of this site (`backOf`).
- **Where it goes.** Kept in `messages` first, then mailed to the team's mailbox (`REPLY_TO`), never
  to the reader; Reply-To is the reader's address when they gave one. A failing mail service loses
  nothing: the message waits in `/admin`, so the reader is still told it arrived.
- **No account.** `messages` has no link to `accounts`: writing needs no login, and the address
  given here opens no space. Its own limits: 5 an hour per connection, 3 a day per address.
- **Measured, anonymously.** « Message envoyé » with `type` (Avis or Message), never the text, the
  page or the address (`messageEvent`).

## The admin (`/admin`)

Decided with the operator on 2026-11-18. Code: the `/api/compte/admin` routes in `accounts.ts`,
tested in `admin.test.ts`; the figures in `src/server/plausible.ts`; the page `src/pages/admin.astro`.

- **Who.** The addresses in `ADMIN_EMAILS`, signed in with the usual magic link. Anyone else gets
  403, and the static page holds nothing until the API says yes. The road not taken: a password
  or a separate admin account, one more secret for a one-person team.
- **What.** Every published review and reply, hidden ones included, grouped by city (newest
  activity first) with « À relire » on top: hidden first, then the most reported. Never the
  author's address: moderating does not need it, and the privacy page says it is never shown.
- **Messages.** The feedback tab's messages, newest first, in their own tab, with the reader's
  address only when they gave it for an answer: it is the team's own inbox. « Supprimer » erases one.
- **Actions.** « Masquer » sets `hidden`; « Rétablir » clears `hidden` and the reports, since the
  operator has read it; « Supprimer » deletes the review and its replies (two taps, no dialog).
  Public reads skip `hidden` as they skip three reports.
- **Figures.** The server asks Plausible's Stats API v2 with a key that never reaches the browser:
  visitors, pages viewed and every goal over 7 and 30 days, the quiz funnel as a share of visitors,
  the most read pages and the cities reviewed over 30 days. No Plausible frame in the page; the full
  dashboard is one link away. A refusal shows as an error, never as zeros.

## Lifetimes

| What                                                      | How long                                  |
| --------------------------------------------------------- | ----------------------------------------- |
| Button of the results e-mail (« Voir mes résultats »)     | 7 days, single use                        |
| Link mailed after « Reprendre plus tard »                 | 24 hours, single use                      |
| Login link asked from Mon espace                          | 15 minutes, single use                    |
| Session (`labas_session`, HttpOnly, Secure, SameSite=Lax) | 30 days                                   |
| Unconfirmed account or journey                            | 7 days, then erased                       |
| Unpublished reaction, and its link                        | 7 days, then erased                       |
| A space                                                   | 3 years after the last visit, then erased |
| News confirmation link                                    | 7 days                                    |
| News address (`news_subscribers`)                         | 3 years after its last confirmation       |
| News unsubscribe link (`/nouveautes/desinscription/#t=`)  | Never expires; the button erases at once  |
| Message from the feedback tab (`messages`)                | 1 year after it was sent, then erased     |
| A review's translation (`reaction_translations`)          | As long as the review, erased with it     |

`purge()` applies these at start-up and then once a day.

## Routes (`/api/compte`, the subscribe service)

| Route                                       | Who            | Does                                                                                             |
| ------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `POST /api/compte/sauvegarder`              | anyone         | Email, consent, a journey → unconfirmed save plus a 24-hour link                                 |
| `POST /api/compte/resultats`                | anyone         | Email, result link, journey → top-three e-mail plus a 7-day link to the result                   |
| `POST /api/compte/lien`                     | anyone         | Email (and `back`) → a 15-minute link if the address has a space; same answer otherwise          |
| `GET /api/compte/connexion?t=`              | link holder    | Confirms, opens a session, redirects to `/espace/` (or `/espace/lien-expire/`)                   |
| `GET /api/compte`                           | session        | Email, news choice, `keptUntil`, confirmed journeys                                              |
| `GET /api/compte/export`                    | session        | Everything kept, as a JSON download                                                              |
| `PATCH /api/compte`                         | session        | Turns the news on or off (also in the news list)                                                 |
| `POST /api/compte/parcours`                 | session        | A new journey                                                                                    |
| `PUT` · `DELETE /api/compte/parcours/:id`   | the owner only | Save answers as the quiz goes · delete one journey                                               |
| `DELETE /api/compte`                        | session        | Erases the space, its journeys and sessions, and removes it from the list                        |
| `POST /api/compte/deconnexion`              | session        | Ends the session                                                                                 |
| `GET /api/compte/taps`                      | anyone         | The one-tap reactions of every city, as counts: `{ taps: { dakar: { like, suits, not } } }`      |
| `POST /api/compte/taps`                     | anyone         | `{ city, kind, was }` adds one tap and takes back the one it replaces; 60 an hour per connection |
| `GET /api/compte/reactions?ville=`          | anyone         | Published reviews of a city (every city without `ville`), with replies and mark counts           |
| `POST /api/compte/reactions`                | anyone         | A review, or a reply with `replyTo`. Signed in: online at once; else a 7-day link                |
| `POST /api/compte/reactions/:id/marques`    | signed in      | Puts a mark, or takes it back; answers the counts and the reader's own marks                     |
| `POST /api/compte/reactions/:id/traduction` | anyone         | `target` → the published review in that language, `{ text, detectedSource }`; 503 without a key  |
| `POST /api/compte/messages`                 | anyone         | `kind`, `text`, `page`, optional `email` → kept, mailed to the team; 202                         |
| `GET /api/compte/admin`                     | admin only     | Every review and reply (never an address), and the feedback tab's messages                       |
| `DELETE /api/compte/admin/messages/:id`     | admin only     | Deletes one message                                                                              |
| `POST /api/compte/admin/reactions/:id`      | admin only     | `action`: `masquer`, or `retablir` (also clears the reports)                                     |
| `DELETE /api/compte/admin/reactions/:id`    | admin only     | Deletes a review and its replies                                                                 |
| `GET /api/compte/admin/stats`               | admin only     | The Plausible figures; 503 without a key, 502 when Plausible fails                               |
| `POST /api/compte/reactions/:id/signaler`   | anyone         | Counts one report per connection; three hide the reaction                                        |
| `DELETE /api/compte/reactions/:id`          | the owner only | Deletes one reaction                                                                             |

Every change must come from `https://labas.africa`, or from `EN_SITE_URL` when it is set (Origin check). The cookie alone authorises
nothing cross-site. Answers go through `cleanAnswers` (`src/lib/keep.ts`), so only questions and
choices the quiz offers reach the database. Results are not stored: the page computes them from the
answers, so a result kept without the sensitive answers may rank a little differently, and the full
questionnaire asks those questions again.

A results link (`&vers=resultats`) lands on `/espace/?ouvrir=<journey>`, which puts the answers back
in the browser and opens `/approfondir/?parcours=<journey>#vos-villes`. A used or expired link sends
a reader still signed in on that browser to `/espace/` instead of the expired page.

`/api/resultats` (no database) still sends the old e-mail with the `#r=` link: the page falls back
to it when `/api/compte` answers 503, so the e-mail never depends on the database.

## The pages

- **« Reprendre plus tard »** (`components/SaveLater.astro`, beside the progress of both quizzes):
  - a reader who is already signed in saves straight to Mon espace;
  - anyone else gives an e-mail address and ticks the consent box.
- **`/espace/`**: the login form, then the journeys, « Mes données » (news, download, delete everything) and « Me déconnecter ». A deletion is confirmed in a dialog first.
- **`/espace/lien-expire/`**: shown for a used or expired link.
- **« Recevoir par e-mail »** (`components/KeepResults.astro`, under the top three): an e-mail
  address, the unticked box for the sensitive answers, the news box.
- **Mon espace** shows « Voir mes résultats » beside « Reprendre » once a journey ranks cities.
- **Resuming**: « Reprendre » puts the journey's answers back in the browser and opens the full questionnaire. That questionnaire asks only what is missing, so a quick quiz left halfway continues there too. While the tab stays signed in, each answer is saved again (`syncJourney`).
- **Visibility**: everything shows only when `PUBLIC_NEWSLETTER` is set, the same switch as the e-mails, since nothing works without them.
