# Level-1 city lines — ten test cities

> Status: draft for tone review, 2026-11-14. These are the two editorial lines each city needs
> for the quick quiz ([architecture §A.6](./architecture.md#a6-the-two-lines-each-city-needs-for-level-1)),
> written for ten test cities before the other 105. Nothing is wired into `src/` yet.

For each city:

- **On dit** (`reputation`): what the city is known for. Introduced by "on dit", "on connaît"
  or "elle a la réputation": a reputation, not a measurement. Never about safety, racism or
  LGBT rights.
- **Ce qui pourrait te surprendre** (`surprise`): the cliché it breaks, through a concrete
  place or event.
- **Pourquoi toi** — two sample lines showing how a quiz answer meets the city. They are
  generated from the criteria, not stored; they are here to judge the tone. Always a
  preference ("tu aimes", "tu veux"), never a trait.
- **À savoir** stays the city's current `watch` text, unchanged here.
- **Hors sphère**: whether the city falls outside the usual sphere of a French speaker living
  in France (§A.5), so it can carry the "Tu n'y aurais peut-être pas pensé" badge.

Every fact carries its source. Sources marked _dossier_ are in `research/countries/<pays>.md`
(the number is the dossier's own). Web checks were made on 2026-11-14.

---

## 1. Nairobi (Kenya) · hors sphère

- **On dit** : « On dit de Nairobi qu'on y sort parmi les plus volontiers d'Afrique de l'Est :
  à Westlands, bars, concerts et clubs s'enchaînent jusqu'au matin. »
- **Ce qui pourrait te surprendre** : « Des girafes et des lions vivent dans un parc national
  aux portes de la ville. Et à 1 800 m d'altitude, tu n'auras pas besoin de clim, mais d'un pull
  en juillet. »
- **Pourquoi toi** :
  - _Samedi soir : danser jusqu'au matin_ → « Tu aimes danser jusqu'au matin : Nairobi aussi.
    Le samedi, Westlands ne dort pas. »
  - _Travail : télétravail_ → « Tu télétravailles : la fibre se trouve autour de 30 € par mois,
    dans la capitale tech de l'Afrique de l'Est. »
- **Sources** : nightlife reputation — travel guides and Lonely Planet's East Africa list,
  [Lonely Planet](https://www.lonelyplanet.com/east-africa/nightlife),
  [Business Daily](https://www.businessdailyafrica.com/bd/lifestyle/food-drinks/nairobi-nightlife-satisfying-the-insatiable-partygoer--4360600)
  (accessed 2026-11-14; travel sources, low confidence); altitude 1,795 m and cool July
  evenings — _dossier kenya [9]_; national park — current `pitch`; fibre KES 4,500 (≈ €31) for
  60 Mbps — _dossier kenya [5], Numbeo 2026-11-06_.
- **Left out** : "les gens y sont très chill, très accueillants" — no source, and a statement
  about a whole population's character is the kind of generalisation §6 rules out. It can come
  back as a quoted resident's or returnee's testimony, with its source.

## 2. San-Pédro (Côte d'Ivoire) · dans la sphère, mais à découvrir

- **On dit** : « On connaît San-Pédro pour son port, le premier au monde pour l'export de
  cacao. On connaît beaucoup moins ses plages. »
- **Ce qui pourrait te surprendre** : « À une heure de route, les criques de Grand-Béréby :
  rochers, cocotiers, sable clair et presque personne. Pas besoin d'aller jusqu'à Zanzibar. »
- **Pourquoi toi** :
  - _Le week-end : à la plage_ → « Tu veux la mer le week-end : les plages de Monogaga et de
    Grand-Béréby sont à moins d'une heure. »
  - _Une ville qui prend son temps_ → « Tu préfères le calme : San-Pédro vit bien plus
    lentement qu'Abidjan. »
- **Sources** : world's leading cocoa export port, beaches nearby (Monogaga, Grand-Béréby),
  slower pace than Abidjan — _dossier cote-d-ivoire, San-Pédro section_; Grand-Béréby 52 km by
  road — [distancede.com](https://www.distancede.com/ci/distance-entre-grandbereby-et-sanpedro-cote-divoire/HistoiredeDistance/2623306.aspx);
  rocky hidden beach at Pointe Est — [onlybeaches.com](https://onlybeaches.com/api/v1/beaches/pointe-est-grand-bereby-beach-grand-bereby)
  (accessed 2026-11-14).
- **To confirm** : "eau turquoise et sable blanc" (operator's own knowledge). No source found
  that names the water colour; the line says "sable clair" until a dated source or a photo
  credit confirms it.

## 3. Kampala (Ouganda) · hors sphère

- **On dit** : « On dit de Kampala qu'elle aime faire la fête : à Kololo, les bars et les
  clubs restent pleins tard, et l'entrée coûte souvent moins de 3 €. »
- **Ce qui pourrait te surprendre** : « L'Ouganda a l'une des populations les plus jeunes du
  monde : la moitié des habitants a moins de 18 ans environ. Ça se voit dans la rue, dans la
  musique et dans les projets qui naissent partout. »
- **Pourquoi toi** :
  - _Une ville qui vibre jour et nuit_ → « Tu veux une ville qui vibre : Kampala, ses collines
    et ses motos-taxis ne s'arrêtent presque jamais. »
  - _Météo : doux_ → « Tu cherches la douceur : à 1 200 m, il fait 25 à 28 °C le jour et
    16 °C la nuit, toute l'année. »
- **Sources** : Kololo bars and clubs, entry about US$2.70 — _dossier ouganda [16], resident's
  blog updated Aug 2026_ (low confidence); median age about 18 (2025–26 estimates; UNFPA gives
  15.9 in an older estimate) — [GeoRank](https://georank.org/demographics/uganda/united-states),
  [UNFPA Uganda](https://uganda.unfpa.org/en/node/48273) (accessed 2026-11-14); altitude and
  temperatures — _dossier ouganda [13][9]_.

## 4. Swakopmund (Namibie) · hors sphère

- **On dit** : « On connaît Swakopmund comme une petite ville tranquille au bord de
  l'Atlantique : une promenade, des cafés, et le désert au bout de la rue. »
- **Ce qui pourrait te surprendre** : « Au sud, à Sandwich Harbour, des dunes d'environ 100 m
  plongent directement dans l'océan. On y va en 4x4 depuis Walvis Bay, à une demi-heure de
  route. »
- **Pourquoi toi** :
  - _Le week-end : savane ou désert_ → « Tu rêves de grands espaces : ici, le désert du Namib
    commence où la ville s'arrête. »
  - _Une ville qui prend son temps_ → « Tu préfères le calme : Swakopmund est une petite ville
    où l'on fait presque tout à pied. »
- **Sources** : seaside town, promenade, cafés, dunes, quiet, walkable — _dossier namibie,
  Swakopmund section [11]_ (vibe partly editorial); dunes up to 100 m plunging into the
  Atlantic at Sandwich Harbour, 4x4 tours from Walvis Bay —
  [Lonely Planet](https://www.lonelyplanet.com/pois/1346423),
  [Info-Namibia](https://www.info-namibia.com/activities-and-places-of-interest/walvis-bay/sandwich-harbour-tour)
  (accessed 2026-11-14).
- **Corrected** : "déserts de sable blanc" — the Namib's dunes are mostly orange to red; the
  white is the clay floor of pans such as Deadvlei, near Sossusvlei, far from Swakopmund.

## 5. Accra (Ghana) · hors sphère

- **On dit** : « On dit d'Accra qu'elle est une capitale du retour : chaque décembre, plus de
  125 000 visiteurs venus de l'étranger, beaucoup de la diaspora, s'y retrouvent pour les
  fêtes. »
- **Ce qui pourrait te surprendre** : « Chaque été depuis 2011, le festival Chale Wote
  transforme les rues de Jamestown, le vieux quartier, en galerie à ciel ouvert : peinture,
  danse, musique. »
- **Pourquoi toi** :
  - _Priorité : retrouver d'autres repats_ → « Tu veux retrouver d'autres repats : à Accra, la
    communauté du retour est l'une des plus visibles du continent. »
  - _Samedi soir : danser jusqu'au matin_ → « Tu aimes sortir : Osu et Labone vivent la nuit,
    et décembre y est une fête d'un mois. »
- **Sources** : 125,000+ international visitors in December 2024, many from the diaspora;
  nightlife in Osu, Labone, East Legon — _dossier ghana [38]_; returnee community visibility —
  _dossier ghana [12][39]_ (editorial judgement); Chale Wote since 2011, Jamestown, August —
  [Al Jazeera, 2015](https://www.aljazeera.com/gallery/2015/8/28/art-festival-electrifies-ghanas-streets),
  [Africa.com](https://africa.com/lifestyle/accras-chale-wote-festival-turns-streets-into-galleries)
  (accessed 2026-11-14).
- **Note** : Ghana's citizenship route for the historic diaspora (Beyond the Return) has been
  suspended since 2026-02-01 — _dossier ghana [30]_. It belongs in "à savoir" or level 2, not in
  this warm line.

## 6. Addis-Abeba (Éthiopie) · hors sphère

- **On dit** : « On connaît Addis-Abeba comme la capitale diplomatique de l'Afrique : l'Union
  africaine y a son siège. »
- **Ce qui pourrait te surprendre** : « À 2 355 m, c'est la plus haute capitale d'Afrique, et
  il y fait doux toute l'année. Le soir, l'éthio-jazz se joue en live, par exemple à l'African
  Jazz Village. »
- **Pourquoi toi** :
  - _Météo : doux_ → « Tu cherches la douceur : ni canicule ni clim, l'altitude s'en charge. »
  - _Travail : création, culture_ → « Tu vis pour la culture : Addis a sa propre musique,
    l'éthio-jazz, et des clubs où l'écouter. »
- **Sources** : 2,355 m, Africa's highest capital, seat of the African Union, mild climate —
  _dossier ethiopie [13]_; Ethio-jazz venues, African Jazz Village —
  [Music In Africa](https://musicinafrica.net/magazine/live-music-scene-ethiopia),
  [Monocle](https://monocle.com/culture/ethio-jazz-revival-addis-ababa/) (accessed
  2026-11-14).

## 7. Mindelo (Cap-Vert) · hors sphère

- **On dit** : « On dit de Mindelo qu'elle est la capitale culturelle du Cap-Vert : c'est la
  ville de Cesária Évora et du carnaval le plus célèbre du pays. »
- **Ce qui pourrait te surprendre** : « Il n'y pleut presque jamais : moins de 100 mm par an et
  près de 3 000 heures de soleil. En août, à la pleine lune, le festival de Baía das Gatas fait
  danser l'île depuis 1984. »
- **Pourquoi toi** :
  - _Météo : sec et ensoleillé_ → « Tu veux du soleil : Mindelo en a près de 3 000 heures par
    an, avec un vent qui rafraîchit. »
  - _Travail : création, culture_ → « Tu vis pour la culture : ici est née la morna de Cesária
    Évora, inscrite au patrimoine de l'UNESCO. »
- **Sources** : cultural capital, carnival, Cesária Évora, climate figures — _dossier cap-vert
  [S15]_; morna on the UNESCO list in 2019 — _dossier cap-vert [S17]_; Baía das Gatas since
  1984 — _dossier cap-vert [S18]_; trade winds — _dossier, editorial_.

## 8. Kigali (Rwanda) · à moitié dans la sphère

The French language is official in Rwanda but little used day to day (French literacy 8.2 %,
dossier rwanda [9]); for a French speaker it reads as a discovery.

- **On dit** : « On dit de Kigali qu'elle est l'une des villes les plus propres d'Afrique : les
  sacs plastiques y sont interdits depuis 2008. »
- **Ce qui pourrait te surprendre** : « Le dernier samedi du mois, la ville s'arrête le matin
  pour l'umuganda : une matinée de travaux collectifs où chacun participe. »
- **Pourquoi toi** :
  - _Météo : doux_ → « Tu cherches la douceur : entre 15 et 27 °C toute l'année, sur des
    collines vertes. »
  - _Une ville à taille humaine_ → « Tu aimes l'ordre et le calme : Kigali est une capitale
    tranquille, où les règles sont respectées. »
- **Sources** : plastic-bag ban since 2008, cleanliness reputation, umuganda on the last
  Saturday — [UNDP](https://www.undp.org/blog/umuganda-rwandas-audacity-hope-end-plastic-pollution),
  [ONE](https://www.one.org/stories/kigali-cleanest-city/) (accessed 2026-11-14) and _dossier
  rwanda [1][2], FCDO current 2026-11-14_; climate — _dossier rwanda [11]_.
- **Check** : the second "pourquoi" line comes close to a trait ("tu aimes l'ordre"). It is a
  stated taste, so it passes the rule, but it should only appear if the quiz actually asked
  about it; with today's ten questions, prefer the climate line.

## 9. Saint-Louis (Sénégal) · dans la sphère

- **On dit** : « On connaît Saint-Louis pour son île classée par l'UNESCO, ses maisons
  coloniales et son festival de jazz, qui revient chaque printemps depuis plus de trente ans. »
- **Ce qui pourrait te surprendre** : « À quelques minutes, la Langue de Barbarie, une bande de
  sable entre le fleuve et l'océan, et pas loin, le parc du Djoudj, un immense refuge
  d'oiseaux. »
- **Pourquoi toi** :
  - _Une ville qui prend son temps_ → « Tu préfères le calme : Saint-Louis vit à un rythme lent,
    loin de l'agitation de Dakar. »
  - _Priorité : la mémoire de la diaspora_ → « L'histoire compte pour toi : Saint-Louis fut la
    première capitale de l'Afrique-Occidentale française, et chaque rue le raconte. »
- **Sources** : UNESCO-listed island, colonial houses — _dossier senegal [20]_; jazz festival,
  33rd edition 2025 — _dossier senegal [46]_; Langue de Barbarie, Djoudj nearby, slow pace —
  _dossier senegal, Saint-Louis section (editorial)_.
- **To confirm** : "première capitale de l'AOF" (general knowledge: Saint-Louis was the AOF
  capital from 1895 to 1902) — needs a dated source before publication.

## 10. Tanger (Maroc) · dans la sphère

- **On dit** : « On dit de Tanger qu'elle regarde l'Europe : seuls 14 km de mer la séparent de
  l'Espagne. »
- **Ce qui pourrait te surprendre** : « L'Europe est à une heure de bateau : une dizaine de
  ferries par jour relient Tanger à Tarifa. Et ici, la Méditerranée rencontre l'Atlantique. »
- **Pourquoi toi** :
  - _Priorité : voyager facilement_ → « Tu veux pouvoir rentrer souvent : de Tanger, l'Espagne
    est à une heure de ferry. »
  - _Le week-end : à la plage_ → « Tu veux la mer : à Tanger, tu as le choix entre deux, la
    Méditerranée et l'Atlantique. »
- **Sources** : strait about 14 km at its narrowest, Mediterranean meets Atlantic, Tanger–
  Tarifa about 1 h, about 10 crossings a day —
  [DFDS](https://www.dfds.com/fr-ma/ferries-passagers/blog/combien-de-temps-faut-il-pour-traverser-le-detroit-de-gibraltar),
  [Ferryhopper](https://www.ferryhopper.com/fr/ferry-routes/direct/tanger-tarifa) (accessed
  2026-11-14; durations vary by operator, one site gives 2 h); beaches on both seas — _dossier
  maroc_.

---

## What this sample teaches

- **Seven of the ten are outside a Parisian French speaker's usual sphere.** San-Pédro,
  Saint-Louis and Tanger show that discovery also works inside it, through a surprise rather
  than a new country.
- **The warmest lines are concrete**: a place, a number, a date (Sandwich Harbour's dunes, 14 km
  to Spain, 3,000 hours of sun). Adjectives alone ("magnifique", "accueillante") say nothing a
  reader can check.
- **Population character is the trap.** "Les gens sont chill" or "accueillants" feels warm, but
  it generalises about millions of people. Use a sourced testimony, or describe a practice
  (umuganda, the December season) instead.
- **Reputation lines need sources too.** Nightlife reputations rest on travel guides; they are
  acceptable behind "on dit", and stay `editorial` in provenance.
- **Open points for the operator**: Grand-Béréby's water colour; the AOF capital line; whether
  the Kigali "ordre" line fits the tone.
