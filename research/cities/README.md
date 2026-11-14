# City curation (Phase 2)

Raw, sourced, atomic items about **daily life** in every city of `src/data/cities.json`, plus
the extra cities the country dossiers suggest. This is curation, not copy: nothing here is
reader-facing text, and nothing here should be read as a measurement. Testimonies are
anecdotes; prices are dated asking prices; editorial scores in `cities.json` are untouched.

Phase 1 (`research/countries/`, `research/social/`) found *where* the information is. This
folder holds what was read there and elsewhere, city by city.

## Layout

```
research/cities/
  README.md          this file
  PROGRESS.md        hand-off table, one row per city file (items, target, sources, social, gaps)
  <country-slug>/    same slugs as research/countries/
    <city-slug>.md   one file per city
  _social/           social-pass staging, only for countries whose web pass had not finished
```

## File format

```markdown
# <City>, <Country>

> Curated <date>. Raw items for Là-bas — not published text. Testimonies are anecdotes, not data.

## Items
- [cost.rent] <one fact or one testimony, own words, English>. — <source + date>, <kind>, confidence: <high|medium|low>

## Gaps
- What was searched for and not found.

## Sources read
1. Title — URL — kind — date read

## Spot-check (<date>)
- <tag> <first words of item> — supported | corrected | unsupported
```

- **One item per line**, paraphrased; at most one quote under 15 words.
- **Kind**: `official`, `local-media`, `intl-media`, `blog`, `company`, `social-caption`,
  `social-comment`, `forum`, `academic`.
- **Safety, racism, LGBT, conflict and women's-safety items** always carry a dated source. A
  forum or comment thread alone is never enough; the spot-check marks such items unsupported.
- **Prices** are in local currency and EUR, at the rate stated in the country dossier, with the
  date. Conflicting figures are listed side by side, never averaged.
- **Markers**: `⚠ spot-check <date>: unsupported` (the cited source does not back the item),
  `✎ spot-check <date>: corrected` (item rewritten to match its source).
  `<!-- social-pass 2026-11-14 -->` opens the block of items that came from Instagram or
  Facebook; `(national)` marks a social item about the whole country, filed under its main city.
- **Privacy**: no names, handles or photos of private individuals. Comment-derived items say
  "comments under @account post <date> (n≈…)". Public creators, media and businesses are named.

## Provisional categories

Kept coarse on purpose: the criteria-architecture session owns the definitive taxonomy and
these tags are meant to be remapped.

`cost.rent` `cost.living` `cost.salary` `cost.negotiation` · `housing.areas` `housing.search` · `work.jobs`
`work.remote` · `business.startup` `business.admin` `business.invest` · `daily.power`
`daily.internet` `daily.water` `daily.transport` `daily.money` · `health.care` ·
`family.schools` `family.childcare` · `safety.general` `safety.women` · `social.nightlife`
`social.culture` `social.food` `social.sport` `social.religion` `social.pace` ·
`community.diaspora` `community.expat` `community.returnee` · `admin.visa` `admin.residency`
`admin.nationality` · `climate.daily` · `nature.access` · `rights.lgbt` `rights.racism` ·
`return.experience` · `other`

## Method

**Web pass (parallel).** One agent per country, at most five countries at a time, reading the
dossier's sources first, then targeted searches per city ("vivre à…", "cost of living 2026",
"loyer quartier", "retour au pays…", expat forums). A second, cheaper agent then re-opened the
cited source for at least 10 items per country, prioritising prices and sensitive items, and
marked or corrected what the source did not support.

**Social pass (serial, read-only).** Instagram ★ accounts and country hubs from
`research/social/instagram-accounts.md` (latest posts, caption and visible comments), and
public Facebook groups from `research/social/facebook-groups.md` (the group's own search for
rent, neighbourhood, school…). One browser tab, nothing liked, followed, joined or sent.

What the social pass taught us about the method:

- **Instagram works for a handful of live, city-specific creators** (Lagos and Abuja guides,
  vivre_au_maroc, ashley.walena in Libreville, liabynd in Abidjan, newindakar in Dakar,
  livinginkigali). Several ★ leads turned out to be dormant (accraexpat since 2023,
  accrafoodies since 2025, lomelives since 2021, djiboutilives empty, expatstanzania mid-2026).
- **Comments carry the signal captions lack**: the cost of a generator day in Lagos, which
  Casablanca district got power back when, what newcomers to Libreville should do about a car.
- **Facebook group search mostly returns agency listings**, not residents' questions. It gave
  dated asking rents (Abuja, Abidjan) and very few testimonies. Large diaspora groups returned
  spam and copy-pasted motivational stories.

## Coverage

COVERAGE_TABLE
