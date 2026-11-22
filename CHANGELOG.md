# Changelog

All notable changes to Là-bas (labas.africa) are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/). A pushed `v*` tag is a production deploy.

## [Unreleased]

## [0.29.1] - 2026-11-23

### Fixed

- The admin's audience tab shows its figures again: the server reaches Plausible on its own
  network instead of through the public address, which timed out.

## [0.29.0] - 2026-11-23

### Added

- After a tap on the first city of a result, the site asks « Vous connaissez … ? Laissez une
  information utile pour les prochains », with a short animation, and the card's one filled button
  becomes « Laisser une info utile sur … ».
- Useful tips need no e-mail any more: the text alone is enough. Four starters (a neighbourhood,
  the cost of living, a surprise, « J'y vis ») begin the text with one tap. The team reads each
  one before it goes online and is mailed when one arrives.
- In the admin, the tips waiting to be read, with « Publier » and « Supprimer ».

### Changed

- The first card of a result: the photo sits right under the city's name, « Pas pour moi » right
  under the reaction, the full questionnaire becomes a link, and WhatsApp joins the other ways to
  share. « Y aller » becomes « Comment y aller », at the end of « Voir le détail ».
- The reviews block is now « Infos utiles sur … », dark and framed in saffron inside the result
  card.
- The admin's reactions read as one plain line each, newest first, with the reader's answers in
  the quiz's own words.
- The privacy pages say how a tip left without an address is read, kept and removed.

### Fixed

- An empty chip no longer shows under a review whose author gave no profile.
- The admin's audience tab gives up after 5 seconds and logs why Plausible could not be reached.

## [0.28.0] - 2026-11-20

### Added

- A slideshow of photos on each city's page: swipe through the city by day and by night, its
  streets, markets and waterfront, each photo with its author and licence. Fourteen cities have
  one so far (Abidjan, Accra, Cairo, Cape Town, Douala, Durban, Grand-Bassam, Johannesburg,
  Kinshasa, Lagos, Maputo, Nairobi, Victoria, Vilankulo), 102 free-licensed photos in all; the
  others keep their one photo until theirs are chosen.
- For the team: a « Réactions » tab in /admin lists the one-tap reactions left on a result, by
  version of the ranking and by city, with the answers behind each « Ça ne me correspond pas ».

### Changed

- The three one-tap reactions carry a sign: a heart for « J'aime », a thumb up for « Ça me
  correspond », a thumb down for « Ça ne me correspond pas ».
- When you react to a city of your result, the version of the site is now kept with your
  reaction, so that we know which ranking you were reacting to. Still no name, address, account,
  IP or time of day. The privacy pages say so.

### Fixed

- On the second and third cities of a result, « Réagir sur… » no longer touches the « À
  découvrir » badge.

## [0.27.0] - 2026-11-20

### Added

- Where regional institutions sit now counts in « Votre métier y recrute »: the central banks in
  Dakar, Yaoundé and Abuja, the stock exchanges in Tunis, Luanda, Addis Ababa and Maputo, the
  regional courts in Abidjan, Abuja, Ouagadougou and N'Djamena, the arbitration centres and large
  law firms in Johannesburg, Lagos, Nairobi, Casablanca, Port Louis, Kigali and Cairo, and the WHO
  regional office in Brazzaville. Law was documented in one city; it is now in fourteen. Each
  line carries its dated sources; the levels are editorial estimates.

### Fixed

- Your religion no longer sends you away from countries where it is commonly practised. It was
  scored as the share of the country that holds it, so a Muslim reader saw Nouakchott ahead of
  Abidjan, Cotonou or Lomé. A faith held by 15 % of a country or more now counts as fully present;
  only where it is rare does it weigh. The cards say « Votre foi y est bien présente ».
- If you settle for good, or keep one foot here and one there, your profession now weighs as much
  as something you will not compromise on: the first cities are ones where it really hires. It
  stays an ordinary answer when you asked for your family's country.

## [0.26.0] - 2026-11-20

### Added

- One-tap reactions on every city: « J'aime », « Ça me correspond », « Ça ne me correspond pas »,
  no account, with public counts on your result, on each city's page and in the list of cities.
  The cities list and the reviews can be sorted and filtered by them.
- « Jusqu'où aimeriez-vous aller ? »: one question, near the end of the quiz, on how far you would
  go from your own: your family's country, its region, a culture alike, or anywhere. It replaces
  « vivre près de vos origines » and, once you have named an origin, « aller vers l'inconnu ».
- « Des régions vous attirent plus que d'autres ? » for readers who would rather not name an
  origin.
- « À découvrir » on the cities outside the countries or regions your family knows. It is a label:
  the order does not change.
- The quiz says how near it is to your cities: « on cherche », « on se rapproche », « presque
  trouvé ».
- « Pourquoi ces villes ? » now recalls what you said of your own, and speaks of closeness only.

### Changed

- Your first city holds everything you can do next, right under its name: react, go on to the full
  questionnaire, share, WhatsApp, get the result by email, leave a review. The separate boxes are
  gone.
- The quiz opens on one question, your project. After that the order follows your answers and
  changes from one reader to the next. Your family's country and your religion are asked in the
  quick quiz, and the five questions on how you live are always asked.
- « Votre façon de vivre » replaces « tempérament » everywhere you read it.
- Up to five family regions and five countries.
- When you react to a city of your result, your answers, the three cities and your reaction are
  kept on our server to improve the ranking: by day, with no name, address, account or IP, origin
  and religion included if you gave them, erased after three years. It is written under the
  buttons and on the privacy pages.

### Fixed

- Your family's region, its country and your religion now keep their share of the score however
  many other questions you answer: a family from Central Africa no longer gets three Indian Ocean
  islands first, and a family from RD Congo sees Kinshasa.
- North African cities no longer lead the map for readers from other regions before they have
  said how far they would go, and the reverse.

## [0.25.0] - 2026-11-20

### Added

- « Pourquoi ces villes ? » above your cities: one line to unfold, which says what your top
  cities have in common and why the first one leads, in French and in English.
- « Ces villes vous ressemblent ? » right under your first city: say yes or not really in one
  tap, leave a review or share your cities. We count only the yes or the not really and which
  questionnaire you were on, never the cities or your answers; the privacy pages say so.

### Changed

- Your first city now comes right after « Vos villes »: the link to the full questionnaire is
  shorter on a phone, and the temperament and the sources note come after the cities.
- One news sign-up on the result, right after your cities. The one offered during the quiz
  closes when the quiz ends.

### Fixed

- A reader who names their origin and says they want to stay near their own (« Beaucoup », or
  « Je préfère rester en terrain connu ») no longer gets cities across the divide between North
  Africa and the rest of the continent at the top, whichever side their family is from. The
  origin alone changes nothing, and no city is removed from the list.

## [0.24.0] - 2026-11-19

### Added

- Là-bas in English: Over There. The quiz, the results, the cities and the reviews have English
  pages under `/en/`, with English addresses (`/en/cities/`, `/en/city/dakar/`, `/en/reviews/`).
  An « English » / « Français » link on every page opens the same page in the other language and
  keeps your shared result.
- « Notre méthode » and « Confidentialité » in English: `/en/method/` and `/en/privacy/`, with the
  same figures and the same promises.
- Reviews can be translated on request. The privacy pages say what is sent: only the review's
  public text, to DeepL SE (Germany, EU), translated once per language and kept with the review;
  never the author's name, journey, answers or address, and nothing unless someone asks.
- Over There has its own address, overthere.africa. Old `labas.africa/en/…` links lead there, and
  English readers write to hello@overthere.africa.
- « Pas pour moi » on the cities leading the quiz and on each result card: set aside that city,
  its whole country or its whole region, see how many cities go, and bring any of them back in
  one tap. The full questionnaire also asks which regions you would rather leave out.
- The places you set aside are kept like sensitive answers: in your browser, and in your space
  only with the box that names them. Analytics count the gesture, never the place.

### Changed

- The long city guides (neighbourhoods, daily life, holidays) stay in
  French on the English pages for now, with a note saying so.
- The Region filter on the results now takes out the regions you pick, instead of keeping them.

### Fixed

- Good healthcare can be a non-negotiable for every reader, not only for families: « De bons
  soins » and « L'école des enfants » are now two separate choices.

## [0.23.0] - 2026-11-18

### Added

- Share your result on WhatsApp, Facebook and X from « Garder vos résultats »: each button opens
  that network's share page with your three cities and the link. Nothing of these networks loads
  on Là-bas until you click.
- Instagram and TikTok open your phone's share sheet with the picture of your result, ready for a
  story; on a computer they copy the link.
- « Votre avis », a small tab on every page: give your opinion of the site or write to the team.
  On a computer it sits on the right edge; on a phone, small, at the bottom right. The message,
  and your address only if you want an answer, go to the team and are erased after a year;
  nothing from the quiz is sent.
- On « Les avis »: pick a region, then one of its cities from a list showing how many reviews each
  has, the most reviewed first. A city chosen shows its card above the reviews: photo, country and
  region, its tagline and pitch, and a link to its page.
- Sort the reviews: most recent, oldest, most liked, least liked, most replies.
- Reviews come twenty a page, numbered; the page and the filters stay in the address.
- The team reads the messages in /admin, beside the reviews.

### Changed

- Each review names its city and country and links to the city page.

### Removed

- The list of cities under the filters on « Les avis »: it looked like a filter and left the page.

## [0.22.1] - 2026-11-18

### Security

- Your origin, family country, faith and health filters are kept in Mon espace only when you tick
  their own box, now on every way of saving a journey, including « Reprendre plus tard » while
  signed in. The choice belongs to each journey: answering those questions later does not slip
  them in. Journeys started from Mon espace before this release had those answers kept without
  the box; they are erased.
- One malformed request could stop the service that saves journeys and sends e-mails; it now gets
  an error page and the service keeps running.
- Reporting a review needs a signed-in reader, and each reader counts once: three people, not
  three connections, are needed to hide a review. Who reported is in your downloaded file and goes
  with your space.
- « Recevoir mon lien de connexion » answers as fast whether or not the address has a space.

### Fixed

- Every safety, conflict and political remark on a city page (« À savoir ») now names a dated
  source. Conakry and Nosy Be are reworded to say what their sources say.
- The privacy page says the news address is erased three years after its last confirmation.

### Changed

- A few colours and the « top three » now come from one place each; nothing changes on screen.

## [0.22.0] - 2026-11-18

### Added

- « Les avis » (/avis): what readers say of every city, newest first, open to anyone. Search a
  city, a country or a word, keep one region, or pick a temperament: reviews by people with close
  preferences come first, and the cities they keep naming show above the list.
- A city page opens its reviews on /avis already filtered on that city.
- Reply to a review. Replies stay two levels deep: answering a reply files it under the same
  review, with « En réponse à … » above it. Replies never show their author's journey.
- Hearts on reviews and replies, with four more friendly marks behind « + » (👍 🙏 😂 💡); no
  thumbs down. Signed in only; tap again to take it back. Only the counts are public.
- « Les villes » (/villes): the cities by region, each linked to its page. Both footers now link
  to the cities and to the reviews.
- An admin page for the team (/admin, addresses in `ADMIN_EMAILS`): every review grouped by city,
  reported or hidden ones on top, with Masquer, Rétablir and Supprimer; and the audience over 7 or
  30 days from Plausible: visitors, the quiz step by step, the review counts, the most read pages.

### Changed

- The privacy page explains what replies and hearts make public and what is kept.

## [0.21.0] - 2026-11-18

### Added

- Reactions on every city: the city page shows what readers say of it, right after its photo,
  and you can add yours. Signed in, it goes online at once; otherwise one e-mail link publishes
  it and confirms your address, once for all your next reactions.
- Each result shows the three latest reactions on your first city inside its card; cities 2 and
  3 and every city of the full list link to their own reactions.
- A reaction shows its author's first city and temperament on one line, with their three cities
  and five traits one tap away. A box keeps them private; your answers are never shown.
- Authors can delete their reactions; a reaction reported by three people is hidden.
- A login link brings you back to the page you asked it from.
- Anonymous counts of reactions opened, sent and read, by city.

### Changed

- The privacy page explains what a reaction makes public and what is counted.

## [0.20.0] - 2026-11-17

### Added

- « Recevoir par e-mail » now opens your space in the same gesture: the e-mail shows your top
  three, and its « Voir mes résultats » button (7 days, single use) opens the full ranking with
  why each city fits. Origin, faith and health are kept only if you tick their own box; otherwise
  they stay on your device.
- Mon espace shows « Voir mes résultats » beside « Reprendre ».

### Changed

- « Envie d'aller plus loin ? » sits right under your top three.
- An e-mail link that was already used brings a reader still signed in back to Mon espace instead
  of the expired-link page.
- The privacy page explains what is kept when you receive your results by e-mail, and for how long.

### Fixed

- Saving a long full questionnaire with « Reprendre plus tard » could be refused: the service now
  accepts up to 8 KB instead of 2 KB.

## [0.19.0] - 2026-11-17

### Added

- A `labas-social` skill and an `npm run social` command to prepare Instagram carousels: every
  city a carousel names comes from the site's own ranking, so a reader who takes the quiz with the
  same answers finds the same cities.

### Changed

- The quick quiz opens on the project, the languages and the family's origin, then follows the
  answers, themes mixed: a follow-up comes right after its question (« Vivre près de vos
  origines » right after the origin), and each next question is the one most likely to change the
  top three. It ends once no question can change it; the rest waits in « Aller plus loin ». The
  counter says « question 7 », without a total.
- « Quelle taille de ville ? » now asks the size only and matches the city's real size; a new
  question, « Quel rythme de ville ? », asks the pace, right before or after it. A lively small town no longer passes for a big
  city.
- The family's region weighs at most like a non-negotiable, so the temperament can still decide
  between cities of the same region.
- The site is now served by nginx 1.31 (was 1.27).
- Build and test tools updated: ESLint 10, esbuild 0.28, PGlite 0.5.16, and the CI actions
  `checkout` and `setup-node` 7.

## [0.18.0] - 2026-11-17

### Added

- Every news e-mail, starting with the confirmation, carries a link to unsubscribe. It opens a
  page with a button, so a mail scanner opening links cannot unsubscribe anyone; the address is
  erased at once, and the news are turned off in « Mon espace » too.

### Changed

- The privacy page says where the news list lives, how long the confirmation link lasts and how
  unsubscribing works.

## [0.17.0] - 2026-11-17

### Added

- The news sign-up, « Recevoir par e-mail » and saved journeys are switched on.

### Changed

- Là-bas's e-mails (confirmation, results, sign-in link) leave from its Microsoft 365 mailbox
  through Microsoft Graph instead of Mailjet. The news list is kept in the site's own database,
  and an address is erased three years after its last confirmation.

### Fixed

- A deploy no longer stops when the database image, pinned by digest, is not yet on the server.

## [0.16.0] - 2026-11-16

### Changed

- Every answer is one piece of evidence and the pieces multiply, as in a guessing game: an answer
  given at the thirteenth question turns the list over as much as at the first. Ticking Arabic now
  puts Arabic-speaking cities first, wherever it comes in the quiz.
- The daily language weighs most of all answers. « Peu importe, je m'adapte » leaves it open.
- The project ranks on its own criteria (settling asks for safety, testing for an easy set-up).
- The family's region weighs on its own, by project: it draws a settler, barely a holidaymaker,
  whose trip leans away from it. « Près des vôtres » and the taste for adventure scale it:
  « Pas vraiment » stops the pull, and an appetite for the unknown makes the region nearly neutral,
  so the other answers mix the regions instead of swapping one for all the others.
- A documented tension with the family's country counts inside that answer, no longer with a
  fixed weight of its own; it is still never written on a card.

### Removed

- The reception rule and its data: documented racism no longer weighs in the ranking, nothing is
  inferred from an origin the reader did not give, and the origin question promises nothing about
  it. With no answer, every city ties.
- Le Cap's unsourced remark that Black repats feel less at home there than in Johannesburg; its
  sourced half (inequality and crime in some areas) stays.

### Fixed

- Every « À savoir » remark on safety, conflict, discrimination or LGBT rights now shows the dated
  sources that back it, under the remark on the city page.

### Security

- The server no longer tells its nginx version; every `.env` file is ignored; images and Actions
  are pinned by digest and SHA, and Dependabot bumps them weekly.

## [0.15.0] - 2026-11-16

### Added

- A reader who names their family's country is ranked away from a host country in documented
  tension with it: Rwanda for a family from RD Congo and the reverse (UN Group of Experts 2025,
  Human Rights Watch 2026), Gabon for a family from Cameroon, Nigeria or Mali (ban on small trade
  by foreigners, August 2025). A war weighs as much as reception, a ban half as much.
- The tension changes the ranking only and is never written on a result card, so a card never
  reads as a verdict on the reader's family. A family that also comes from the host country is
  never turned against it.

## [0.14.0] - 2026-11-16

### Changed

- Cities are ranked on what resembles the reader first. A practical criterion the reader did not
  name (safety, power and care, paperwork, set-up cost, flights, internet, jobs, schools, cost) is
  now a floor: only the weakest third of cities loses points on it. A stated need still ranks, and
  a non-negotiable weighs twice as much as before.
- Temperament answers no longer ask for safety or comfort: they are matched against the city's
  neighbourhoods, which weigh twice as much. The daily language weighs half as much.
- A card names a practical criterion as a reason only when the reader asked for it.
- On simulated quizzes, cities ever proposed in a top 3 rise from 85 to 106; Port-Louis falls from
  41 % to 30 % of top 3s and Kigali from 20 % to 11 %.

## [0.13.3] - 2026-11-16

### Changed

- Each anonymous quiz answer sent to Plausible carries the reader's path (Vacances, S'installer…)
  and the question's rank in it, so the dashboard shows where each path loses its readers; the
  « terminé » steps carry the path too. The privacy page says so.

