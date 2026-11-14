/**
 * Proposed data model for Là-bas criteria — a design document, NOT wired into the app.
 *
 * Rationale lives in `docs/criteria/architecture.md`; this file only fixes the shapes so the
 * rationale can be checked against something concrete. Everything stays computable in the
 * browser from two static JSON files (cities, countries): no backend.
 *
 * Migration from today's `src/data/cities.json` is described at the bottom of this file.
 */

// ---------------------------------------------------------------------------
// Provenance — every scored or factual value carries where it came from.
// ---------------------------------------------------------------------------

/** ISO 8601 date, e.g. "2026-11-14". */
export type IsoDate = string;

export interface SourceRef {
  title: string;
  publisher: string;
  url: string;
  /** Date the source itself carries (publication or last update), when it has one. */
  published?: IsoDate;
  /** Date an editor last opened it. Required: an undated source cannot back a score. */
  accessed: IsoDate;
}

/**
 * How much a reader may trust a value. Shown on the city page, never hidden.
 * - `measured`: a published figure for this city or country (listing sample, Ookla median).
 * - `survey`: what residents say in a representative survey (Afrobarometer), usually for the
 *   region or country rather than the city — the page says "les habitants de … disent".
 * - `sourced`: an editor's 0–5 judgement applying the rubric to named, dated sources.
 * - `editorial`: an editor's judgement with no source specific to this place (typical for
 *   secondary cities). Always labelled "estimation" to the reader.
 */
export type Confidence = "measured" | "survey" | "sourced" | "editorial";

export interface Provenance {
  sources: SourceRef[];
  /** When the value was set or last re-checked. Values older than the criterion's
   * `reviewEveryMonths` are flagged stale on the page. */
  date: IsoDate;
  confidence: Confidence;
  /** Editor's handle (GitHub login). */
  editor: string;
}

// ---------------------------------------------------------------------------
// Criteria — the shared vocabulary of the quiz, the free text and the ranking.
// ---------------------------------------------------------------------------

/** 0–5 rubric level. 0 = absent / not applicable; 1, 3, 5 have written anchors. */
export type RubricLevel = 0 | 1 | 2 | 3 | 4 | 5;

/** Criteria scored per city on the 0–5 rubric. */
export type CityCriterionKey =
  | "cost" // Coût de la vie (asking prices)
  | "setupCost" // Coût pour s'installer
  | "negotiation" // Marge de négociation — a target, not "more is better"
  | "safety" // Sécurité au quotidien
  | "utilities" // Courant et eau
  | "internet" // Internet
  | "healthcare" // Soins
  | "schools" // Écoles
  | "jobs" // Emploi
  | "business" // Entreprendre et investir
  | "flights" // Avions vers l'Europe et la région
  | "culture" // Vie culturelle
  | "nightlife" // Sorties
  | "history" // Histoire et mémoire
  | "returnees" // Réseau de repats
  | "pace"; // Rythme de la ville — a target, not "more is better"

/** Criteria scored once per country (they are set by national law or institutions). */
export type CountryCriterionKey = "paperwork"; // Démarches

export type CriterionKey = CityCriterionKey | CountryCriterionKey;

export interface Criterion {
  key: CriterionKey;
  scope: "city" | "country";
  /** Plain French, as the reader sees it. */
  label: string;
  /** One sentence: what the score says. */
  means: string;
  /** One sentence: what a reader might wrongly read into it. */
  doesNotMean: string;
  /**
   * `higher-is-better`: the reader wants more of it (internet, safety).
   * `target`: the reader wants a match, not a maximum (pace: a calm person penalises 5).
   */
  direction: "higher-is-better" | "target";
  /** Written anchors so two editors land on the same level. Levels 2 and 4 sit between. */
  rubric: { 1: string; 3: string; 5: string };
  /** Sub-indicators an editor checks, in order of preference, each with its best source. */
  indicators: { name: string; preferredSource: string }[];
  /** Re-check cadence; past it, the value shows as "à revérifier". */
  reviewEveryMonths: number;
}

