# Exchange rates for the country dossiers

Compiled 2026-11-15. One row per currency named in `research/countries/*.md`, plus the US dollar
because many dossiers quote prices in dollars.

**Columns.**

- **Units per EUR**: the mid-market reference. A central bank figure comes first. When the central
  bank page could not be read, the figure comes from the aggregator
  [ExchangeRate-API (open.er-api.com), last updated 2026-11-15 00:02 UTC](https://open.er-api.com/v6/latest/EUR),
  shown as "ER-API".
- **Dossier used**: the rate the dossier states or implies, converted to units per EUR. Where the
  dossier only gives a USD rate, it is converted at the ECB EUR/USD rate of 1.1052.
- **Gap**: (dossier rate − reference) / reference. A **positive** gap means the dossier counts too
  many local units per euro, so its EUR figures are **too low**. A **negative** gap means its EUR
  figures are **too high**.
- **Parallel**: the street or black-market rate, given only where a gap with the official rate is
  documented. Each one carries a dated source.

Some sources were seen only in a search-result summary, not on the page itself. Those are marked
"(search summary, page not opened)" and should be checked before anyone quotes them.

## US dollar and the euro pegs

| Currency | Dossiers | Units per EUR | Date | Source | Dossier used | Gap |
|---|---|---|---|---|---|---|
| USD | many (see below) | **1.1052** | 2026-11-13 | [ECB euro reference rates](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml); ER-API 1.1038 (2026-11-15) | 1.15 (ethiopie, djibouti) | +4.1 % |
| | | | | | 1.163, i.e. 1 USD ≈ 0.86 EUR (rd-congo, somalie, zimbabwe) | +5.2 % |
| | | | | | ≈1.167, implied by USD 210 ≈ EUR 180 (ghana) | +5.6 % |
| | | | | | 1.111, i.e. 1 USD ≈ 0.9 EUR (lesotho) | +0.5 % |
| | | | | | 1.087, i.e. 1 USD ≈ 0.92 EUR (zambie) | −1.7 % |
| XOF (CFA franc, BCEAO) | benin, burkina-faso, cote-d-ivoire, guinee-bissau, mali, niger, senegal, togo | **655.957** (fixed) | fixed since 1999 | Treaty peg; ER-API 655.957 | 655.957 or 656 | 0 % |
| XAF (CFA franc, BEAC) | cameroun, centrafrique, congo, gabon, guinee-equatoriale, tchad | **655.957** (fixed) | fixed since 1999 | Treaty peg; ER-API 655.957 | 655.957 or 656 | 0 % |
| CVE | cap-vert | **110.265** (fixed) | fixed since 1999 | Peg; ER-API 110.265 | 110.265 | 0 % |
| KMF | comores | **491.968** (fixed) | fixed | Peg; ER-API 491.96775 | 491.97 | 0 % |
| STN | sao-tome-et-principe | **24.5** (fixed) | fixed since 2010 | Peg; ER-API 24.5 | 24.5 | 0 % |

## Other currencies

| Currency | Dossier | Units per EUR | Date | Source | Dossier used | Gap | Parallel rate (dated source) |
|---|---|---|---|---|---|---|---|
| ZAR | afrique-du-sud | **18.748** | 2026-11-13 | [ECB](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml); ER-API 18.676 | 18.7 | −0.3 % | — |
| NAD (pegged 1:1 to ZAR) | namibie | **18.748** | 2026-11-13 | ECB ZAR rate, through the peg | 20 | **+6.7 %** | — |
| LSL (pegged 1:1 to ZAR) | lesotho | **18.748** | 2026-11-13 | ECB ZAR rate, through the peg | 20 | **+6.7 %** | — |
| SZL (pegged 1:1 to ZAR) | eswatini | **18.748** | 2026-11-13 | ECB ZAR rate, through the peg | none (dossier says "not found") | n/a | — |
| BWP | botswana | **15.02** (1 BWP = 0.0666 EUR) | 2026-11-13 | [Bank of Botswana](https://www.bankofbotswana.bw/); ER-API 16.21 disagrees | 15 (unsourced) | −0.1 % | — |
| DZD | algerie | **152.13** official | 2026-11-09 | Banque d'Algérie, as reported by [Mediaterranee](https://www.mediaterranee.com/1022026-dinar-leuro-276-da-au-marche-parallele-152-da-au-taux-officiel.html) (search summary, page not opened); ER-API 151.67 (2026-11-15) | no EUR rate. Numbeo EUR figures follow the official rate; implied 146 DZD/USD (Dec 2025) | n/a | **274.5–275 buy / 276.5–277 sell** per EUR, Square Port-Saïd, Algiers ([Observ'Algérie, 2026-11-10](https://observalgerie.com/2026/11/10/economie/marche-noir-des-devises-en-algerie-leuro-repart-a-la-hausse-face-au-dinar-2)), about 82 % above official |
| AOA | angola | **1,043.3** | 2026-11-15 | ER-API (Banco Nacional de Angola not checked) | 1,000 (Numbeo-implied) | −4.2 % | not checked |
| BIF | burundi | **3,330.1** official | 2026-11-15 | ER-API (BRB not reachable in this run) | none (prices kept in FBu, which is correct) | n/a | about twice the official rate: a premium of "around 100 % at the end of April" 2026 ([Burundi Times, 2026-06-20](https://www.burunditimes.com/?p=8131), citing IMF), which gives about **6,660 per EUR** (derived) |
| CDF | rd-congo | **2,505.15** | 2026-11-16 (indicative) | [Banque Centrale du Congo](https://www.bcc.cd/); ER-API 2,570.0 | none in CDF (prices in USD, converted at 0.86) | see USD | not checked |
| DJF (USD peg 177.721) | djibouti | **196.42** | 2026-11-13 | 177.721 × ECB EUR/USD; ER-API 196.16 | 205 (assumed EUR/USD 1.15) | **+4.4 %** | — |
| EGP | egypte | **59.02** | 2026-11-15 | ER-API. The CBE page refused the request; CBE gave 59.00 buy / 59.17 sell on 2026-10-01 per [Ahram Online](https://english.ahram.org.eg/News/577981.aspx) (search summary, page not opened) | 59 (Numbeo-implied) | 0.0 % | no dated 2026 parallel quote found; the gap largely closed after the March 2024 float |
| ERN (USD peg 15) | erythree | **16.58** | 2026-11-13 | 15 × ECB EUR/USD; ER-API 16.56 | 17 (France Diplomatie, Oct 2026) | +2.5 % | 50–58 ERN per USD in 2025 (Wikivoyage, cited by the dossier [13]), about **55–64 per EUR**. Using it is illegal and risky. Undated Awate report: 28–30 per USD |
| ETB | ethiopie | **≈176.8** | Oct 2026 auctions | NBE auctions at "about 160 to the US dollar" ([Rio Times, 2026-11-09](https://www.riotimesonline.com/?p=785748)) × ECB EUR/USD. The NBE page did not load. ER-API gives 188.1, which looks high against the auction rate | 185 (assumed) | **+4.6 %** (−1.7 % against ER-API) | "over 180 Br" per USD ([Addis Fortune](https://addisfortune.news/brewed-buck-keeps-falling-quietly-on-policys-terms), undated, search summary), about **≥199 per EUR**. No dated November 2026 quote |
| GMD | gambie | **84.87** | 2026-11-15 | [Central Bank of The Gambia](https://www.cbg.gm/) daily valuation rate; ER-API 82.74 | 82.3 (FxFeed) | −3.0 % | — |
| GHS | ghana | **12.919** (mid) | 2026-11-13 | [Bank of Ghana](https://www.bog.gov.gh/treasury-and-the-markets/daily-interbank-fx-rates/) interbank, 12.9123 buy / 12.9251 sell; ER-API 13.00 | 14 (Africanvestor-implied) | **+8.4 %** | — |
| GNF | guinee | **9,787** | 2026-11-15 | ER-API (BCRG not checked) | 10,000 (unverified) | +2.2 % | not checked |
| KES | kenya | **143.86** | 2026-11-15 | ER-API (the CBK page served a stale 2012 table) | 143 (Numbeo-implied) | −0.6 % | — |
| LRD | liberia | **189.36** | 2026-11-15 | ER-API (CBL not checked) | none (prices in USD) | n/a | — |
| LYD | libye | **7.122** (mid) | 2026-11-15 | [Central Bank of Libya](https://cbl.gov.ly/en/), 7.1037 buy / 7.1393 sell; ER-API 7.119 | 7.15 | +0.4 % | no dated 2026 quote found (the Libya Observer table was last updated 2026-02-09, per the dossier) |
| MGA | madagascar | **≈5,010–5,028** | 2026-10-14 / 2026-11-15 | BFM reference 5,009.39 on 2026-10-14 per [Newsmada](https://newsmada.com/?p=199435) (search summary, page not opened; the BFM site failed its TLS check); ER-API 5,027.8 on 2026-11-15 | 4,500 (Expat.com-implied) | **−10.5 %** | — |
| MWK | malawi | **1,976.96** (mid of buy/sell) | 2026-11-13 | [Reserve Bank of Malawi](https://www.rbm.mw/), 1,957.59 buy / 1,996.33 sell; ER-API 1,931.4 | RBM 1,958–1,996 | 0 % | about **4,400 per USD** (EIU, quoted in Nico's June 2026 report, [The Nation, 2026-07-09](https://mwnation.com/unit-sees-renewed-imf-push-for-devaluation/)), about **4,860 per EUR**, roughly 2.5 × official |
| MAD | maroc | **10.954** | 2026-11-15 | ER-API (the Bank Al-Maghrib URL returned 404) | 10.8 (unsourced) | −1.4 % | — |
| MUR | maurice | **52.73** | 2026-11-15 | ER-API (the Bank of Mauritius site failed its TLS check) | 52.5 (Numbeo-implied) | −0.4 % | — |
| MRU | mauritanie | **44.92** | 2026-11-15 | ER-API (BCM not checked) | none | n/a | — |
| MZN | mozambique | **70.60** | 2026-11-15 | ER-API (the Banco de Moçambique URL returned 404). This matches the de facto peg of about 63.9 per USD × 1.105 | 76 (France Diplomatie "≈ 40 €" rounding) | **+7.6 %** | — |
| NGN | nigeria | **≈1,488** | 2026-11-10 | CBN/NFEM average 1,346.51 per USD ([TechEconomy, 2026-11-10](https://techeconomy.ng/naira-dollar-exchange-rate-november-10-2026)) × ECB EUR/USD. The CBN page table was empty. ER-API 1,472.2 | ~1,500 | +0.8 % | **1,410–1,430 per USD** (same source, 2026-11-10), about **1,560–1,580 per EUR**, 5–6 % above official |
| RWF | rwanda | **1,639.4** | 2026-11-15 | ER-API (the BNR page did not load) | 1,630 (Numbeo-implied) | −0.6 % | — |
| SCR | seychelles | **15.42** | 2026-11-15 | ER-API (the CBS page did not render its rates) | 16 (Expat.com-implied) | **+3.7 %** | — |
| SLE | sierra-leone | **25.46** | 2026-11-15 | ER-API (bsl.gov.sl did not resolve) | 25.33 | −0.5 % | — |
| SOS | somalie | **632.97** official / interbank (≈573 per USD) | 2026-11-15 | ER-API (CBS Somalia not checked) | none in EUR (USD used; the dossier cites ~26,000 SOS per USD, May 2025, as the street rate) | n/a | street rate **~26,000 per USD** in May 2025 (dossier [11]); "over 31,000" per USD per TRT Afrika (undated, search summary). The dollar is the working currency. The Somaliland shilling has no quote |
| SSP | soudan-du-sud | **≈6,358** official (≈5,760 per USD) | 2026-11-15 | ER-API (Bank of South Sudan not reachable in this run) | 2,290.94 per USD commercial, 2024-08-20 (≈2,532 per EUR) | **−60 %** (stale) | **~7,100 per USD** ("US$100 equaled about SSP 710,000", 2026-07-12, [Rio Times, 2026-09-07](https://www.riotimesonline.com/?p=713172)), about **7,850 per EUR**. The dossier's 4,850 dates from Aug 2024 |
| SDG | soudan | **≈4,140** official (≈3,743 per USD) | end of June 2026 | Central Bank of Sudan semi-annual review, as reported in search results (search summary, page not opened). **ER-API's 495 is stale: do not use it** | 375 per USD, Feb 2021 (≈414 per EUR) | **−90 %** (stale) | **6,350–6,400 per USD** on 2026-08-27 ([Rio Times, 2026-08-28](https://www.riotimesonline.com/sudan-pound-record-low-managed-float-2026/)), about **7,050 per EUR**. Later reports (search summary only): >7,300 on 2026-09-05 and >8,400 in mid-September. The dossier's 2,100 dates from July 2024 |
| TZS | tanzanie | **2,925.96** (mean) | 2026-11-15 | [Bank of Tanzania](https://www.bot.go.tz/ExchangeRate/excRates); ER-API 2,899.8 | 2,920 (Numbeo-implied) | −0.2 % | — |
| TND | tunisie | **3.3639** | 2026-11-12 | [Banque Centrale de Tunisie](https://www.bct.gov.tn/bct/siteprod/cours.jsp), interbank average; ER-API 3.336 | 3.32 (Numbeo-implied) | −1.3 % | — |
| UGX | ouganda | **4,422.3** | 2026-11-15 | ER-API (the Bank of Uganda page did not load) | 4,550 (Numbeo-implied) | **+2.9 %** | — |
| ZMW | zambie | **22.60** (≈20.4 per USD) | 2026-11-15 | ER-API (the BoZ page did not load). BoZ quoted K17.9 per USD in early June 2026 ([Open Zambia](https://www.openzambia.com/economics/2026/6/3/kwacha-strengthens-further-reaching-k179-to-the-dollar), search summary) | ~25 per USD, inferred from trade data (≈27.2 per EUR at the dossier's 0.92) | **+20 %** (not used for EUR figures) | — |
| ZWG (ZiG) | zimbabwe | **29.40** (≈26.6 per USD) | 2026-11-15 | ER-API. RBZ interbank mid 26.5673 per USD on 2026-08-14 ([Equity Axis](https://equityaxis.net/post/19406/2026/8/weekly-currency-update-zig-enters-september-stable-as-tight-money-fx-buffers-contain-pressure), search summary) | 25–27 per USD (≈27.6–29.8 per EUR) | −6 % to +1 % | **~32 per USD** through August 2026, a premium of 20–21 % (Equity Axis, Aug 2026, search summary), about **35.4 per EUR**. Rents are in USD anyway |

## How to use

**Use the official mid-market rate for every EUR conversion in research files**, and write its date
and source beside it. Take the central bank figure first. For USD and ZAR, use the ECB reference
rate. For XOF, XAF, CVE, KMF and STN, use the fixed peg. Fall back to a named aggregator only when
the central bank page cannot be read. Why:

- The official rate is what a French or EU card, a bank transfer and Wise actually pay. It is
  legal everywhere, and anyone can check it again later.
- Rates backed out of Numbeo, Expat.com or France Diplomatie roundings drift by 5–10 %. Most of the
  gaps above come from that drift.
- Never take the headline figure from a parallel market. In Eritrea it is illegal, in Algeria and
  Libya it is a cash trade outside the law, and the quotes move week to week.

Where a parallel market exists (DZD, NGN, ETB, BIF, MWK, SDG, SSP, ZWG, ERN, SOS), add **one
line** saying what the same local price costs at the parallel rate. For example, in Algeria a
Numbeo price converted at the official rate costs about 45 % fewer euros for someone who changes
cash at the Square. Write that line as context, not advice. For dollarised economies (rd-congo,
liberia, somalie, zimbabwe, soudan-du-sud), keep the source's USD figure and convert it at the
ECB EUR/USD rate (1.105 today, not 0.86 or 1.15). Refresh this table before any figure is
published; one month is the useful lifetime for MGA, NGN, ETB, SDG, SSP, MWK and ZMW.

**Dossiers off by more than 10 %:**

- **madagascar**: uses 4,500 MGA per EUR against about 5,010–5,030. Every EUR figure is about
  **11 % too high**. For example, the centre 1-bed at 1,700,000 MGA is about 339 €, not 378 €.
- **soudan**: quotes 375 SDG per USD (2021) as the official rate and 2,100 (July 2024) as the
  parallel rate. Today these are about 3,743 and 6,400 or more, so the official rate is out by
  about 90 %. The dossier rightly gives no EUR figures, but the currency line needs updating.
- **soudan-du-sud**: quotes 2,290.94 commercial and 4,850 parallel per USD (Aug 2024). Today these
  are about 5,760 and about 7,100. The commercial rate is out by about 60 %. The dossier's costs
  are in USD, so no EUR figure is affected.
- **zambie**: says the kwacha is "roughly 25 per USD". It is about 20.4 per USD (ER-API) and was
  17.9 in June 2026 (BoZ), so the dossier is about 20 % off. The EUR figures convert from USD at
  0.92, which is only 1.7 % off, so they stand.

**Between 5 and 10 % off (worth fixing at the next pass):**

- ghana: 14 GHS per EUR, EUR figures about 8 % too low. Its USD→EUR rate is also about 5 % low.
- mozambique: 76 MZN per EUR, EUR figures about 7 % too low.
- namibie and lesotho: 20 per EUR against 18.75, EUR figures about 6 % too low.
- rd-congo, somalie and zimbabwe: 1 USD ≈ 0.86 EUR against 0.905, EUR figures about 5 % too low.

**Watch:**

- algerie: no rate is wrong, but its Numbeo EUR figures follow the official rate while the
  parallel rate is 82 % higher.
- burundi: correctly keeps prices in FBu because of the twofold parallel gap.