## [0.13.2] - 2026-11-16

### Fixed

- The mail and accounts service waits for the database when it starts beside it, instead of
  leaving saved journeys off until the next restart.

## [0.13.1] - 2026-11-16

### Changed

- The « Fondation » profile likes cities « aux démarches simples et prévisibles », no longer
  cities where things « work as planned ».

## [0.13.0] - 2026-11-16

### Added

- « Reprendre plus tard » and « Mon espace »: a reader can save a journey with their e-mail and
  come back to it on any device through a login link, without a password. Answers, sensitive ones
  included, are kept only with an explicit consent box, can be downloaded or deleted at any time,
  and are erased three years after the last visit. Several journeys per reader. Switched off for
  readers until the Mailjet account is unblocked.
- The saved journeys run on a database beside the mail service, reachable only from it.

### Changed

- « Prévoir des imprévus »: organisation and friction give one 1–5 gauge under each city, like
  the criteria, instead of « Tout fonctionne comme prévu : n quartiers ». Cities rated as a whole
  mark it « estimation » and their other lines read « …, selon notre estimation ».

## [0.12.1] - 2026-11-16

### Changed

- A neighbourhood line that counts nothing reads as a sentence tied to our notes: « Aucun
  quartier où tout fonctionne comme prévu, selon nos sources ».
