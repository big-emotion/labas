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
    <city-slug>.md                 raw sourced items, one file per city (incl. extra cities)
    <city-slug>.neighbourhoods.md  neighbourhood sheets and routes (cities.json cities, safe ones)
```

Staging folder `_social/` was used during the run and is now empty: every social and listings
item has been merged into the city files.

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
- **Facebook groups are classifieds boards, and that is useful.** They hold few residents'
  questions (large diaspora groups returned spam and copy-pasted stories), but they hold
  hundreds of dated asking prices.

**Listings pass (serial, read-only, Facebook).** Added on the user's request: every price signal
counts (rents, sale prices, used cars, household goods, services, domestic-help wages), and
**negotiation is a criterion of its own** (`cost.negotiation`). For one active public housing or
classifieds group per country, the chronological feed (≈ 30–40 latest posts) was read and each
priced post recorded with its date, neighbourhood, upfront terms and whether it says
"négociable / à débattre / negotiable / negociável". Listings are **asking prices**, never
averaged and never presented as what people pay.

What the listings pass shows about negotiation (14 Nov 2026, share of priced posts that say so):

| Market | Negotiable in the ad | How it shows |
|---|---|---|
| Brazzaville / Pointe-Noire | 17 of 26 | "à débattre légèrement" is the default; "NON NÉGOCIABLE" has to be stated |
| Abidjan | 8 of 15 | rents and even more sales ("à débattre fort") |
| Mauritius (north) | 5 of 14 | "négociable", "or nearest offer" |
| Luanda | 4 of 14 | discount written in: 20 % off for a year paid upfront |
| Kinshasa | 3 of 13 | "DISCUTABLE" on cars, "négociable légèrement" on flats |
| Dakar | 2 of 8 | broker writes "80,000, possible même à 70,000" |
| Douala | 1 of 14 + discounts | "négociable à 280,000" for a longer lease |
| Casablanca, Tunis, Cape Town, Windhoek, Kigali, Dar es Salaam, Libreville | 0 | fixed prices; the lever is avoiding agency fees, or prices in US dollars |

Upfront terms are as telling as rents: from 1 month + 1 month deposit (Libreville) to 5 months
(Abidjan, Kinshasa "4+1"), 8 + 2 (Douala), about 9 months (Abomey-Calavi) and 10–12 months for a
single room (Douala), plus visit fees of 3,000–20,000 in local currency.

Not covered by the listings pass: countries with no active public group in Phase 1
(e.g. Togo, Sierra Leone, Liberia, Mauritania, Chad, Burundi, Eritrea, Lesotho, Eswatini,
Comoros, Seychelles, Somalia), groups that are private (Mozambique, Accra marketplace), groups
whose rent posts date from 2019 (Cabo Verde), and unsafe countries, which were skipped on
purpose.

## Neighbourhood sheets and routes

Added on the user's request (2026-11-14): think at neighbourhood level, and for each reader
profile propose real places and a route. One `<city>.neighbourhoods.md` per safe city of
`cities.json` (100 files), built from the city file plus targeted searches, then checked:

- **Neighbourhoods** (4–8 per city, 564 in all): feel, dated asking rents, getting around, a
  sourced "Watch" line, 3–8 real named places with a source each, and which quiz answers fit.
- **Living: typical weeks**, labelled with the exact level-1 quiz answers from
  `docs/criteria/architecture.md` §A.3 (branch `docs/criteria-architecture`): Télétravail +
  Seul·e, Salarié·e + En couple, J'entreprends, Avec mes enfants, and "Tester quelques mois"
  (first week: where to stay, SIM and mobile money, flat hunting, visit fees, advances). Each has
  Saturday-night options per Q2 answer, weekend outings per Q8 answer ("not realistic from …"
  when it is not) and a weekly spend whose arithmetic uses only sourced prices.
- **Visiting: discovery** for "D'abord des vacances": one day and one week, with at least one
  ordinary-life moment (market morning, rush hour, local match) to help decide.
- **Check**: a second agent re-opened the source for 615 places or prices: 575 supported,
  36 fixed, 5 removed from every route. 4,082 named places in all.

Thin sheets at first (fewer than 15 sourced places): Buchanan, Mindelo, Tadjourah,
Teyateyaneng; thickened in the quality pass below. Two sheets carry advisory warnings:
**Bahir Dar** (FCDO advises against all travel to Amhara, updated 2026-10-30; the site already
excludes it through `city-scores.json`) and **Rubavu** (Canada reports active fighting including
shelling in the district, 2026-09-09; the site's rule reads France and the UK only, which do not
exclude it).

## Quality pass (2026-11-15)

- Every item the spot-check had marked ⚠ unsupported was re-opened: re-sourced (marked
  `✔ re-sourced 2026-11-15`) or deleted with a line in that file's Gaps. None is left.
- Mozambique, Eswatini, Burundi and Seychelles, the weakest countries, got a second pass
  (items after `<!-- quality-pass 2026-11-15 -->`), prices and negotiation first.
- The thin neighbourhood sheets (Buchanan, Mindelo, Tadjourah, Teyateyaneng) now carry 45–70
  sourced places each; many come from OpenStreetMap and are marked low confidence.
- [`research/rates.md`](../rates.md): one dated, sourced rate per currency (46 currencies plus
  USD), the rate each dossier used, the gap, and parallel-market rates where they exist
  (Algeria, Nigeria, Ethiopia, Burundi, Malawi, Sudan, South Sudan, Zimbabwe, Eritrea,
  Somalia). Use it for any new EUR conversion; older items keep the dossier's rate they state.
- A second, small social pass (`<!-- social-pass-2 2026-11-15 -->`) added restaurant prices in
  Abidjan and relocation and healthcare testimony from a Nairobi relocation business.
- Unsafe cities are now read from the advisories in `src/data/city-scores.json` (France
  orange/red or FCDO "all"/"all but essential"), as `src/lib/cities.ts` does; Bahir Dar is
  among them.

## Coverage

Generated 2026-11-15 from the files on disk. "Items" counts lines in each `## Items` section;
"of which social" counts items whose kind is `social-caption` or `social-comment`.