export interface CriterionScore {
  /** `null` = no reliable figure. Never replaced by a default: see `Match.coverage`. */
  level: RubricLevel | null;
  /** Optional raw figure behind the level, e.g. 420 (EUR, 1-bedroom rent). */
  figure?: { value: number; unit: string };
  /** One plain-French line justifying the level, shown in "pourquoi ce score". */
  justification: string;
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// Facts — categorical or legal, never turned into a 0–5 score.
// ---------------------------------------------------------------------------

export type Language = "fr" | "en" | "pt" | "ar" | "es" | "sw";

/** How far a newcomer gets with a language in this city. */
export interface LanguageUse {
  language: Language;
  use: "daily" | "work-and-admin" | "limited";
}

export type Climate = "hot-humid" | "hot-dry" | "mild" | "highland";
export type Setting = "ocean" | "lake-or-river" | "mountains" | "forest" | "savanna" | "desert";

/** Travel-advice colour for the city's area, as published (not interpreted). */
export type AdvisoryLevel = "green" | "yellow" | "orange" | "red";

export interface Advisory {
  /** France Diplomatie zone colour covering the city. */
  franceDiplomatie: AdvisoryLevel;
  /** UK FCDO: "advise against all travel" / "all but essential travel" / none. */
  fcdo: "all" | "all-but-essential" | "none";
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

export interface Country {
  /** ISO 3166-1 alpha-3. */
  code: string;
  name: string;
  scores: Partial<Record<CountryCriterionKey, CriterionScore>>;
  /** Visa-free stay for French passport holders, in days; 0 = visa needed. */
  visaFreeDaysFrenchPassport: number;
  /** Whether a resident card exists for nationals' foreign-born descendants, plain text. */
  diasporaResidenceRoute: { summary: string; provenance: Provenance };
  dualNationality: { allowed: "yes" | "no" | "restricted"; note: string; provenance: Provenance };
  /** ILGA World database reading. Described, never scored. */
  sameSexRelations: {
    status: "legal" | "criminalised" | "criminalised-not-enforced" | "unclear";
    note: string;
    provenance: Provenance;
  };
  /** Share of adults with a mobile-money account (Findex), 0–100, or null. */
  mobileMoneyShare: { value: number | null; provenance: Provenance };
  /** Described-only topics: shown as text, never ranked on. */
  described: {
    womenDaily?: string;
    /** How returnees are seen and named locally ("bengiste", "been-to", "repat"…). */
    returneePerception?: string;
    religion?: string;
  };
}

export interface City {
  slug: string;
  name: string;
  countryCode: string;
  zone: "ouest" | "centre" | "est" | "sud" | "nord";
  lat: number;
  lon: number;
  /** Agglomeration population and its source (Africapolis or UN WUP). */
  population: { value: number; year: number; provenance: Provenance };
  /** 3 very large, 2 human-sized, 1 small — derived from population, kept for the quiz. */
  size: 1 | 2 | 3;
  languages: LanguageUse[];
  climates: Climate[];
  /** Landscapes reachable within about an hour. Replaces beach/nature/wildSpaces scores. */
  settings: Setting[];
  scores: Partial<Record<CityCriterionKey, CriterionScore>>;
  advisory: Advisory;
  /**
   * Ranked but never proposed. Derived, not hand-set: true when the advisory is orange or
   * red (France) or "all"/"all-but-essential" (FCDO) for the city itself.
   */
  unsafe: boolean;
  tagline: string;
  pitch: string;
  /** The one drawback always shown ("À savoir avant de partir"). Sourced when it touches
   * safety, racism, LGBT rights or conflict. */
  watch: { text: string; provenance: Provenance };
  described: { food?: string; neighbourhoods?: string };
  /** Level 1: what the city is known for, introduced by "On dit de … que". A reputation, not
   * a measurement; never about safety, racism or LGBT rights. */
  reputation: string;
  /** Level 1: the cliché it breaks ("les criques de Grand-Bérébi, à une heure"). A concrete,
   * checkable place or event. */
  surprise: { text: string; provenance?: Provenance };
}

// ---------------------------------------------------------------------------
// The reader — what the quiz and the free text both fill in.
// ---------------------------------------------------------------------------

export type Project =
  | "settle" // M'installer pour de bon
  | "split" // Un pied ici, un pied là-bas
  | "trial" // Tester quelques mois
  | "invest" // Investir sans y vivre
  | "retire" // Prendre ma retraite
  | "study" // Étudier
  | "explore"; // D'abord des vacances

export type Work = "employee" | "founder" | "remote" | "creative" | "care-or-teaching" | "none";

export interface PersonProfile {
  /** Hard constraints: each one removes cities, and the page says how many and why. */
  constraints: {
    languages?: Language[];
    /** Monthly budget band on site, per household; turned into a ceiling on `cost`. */
    budget?: "tight" | "medium" | "comfortable";
    /** Needs a school following a given curriculum. */
    schoolCurriculum?: "french" | "english" | "any";
    /** Needs specialist care nearby (chronic condition, pregnancy, elderly parent). */
    specialistCare?: boolean;
    /** Reader asked to exclude countries criminalising same-sex relations. */
    excludeCriminalisingCountries?: boolean;
    /** Reader asked to stay where French passports need no visa for a first stay. */
    visaFreeOnly?: boolean;
  };
  project?: Project;
  work?: Work;
  household?: "single" | "couple" | "children" | "starting-family" | "with-parents";
  preferences: {
    size?: 1 | 2 | 3;
    settings?: Setting[];
    climates?: Climate[];
    /** Saturday night: 0 quiet at home, 0.5 dinner with friends, 1 out until morning. */
    outings?: 0 | 0.5 | 1;
  };
  roots: {
    /** ISO alpha-3 of the country of origin, if the reader gives one. */
    originCountry?: string;
    /** "Retrouver" boosts the origin country; "découvrir" is neutral; never a penalty. */
    intent?: "rediscover" | "discover" | "both";
    wantsReturneeNetwork?: boolean;
  };
  /**
   * Tolerances the reader states about themselves. They are not personality traits and are
   * never named as such (no "extraverti", no "névrosé"): the site only compares a stated
   * preference with a described city.
   */
  tolerances: {
    /** "Le bruit et la foule me donnent de l'énergie" … "me fatiguent". 0–1. */
    crowds?: number;
    /** "Les coupures et les démarches, je fais avec" … "me minent". 0–1. */
    friction?: number;
  };
  /** Top three non-negotiables, as criterion keys. */
  priorities: CityCriterionKey[];
}

/** One answer, whether tapped or extracted from free text — both feed the same profile. */
export interface Answer {
  questionId: string;
  value: string | number | string[];
  origin: "quiz" | "free-text";
  /** For free text: the reader's words the value was read from, shown back for correction. */
  evidence?: string;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface Explanation {
  criterion: CriterionKey | "language" | "climate" | "setting" | "size" | "roots";
  /** Plain French: "Internet fiable pour le télétravail (fibre courante)". */
  text: string;
  /** Carried through so an estimate is labelled as one next to the sentence. */
  confidence: Confidence;
}

export interface Match {
  city: City;
  /** 0–1: share of the best possible weighted score, over criteria that HAVE data. */
  score: number;
  /** 0–1: share of the reader's total weight backed by a non-null value. Below 0.7 the
   * card says "données incomplètes pour cette ville". */
  coverage: number;
  /** Set when a hard constraint or the advisory keeps the city out of the proposals. */
  excludedBecause?: "constraint" | "unsafe";
  /** Two or three "parce que…" lines, highest weight × level first. */
  reasons: Explanation[];
  /** Always exactly one: the most relevant drawback for this reader, else `city.watch`. */
  caveat: Explanation;
  /** Level 1 "Pourquoi toi et [ville]": two or three lines pairing a stated preference with
   * what the city is known for ("Tu aimes quand ça bouge : Nairobi aussi"). Never a trait. */
  portrait: string[];
  /** Level 1: true for the lead chosen outside the reader's usual sphere ("Tu n'y aurais
   * peut-être pas pensé"), ranked with the language weight removed. */
  discovery: boolean;
}

// ---------------------------------------------------------------------------
// Migration from today's src/data/cities.json (21 scores, no provenance)
// ---------------------------------------------------------------------------
//
// 1. Split the file: country facts move to `countries.json`, keyed by ISO alpha-3.
// 2. Copy scores that survive unchanged (cost, safety, internet, culture, nightlife,
//    flights) with `confidence: "editorial"`, `editor: "prototype"`, `date: "2026-11-14"`,
//    no sources. The page labels them "estimation" until an editor re-scores them with the
//    rubric — the 54 country dossiers already hold most of the sources.
// 3. Renames: career → jobs, diaspora → returnees, intensity → pace.
// 4. Merges: heritage + memory → history (max of the two, then re-check);
//    investment → business (re-score with the dossiers' `startup`).
// 5. Splits: healthAndSchools → healthcare + schools (both `level: null` until re-scored;
//    the dossiers' `healthcare` and `family` scores seed them); order → utilities (city) +
//    paperwork (country), both `null` until scored.
// 6. To facts: beach / nature / wildSpaces ≥ 3 → `settings` entries; languages gain a `use`.
// 7. Dropped: food (→ `described.food`), novelty, competition, social (their signal is
//    carried by pace and nightlife; see architecture.md §3.3).
// 8. New with no prototype value (`null`): setupCost, negotiation.
// 9. `unsafe` becomes derived from `advisory` instead of hand-set.
// The ranking keeps `rankCities` / `bestMatches` as its public interface, so the existing
// tests keep running while scores move over one criterion at a time.
