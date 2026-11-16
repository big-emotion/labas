# Saved journeys and « Mon espace »

Decided with the operator on 2026-11-16. Code: `src/server/accounts.ts`, tested against a real Postgres
(PGlite) in `accounts.test.ts`. Mockup: the « sauvegarder et reprendre » canvas (7 boards).

## Why it works this way

- **A link by e-mail, never a password.** No password to store, leak or reset. The service already
  mails signed links for the news, so the reader learns one gesture. A Google or Microsoft login was
  set aside: each provider means an application to register and screens to review, for little gain at
  this stage.
- **Sensitive answers are kept, with explicit consent.** Origin, faith, health and the same-sex-law
  filter are special-category data (GDPR art. 9). They are stored only after the reader ticks a
  separate, unticked box that names them. They are never sent to a partner, to analytics or into an
  e-mail.
- **Saving under someone else's address does nothing visible.** A save creates an unconfirmed journey,
  and only opening the link from that address confirms it. Until then it does not show in Mon espace,
  and it is erased after 7 days.
- **Nothing reveals who uses Là-bas.** « Recevoir mon lien de connexion » gives the same answer
  whether or not the address has a space.
- **Tokens are stored hashed.** A copy of the database opens no session and no link.

## Lifetimes

| What                                                      | How long                                  |
| --------------------------------------------------------- | ----------------------------------------- |
| Link mailed after « Reprendre plus tard »                 | 24 hours, single use                      |
| Login link asked from Mon espace                          | 15 minutes, single use                    |
| Session (`labas_session`, HttpOnly, Secure, SameSite=Lax) | 30 days                                   |
| Unconfirmed account or journey                            | 7 days, then erased                       |
| A space                                                   | 3 years after the last visit, then erased |

`purge()` applies these at start-up and then once a day.

## Routes (`/api/compte`, the subscribe service)

| Route                                     | Who            | Does                                                                           |
| ----------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `POST /api/compte/sauvegarder`            | anyone         | Email, consent, a journey → unconfirmed save plus a 24-hour link               |
| `POST /api/compte/lien`                   | anyone         | Email → a 15-minute link if the address has a space; same answer otherwise     |
| `GET /api/compte/connexion?t=`            | link holder    | Confirms, opens a session, redirects to `/espace/` (or `/espace/lien-expire/`) |
| `GET /api/compte`                         | session        | Email, news choice, `keptUntil`, confirmed journeys                            |
| `GET /api/compte/export`                  | session        | Everything kept, as a JSON download                                            |
| `PATCH /api/compte`                       | session        | Turns the news on or off (also in the Mailjet list)                            |
| `POST /api/compte/parcours`               | session        | A new journey                                                                  |
| `PUT` · `DELETE /api/compte/parcours/:id` | the owner only | Save answers as the quiz goes · delete one journey                             |
| `DELETE /api/compte`                      | session        | Erases the space, its journeys and sessions, and removes it from the list      |
| `POST /api/compte/deconnexion`            | session        | Ends the session                                                               |

Every change must come from `https://labas.africa` (Origin check). The cookie alone authorises
nothing cross-site. Answers go through `cleanAnswers` (`src/lib/keep.ts`), so only questions and
choices the quiz offers reach the database. Results are not stored: the page computes them from the
answers.

## Still to build

The pages (« Reprendre plus tard » in the quiz, `/espace/`, `/espace/lien-expire/`, the header
link) wait for the mockup to be approved. The rewritten privacy page ships with them.