- One short note under the results and on each city page says where the information comes from
  (local voices, specialised and official sites), that sources can disagree and that the city can
  differ on the spot; the Méthode page explains it.

### Removed

- Plan, audit and review documents; code comments no longer point at docs.

## [0.12.0] - 2026-11-16

### Added

- Holiday mode: « Quand partez-vous ? » steers you to cities in their good season, away from
  the rains; « Ce que vous voulez vivre » adds safari and diving, surf or water sports. Each city
  page gets « En vacances »: the best months, what to do within about two hours and escapes for a
  day or a weekend, every item with its source.
- « La musique qui vous fait bouger ? » in the full questionnaire, for those who go out: seven
  club genres, each tied to its countries by dated sources (listed on the Méthode page).

### Changed

- A shorter quick quiz: budget, passport, the family's country, faith, the length of a holiday
  and trips home move to the full questionnaire, measured as the questions that change the result
  least.
- A neighbourhood line that counts nothing reads « aucun quartier », in the « against » colour,
  after the lines that fit.

### Fixed

- The results e-mail writes the neighbourhood lines as text.

## [0.11.0] - 2026-11-16

### Added

- « Recevoir par e-mail » is sent by Là-bas itself: the reader gives an address and receives
  their profile, three cities, their pages and the link to the result, with an optional box to
  sign up for the news in the same e-mail. Switched off until the Mailjet account is unblocked.

