# Changelog

All notable changes to Là-bas (labas.africa) are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/). A pushed `v*` tag is a production deploy.

## [Unreleased]

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

[Unreleased]: https://github.com/big-emotion/labas/compare/v0.5.0...HEAD
[0.5.1]: https://github.com/big-emotion/labas/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/big-emotion/labas/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/big-emotion/labas/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/big-emotion/labas/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/big-emotion/labas/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/big-emotion/labas/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/big-emotion/labas/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/big-emotion/labas/compare/v0.1.2...v0.1.3