| Country | City files | Items | of which social | ⚠ unsupported | Neighbourhood sheets | Cities (items) |
|---|---|---|---|---|---|---|
| afrique-du-sud | 4 | 280 | 10 | 0 | 3 | [durban](afrique-du-sud/durban.md) 73, [johannesburg](afrique-du-sud/johannesburg.md) 96, [le-cap](afrique-du-sud/le-cap.md) 79, [pretoria](afrique-du-sud/pretoria.md) 32 |
| algerie | 3 | 172 | 0 | 0 | 2 | [alger](algerie/alger.md) 95, [constantine](algerie/constantine.md) 36, [oran](algerie/oran.md) 41 |
| angola | 4 | 203 | 3 | 0 | 2 | [benguela](angola/benguela.md) 37, [lobito](angola/lobito.md) 34, [luanda](angola/luanda.md) 96, [lubango](angola/lubango.md) 36 |
| benin | 4 | 251 | 7 | 0 | 2 | [abomey-calavi](benin/abomey-calavi.md) 29, [cotonou](benin/cotonou.md) 122, [ouidah](benin/ouidah.md) 68, [porto-novo](benin/porto-novo.md) 32 |
| botswana | 4 | 213 | 3 | 0 | 2 | [francistown](botswana/francistown.md) 29, [gaborone](botswana/gaborone.md) 127, [kasane](botswana/kasane.md) 16, [maun](botswana/maun.md) 41 |
| burkina-faso | 2 | 58 | 0 | 0 | 0 | [bobo-dioulasso](burkina-faso/bobo-dioulasso.md) 24, [ouagadougou](burkina-faso/ouagadougou.md) 34 |
| burundi | 4 | 209 | 0 | 0 | 2 | [bujumbura](burundi/bujumbura.md) 99, [gitega](burundi/gitega.md) 49, [ngozi](burundi/ngozi.md) 30, [rumonge](burundi/rumonge.md) 31 |
| cameroun | 5 | 267 | 5 | 0 | 3 | [bafoussam](cameroun/bafoussam.md) 21, [douala](cameroun/douala.md) 98, [kribi](cameroun/kribi.md) 47, [limbe-buea](cameroun/limbe-buea.md) 24, [yaounde](cameroun/yaounde.md) 77 |
| cap-vert | 3 | 176 | 0 | 0 | 2 | [mindelo](cap-vert/mindelo.md) 52, [praia](cap-vert/praia.md) 79, [santa-maria](cap-vert/santa-maria.md) 45 |
| centrafrique | 3 | 99 | 0 | 0 | 0 | [bangui](centrafrique/bangui.md) 29, [berberati](centrafrique/berberati.md) 20, [bimbo](centrafrique/bimbo.md) 50 |
| comores | 3 | 152 | 0 | 0 | 2 | [fomboni](comores/fomboni.md) 30, [moroni](comores/moroni.md) 79, [mutsamudu](comores/mutsamudu.md) 43 |
| congo | 3 | 189 | 5 | 0 | 2 | [brazzaville](congo/brazzaville.md) 103, [dolisie](congo/dolisie.md) 23, [pointe-noire](congo/pointe-noire.md) 63 |
| cote-d-ivoire | 5 | 234 | 17 | 0 | 3 | [abidjan](cote-d-ivoire/abidjan.md) 111, [bouake](cote-d-ivoire/bouake.md) 22, [grand-bassam](cote-d-ivoire/grand-bassam.md) 36, [san-pedro](cote-d-ivoire/san-pedro.md) 40, [yamoussoukro](cote-d-ivoire/yamoussoukro.md) 25 |
| djibouti | 3 | 160 | 0 | 0 | 2 | [ali-sabieh](djibouti/ali-sabieh.md) 21, [djibouti](djibouti/djibouti.md) 108, [tadjourah](djibouti/tadjourah.md) 31 |
| egypte | 4 | 261 | 5 | 0 | 3 | [alexandrie](egypte/alexandrie.md) 65, [assouan](egypte/assouan.md) 63, [hourghada](egypte/hourghada.md) 37, [le-caire](egypte/le-caire.md) 96 |
| erythree | 3 | 144 | 0 | 0 | 2 | [asmara](erythree/asmara.md) 85, [keren](erythree/keren.md) 21, [massaoua](erythree/massaoua.md) 38 |
| eswatini | 2 | 135 | 0 | 0 | 2 | [manzini](eswatini/manzini.md) 48, [mbabane](eswatini/mbabane.md) 87 |
| ethiopie | 4 | 247 | 5 | 0 | 2 | [addis-abeba](ethiopie/addis-abeba.md) 121, [bahir-dar](ethiopie/bahir-dar.md) 58, [dire-dawa](ethiopie/dire-dawa.md) 34, [hawassa](ethiopie/hawassa.md) 34 |
| gabon | 4 | 282 | 8 | 0 | 2 | [franceville](gabon/franceville.md) 31, [libreville](gabon/libreville.md) 161, [oyem](gabon/oyem.md) 24, [port-gentil](gabon/port-gentil.md) 66 |
| gambie | 4 | 188 | 4 | 0 | 2 | [banjul](gambie/banjul.md) 40, [brikama](gambie/brikama.md) 20, [brufut](gambie/brufut.md) 19, [serrekunda](gambie/serrekunda.md) 109 |
| ghana | 4 | 288 | 4 | 0 | 2 | [accra](ghana/accra.md) 136, [cape-coast](ghana/cape-coast.md) 41, [kumasi](ghana/kumasi.md) 72, [takoradi](ghana/takoradi.md) 39 |
| guinee | 4 | 185 | 4 | 0 | 2 | [conakry](guinee/conakry.md) 85, [kankan](guinee/kankan.md) 33, [kindia](guinee/kindia.md) 26, [labe](guinee/labe.md) 41 |
| guinee-bissau | 4 | 186 | 0 | 0 | 2 | [bissau](guinee-bissau/bissau.md) 93, [bubaque](guinee-bissau/bubaque.md) 43, [cacheu](guinee-bissau/cacheu.md) 25, [gabu](guinee-bissau/gabu.md) 25 |
| guinee-equatoriale | 3 | 158 | 0 | 0 | 2 | [bata](guinee-equatoriale/bata.md) 55, [ciudad-de-la-paz](guinee-equatoriale/ciudad-de-la-paz.md) 17, [malabo](guinee-equatoriale/malabo.md) 86 |
| kenya | 4 | 257 | 10 | 0 | 2 | [kisumu](kenya/kisumu.md) 32, [mombasa](kenya/mombasa.md) 74, [nairobi](kenya/nairobi.md) 123, [nakuru](kenya/nakuru.md) 28 |
| lesotho | 3 | 133 | 0 | 0 | 2 | [maseru](lesotho/maseru.md) 79, [roma](lesotho/roma.md) 25, [teyateyaneng](lesotho/teyateyaneng.md) 29 |
| liberia | 3 | 135 | 0 | 0 | 2 | [buchanan](liberia/buchanan.md) 26, [monrovia](liberia/monrovia.md) 91, [robertsport](liberia/robertsport.md) 18 |
| libye | 3 | 93 | 0 | 0 | 0 | [benghazi](libye/benghazi.md) 21, [misrata](libye/misrata.md) 43, [tripoli](libye/tripoli.md) 29 |
| madagascar | 4 | 164 | 5 | 0 | 2 | [antananarivo](madagascar/antananarivo.md) 68, [antsiranana](madagascar/antsiranana.md) 22, [nosy-be](madagascar/nosy-be.md) 38, [toamasina](madagascar/toamasina.md) 36 |
| malawi | 4 | 180 | 3 | 0 | 2 | [blantyre](malawi/blantyre.md) 50, [lilongwe](malawi/lilongwe.md) 74, [mzuzu](malawi/mzuzu.md) 29, [zomba](malawi/zomba.md) 27 |
| mali | 3 | 90 | 0 | 0 | 0 | [bamako](mali/bamako.md) 29, [segou](mali/segou.md) 18, [sikasso](mali/sikasso.md) 43 |
| maroc | 4 | 343 | 17 | 0 | 3 | [casablanca](maroc/casablanca.md) 127, [marrakech](maroc/marrakech.md) 82, [rabat](maroc/rabat.md) 52, [tanger](maroc/tanger.md) 82 |
| maurice | 3 | 150 | 10 | 0 | 2 | [ebene-quatre-bornes](maurice/ebene-quatre-bornes.md) 30, [grand-baie](maurice/grand-baie.md) 45, [port-louis](maurice/port-louis.md) 75 |
| mauritanie | 2 | 125 | 0 | 0 | 2 | [nouadhibou](mauritanie/nouadhibou.md) 38, [nouakchott](mauritanie/nouakchott.md) 87 |
| mozambique | 4 | 200 | 0 | 0 | 2 | [beira](mozambique/beira.md) 38, [inhambane-tofo](mozambique/inhambane-tofo.md) 36, [maputo](mozambique/maputo.md) 80, [vilankulo](mozambique/vilankulo.md) 46 |
| namibie | 3 | 167 | 6 | 0 | 2 | [swakopmund](namibie/swakopmund.md) 46, [walvis-bay](namibie/walvis-bay.md) 31, [windhoek](namibie/windhoek.md) 90 |
| niger | 4 | 98 | 0 | 0 | 0 | [agadez](niger/agadez.md) 15, [maradi](niger/maradi.md) 24, [niamey](niger/niamey.md) 33, [zinder](niger/zinder.md) 26 |
| nigeria | 4 | 284 | 17 | 0 | 2 | [abuja](nigeria/abuja.md) 94, [enugu](nigeria/enugu.md) 41, [ibadan](nigeria/ibadan.md) 28, [lagos](nigeria/lagos.md) 121 |
| ouganda | 4 | 196 | 3 | 0 | 2 | [entebbe](ouganda/entebbe.md) 31, [jinja](ouganda/jinja.md) 40, [kampala](ouganda/kampala.md) 104, [mbarara](ouganda/mbarara.md) 21 |
| rd-congo | 3 | 182 | 8 | 0 | 2 | [kinshasa](rd-congo/kinshasa.md) 99, [kolwezi](rd-congo/kolwezi.md) 19, [lubumbashi](rd-congo/lubumbashi.md) 64 |
| rwanda | 4 | 279 | 10 | 0 | 2 | [huye](rwanda/huye.md) 28, [kigali](rwanda/kigali.md) 165, [musanze](rwanda/musanze.md) 33, [rubavu](rwanda/rubavu.md) 53 |
| sao-tome-et-principe | 4 | 161 | 0 | 0 | 2 | [neves](sao-tome-et-principe/neves.md) 23, [santo-antonio](sao-tome-et-principe/santo-antonio.md) 30, [sao-tome](sao-tome-et-principe/sao-tome.md) 84, [trindade](sao-tome-et-principe/trindade.md) 24 |
| senegal | 5 | 238 | 8 | 0 | 3 | [dakar](senegal/dakar.md) 94, [saint-louis](senegal/saint-louis.md) 40, [saly](senegal/saly.md) 56, [thies](senegal/thies.md) 21, [ziguinchor](senegal/ziguinchor.md) 27 |
| seychelles | 3 | 180 | 0 | 0 | 2 | [la-digue](seychelles/la-digue.md) 33, [praslin](seychelles/praslin.md) 50, [victoria](seychelles/victoria.md) 97 |
| sierra-leone | 4 | 192 | 2 | 0 | 2 | [bo](sierra-leone/bo.md) 42, [freetown](sierra-leone/freetown.md) 100, [kenema](sierra-leone/kenema.md) 27, [makeni](sierra-leone/makeni.md) 23 |
| somalie | 3 | 107 | 0 | 0 | 1 | [berbera](somalie/berbera.md) 21, [hargeisa](somalie/hargeisa.md) 69, [mogadiscio](somalie/mogadiscio.md) 17 |
| soudan | 2 | 81 | 0 | 0 | 0 | [khartoum](soudan/khartoum.md) 48, [port-soudan](soudan/port-soudan.md) 33 |
| soudan-du-sud | 2 | 62 | 0 | 0 | 0 | [juba](soudan-du-sud/juba.md) 40, [wau](soudan-du-sud/wau.md) 22 |
| tanzanie | 5 | 316 | 4 | 0 | 3 | [arusha](tanzanie/arusha.md) 60, [dar-es-salaam](tanzanie/dar-es-salaam.md) 116, [dodoma](tanzanie/dodoma.md) 27, [moshi](tanzanie/moshi.md) 30, [zanzibar](tanzanie/zanzibar.md) 83 |
| tchad | 4 | 155 | 0 | 0 | 2 | [abeche](tchad/abeche.md) 23, [moundou](tchad/moundou.md) 38, [n-djamena](tchad/n-djamena.md) 73, [sarh](tchad/sarh.md) 21 |
| togo | 4 | 184 | 0 | 0 | 2 | [aneho](togo/aneho.md) 18, [kara](togo/kara.md) 31, [kpalime](togo/kpalime.md) 32, [lome](togo/lome.md) 103 |
| tunisie | 3 | 158 | 4 | 0 | 2 | [sfax](tunisie/sfax.md) 36, [sousse](tunisie/sousse.md) 46, [tunis](tunisie/tunis.md) 76 |
| zambie | 4 | 193 | 4 | 0 | 2 | [kitwe](zambie/kitwe.md) 30, [livingstone](zambie/livingstone.md) 47, [lusaka](zambie/lusaka.md) 88, [ndola](zambie/ndola.md) 28 |
| zimbabwe | 4 | 181 | 5 | 0 | 2 | [bulawayo](zimbabwe/bulawayo.md) 42, [harare](zimbabwe/harare.md) 95, [mutare](zimbabwe/mutare.md) 24, [victoria-falls](zimbabwe/victoria-falls.md) 20 |
| **Total** | 192 | 10021 | 196 | 0 | 100 | |