## [0.10.0] - 2026-11-16

### Added

- Share your result: the message and the e-mail carry your profile and why each city fits, with
  a link that opens your result for whoever receives it; « Enregistrer l'image » makes a picture
  of it to post or send. The link holds your temperament and cities only, never your other
  answers.
- On holiday, the quiz asks how long you stay and what you want to live there (beach, desert,
  nature, nights out, history, culture).

### Changed

- Each project has its own path: the questions come chapter by chapter, only those that fit
  your project are asked, and the answers you give shape the next ones (no origins after « Je
  préfère ne pas dire », no schools without children, no career on holiday).

### Fixed

- Going back and changing an answer no longer leaves answers that no longer apply counting in
  your result.

## [0.9.0] - 2026-11-16

### Changed

- Each city page is grouped by theme (the essentials, neighbourhoods, your typical week,
  discovering, criteria, the country, getting there), with shortcuts at the top and a short
  preview and « Voir plus » in each. The typical week shown is the one your answers point to.

## [0.8.0] - 2026-11-16

### Added

- Sign-up for Là-bas news by e-mail (new cities, quiz improvements, one e-mail a month at most),
  with a confirmation link. It is in the quiz from the fourth answer, once per visit, and on the
  result. Only the e-mail address is kept; nothing from the quiz is sent. Switched off until the
  Mailjet account is set up.

