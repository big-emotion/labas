# Changelog

All notable changes to Là-bas (labas.africa) are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/). A pushed `v*` tag is a production deploy.

## [Unreleased]

## [0.13.0] - 2026-11-16

### Added

- « Reprendre plus tard » and « Mon espace »: a reader can save a journey with their e-mail and
  come back to it on any device through a login link, without a password. Answers, sensitive ones
  included, are kept only with an explicit consent box, can be downloaded or deleted at any time,
  and are erased three years after the last visit. Several journeys per reader. Switched off for
  readers until the Mailjet account is unblocked.
- The saved journeys run on a database beside the mail service, reachable only from it.

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

[Unreleased]: https://github.com/big-emotion/labas/compare/v0.12.1...HEAD
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
