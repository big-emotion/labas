# Card brief — Là-bas carousels

The brief to commission the carousel card template (Claude Design), from the operator's direction
of 2026-11-16. Once a template is accepted, record its version and reference files here; it then
becomes the visual authority for the `labas-social` skill.

## Chosen style: C « Carte postale » (operator, 2026-11-16)

Chosen among three proposals on the Claude Design canvas « Là-bas · Cartes carrousel »
(https://claude.ai/artifact/WhGoHoPGYZVR7xas9YmdyS, board `CartePostale.dc.html`), built on the
« Là-bas » design system (https://claude.ai/artifact/XUL4V2mUjGZuWr64bn5XBP). Measures below are
on the 1080 × 1350 card (the canvas draws it at a third).

- **Frame**: a 1 px near-white line inset 42 px from every edge, at about 55 % opacity, on every
  card, cover included.
- **Text at the top**, left-aligned, 100 px from the left edge, starting about 170 px from the
  top; a soft `--night-deep` gradient from the top edge (about 60 % at the top, gone by mid-card)
  only on cards that carry text.
- **Card number** top-right, « 02 / 06 », Nunito Sans 600, letter-spaced; not on the cover.
- **Line card**: one sentence in Fraunces 500, about 75 px.
- **Reveal card**: the city in Fraunces 700, about 140 px; below it « Seychelles · 91 % pour ce
  profil » in Nunito Sans 600, the percentage in `--saffron`.
- **Close card**: « Quelle ville vous ressemble ? » (Fraunces 500), « Faites le quiz · lien dans
  la bio » (Nunito Sans 700, `--saffron`), photo credits at the bottom left; a second soft
  gradient from the bottom edge carries the credits.
- **Logo watermark** bottom-right, inside the frame, about 60 px, white at 60 % opacity.
- **Cover**: photo, frame and watermark only.

The sample's photos are the site's 1024 × 768 ones: they settle the layout, not the photo
standard below.

## What the cards are for

Là-bas ranks 115 African cities against a reader's answers (labas.africa). Its carousels speak to
the French-speaking African diaspora: people thinking of settling « là-bas », going back and
forth, or investing. A carousel makes them want a city, then sends them to the quiz. The photo
does the persuading; the words stay few.

## Direction (operator, 2026-11-16)

- Very minimal. Sober type, readable on a phone, little text per card.
- A full-bleed photo of the city or neighbourhood on every card.
- The logo as a discreet watermark.
- The first card is a photo only: the most telling image of the city the carousel puts forward
  most.
- Only beautiful photos: bright, well lit, aesthetic, that make people want to go.

## Canvas

- 1080 × 1350 px (4:5, Instagram feed). Instagram's profile grid shows a 3:4 centre crop, so
  nothing important within 40 px of the left and right edges; keep text inside an 80 px margin.
- Exported as JPEG or PNG, one file per card, numbered in order.

## Card types

| Type   | Content                                                                                           | Notes                                                               |
| ------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Cover  | Photo only, watermark                                                                             | No title, no hook. The photo is the hook.                           |
| Line   | Photo + one short sentence (≤ 12 words)                                                           | Used for the profile traits, the routine steps, a fact.             |
| Reveal | Photo of the city + city name + country + « 91 % »                                                | The answer card. The city name is the largest text of the carousel. |
| Close  | Photo + « Quelle ville vous ressemble ? » + « Faites le quiz · lien dans la bio » + photo credits | Credits are mandatory (most photos are CC BY-SA).                   |

## Type and colour

- Fonts are the site's, self-hosted: **Fraunces** (display: city names, the one sentence) and
  **Nunito Sans** (small text: country, percentage label, credits). No other font.
- Text in `--thread` `#f1f0ff` (near-white) on the photo. Accent, sparingly: `--saffron`
  `#ffb627`. Deep tone for any scrim: `--night-deep` `#0e1145`.
- Size floor on the 1080 canvas: 44 px for any sentence, 28 px for credits. Readable at 320 px
  wide is the test.
- Legibility comes from where the text sits (on a calm part of the photo) and, only if needed,
  a soft gradient from `--night-deep` at the bottom. Never an opaque box or a coloured band.

## Logo watermark

- The « a » with Africa from `public/favicon.svg`, without its navy square.
- Small (around 64 px), near-white at low opacity, in the same corner on every card. Discreet
  enough not to compete with the photo, present enough to identify a reshared card.

## Photos

- Bright, sharp, well lit; daylight or golden hour. No grey sky, no dark or blurry picture, no
  photo that reads as documentary or bleak.
- Reuse licence required, credit recorded (author, licence, source). The site's own photos are
  in `public/photos/` with credits in `src/data/photos.json`.
- The template must accept any photo: test it on a light and a busy one (beach, skyline,
  market).

## What to deliver

- The four card types as editable templates at 1080 × 1350.
- One sample carousel built with them (cover, three lines, reveal, close) on real Là-bas photos.
- The rules a renderer must follow: margins, sizes, watermark position, scrim limits, how a long
  city name or sentence wraps.