## [0.7.0] - 2026-11-16

### Added

- The full questionnaire ends like the quick quiz: your answers fold behind « Voir mes
  réponses », the top three cities get detailed cards (photo, why they fit, « Y aller », link to
  the city page), the rest expandable rows.

### Changed

- « Ce qui compte le plus pour vous ? » becomes « Sur quoi ne voulez-vous pas transiger ? »,
  says that the three choices weigh the most, and closes the quick quiz.

## [0.6.1] - 2026-11-15

### Removed

- The « raconte » prototype (describe your situation in your own words), which was not linked from
  the site. Free text will come through the ChatGPT and Claude versions of Là-bas.

## [0.6.0] - 2026-11-15

### Added

- The full questionnaire asks first the questions that fit your profile: on holiday and fond of
  going out, what kind of night; settling and fond of calm, what your evenings need. Each answer
  moves the cities that fit it.
- Your profile is shown at the end of both questionnaires, and under each city's percentage, the
  neighbourhoods that match your temperament (« Calme le soir : 3 quartiers sur 11 »).

## [0.5.1] - 2026-11-15

### Fixed

- Phones read the app description (for « add to home screen ») with its proper type.
- The « raconte » prototype now gives several languages and landscapes like the questionnaire;
  the old single-answer forms are gone from the engine.

