# Là-bas → Over There glossary

Fixed terms: once a French term has an English counterpart here, every page uses it, so a reader
who meets « Mon espace » in the header finds "My space" in the privacy page and in the e-mail.
Add a row whenever a translation makes a new term recur (a button label, a section name, a
recurring phrase). Change a row only on purpose, and then grep `src/` for the old English term
and change every use in the same commit.

## Brand and names

| French                             | English           | Note                                                           |
| ---------------------------------- | ----------------- | -------------------------------------------------------------- |
| Là-bas                             | Over There        | `BRAND` in `src/i18n/locale.ts`; never "Labas" in English      |
| labas.africa                       | overthere.africa  | once live (docs/deploy.md); until then `/en/` on labas.africa  |
| hello@big-emotion.com              | `CONTACT.en`      | hello@overthere.africa once the domain is live; never typed    |
| Big Emotion, BIG EMOTION           | unchanged         | the publisher                                                  |
| France Diplomatie                  | France Diplomatie | proper name, kept; gloss once as "the French foreign ministry" |
| FCDO                               | FCDO              | the UK Foreign, Commonwealth & Development Office              |
| CNIL                               | CNIL              | gloss once as "the French data protection authority"           |
| DeepL SE, Plausible, Natural Earth | unchanged         | proper names                                                   |
| Afrobaromètre                      | Afrobarometer     | the survey's own English name                                  |

## Places and money

- City and country names: `src/i18n/places.ts` (`cityName`, `countryName`, `zoneName`). Only the
  names that differ are listed there (Le Cap → Cape Town, Sénégal → Senegal); add one there, never
  inline in a page.
- Neighbourhoods, streets, markets and local words (quartier names, « maquis », « dibiterie »):
  keep them as the place says them; explain in a few words if needed.
- Currencies: keep the local currency and its symbol as the data gives them (FCFA, GHS, MAD,
  €). Never convert to pounds.
- Numbers and dates: British format through `INTL_LOCALE` (`en-GB`): 18 November 2026, 2.5,
  12%. In prose write "18 November 2026", not "November 18th".

## Interface

| French                        | English                       |
| ----------------------------- | ----------------------------- |
| Mon espace                    | My space                      |
| Aller plus loin               | Go deeper                     |
| Les avis                      | Reviews                       |
| Les villes                    | The cities                    |
| Notre méthode                 | Our method                    |
| Mentions légales              | Legal notice                  |
| Confidentialité               | Privacy                       |
| Refaire le quiz               | Take the quiz again           |
| Raccourcis                    | Shortcuts                     |
| Pages du site                 | Site pages                    |
| le quiz                       | the quiz                      |
| le questionnaire complet      | the full questionnaire        |
| un parcours                   | a journey                     |
| le résultat, vos résultats    | the result, your results      |
| une réaction (sur une ville)  | a reaction                    |
| un avis                       | a review                      |
| une réponse (à un avis)       | a reply                       |
| un cœur                       | a heart                       |
| les nouveautés                | news                          |
| un lien de connexion          | a sign-in link                |
| se connecter / Me déconnecter | sign in / Sign out            |
| Reprendre plus tard           | Continue later                |
| Recevoir par e-mail           | Get it by email               |
| Tout reprendre à zéro         | Start again                   |
| Partager                      | Share                         |
| Enregistrer l'image           | Save the picture              |
| Imprimer                      | Print                         |
| Supprimer                     | Delete                        |
| À savoir                      | Good to know                  |
| En tête pour l'instant        | Leading for now               |
| Utilisateur N                 | User N                        |
| e-mail                        | email                         |
| repats                        | returnees (from the diaspora) |

The labels from « Reprendre plus tard » down were set by the English privacy page
(2026-11-18), which quotes them; the button itself must carry the same words. If a component
already ships a different English label, align the two and fix this table.

## Scores and data honesty

| French                                                     | English                                                |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| Mesuré · Enquête · Sourcé · Estimation                     | Measured · Survey · Sourced · Estimate                 |
| une estimation éditoriale                                  | an editorial estimate                                  |
| inspirée du Big Five, ce n'est pas un test de personnalité | inspired by the Big Five; it is not a personality test |
| le tempérament, le profil de tempérament                   | the temperament, the temperament profile               |
| « vous aimez… », « vous préférez… »                        | "you like…", "you prefer…" (never "you are…")          |
| conseils aux voyageurs                                     | travel advice                                          |
| déconseillé                                                | advised against                                        |
| à l'échelle du pays                                        | at country level                                       |

## Address

- « vous » → "you". Never "thou"-style formality, never "dear user", never "we've got you".
- « nous » (the team) → "we".

## Recurring phrases fixed when the site went bilingual (2026-11-18)

| French                                              | English                                            | Note                                                            |
| --------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| Quelle ville d'Afrique vous ressemble ?             | Which African city is most like you?               | the slogan: home page, share cards, result page                 |
| En tête pour l'instant                              | Leading for now                                    | the live top three                                              |
| À savoir                                            | Good to know                                       |                                                                 |
| Y aller                                             | Getting there                                      |                                                                 |
| Réseau de repats                                    | Returnee network                                   |                                                                 |
| Marge de négociation                                | Room to haggle                                     |                                                                 |
| Votre avis (onglet)                                 | Your feedback                                      | the private feedback tab, not the public reviews                |
| Traduire / Voir l'original                          | Translate / Show original                          | under each review (DeepL)                                       |
| Pourquoi ces villes ?                               | Why these cities?                                  | the box that opens a result (`ResultWhy.astro`)                 |
| {Ville}, ça vous correspond ?                       | {City}: does it suit you?                          | the one-tap reaction; « Je laisse un avis » is "Leave a review" |
| J'aime / Ça me correspond / Ça ne me correspond pas | I like it / It suits me / It doesn't suit me       | the three one-tap answers (`lib/taps-dom.ts`)                   |
| un lien plus étroit avec vos origines               | a closer tie to your roots                         | closeness, never which region stepped back                      |
| Conquête, Lien, Fondation, Exploration, Refuge      | Drive, Connection, Foundation, Exploration, Refuge | temperament names (`TEMPERAMENTS[].en`)                         |
