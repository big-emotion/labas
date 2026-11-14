# Criteria architecture — what Là-bas matches on, and why

> Status: proposal, 2026-11-14. Nothing here is wired into `src/`. The type model is in
> [`schema.ts`](./schema.ts). Reader-facing labels are French; everything else is English.

Là-bas tells a reader "cette ville te correspond parce que…". This document defines what that
"parce que" may rest on: which facts about the **reader** count, which facts about a **city**
count, how they meet, and where the site must stop claiming.

**Read [§A](#a-two-levels-give-the-taste-first) first.** The criteria below are the engine,
not the experience. The free quiz shows one city, warmly, in about five minutes; the criteria
only appear when the reader asks "pourquoi ?", and in full in a later paid tier.

**Inputs analysed:** the 21 scores of the 115 cities in `src/data/cities.json`, the
current ranking (`src/lib/ranking.ts`, `questions.ts`), the 54 country dossiers in
`research/countries/` (120 scored cities, 15 proposed dimensions each, 300
"discriminating questions", a Big Five reading per country), the two social-media inventories in
`research/social/`, and a web benchmark of nine liveability frameworks and ~40 data sources. The
mining notes are summarised here, not committed.

## Contents

A. [Two levels: give the taste first](#a-two-levels-give-the-taste-first) 0. [The short version (the engine)](#0-the-short-version-the-engine)

1. [Benchmark](#1-benchmark)
2. [The person side](#2-the-person-side)
3. [The city side](#3-the-city-side)
4. [The matching layer](#4-the-matching-layer)
5. [Data model](#5-data-model)
6. [Honesty and risk](#6-honesty-and-risk)
7. [Decisions for the maintainer](#7-decisions-for-the-maintainer)

---

## A. Two levels: give the taste first

### A.1 Who we are talking to, and what the first five minutes are for

The reader is a member of the diaspora: often an economic actor, demanding, but not a
specialist, and not looking for a report. Most diaspora readers only look at the country their
family comes from, or at the former colonies of the country they live in: a French speaker in
Paris rarely looks at Ghana, Tanzania, Ethiopia, Namibia or South Africa. Là-bas starts from
the opposite assumption: **the reader would go wherever life suits them; what is missing is
information.** Someone who believes turquoise water and white sand are only in Zanzibar has
never been told about the coves of Grand-Bérébi, an hour from San-Pédro, or about Mombasa,
Gambia or the Senegalese coast beyond Saly.

So the first level has one job: **in about five minutes, show one city the reader had perhaps
never considered, make them feel why it could be theirs, and make them want to know more.**
Analysis comes after, and only if they want it.

### A.2 The two levels

|              | Level 1 — free, now                                                                                  | Level 2 — paid, later                                |
| ------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Goal**     | Spark curiosity and emotion: "pourquoi pas là ?"                                                     | Help a real decision                                 |
| **Length**   | The current 10 questions, ~5 minutes                                                                 | The full question bank (§4.4) and the filters (§2.1) |
| **Tone**     | Warm, playful, "tu", "on te comprend"                                                                | Precise, still plain French                          |
| **Result**   | **One city**, a short portrait, two other leads (one deliberately outside the reader's usual sphere) | A ranked list with every criterion, source and date  |
| **Criteria** | Hidden, behind "Pourquoi cette ville ?"                                                              | Shown in full                                        |
| **Human**    | None                                                                                                 | Personal coaching (accompagnement)                   |

The criteria, rubrics and sources in §2–§6 run underneath **both** levels. Level 1 does not
get a lighter or less honest engine; it gets a lighter **presentation**.

### A.3 The level-1 questions (decided 2026-11-14)

The ten current questions stay, with the same answer values (so `src/lib/ranking.ts` and its
tests stand), reworded in "tu" and made more playful. Questions 2, 7 and 8 carry the Big Five
inspiration: they ask about how the reader likes to live, not about facts.

| #   | Question                                 | Answers                                                                                                                                                    | Inspiration (internal, never shown) |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | Là-bas, tu t'y vois comment ?            | M'installer pour de bon · Un pied ici, un pied là-bas · Tester quelques mois · Investir sans y vivre · D'abord des vacances                                | Life project                        |
| 2   | Ton samedi soir idéal ?                  | Danser jusqu'au matin · Un bon dîner entre amis · Tranquille chez moi                                                                                      | Sociability (extraversion)          |
| 3   | Ton budget sur place ?                   | Serré · Moyen · Le prix compte peu                                                                                                                         | Constraint                          |
| 4   | Tu pars avec qui ?                       | Seul·e · En couple · Pour fonder une famille · Avec mes enfants                                                                                            | Constraint                          |
| 5   | Et le travail ?                          | Salarié·e · J'entreprends · Télétravail · Création, culture · Santé, enseignement                                                                          | Life project                        |
| 6   | Tu es à l'aise en…                       | Français · Anglais · Portugais · Arabe                                                                                                                     | Constraint (a weight, not a filter) |
| 7   | Plutôt une ville qui…                    | Vibre jour et nuit · Reste à taille humaine · Prend son temps                                                                                              | Pace (extraversion, calm)           |
| 8   | Le week-end, tu files où ?               | À la plage · En montagne, en forêt · Dans la savane ou le désert · Je reste en ville                                                                       | Openness to nature or city          |
| 9   | Côté météo ?                             | Chaud toute l'année · Doux · Sec et ensoleillé                                                                                                             | Preference                          |
| 10  | Ce qui compte le plus pour toi ? (3 max) | Me sentir en sécurité · Une vie abordable · La santé et l'école · Ma carrière · Retrouver d'autres repats · La mémoire de la diaspora · Voyager facilement | Priorities (need for security)      |

The four temperament questions cut from the prototype (novelty, order, competition, stress)
could come back as playful scenarios if testing shows the portrait feels thin; that is a later
choice, not part of this design.

### A.4 The result screen

On the phone, in this order:

1. **The city**, big: name, country, a photo, the tagline.
2. **"Pourquoi toi et [ville]"**: two or three lines that pair something the reader said with
   something the city is known for, written as **preferences, never traits** (repo rule:
   never "tu es", never "ta personnalité"):
   - "Tu aimes quand ça bouge le samedi soir : Nairobi aussi. On la dit parmi les villes
     d'Afrique de l'Est où l'on sort le plus, et les gens y sont détendus et accueillants."
   - "Tu veux la mer le week-end : à une heure de San-Pédro, les criques de Grand-Bérébi ont
     l'eau turquoise et le sable blanc qu'on croit réservés à Zanzibar."
3. **"Ce qui pourrait te surprendre"**: one line that breaks a cliché about the city or
   region.
4. **"À savoir"**: one honest line (the city's `watch`, sourced when it touches safety, racism,
   LGBT rights or conflict). Level 1 stays warm, not blind.
5. **Two other leads**, one of them marked **"Tu n'y aurais peut-être pas pensé"** (A.5).
6. **"Pourquoi cette ville ?"**: opens the criteria behind the match, with sources and dates.
   This is where §3 becomes visible.
7. **"Aller plus loin"**: the door to level 2.

### A.5 The discovery rule

Without a rule, a French speaker gets French-speaking cities: language weighs 3 in the score.
Level 1 therefore always shows, among its three cities, **at least one from outside the
reader's usual sphere**:

- **Sphere** = the countries where the reader's chosen language is the language of daily life.
  Later, with roots (§2.4), also the country of origin.
- **The discovery lead** = the best-ranked proposable city outside that sphere, computed with
  the language weight removed. If it already sits in the top three, nothing changes.
- **It says why it is there and what it asks of the reader**: "On y vit en anglais, mais tout
  le reste te ressemble : la plage, une ville qui bouge, une vie abordable."
- **It never overrides safety:** `unsafe` cities are never proposed, discovery included.

### A.6 The two lines each city needs for level 1

The criteria in §3 produce the "pourquoi toi" lines automatically: a reader's answer meets a
city criterion at level 4 or 5. Two short editorial lines per city make them warm:

| Field        | What it is                                                                                                                               | Rule                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `reputation` | "On dit de Nairobi que…": what the city is known for, in one sentence                                                                    | Introduced by "on dit", "on la connaît pour": a reputation, not a measurement. No claim about safety, racism or LGBT rights here |
| `surprise`   | The cliché it breaks (Grand-Bérébi's water, Swakopmund, where the Namib dunes run down to the ocean, Kampala's young and creative scene) | A concrete, checkable fact (a place, an event), dated if it can change                                                           |

A third line already exists: `watch` ("À savoir"). The fields are in [`schema.ts`](./schema.ts).

### A.7 Tone

- **Warm and close:** "tu", short sentences, the community's own words ("retour au pays",
  "s'installer", "là-bas"). "Repat" is explained the first time it appears.
- **Knowledgeable, not expert:** we know the continent and say so through concrete places,
  never through jargon, scores or percentages on the first screen.
- **On the reader's side:** we take the wish to go seriously and do not lecture. Difficulties
  are named once, honestly, in "à savoir", not used to discourage.
- **Preferences, not traits:** "tu aimes", "tu cherches", "tu as dit"; never "tu es
  quelqu'un de…", "ton profil", "ta personnalité", "test".

---

## 0. The short version (the engine)

- **Today's 21 scores mostly say one thing: "this is a big capital".** Across the 115 cities,
  career, flights, internet, investment and health-and-schools correlate at r = 0.67–0.86 with
  each other, and intensity, competition and career at r = 0.68–0.71 with city size. Nightlife
  and "social" correlate at r = 0.86. A reader who ticks three of these gets the same capitals
  three times. The redesign removes the duplicates and adds what actually separates cities.
- **What separates cities, according to the 54 dossiers,** is mostly missing from both the 21
  scores and the 15 dossier dimensions: power and water reliability, upfront rent (Lagos asks
  1–2 years, Kinshasa 3 months plus a generator), schools as their own criterion, climate,
  medical evacuation, and how a returnee is received. Visa, nationality and LGBT law come up in
  all 54 dossiers, but they are **national facts**, not city scores.
- **The evidence is thin, and the design must show it.** 839 of the dossiers' 1,800 proposed
  city scores (47 %; 43–51 % by group) are flagged "(?)", "editorial" or "not found". In one
  group, secondary cities average 8.0 uncertain scores out of 15 against 4.8 for capitals. Food, returnee network, nightlife and startup scene are the weakest; career, safety
  and language the strongest. Every value therefore carries a source, a date and a confidence
  level, and a missing value stays missing.
- **Proposed set:** 15 city criteria scored on a written 0–5 rubric, 1 country criterion,
  a handful of **facts** (language, climate, landscape, size, travel advice, visa, nationality,
  LGBT law, mobile money) that filter or explain but are never turned into a score, and a list
  of **described-only** topics (food, women's daily life, how returnees are seen, religion,
  racism) that the site writes about but never ranks on.
- **Temperament stays, as stated tolerances.** The reader says how crowds and daily friction
  affect them; the site compares that with a city's described pace and reliability. It never
  names a trait.

---

## 1. Benchmark

Twelve frameworks were reviewed on 2026-11-14 (accessed date for every link below). eiu.com,
oecd.org and internations.org refused automated fetching; claims about them rest on the
secondary pages cited and are marked _(secondary)_.

| Framework                            | Dimensions                                                                                                                                                                                                                                                           | How measured                                                                                                                                                                                                                                                                                                                                                   | African coverage                                                                                                                                                                                                                                                     | Misses for a returnee                                                                                                             | Reusable                                                                                                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **EIU Global Liveability Index**     | Stability 25 %, Healthcare 20 %, Culture & Environment 25 %, Education 10 %, Infrastructure 20 % _(secondary: [Wikipedia](https://en.wikipedia.org/wiki/Global_Liveability_Ranking))_                                                                                | ~30 indicators, each rated _acceptable / tolerable / uncomfortable / undesirable / intolerable_ by analysts and in-city contributors, scaled 1–100; annual, 173 cities ([2026 edition, allAfrica, 2026-07-13](https://fr.allafrica.com/stories/202607140340.html))                                                                                             | ~10 capitals; 2026: Harare 165th, Lagos 168th, Algiers 169th, Tripoli 172nd. No secondary city                                                                                                                                                                       | Built to set expatriate hardship allowances: assumes private clinics and schools; ignores right to stay, family, land, local cost | **Named verbal anchors** per level; mixed expert + data scoring; published weights                                                                                                                                             |
| **Mercer Quality of Living**         | 10 categories, 39 factors: consumer goods, economy, housing, health, natural environment, political and social, public services and transport, recreation, schools, socio-cultural ([Mercer, © 2026](https://mobilityexchange.mercer.com/quality-of-living-reports)) | Weighted factors, New York = 100; weights unpublished ([2024 release](https://www.mercer.com/en-ie/about/newsroom/2024-quality-of-living-city-ranking/))                                                                                                                                                                                                       | Broad but paywalled; 2024: Port Louis best in Africa (88th), Bangui 239th, Khartoum 241st ([How We Made It In Africa, 2024](https://www.howwemadeitinafrica.com/ranked-african-cities-best-quality-life/)). No public ranking since 2024 found                       | Same allowance lens; opaque                                                                                                       | The most complete everyday-life **category list** (housing separate from consumer goods and recreation)                                                                                                                        |
| **OECD Better Life Index**           | Housing, income, jobs, community, education, environment, civic engagement, health, life satisfaction, safety, work-life balance                                                                                                                                     | Official statistics + Gallup items; **reader sets each topic's weight 0–5**; no official ranking _(secondary: [Wikipedia](https://en.wikipedia.org/wiki/OECD_Better_Life_Index); oecd.org returned 403)_                                                                                                                                                       | One African country (South Africa), country level only                                                                                                                                                                                                               | No Africa, no cities, no cost, visa or connectivity                                                                               | **Reader-set weights** — the model for "sur quoi ne transigez-vous pas"                                                                                                                                                        |
| **Numbeo**                           | Quality of life = purchasing power, pollution, house price/income, cost of living, safety, health care, commute, climate — formula published ([indices explained](https://www.numbeo.com/quality-of-life/indices_explained.jsp))                                     | Crowd-sourced prices (manual entries weighted 3×, data expiring after 12 months) and visitor surveys (crime scored −2…+2 over 5 years) ([methodology](https://www.numbeo.com/common/motivation_and_methodology.jsp))                                                                                                                                           | Many African cities listed; contributor minimum unpublished; secondary cities often a handful of entries                                                                                                                                                             | Perception of web-connected visitors; imported-goods prices; no legal or admin dimension                                          | **Published formula**; freshness rules; use only with sample size and date shown                                                                                                                                               |
| **Nomad List (nomads.com)**          | Nomad / quality of life / family scores; cost, internet, safety; filters for female safety, LGBTQ+, racism ([nomads.com](https://nomads.com/), [FAQ](https://nomads.com/faq))                                                                                        | Public datasets + speed tests + members; moved away from crowd-sourcing as inconsistent; weights unpublished                                                                                                                                                                                                                                                   | Cape Town #83, Lagos #258; secondary cities sparse                                                                                                                                                                                                                   | Short-stay single remote worker; no family, property, residence                                                                   | **Profile-specific scores** from one base; identity-safety filters                                                                                                                                                             |
| **InterNations Expat Insider**       | Quality of life, **ease of settling in**, working abroad, personal finance, **expat essentials** (admin, housing, digital, language); 53 factors ([2024 method](https://assets.in-cdn.net/expat-insider/2024/city-ranking-methodology-40492))                        | Online survey of expats on a 1–7 scale, 12,543 respondents (Feb 2024); a city needs ≥ 50 respondents                                                                                                                                                                                                                                                           | 0–4 African cities a year (2021: Nairobi 12th, Cape Town 41st, Cairo 52nd, Johannesburg 55th — [press release 2021-12-01](https://cms.in-cdn.net/cdn/file/cms-media/public/2021-11/2021-12-01_Press%20Release_Expat%20City%20Ranking%202021_African%20Cities_0.pdf)) | A returnee is not an expat: belonging and admin are lived differently; self-selected panel                                        | **Ease of settling in** is the closest to a returnee's first year; **≥ 50 respondents** threshold for any future reader-feedback layer                                                                                         |
| **Teleport City Scores**             | 17 categories 0–10 (housing, cost, startups, connectivity, safety, healthcare, education, tolerance, outdoors…) _(list partly unverified)_                                                                                                                           | Open API over third-party data                                                                                                                                                                                                                                                                                                                                 | A handful of capitals _(unverified)_                                                                                                                                                                                                                                 | —                                                                                                                                 | **Lesson, not model:** teleport.org shows a registrar placeholder and developers.teleport.org no longer resolves (both checked 2026-11-14). Sites built on its API lost their data. Snapshot every value locally with its date |
| **UN-Habitat City Prosperity Index** | Productivity, infrastructure, quality of life, equity and inclusion, environment, governance                                                                                                                                                                         | 0–100 per indicator against benchmarks; **Basic CPI** (common core) + **Extended CPI** (local indicators); verbal bands "very solid" … "very weak" ([Francistown report 2017/18](https://unhabitat.org/sites/default/files/2021/08/francistown_botswana_07302020_optimized.pdf))                                                                               | The only one reaching **secondary African cities** (Francistown: 48.5, "weak"); 539 cities in 54 countries by 2019; not periodic                                                                                                                                     | Written for planners; no household cost, admin or visa                                                                            | Common core + optional extras; **declares every proxy** (national figures used where city figures are missing)                                                                                                                 |
| **Afrobarometer**                    | Not an index: democracy, services, safety, economy                                                                                                                                                                                                                   | Face-to-face, 1,200–2,400 adults per country, ±2–3 pts; Round 10 = 38 countries, 50,961 interviews ([release 2026-02-09](https://www.afrobarometer.org/wp-content/uploads/2026/02/News-release_Africans-want-elections-but-dont-trust-electoral-management-bodies-Afrobarometer-bh-9feb26.pdf), [methods](https://www.afrobarometer.org/surveys-and-methods/)) | 38 countries; valid at country level, region with care                                                                                                                                                                                                               | City scale; newcomers' cost and admin                                                                                             | The only large **residents' voice** (power works?, safe walking?) — as country or regional context                                                                                                                             |
| **Ibrahim Index (IIAG)**             | Security and rule of law; participation, rights, inclusion; economic foundations; human development — 16 sub-categories ([2024 key findings](https://mo.ibrahim.foundation/sites/default/files/2024-10/2024-iiag-key-findings_en.pdf))                               | 322 variables from 49 sources, 2014–2023                                                                                                                                                                                                                                                                                                                       | All 54 countries, country level                                                                                                                                                                                                                                      | City scale                                                                                                                        | **Pairs each measured sub-category with an Afrobarometer perception indicator**                                                                                                                                                |
| **Henley Passport Index**            | Visa-free destinations per passport (IATA Timatic), quarterly ([ThisDay, 2026-01-17](https://www.thisdaylive.com/2026/01/17/nigerian-passport-climbs-to-89th-place-in-2026-henley-global-ranking/))                                                                  | Binary per passport–destination pair                                                                                                                                                                                                                                                                                                                           | All                                                                                                                                                                                                                                                                  | Measures the wrong direction: the reader needs _inbound_ entry, stay, work and land rights                                        | The **passport × destination** data shape                                                                                                                                                                                      |
| **World Happiness Report**           | Cantril ladder; six explanatory factors kept apart from the headline ([FAQ](https://www.worldhappiness.report/faq/))                                                                                                                                                 | Gallup World Poll, ~1,000 per country per year                                                                                                                                                                                                                                                                                                                 | Most African countries; no cities                                                                                                                                                                                                                                    | City scale                                                                                                                        | **Keep the headline apart from its explanations**                                                                                                                                                                              |

**Common skeleton.** Eight families recur: safety and stability, health, cost and housing,
infrastructure and utilities, education, economy and work, environment and climate, social and
cultural life with rights and governance. The set in §3 covers all eight.

**What every framework misses for a diaspora returnee** — and what Là-bas therefore has to
build itself: the right to enter, reside and work (visa, dual nationality, diaspora routes);
land and property access; money (banking, transfers, mobile money); the friction of settling
in (only InterNations touches it); the language of daily life and schooling; flights to where
the family lives; and a returnee community.

**Lessons applied in this design**

1. **Written anchors for each level** (EIU, UN-Habitat) → every criterion has a published 1/3/5
   rubric (§3.2).
2. **Published weights the reader can move** (Numbeo, OECD) → default weights are in §4.1 and
   the method page; priorities and "à quoi pouvez-vous renoncer" move them.
3. **Measured, residents' view and editorial kept apart** (IIAG, Numbeo) → the `confidence`
   field distinguishes `measured`, `survey`, `sourced` and `editorial`.
4. **Country data never dressed as city data** (UN-Habitat declares its proxies) → `scope` on
   every criterion; regional proxies labelled.
5. **Snapshot everything** (Teleport) → every value stored with URL and access date; no live
   API dependency.
6. **Missing data is its own state.** The benchmark's strict reading is "never rank a city on a
   criterion with no data". §4.2 explains why Là-bas uses a neutral midpoint instead, and shows
   coverage on every card.

**Pitfalls to avoid:** an expatriate-allowance lens (it ranks almost every African city at the
bottom and says nothing of a returnee's life); crowd perception presented as fact; national
figures copied onto cities; one opaque composite; dependence on a single external feed.

**Unverified (to recheck in a browser):** EIU weights and full African list; Mercer's 39 factors
and any 2025–26 public ranking; OECD BLI update status; Expat Insider 2025; Teleport's category
list and shutdown date; CPI band cut-offs; Numbeo contributor thresholds; IIAG aggregation.

---

## 2. The person side

Each reader criterion is classed by what it does in the ranking:

- **Filter**: removes cities. Only when the reader states it, and the page says how many cities
  it removed and why ("12 villes retirées : visa nécessaire").
- **Weight**: raises or lowers how much a city criterion counts.
- **Target**: compared by distance, not "more is better" (a calm reader is penalised by a
  frantic city, and a party lover by a sleepy one).
- **Explanation**: changes the wording of reasons and drawbacks, never the order.

Evidence codes: **[D]** the country dossiers (count of the 54 that raise it), **[Q]** the
dossiers' discriminating questions (count out of 300), **[S]** the social inventories, **[L]**
literature.

### 2.1 Hard constraints

| Criterion                       | Why it matters                                                                                                                                                                                             | Captured by                                                                                                        | Role                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Language the reader can live in | 54/54 dossiers [D]; language questions in at least 8 [Q], including street languages (Wolof, Lingala, Swahili, Hausa, Derja). French alone is not enough in Kigali (French literacy 8.2 %, Rwanda dossier) | Quiz chip (multi-select)                                                                                           | **Filter** if the reader says "seulement" (only); otherwise weight 3                                           |
| Budget band                     | Cost is the most asked-for practical point [S]; housing questions in 11 [Q]                                                                                                                                | Quiz chip: serré / moyen / confortable                                                                             | **Weight** on `cost`, plus a **filter** (`cost` ≤ 1) for "serré"                                               |
| Schooling need                  | 38 of 300 questions [Q]; French school absent in Kampala, Windhoek, São Tomé, Lubumbashi, Niamey (lycée suspended since 2024) [D]                                                                          | Quiz: "Des enfants à scolariser ?" + curriculum                                                                    | **Filter** (`schools` ≥ 3 for the requested curriculum)                                                        |
| Specialist health needs         | Medical evacuation dependence in 30+ dossiers (São Tomé → Lisbon, Juba → Nairobi) [D]                                                                                                                      | Quiz: "Un besoin de soins suivis ?"                                                                                | **Filter** (`healthcare` ≥ 3)                                                                                  |
| Passport and right to stay      | Visa required for EU passports in 8 of 12 countries in one group alone [D]; Niger may turn back French nationals                                                                                           | Quiz: "Avec quel passeport ?" (French / other EU / other / the destination's)                                      | **Filter** only if the reader ticks "sans visa"; otherwise **explanation** ("visa à demander avant le départ") |
| Nationality of origin           | Dual nationality lost in Cameroun, Côte d'Ivoire, DRC, Madagascar, Tanzania, Togo; restricted by descent in Malawi, Mauritius, Nigeria [D]                                                                 | Free text or roots question                                                                                        | **Explanation** only: the site states the rule for the origin country; it never filters on it                  |
| LGBT safety                     | Same-sex relations criminalised in ~31 of 54 states (ILGA, May 2026); Senegal tightened its law on 2026-03-30 [D]                                                                                          | Opt-in toggle: "Exclure les pays qui pénalisent l'homosexualité" — never a question about the reader's orientation | **Filter**, opt-in only; nothing is stored                                                                     |
| Religion-related needs          | Alcohol bans and dress codes in 10 of 12 countries in one group; Zanzibar vs Dar; N'Djamena vs Moundou [D]                                                                                                 | Not asked by default; free text can raise it                                                                       | **Explanation** (described per city); a filter only if the reader states it in free text                       |

The current quiz has two of these (budget, language). Schools and health are hidden inside
the family question; passport, LGBT and religion are absent.

### 2.2 Life project

| Criterion                                                                                               | Why it matters                                                                                                                                                   | Captured by                             | Role                                                                                      |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Project: s'installer / un pied ici et là-bas / tester / investir / retraite / études / vacances d'abord | Already in the quiz; "retire" and "study" are named by the social inventories and 8+ dossiers but missing                                                        | Quiz chip                               | **Weight** (as today), plus "trial" lowers the weight of `schools` and raises `setupCost` |
| Work: salarié local / entreprendre / télétravail / création / soin-enseignement / sans emploi           | Work type is the largest question cluster: 55 of 300 [Q]; local salary vs remote income in at least 9 [Q]                                                        | Quiz chip                               | **Weight**: `jobs`, `business`, `internet`, `flights`                                     |
| Sector (admin-NGO, port and trade, mining, oil and gas, tourism, tech)                                  | Dossiers name the sector that makes a secondary city viable (San-Pédro port, Kitwe mining, Saint-Louis gas) [D]                                                  | Follow-up chip, only if "salarié local" | **Weight** via a per-city `sectors` fact (not a score)                                    |
| Timeline / trial vs permanent                                                                           | "Rent first" is the strongest piece of social evidence (Lebrun post, 2026-10-28, 168 comments) [S]                                                               | Covered by project                      | **Explanation**: trial readers see setup-cost wording first                               |
| Housing plan: louer d'abord / acheter / construire                                                      | Building from abroad and the unfinished family house is the main social theme after household goods [S]; property thresholds in Seychelles, Zambia, Zanzibar [D] | Optional chip                           | **Explanation** (+ weight on `business` for buyers)                                       |

### 2.3 Preferences

| Criterion         | Evidence                                                                                                                                | Captured by                                                          | Role                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| City size         | 45 of 300 questions on big city vs small calm town [Q], the second-largest cluster                                                      | Quiz chip (as today)                                                 | **Target** on `size`                                                                     |
| Climate           | 36 of 300 questions [Q], the third-largest cluster, yet no current score; Nouakchott > 40 °C six months, Saint-Louis 45–47 °C in spring | Quiz chip: chaud et humide / chaud et sec / doux / frais en altitude | **Weight** 2 on the `climates` fact (today's three classes cannot tell Addis from Dakar) |
| Landscape         | 14 questions on sea vs inland and nature [Q]                                                                                            | Quiz chip (multi)                                                    | **Weight** on the `settings` fact                                                        |
| Saturday night    | Already in the quiz                                                                                                                     | Quiz chip                                                            | **Target** on `nightlife`                                                                |
| Culture, heritage | Culture interest in 10 [Q]                                                                                                              | Priority chips                                                       | **Weight**                                                                               |
| Car-free life     | 1 question (Praslin) [Q]; traffic in 14 dossiers                                                                                        | Not asked; folded into `pace`                                        | —                                                                                        |

### 2.4 Roots and belonging

| Criterion                        | Evidence                                                                                                                                     | Captured by                                                                  | Role                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Country of origin                | Family-region questions in 11 dossiers ("Yoruba ou Igbo ?", "famille côté Maradi ?") [Q]; "retour au pays" is the community's own phrase [S] | Optional chip list (54 countries) or free text                               | **Weight**: +1.5 on cities of that country when intent is "retrouver"; never a penalty for others |
| Retrouver / découvrir / les deux | Prototype question cut from the one-screen form (README)                                                                                     | Quiz chip                                                                    | Switches the roots weight on or off                                                               |
| Family on site as a safety net   | 2 questions (Somalia, Sudan) [Q]                                                                                                             | Free text only                                                               | **Explanation**                                                                                   |
| Wish for a returnee network      | Returnee groups are tiny (236 to 4.3K members) and most "expat" groups are foreign workers [S]                                               | Quiz chip: "Retrouver d'autres repats" / "Plutôt vivre comme les gens d'ici" | **Weight** on `returnees` (positive or zero, never negative)                                      |
| How returnees are received       | Asked by all 54 dossiers, sourced in 5 (Nigeria "japada", DRC "diaspo", Côte d'Ivoire "bengiste", Senegal "repats", Cameroun) [D]            | —                                                                            | **Described only**, never scored (§6)                                                             |

### 2.5 Temperament

**What the evidence allows.** Personality–environment fit research finds that people report
more satisfaction where a place's prevailing character matches their own (Rentfrow, Gosling &
Potter 2008, _Perspectives on Psychological Science_ 3(5), on US states; Jokela et al. 2015,
_PNAS_ 112(3), on London boroughs). Effects are **small** (single-digit percentage of variance),
come from large samples, measure residents rather than movers, and have no African
replication we could find. National culture scores (Hofstede) exist for 3 of 54 countries in
the dossiers, two from secondary sources, and hide large within-country differences.

**What the dossiers actually describe** is not personality but **tolerance of friction**. Every
dossier reads conscientiousness as "rewards planners" (paperwork, cash, backup power, upfront
rent) and emotional stability as "copes with cuts, traffic, insecurity". Extraversion is the
one reading tied to a city property: capitals as network-driven, small towns as
"petit cercle".

**Design.** Each temperament question is compared with a **described city property**, never
with a trait. In level 1 (§A.3) these are the Saturday-night question and "Plutôt une ville
qui…" (size and pace); the two tolerance questions below join them in level 2:

| Question                                                                      | City property it meets                | Role   |
| ----------------------------------------------------------------------------- | ------------------------------------- | ------ |
| Samedi soir idéal (existing)                                                  | `nightlife`                           | Target |
| "Le bruit et la foule…" me donnent de l'énergie / ça dépend / me fatiguent    | `pace`                                | Target |
| "Coupures, démarches, imprévus…" je fais avec / ça me pèse / je veux l'éviter | `utilities`, `paperwork`, `setupCost` | Weight |

Dropped: the prototype's novelty, order and competition questions. Novelty had the least spread
of all 21 scores (σ = 0.70) and no observable referent; order splits into `utilities` and
`paperwork`; competition duplicates `jobs` and city size (r = 0.83 and 0.68).

**Wording rules the site must follow** (also for free-text replies and social posts):

1. Never name a trait or a type: no "extraverti", "introverti", "névrosé", "consciencieux",
   "profil", "personnalité", "test".
2. Talk about the reader's stated preference and the city's described property: "Vous aimez
   le calme ; Saint-Louis est une ville tranquille." Not "Votre personnalité correspond à…".
3. Never say a question "mesure", "révèle" or "détecte" anything.
4. The method page says: these questions compare what you say you like with how the city is
   described; they say nothing about who you are.
5. No temperament answer can remove a city (filter) or produce a drawback stronger than
   "Une ambiance différente de ce que vous cherchez".

---

## 3. The city side

### 3.1 Principles

- **Score only what two editors can score the same way.** Each criterion has written anchors
  for 1, 3 and 5; 2 and 4 sit between them; 0 means absent.
- **Score at the level the data exists.** A national law is a country fact; giving Bukavu and
  Kinshasa the same "city" score for it pretends.
- **Facts are not scores.** Language, climate, landscape, travel advice, visa and LGBT law are
  stored as what they are and used as filters or text.
- **Some things are described, never ranked:** where the only evidence is anecdote, where a
  score would rank people (how returnees, women or Black foreigners are treated), or where taste
  dominates (food).
- **Every value carries provenance**: sources (title, publisher, URL, published, accessed),
  date set, confidence (`measured` / `sourced` / `editorial`) and editor
  ([`schema.ts`](./schema.ts) `Provenance`).

### 3.2 City criteria (scored 0–5)

Direction is "higher is better" for the reader unless marked _target_. Coverage notes are about
the 115 cities, many of them secondary.

#### `cost` — Coût de la vie

- **Means:** what a newcomer pays each month for a decent one-bedroom flat in a neighbourhood
  newcomers actually choose, plus daily basics. A higher score means cheaper.
- **Does not mean:** what locals pay, or the cost of moving (see `setupCost`).
- **Indicators and sources:** median asking rent sampled from local listings, dated, with the
  number of listings (Expat-Dakar, CoinAfrique, Mubawab, meQasa, Property24, BuyRentKenya,
  Nigeria Property Centre); Numbeo only when the city page shows enough contributors (Numbeo
  flags low-data cities). Mercer covers capitals only, and its last public ranking found is 2024. Jumia House no longer exists as a pan-African portal and must not be cited.
- **Coverage:** good for capitals, poor for secondary cities (manual listing samples needed).
  Review every 6 months (inflation: Nigeria 33.9 % → 16.1 %, Malawi forex shortages).
- **Rubric:** **1** a one-bedroom rents above €900 or basics cost about European prices
  (Luanda-type expat market) · **3** €300–600 · **5** under €200, local market open to
  newcomers.
- **Scope:** city.

#### `setupCost` — Coût pour s'installer _(new)_

- **Means:** the cash needed before the first month: rent paid upfront, deposit, agency fee,
  equipment that the city makes necessary (generator, water tank, guard).
- **Does not mean:** monthly cost.
- **Why new:** 30 of 54 dossiers report it, and it varies by city within a country (Sousse
  asks a year upfront, Tunis less; Lagos 1–2 years; Kampala and Kigali 3–6 months; Kinshasa
  3 months + 1–3 deposit + generator US$200–600 + guard US$100–200). The social inventories
  name "rent first" as the main advice.
- **Sources:** dossiers, local rental law, agencies, dated. No index exists; confidence is at
  best `sourced`.
- **Rubric:** **1** a year or more paid upfront, or more than €5,000 before moving in · **3**
  3–6 months in total (deposit + advance + fees) · **5** monthly rent with a deposit of one
  or two months.
- **Scope:** city. Review yearly.

#### `safety` — Sécurité au quotidien

- **Means:** day-to-day crime and harassment risk for a resident who takes ordinary care, in
  the neighbourhoods newcomers live in.
- **Does not mean:** war, terrorism or travel-advice zones. Those are handled by the advisory
  gate (§4.3): a city in an orange or red zone is not "safety 0", it is not proposed at all.
- **Sources:** France Diplomatie "Conseils aux voyageurs" remarks naming the city (dated); UK
  FCDO; ACLED events within 25 km over 12 months (registration and EULA of 2025-07-08 to
  check); Afrobarometer "felt unsafe walking in your neighbourhood" for the region where
  available; Numbeo Crime only as a third source, never alone.
- **Rubric:** **1** advisories name the city for armed robbery or kidnapping; curfew or
  "do not walk after dark" anywhere · **3** pickpocketing and muggings in named areas,
  usual big-city care, no city-specific warning beyond that · **5** advisories mention no
  specific risk; residents walk at night in most areas.
- **Scope:** city. Review every 3 months. Any remark carries a dated source (CLAUDE.md rule).

#### `utilities` — Courant et eau _(new, replaces part of `order`)_

- **Means:** how often power and water fail, and what it takes to cope.
- **Why new:** power cuts are raised in 45 of 54 dossiers (documented in far fewer), water in at least 12; both vary by city
  (Bulawayo vs Harare; Windhoek restrictions; Saint-Louis and Saly worse than Dakar).
- **Sources:** Afrobarometer "electricity works most or all of the time" (connected urban
  respondents, region; Round 10 covers 38 countries, e.g. Kenya 47 %, Tanzania 34 %, Uganda
  16 %, released 2026); load-shedding schedules (EskomSePush for South Africa, utility
  announcements elsewhere); World Bank Enterprise Surveys outages per month (country);
  WHO/UNICEF JMP urban water (country, 2025 report); local press for rationing.
- **Coverage:** region-level proxy at best; label it.
- **Rubric:** **1** cuts of several hours most days; generator or solar kit and water tank
  indispensable · **3** weekly cuts or seasonal shedding; a backup is wise · **5** cuts rare
  and short; no backup needed.
- **Scope:** city (regional proxy). Review every 6 months.

#### `internet` — Internet

- **Means:** whether you can work online from home.
- **Sources:** Ookla open-data tiles aggregated to the city outline (median fixed download,
  number of tests; quarterly; **CC BY-NC-SA**, see §7); fibre offers and prices from operators;
  country shutdown history (Access Now / dossiers: Tanzania 2025, Togo 2025, Sudan 2023–26);
  Starlink status (suspended in Senegal, 2026-11-03).
- **Rubric:** **1** median under 5 Mbps, mobile data only · **3** 15–40 Mbps, fibre in some
  neighbourhoods · **5** above 80 Mbps, fibre widely sold by several operators. A national
  shutdown in the last 24 months caps the score at 3.
- **Scope:** city. Review every 6 months.

#### `healthcare` — Soins _(split from `healthAndSchools`)_

- **Means:** what care is reachable without leaving the country.
- **Sources:** presence of a JCI- or COHSASA-accredited hospital (facility → city), private
  clinics named in advisories and expat guides; national context from the WHO/World Bank UHC
  index (December 2025 report, data to 2023) and the International SOS Risk Map 2026.
- **Rubric:** **1** serious cases are evacuated abroad · **3** private clinics for most care;
  specialists or surgery in the capital · **5** an accredited hospital in the city and most
  specialities.
- **Scope:** city. Review yearly.

#### `schools` — Écoles _(split from `healthAndSchools`)_

- **Means:** places in a school that follows a curriculum a diaspora family can continue
  elsewhere (French, English or international).
- **Sources:** AEFE list of approved schools (arrêté of 16 June 2025, 612 schools in 138
  countries), IB World Schools directory, Cambridge International school finder; fees from
  school sites.
- **Rubric:** **0** none · **1** a small or partly approved school, or distance learning
  (CNED) only · **3** one approved French or English school · **5** several, covering both
  French and English curricula through to the baccalauréat or equivalent.
- **Facts stored with it:** curricula available (`french`, `english`, `ib`), so the filter
  can match the reader's request.
- **Scope:** city. Review yearly (June arrêté).

#### `jobs` — Emploi _(renamed from `career`)_

- **Means:** chances of finding skilled local work as a newcomer.
- **Sources:** dossiers (career is the best-evidenced dimension: 13 weak out of 120 cities), presence
  of international organisations and multinationals, sector notes.
- **Rubric:** **1** almost no formal skilled jobs open to newcomers · **3** one or two sectors
  hire (port, mining, administration, tourism) · **5** a regional hub hiring across sectors.
- **Facts stored with it:** `sectors` (admin-ngo, port-trade, mining, oil-gas, tourism, tech,
  agriculture), used to match the follow-up question.
- **Scope:** city. Review yearly.

#### `business` — Entreprendre et investir _(merges `investment` and the dossiers' `startup`)_

- **Means:** how workable it is to start a company or invest here.
- **Sources:** StartupBlink 2026 city rank (69 African cities assessed; not ranked is itself
  information); incubators; World Bank B-READY (country; 2025 edition covers 14 African
  countries, 2026 adds 20, South Africa and Algeria absent); property-ownership rules for
  foreigners (country fact).
- **Rubric:** **1** no incubator, no ranking, ownership restricted · **3** an incubator and some
  local funding · **5** a StartupBlink top-200 city or a continental hub (Lagos, Nairobi, Cape
  Town, Cairo).
- **Scope:** city, with the country's B-READY reading as context. Review yearly.

#### `flights` — Avions vers l'Europe et la région

- **Means:** how easily you go back and forth.
- **Sources:** FlightConnections (or airport route lists) snapshot per IATA season: number of
  European airports with non-stop flights from the nearest international airport, and road
  time to it.
- **Rubric:** **1** no international airport within 3 hours · **3** one to three non-stop
  European destinations within 1.5 hours · **5** eight or more.
- **Scope:** city. Review every season (twice a year).

#### `culture` — Vie culturelle

- **Rubric:** **1** little regular cultural life · **3** venues and at least one yearly
  festival of national reach · **5** a continental scene (music, film, art) with year-round
  programming.
- **Sources:** festival calendars, UNESCO Creative Cities, Institut français and Goethe
  programmes, dossiers (culture weak in 8 of 29 in one group: acceptable).

#### `nightlife` — Sorties _(target)_

- **Means:** how much happens after dark: bars, live music, clubs. Matched against the Saturday
  night answer as a target. Absorbs the prototype's `social` (r = 0.86).
- **Rubric:** **1** alcohol banned or almost nothing open after dinner · **3** some bars and
  live music at weekends · **5** every night, regional reputation.
- **Sources:** dossiers, alcohol law (country), curfews. Weakly sourced in 85 of 120 dossier
  cities: label `editorial` until sourced.

#### `history` — Histoire et mémoire _(merges `heritage` and `memory`)_

- **Means:** history you can visit, including places tied to the slave trade and to the
  diaspora (Gorée, Ouidah, Cape Coast, Stone Town).
- **Sources:** UNESCO World Heritage List, UNESCO "Routes of Enslaved Peoples" sites,
  national museums.
- **Rubric:** **1** no notable site · **3** a listed site or significant museum · **5** a World
  Heritage site in the city and memorial places of the diaspora.

#### `returnees` — Réseau de repats _(renamed from `diaspora`)_

- **Means:** an active network of people who came back or came over, that a newcomer can join.
- **Does not mean:** how welcome returnees are (described only, §3.4), nor the size of the
  foreign-worker community (most "expat" groups are foreign workers, not returnees [S]).
- **Sources:** returnee associations and groups (sizes, dated), government diaspora desks
  (FAISE in Senegal, NiDCOM in Nigeria, Benin's 2024-31 law), Institut français and consulates
  as proxies. **No index exists**: confidence is never higher than `sourced`.
- **Rubric:** **1** none found · **3** an active association or group · **5** a known returnee
  hub with regular events and a government desk.

#### `pace` — Rythme de la ville _(target; merges `intensity`, `competition`, `size` cues)_

- **Means:** traffic, crowds, noise, the speed of daily life. Matched by distance with the
  reader's "bruit et foule" answer.
- **Sources:** population (UN WUP 2025, Africapolis), commute times reported in dossiers
  (Lagos 2–4 h a day, Kinshasa 25 km in 2–3 h), density.
- **Rubric:** **1** small town, little traffic, quiet evenings · **3** a busy centre, calm
  neighbourhoods · **5** megacity: heavy traffic, crowds and noise day and night.

### 3.3 Country criterion (scored 0–5)

#### `paperwork` — Démarches _(new, replaces part of `order`)_

- **Means:** how hard it is for a French-passport holder, and for a descendant of nationals, to
  enter, get a residence card, open a bank account and register a business.
- **Sources:** national immigration sites, France Diplomatie "Entrée / séjour", B-READY
  business entry (country), dossiers (visa required for EU passports in 8 of 12 countries in one
  group; Togo ended visa on arrival on 2024-04-12; Mauritius Premium Visa). Diaspora routes are rare: Benin (law 2024-31), Ethiopia's Yellow Card for people of Ethiopian origin, Sierra Leone's descent route; Ghana's right-of-abode scheme has been suspended since 2026-02-01.
- **Rubric:** **1** visa obtained only from a consulate in Europe; residence opaque or
  discretionary · **3** e-visa or visa on arrival; residence card in a few months with a local
  sponsor · **5** visa-free entry, residence online, or a dedicated diaspora route.
- **Scope:** country. Review every 6 months.

### 3.4 Facts and described-only topics

| Item                                                                                                                | Kind      | Level                       | Source                                                          | Use                                        |
| ------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| Languages + how far each gets you (daily / work and admin / limited)                                                | Fact      | City                        | Dossiers, census                                                | Filter or weight                           |
| Climate (chaud et humide / chaud et sec / doux / frais en altitude) + hottest-month figure + flood/cyclone exposure | Fact      | City                        | Köppen-Geiger 1 km, ERA5 or Meteostat, WRI Aqueduct             | Weight; risk goes in "à savoir"            |
| Landscape within an hour (océan, lac ou fleuve, montagnes, forêt, savane, désert)                                   | Fact      | City                        | Map                                                             | Weight                                     |
| Population and size class                                                                                           | Fact      | City                        | UN WUP 2025, Africapolis                                        | Target                                     |
| Travel advice colour (France Diplomatie) and FCDO level                                                             | Fact      | City zone                   | France Diplomatie, FCDO                                         | Gate (§4.3)                                |
| Sectors that hire                                                                                                   | Fact      | City                        | Dossiers                                                        | Weight via follow-up                       |
| Visa-free days for French passports                                                                                 | Fact      | Country                     | France Diplomatie                                               | Filter (opt-in)                            |
| Dual nationality and descent rules                                                                                  | Fact      | Country                     | GLOBALCIT v3.0 (2025-06-13), dossiers                           | Explanation                                |
| Same-sex relations: legal / criminalised                                                                            | Fact      | Country (Zanzibar separate) | ILGA World database (May 2026)                                  | Filter (opt-in), explanation               |
| Mobile money share of adults                                                                                        | Fact      | Country                     | Global Findex 2025, GSMA 2026                                   | Explanation ("on paie surtout par mobile") |
| Food                                                                                                                | Described | City                        | Editorial                                                       | Pitch text                                 |
| Women's daily experience                                                                                            | Described | Country, city notes         | Afrobarometer gender items, WPS Index 2025/26, national surveys | "À savoir" text, sourced                   |
| How returnees are received, and local words for them                                                                | Described | Country                     | Dossiers (5 sourced)                                            | Text only                                  |
| Religion, alcohol, dress codes                                                                                      | Described | City                        | Advisories, dossiers                                            | Text; filter only if stated in free text   |
| Racism and colourism toward Black or mixed-race residents                                                           | Described | City                        | Advisories, HRW (Tunisia 2024–26)                               | Always shown in "à savoir" where sourced   |
| Political speech limits, internet shutdowns                                                                         | Described | Country                     | Advisories, Access Now                                          | "À savoir"                                 |

### 3.5 What happens to the current 21 scores

| Current score      | Decision          | Becomes                                        | Reason                                                                                      |
| ------------------ | ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `cost`             | **Keep**          | `cost`                                         | Core; rubric and listing samples added                                                      |
| `safety`           | **Keep, narrow**  | `safety` + advisory gate                       | War zones were mixed with daily crime                                                       |
| `nightlife`        | **Keep**          | `nightlife` (target)                           | Absorbs `social`                                                                            |
| `culture`          | **Keep**          | `culture`                                      | —                                                                                           |
| `food`             | **Drop as score** | Described                                      | Weakest in every group (113 of 120 dossier cities unsourced); σ 0.92; every city "has food" |
| `career`           | **Rename**        | `jobs` + `sectors` fact                        | Best-evidenced; sector is what discriminates                                                |
| `investment`       | **Merge**         | `business`                                     | r = 0.70 with career, 0.86 with internet: it was a "capital" proxy                          |
| `internet`         | **Keep**          | `internet`                                     | Ookla gives a real figure                                                                   |
| `healthAndSchools` | **Split**         | `healthcare`, `schools`                        | Different readers, different filters; schools is the top discriminator                      |
| `heritage`         | **Merge**         | `history`                                      | Overlaps `memory` for diaspora readers                                                      |
| `beach`            | **To fact**       | `settings: ocean`                              | A map fact, not a quality grade                                                             |
| `nature`           | **To fact**       | `settings: mountains / forest / lake-or-river` | Same                                                                                        |
| `wildSpaces`       | **To fact**       | `settings: savanna / desert`                   | Same                                                                                        |
| `memory`           | **Merge**         | `history`                                      | Same referent, two scores                                                                   |
| `flights`          | **Keep**          | `flights`                                      | Rubric now counts routes                                                                    |
| `diaspora`         | **Rename**        | `returnees`                                    | Says what it measures                                                                       |
| `social`           | **Merge**         | `nightlife`                                    | r = 0.86                                                                                    |
| `novelty`          | **Drop**          | —                                              | Lowest spread (σ 0.70); no observable referent                                              |
| `order`            | **Split**         | `utilities` (city), `paperwork` (country)      | Two different, sourceable things                                                            |
| `competition`      | **Merge**         | `jobs`, `pace`                                 | r = 0.83 with career, 0.72 with intensity                                                   |
| `intensity`        | **Rename**        | `pace` (target)                                | Says what it measures                                                                       |

The dossiers' 15 dimensions map the same way: `startup` → `business`; `family` → `schools` +
`healthcare` (+ `safety`); `healthcare` → `healthcare`; `francophone-friendliness` →
language fact with its `use` level; `diaspora-network` → `returnees`; the others as above.

**Added** with no prototype equivalent: `setupCost`, `utilities`, `schools` (as its own
criterion), `paperwork`, the climate classes, travel-advice, visa, nationality, LGBT and
mobile-money facts.

---

## 4. The matching layer

### 4.1 Person → city matrix

`F` filter · `W` weight (number = points added to the base weight) · `T` target · `E`
explanation only. Base weights apply before any answer (cost 1, safety 1, utilities 0.5,
internet 0.5, healthcare 0.5, flights 0.5, culture 0.5, history 0.5; others 0).

| Reader answer                           | cost                       | setup | safety | utilities | internet | health | schools  | jobs | business | flights | culture | nightlife | history | returnees | pace | paperwork | facts              |
| --------------------------------------- | -------------------------- | ----- | ------ | --------- | -------- | ------ | -------- | ---- | -------- | ------- | ------- | --------- | ------- | --------- | ---- | --------- | ------------------ |
| Project: s'installer                    | W1                         |       | W1.5   | W1        |          | W1     |          |      |          |         |         |           |         | W1        |      | W1        |                    |
| Project: un pied ici et là-bas          |                            |       |        |           | W1       |        |          |      | W1       | W3      |         |           |         |           |      |           |                    |
| Project: tester                         | W1                         | W2    |        |           | W1.5     |        |          |      |          |         |         |           |         | W1.5      |      | E         |                    |
| Project: investir                       |                            |       |        |           |          |        |          | W1.5 | W3       | W1      |         |           |         |           |      | W1        |                    |
| Project: retraite                       | W1.5                       |       | W1.5   | W1        |          | W3     |          |      |          | W1      |         |           |         |           |      | W1        |                    |
| Project: études                         | W2                         |       |        |           | W1       |        |          |      |          |         | W1      |           |         | W1        |      |           |                    |
| Project: vacances d'abord               |                            |       | W0.5   |           |          |        |          |      |          |         | W1      |           | W1      |           |      |           | landscape W        |
| Work: salarié                           |                            |       |        |           |          |        |          | W2.5 |          |         |         |           |         |           |      |           | sectors W2         |
| Work: entreprendre                      |                            |       |        |           |          |        |          | W1   | W2.5     |         |         |           |         |           |      | W1        |                    |
| Work: télétravail                       |                            |       |        | W1.5      | W3       |        |          |      |          | W1      |         |           |         |           |      |           |                    |
| Work: création                          |                            |       |        |           |          |        |          |      |          |         | W2.5    | W0.5      |         |           |      |           |                    |
| Work: soin, enseignement                | W1                         |       |        |           |          | W1     |          |      |          |         |         |           |         | W0.5      |      |           |                    |
| Budget serré                            | W3, F (≤1 out)             | W1    |        |           |          |        |          |      |          |         |         |           |         |           |      |           |                    |
| Budget moyen                            | W1.5                       |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           |                    |
| Budget confortable                      | set 0                      |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           |                    |
| Enfants à scolariser                    |                            |       | W1.5   |           |          | W1     | F + W2.5 |      |          |         |         |           |         |           |      |           |                    |
| Besoin de soins suivis                  |                            |       |        |           |          | F + W2 |          |      |          |         |         |           |         |           |      |           |                    |
| Langue (seulement)                      |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           | language F         |
| Langue (de préférence)                  |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           | language W3        |
| Sans visa seulement                     |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      | E         | visa F             |
| Exclure pays pénalisant l'homosexualité |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           | law F              |
| Taille                                  |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           | size T2            |
| Climat                                  |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           | climate W2         |
| Paysage                                 |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           | settings W2        |
| Samedi soir                             |                            |       |        |           |          |        |          |      |          |         |         | T2.5      |         |           |      |           |                    |
| Bruit et foule                          |                            |       |        |           |          |        |          |      |          |         |         |           |         |           | T2   |           |                    |
| Coupures et démarches me pèsent         |                            | W1    |        | W2        |          |        |          |      |          |         |         |           |         |           |      | W1.5      |                    |
| Origine + retrouver                     |                            |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           | country +1.5 bonus |
| Réseau de repats souhaité               |                            |       |        |           |          |        |          |      |          |         |         |           |         | W2        |      |           |                    |
| Priorité (top 3)                        | each chosen criterion W2.5 |       |        |           |          |        |          |      |          |         |         |           |         |           |      |           |                    |

The weights for the existing answers are the prototype's, kept so results stay recognisable;
new rows use the same scale (0.5 = a nudge, 2.5 = a priority, 3 = the deciding factor).

### 4.2 Missing data

A city with no reliable figure must neither win nor lose because of it.

- **Ranking:** a `null` level counts as the **neutral midpoint 2.5** for that city. Dropping the
  criterion instead would reward thinly documented cities (their score would rest only on what
  is known, often the flattering part); counting it as 0 would bury every secondary city.
- **Explanation:** a criterion at `null` is never cited as a reason or as a drawback.
- **Coverage:** each match carries `coverage` = the share of the reader's total weight backed by
  a non-null value. Below 0.7 the card says "Données incomplètes pour cette ville : on vous
  montre ce qu'on sait". The list can be sorted by score only; coverage never changes order.
- **Filters on missing data:** a hard filter on a `null` criterion (e.g. schools for a city
  where no one checked) **keeps** the city and marks it "à vérifier", rather than removing it on
  an absence of evidence.
- **Confidence in the sentence:** an `editorial` value is shown with "(estimation)" next to the
  reason.

### 4.3 Cities that stay ranked but are never proposed

- `unsafe` becomes **derived**, not hand-set: true when France Diplomatie's zone covering the
  city is orange or red, or the FCDO advises against all or all-but-essential travel there. The
  15 cities flagged today (Bamako, Ouagadougou, Niamey, Bangui, Mogadiscio, Juba, Tripoli,
  Khartoum, Ségou, Bobo-Dioulasso, Agadez, Berbérati, Wau, Benghazi, Port-Soudan) should be
  rechecked against that rule; the dossiers add Bahir Dar (recommended `unsafe`), Hargeisa and N'Djamena (borderline).
- They are still ranked so the reader can see where they would have landed, but they never
  appear in the top three or on the map's highlight. Where one would have ranked in the top
  ten, the page says: "Bamako aurait pu vous correspondre. Elle n'est pas proposée : le
  ministère des Affaires étrangères déconseille de s'y rendre (zone rouge, mise à jour du …)".
- The rule and its date are on the method page. The gate is re-run whenever travel advice is
  updated; the reader never sees an advice colour older than its review date without
  "à revérifier".

### 4.4 The level-2 questionnaire (paid tier)

Level 1 asks the ten questions of §A.3 in a fixed order. The bank below is the level-2
questionnaire, drafted in "vous"; it moves to "tu" if the paid tier keeps level 1's voice.

**Keep the promise that every tap visibly changes something:** each answer re-ranks
immediately, and the next question is the one most likely to change the current top three.

**Next-question rule (computable in the browser):**

1. Rank with the current answers; take the top 10 proposable cities.
2. For each unanswered question, re-rank once per possible answer (≤ 6) and record the top 3.
3. Score the question by the number of **distinct cities** that appear across those top-3
   lists (3 = the answer changes nothing; up to 18 = every answer reshuffles the top).
4. Ask the highest-scoring question; break ties by the bank order below (hard constraints
   first, then project, then preferences, then tolerances).
5. Always ask `project` first and stop proposing after 15 answers or when no question scores
   above 4 ("Vos trois villes sont stables : vous pouvez affiner si vous voulez").

Cost: about 40 questions × 5 answers × 115 cities ≈ 23,000 small evaluations per tap, well
within a phone's budget. If it is too slow, keep only the top 30 cities in step 2.

**Question bank** (40 questions; "vous", phone-sized answers; ID → criteria informed).

_Hard constraints_

| ID  | Question                                                           | Answers                                              | Informs                     |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------- |
| Q01 | Dans quelle langue pouvez-vous vivre au quotidien ?                | Français · Anglais · Portugais · Arabe · Plusieurs   | language                    |
| Q02 | Cette langue, c'est…                                               | Indispensable · Un plus                              | language F/W                |
| Q03 | Votre budget mensuel sur place, logement compris ?                 | Moins de 800 € · 800 à 2 000 € · Plus de 2 000 €     | cost                        |
| Q04 | Avez-vous des enfants à scolariser là-bas ?                        | Oui · Pas pour l'instant                             | schools, safety, healthcare |
| Q05 | Quelle école pour eux ?                                            | Programme français · Programme anglais · Peu importe | schools F                   |
| Q06 | Un besoin de soins réguliers (traitement, grossesse, parent âgé) ? | Oui · Non                                            | healthcare F                |
| Q07 | Pour un premier séjour, vous voulez éviter le visa ?               | Oui, sans visa · Le visa ne me gêne pas              | visa F, paperwork           |
| Q08 | Voulez-vous exclure les pays qui punissent l'homosexualité ?       | Oui · Non                                            | LGBT law F                  |

_Life project_

| ID  | Question                                        | Answers                                                                                                                                    | Informs                           |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Q09 | Comment vous voyez-vous là-bas ?                | M'installer · Un pied ici, un pied là-bas · Tester quelques mois · Investir sans y vivre · Ma retraite · Mes études · D'abord des vacances | project                           |
| Q10 | Votre travail là-bas ?                          | Salarié sur place · Entreprendre · Télétravail · Création, culture · Santé, enseignement · Pas de travail                                  | jobs, business, internet, culture |
| Q11 | Dans quel secteur ?                             | Administration, ONG · Port, commerce · Mines, énergie · Tourisme · Numérique · Agriculture                                                 | sectors                           |
| Q12 | Votre revenu viendra…                           | D'un salaire local · De l'étranger · D'une pension · Je ne sais pas encore                                                                 | cost, jobs                        |
| Q13 | Pour le logement ?                              | Louer d'abord · Acheter · Construire · Chez la famille                                                                                     | setupCost, business (E)           |
| Q14 | Quand partez-vous ?                             | Cette année · D'ici 2 ou 3 ans · Je rêve encore                                                                                            | E (urgency of setup text)         |
| Q15 | Vous partez…                                    | Seul · En couple · En famille · Avec mes parents                                                                                           | safety, healthcare, schools       |
| Q16 | Combien d'allers-retours vers l'Europe par an ? | Un ou moins · Deux ou trois · Tous les mois                                                                                                | flights                           |

_Roots and belonging_

| ID  | Question                                                  | Answers                                                           | Informs            |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------- | ------------------ |
| Q17 | Votre famille vient de quel pays ?                        | (liste des 54) · Je préfère ne pas dire                           | roots              |
| Q18 | Vous cherchez plutôt à…                                   | Retrouver mes racines · Découvrir ailleurs · Les deux             | roots bonus on/off |
| Q19 | Avez-vous de la famille sur place ?                       | Oui, proche · Un peu · Non                                        | E                  |
| Q20 | Là-bas, vous aimeriez…                                    | Retrouver d'autres repats · Vivre comme les gens d'ici · Les deux | returnees          |
| Q21 | L'histoire de la diaspora (lieux de mémoire), ça compte ? | Beaucoup · Un peu · Pas pour ce choix                             | history            |

_Preferences_

| ID  | Question                                             | Answers                                                                       | Informs                   |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| Q22 | Quelle taille de ville ?                             | Très grande · À taille humaine · Petite et tranquille                         | size T                    |
| Q23 | Quel climat ?                                        | Chaud et humide · Chaud et sec · Doux · Frais en altitude                     | climate                   |
| Q24 | La chaleur au-dessus de 40 °C ?                      | Je supporte · Je préfère éviter                                               | climate (hot-dry penalty) |
| Q25 | Quel paysage autour ?                                | Océan · Lac, fleuve · Montagnes, forêts · Savane, désert · La ville me suffit | settings                  |
| Q26 | Votre samedi soir idéal ?                            | Musique jusqu'au matin · Un dîner entre amis · Au calme chez moi              | nightlife T               |
| Q27 | Concerts, expos, festivals ?                         | Souvent · De temps en temps · Rarement                                        | culture                   |
| Q28 | Pour vous déplacer ?                                 | Voiture · Taxi, moto · À pied surtout                                         | pace, E                   |
| Q29 | La plage le week-end, c'est…                         | Indispensable · Un plus · Sans importance                                     | settings                  |
| Q30 | Une ville où l'on boit de l'alcool en public, c'est… | Important · Égal · Je préfère l'inverse                                       | nightlife, E              |

_Tolerances (temperament, as stated preferences)_

| ID  | Question                                          | Answers                                            | Informs                         |
| --- | ------------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| Q31 | Le bruit et la foule…                             | Me donnent de l'énergie · Ça dépend · Me fatiguent | pace T                          |
| Q32 | Coupures de courant, démarches longues, imprévus… | Je fais avec · Ça me pèse · Je veux l'éviter       | utilities, paperwork, setupCost |
| Q33 | Les embouteillages tous les jours ?               | Ça passe · Plutôt pas · Hors de question           | pace                            |
| Q34 | Payer surtout par téléphone (mobile money) ?      | Très bien · Je m'adapterai · Je préfère la carte   | E (mobile-money fact)           |
| Q35 | Dans une nouvelle ville, vous préférez…           | Un grand réseau à se faire · Un petit cercle       | pace, returnees                 |

_Priorities and what to give up_

| ID  | Question                                                                     | Answers                                                                                                     | Informs                                                 |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Q36 | Sur quoi ne transigez-vous pas ? (3 max)                                     | Sécurité · Coût de la vie · Soins · Écoles · Emploi · Internet · Avions · Courant et eau · Réseau de repats | priority W2.5                                           |
| Q37 | À quoi pouvez-vous renoncer ? (2 max)                                        | Vie nocturne · Plage · Culture · Grande ville · Internet rapide                                             | weight set to 0                                         |
| Q38 | Combien pouvez-vous avancer pour vous installer (caution, loyers d'avance) ? | Moins de 2 000 € · 2 000 à 6 000 € · Plus                                                                   | setupCost                                               |
| Q39 | Une ville déjà en tête ?                                                     | (champ de recherche) · Non                                                                                  | E (shown with its rank)                                 |
| Q40 | Déjà vécu ou voyagé en Afrique ?                                             | Souvent · Une ou deux fois · Jamais                                                                         | E (wording of "à savoir": more detail for first-timers) |

Every question maps to at least one criterion or fact; questions marked only `E` never change
the order, and the selection rule never asks them while a ranking question still scores above 4.

### 4.5 Free text → the same model

The free-text entry ("Racontez-nous votre situation") fills the same `PersonProfile` as the
quiz, through a structured extraction:

- **Target:** the `PersonProfile` type in [`schema.ts`](./schema.ts), each field optional, each
  extracted value an `Answer` with `origin: "free-text"` and `evidence` (the reader's own words).
- **Rules:** extract only what is said; never infer orientation, religion, health or origin
  from names or style; anything sensitive (health, orientation, religion) is only used as a
  filter if the reader phrases it as a wish ("je ne veux pas d'un pays qui…").
- **Shown back as chips** the reader can remove or correct before ranking ("J'ai compris :
  budget serré · enfants · français indispensable"). Unmapped wishes are listed as "Ce que
  Là-bas ne sait pas encore évaluer".
- **Privacy conflict:** today nothing leaves the browser (CLAUDE.md). A server-side language
  model breaks that rule; see decision 3.

### 4.6 The explanation contract

Level 1 presents these elements as described in §A.4: the "parce que" lines become "Pourquoi
toi et [ville]", written as preferences, and the criteria stay behind "Pourquoi cette ville ?".
Level 2 shows them as below.

For each proposed city:

- **"Parce que…"** — two or three lines. Candidates are criteria with weight > 0, level ≥ 3.5
  and a non-null value, sorted by weight × level. The reader's priorities always come first if
  they qualify. Each line carries "(estimation)" when its confidence is `editorial`.
- **"À savoir avant de partir"** — exactly one line, always shown:
  1. a filter that was relaxed ("École française : à vérifier"), else
  2. the reader's heaviest criterion where the city scores ≤ 2, else
  3. the city's `watch` text (sourced when it touches safety, racism, LGBT rights or conflict).
- **Context line** (small text, when relevant): a country fact the reader should know even if
  they did not ask — visa, dual nationality for their origin country, criminalisation of
  homosexuality, the advice colour.
- **Never** a percentage presented as a "match" of the person; the score is shown as a rank and
  a bar, labelled "selon vos réponses".

---

## 5. Data model

The proposed types are in [`schema.ts`](./schema.ts): `Criterion`, `CriterionScore`
(level, optional raw figure, justification, provenance), `Provenance`, `City`, `Country`,
`PersonProfile`, `Answer`, `Match` and `Explanation`. Design choices:

- **Two files, still static:** `cities.json` and `countries.json`. Country facts (visa,
  nationality, LGBT law, mobile money, `paperwork`) are stored once, not copied into each
  city. Everything is still computed in the browser.
- **`level: null` is allowed** and means "not known"; the ranking treats it as described in
  §4.2.
- **Provenance is mandatory** on every score and sensitive fact, including the prototype's
  scores during migration (`confidence: "editorial"`, `editor: "prototype"`).
- **`unsafe` is derived** from the stored advisory, so it cannot drift from its source.
- **Public interface unchanged:** `rankCities(answers)` and `bestMatches(answers, n)` keep
  their names, so the existing tests keep guarding behaviour while criteria move over one by
  one (test first: each migrated criterion starts with a failing test on `rankCities`).

**Migration**, in order (each step a separate PR behind `make check`): split country facts out;
rename (`career` → `jobs`, `diaspora` → `returnees`, `intensity` → `pace`); merge
(`heritage` + `memory` → `history`, `investment` → `business`, `social` → `nightlife`); turn
`beach`/`nature`/`wildSpaces` into `settings`; drop `food`, `novelty`, `competition`; add
`null`-valued `setupCost`, `utilities`, `schools`, `healthcare`, `paperwork`; then re-score from
the dossiers criterion by criterion. Details at the bottom of `schema.ts`.

---

## 6. Honesty and risk

**Where the architecture could mislead**

1. **A ranked list looks like a measurement.** A 0.82 next to Dakar reads as "82 % compatible".
   Show rank and a bar, say "selon vos réponses", and link every score to its source.
2. **Capitals win by default.** Even after merges, capitals lead on jobs, flights, internet,
   healthcare, schools and business. A reader with no strong preferences will mostly see
   capitals. That is honest for those criteria, but the method page must say so, and `pace`
   and `cost` must carry enough weight to let secondary cities through when the reader asks
   for calm or cheap.
3. **Regional proxies dressed as city figures.** Afrobarometer and DHS give region-level
   values; showing them as a city's own figure would be false precision. Label "région de …".
4. **Stale advice.** Travel advice changes overnight (Niger, Mali, Sudan in 2025–26). A stale
   colour is worse than none. Each advisory carries its date, and the page shows
   "à revérifier" past its review date.
5. **The neutral 2.5 for missing data** is a choice, not a fact. A secondary city with five
   unknowns sits in the middle of the list for reasons the reader cannot see unless coverage is
   shown. Coverage is therefore always shown.
6. **Sensitive filters can look like profiling.** The LGBT and religion filters are opt-in,
   phrased as the reader's wish, never inferred, never stored, and never sent.

**Criteria resting on thin data for most cities**

| Criterion                                 | Why thin                                 | Label                          |
| ----------------------------------------- | ---------------------------------------- | ------------------------------ |
| `returnees`                               | No index; groups are small and undated   | Always "estimation"            |
| `nightlife`, `culture`                    | Unsourced in most dossier cities         | "estimation" until sourced     |
| `utilities`                               | Region-level proxy at best               | "région de …"                  |
| `setupCost`                               | No dataset; local practice               | "pratique courante d'après …"  |
| `cost` in secondary cities                | Few Numbeo contributors                  | Show listing count and date    |
| `safety` in secondary cities              | 16 cities in one group have no source    | "estimation"                   |
| `business` outside 69 StartupBlink cities | Absence of ranking ≠ absence of activity | "non classée par StartupBlink" |

**Must be labelled as an estimate:** every `editorial` value; every value carried over from the
prototype until re-scored; every regional proxy; the overall rank.

**Must never be scored, only described (with a dated source):**

- how returnees, women, LGBT people, Black foreigners or mixed-race people are treated — a
  score would rank human dignity and rests on anecdote;
- religion and religiosity;
- political freedom and repression (described in "à savoir");
- food and "ambiance";
- anything about the reader's personality.

**Data licences to clear before launch:** Ookla open data is non-commercial (CC BY-NC-SA);
Numbeo and Henley forbid reuse without a licence; ACLED tiers and lags must be checked. France
Diplomatie, FCDO (OGL), ILGA, JMP, UN WUP, Findex, B-READY and GLOBALCIT are free to cite.

---

## 7. Decisions for the maintainer

**Already decided (2026-11-14):** two levels, free then paid with coaching (§A.2); level 1 keeps
the ten current questions, reworded in "tu" (§A.3); the portrait speaks of preferences, never
of traits, so the repo rule stays as it is (§A.7); one city first, with a discovery lead
outside the reader's usual sphere (§A.5).

**Still open:**

1. **Adopt the reshaped criteria set** (15 city + 1 country criteria; `food`, `novelty`,
   `competition` dropped; `beach`/`nature`/`wildSpaces` turned into landscape facts)?
   **Recommendation: yes.** It removes the "big capital" triple-counting and adds the four
   things the dossiers say separate cities (setup cost, power and water, schools, paperwork).
   Cost: the current quiz answers must be re-mapped and the 115 cities re-scored.
2. **Offer the sensitive filters in level 2** (visa-free, criminalisation of homosexuality, later
   religion via free text)? **Recommendation: yes, opt-in only**, worded as the reader's wish,
   with the count of removed cities shown and nothing stored. Leaving them out pushes the
   reader to discover a 5–10 year sentence (Senegal, 2026) after choosing.
3. **Free-text entry and privacy.** A language model behind a server breaks "nothing leaves
   the browser". **Recommendation:** ship the quiz first; when free text comes, run the
   extraction with explicit consent ("votre texte est envoyé à … pour être lu, puis effacé"),
   no logging, and the chips shown back before ranking — or keep it entirely client-side with
   a keyword extractor if consent is unacceptable.
4. **Derive `unsafe` from travel advice** (France Diplomatie orange/red, or FCDO "all" /
   "all but essential") instead of hand-setting it? **Recommendation: yes, France Diplomatie
   first** (the audience is French-speaking and the zones are sub-national), FCDO as a second
   trigger. It may add Bahir Dar, Hargeisa and N'Djamena and remove nothing, which has to be checked city by
   city.
5. **Minimum data before public launch and the Ookla licence.** **Recommendation:** no launch
   until `safety`, `cost`, `healthcare` and `utilities` are `sourced` or `measured` for all 100
   proposable cities, with dated sources; decide now whether Là-bas will ever carry ads or
   affiliate links — if it may, license Ookla data or use operator-advertised speeds instead.