## [0.5.0] - 2026-11-15

### Added

- « Garder vos résultats » under the result and the full ranking: share, print or save as PDF,
  or receive the result in your own mail app. The text carries cities and percentages, never
  answers.
- The full questionnaire picks up the quick quiz's answers (kept in your browser only) and goes
  straight to the next questions, with « Tout reprendre à zéro ».
- Audience funnel in Plausible: quick quiz finished, full questionnaire finished.

### Fixed

- The full questionnaire no longer asks the same question twice.

## [0.4.0] - 2026-11-15

### Added

- A picture when a link is shared on WhatsApp, Facebook, LinkedIn or X: the question and the map
  for the home page, and for each city its credited photo with « Vivre à … », or the map with the
  city ringed when it has no photo.
- Search engines get a sitemap of the 120 public pages, a canonical address per page and a
  description of the site; the prototype stays out.
- Là-bas can be added to a phone's home screen with its own icon.

### Changed

- City pages are titled « Vivre à Dakar, Sénégal ». The home description no longer promises ten
  questions.

### Fixed

- `/ville/dakar` (no final slash) redirected through plain http before reaching https.

## [0.3.0] - 2026-11-15

### Added

- Cities are matched to the reader's temperament neighbourhood by neighbourhood: 763
  neighbourhoods rated on the five temperament axes, on one scale shared by every city. A calm
  reader is drawn to cities that are mostly calm (Kigali before Abidjan) and still fits a lively
  city in part.

## [0.2.1] - 2026-11-15

### Security

- The site serves HSTS, a Content-Security-Policy (no inline script), frame protection and a
  Permissions-Policy.
- Test tooling upgraded (vitest 5), clearing two critical advisories.

### Added

- Audience measurement with Plausible: cookieless, one anonymous count per quick-quiz answer;
  origin, family country, feeling at home and faith are never sent.

### Fixed

- Every source behind a score links over https.

## [0.2.0] - 2026-11-15

### Added

- « Y aller » on each result: links to flights, lodging and local groups for the city.
- A free-text entry prototype (`/raconte`, not linked, not indexed): a situation written in
  French is read into quiz answers in the browser, with the words behind each answer shown.
- Agent skills for the project: `labas-audit` (production-readiness audit, first report
  6.5/10 in `docs/PRODUCTION-READINESS-AUDIT.md`) and `labas-release`.

### Security

- The public repository no longer names the server, its IP address or its providers; a check
  fails the build if they come back.
- Secrets are scanned over the whole history on every pull request (gitleaks), commits pass
  through hooks (infra check, lint, format, Conventional Commits), and `main` is protected.

### Changed

- Documentation of how cities get a temperament profile from their neighbourhoods.

## [0.1.4] - 2026-11-15

### Changed

- The quiz fits the project: an investor who will not live there is no longer asked about
  life on site, and a holidaymaker is not asked about their job.

## [0.1.3] - 2026-11-15

### Changed

- Every question is a direct question with one sentence saying what the answer changes;
  « Quel paysage autour de vous ? » replaces the weekend question.
- Documented racism or xenophobia is named in its source's own words, with source and year.

### Security

- A reader who does not give their origin is no longer sent where anti-Black racism is
  documented.

[Unreleased]: https://github.com/big-emotion/labas/compare/v0.29.1...HEAD
[0.29.1]: https://github.com/big-emotion/labas/compare/v0.29.0...v0.29.1
[0.29.0]: https://github.com/big-emotion/labas/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/big-emotion/labas/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/big-emotion/labas/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/big-emotion/labas/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/big-emotion/labas/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/big-emotion/labas/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/big-emotion/labas/compare/v0.22.1...v0.23.0
[0.22.1]: https://github.com/big-emotion/labas/compare/v0.22.0...v0.22.1
[0.22.0]: https://github.com/big-emotion/labas/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/big-emotion/labas/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/big-emotion/labas/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/big-emotion/labas/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/big-emotion/labas/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/big-emotion/labas/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/big-emotion/labas/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/big-emotion/labas/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/big-emotion/labas/compare/v0.13.3...v0.14.0
[0.13.3]: https://github.com/big-emotion/labas/compare/v0.13.2...v0.13.3
[0.13.2]: https://github.com/big-emotion/labas/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/big-emotion/labas/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/big-emotion/labas/compare/v0.12.1...v0.13.0
[0.12.1]: https://github.com/big-emotion/labas/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/big-emotion/labas/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/big-emotion/labas/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/big-emotion/labas/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/big-emotion/labas/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/big-emotion/labas/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/big-emotion/labas/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/big-emotion/labas/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/big-emotion/labas/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/big-emotion/labas/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/big-emotion/labas/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/big-emotion/labas/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/big-emotion/labas/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/big-emotion/labas/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/big-emotion/labas/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/big-emotion/labas/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/big-emotion/labas/compare/v0.1.2...v0.1.3
