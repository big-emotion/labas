import ledger from "../data/city-testimonies.json";
import { CITIES, CRITERION_KEYS, type CriterionKey } from "./cities";

/**
 * What a first-hand account may bear on. A criterion is one of the sixteen scores; the three
 * next ones are the other places the site keeps city knowledge (`city-life.json`,
 * `city-lines.json`, `countries.json`); « uncovered » is something the site has no field for
 * yet, kept because enough of them point at a missing question.
 */
export const OTHER_SUBJECTS = ["profession", "neighbourhood", "paperwork", "uncovered"] as const;
export type Subject = CriterionKey | (typeof OTHER_SUBJECTS)[number];

/** Against the level the site showed on the day the account came in. */
export type Lean = "higher" | "lower" | "same";

export interface Claim {
  about: Subject;
  /** Required for a criterion, where it is what gets counted. */
  leans?: Lean;
  /** Required for « uncovered »: a short key shared by the accounts that tell the same thing. */
  topic?: string;
  /** A paraphrase in English, never the person's words: the repository is public. */
  says: string;
}

/** One person's account. A second piece from the same person adds claims here, not an entry. */
export interface Testimony {
  id: string;
  /** City slug, as in `/ville/<slug>`. */
  city: string;
  received: string;
  /** When the person was there, as precisely as they said it. */
  experienced: string | null;
  medium: "screenshot" | "text" | "photo" | "video" | "link";
  /** Where the piece circulated, without naming anyone. */
  context: string;
  /** Only when anyone can open it; then it may also be cited as a `Source` on the city. */
  url: string | null;
  /** What is known of the person's situation, in general words. */
  witness: string | null;
  claims: Claim[];
}

export const TESTIMONIES = ledger as Testimony[];

const isCriterion = (subject: Subject): subject is CriterionKey =>
  (CRITERION_KEYS as readonly string[]).includes(subject);

/**
 * The direction the accounts agree on, or null. One account already moves a score, by one
 * level (operator, 2026-11-26: readers' experience comes first); agreement is what lets it go
 * all the way to the level the rubric describes. Two people leaning the same way, nobody the
 * other way, and fewer people finding the score right, is the lowest bar worth calling that.
 */
export function agreedLean(
  testimonies: Testimony[],
  city: string,
  criterion: CriterionKey,
): "higher" | "lower" | null {
  const people: Record<Lean, number> = { higher: 0, lower: 0, same: 0 };
  for (const testimony of testimonies) {
    if (testimony.city !== city) continue;
    const leans = new Set(
      testimony.claims.filter((claim) => claim.about === criterion).map((claim) => claim.leans),
    );
    for (const lean of leans) if (lean) people[lean] += 1;
  }
  if (people.higher > 0 && people.lower > 0) return null;
  const lean = people.higher > 0 ? "higher" : "lower";
  return people[lean] >= 2 && people[lean] > people.same ? lean : null;
}

export interface Gap {
  topic: string;
  testimonies: number;
  cities: string[];
}

/** What people bring up that no score, fact or question covers, the most told first. */
export function gapsIn(testimonies: Testimony[]): Gap[] {
  const tellers = new Map<string, Testimony[]>();
  for (const testimony of testimonies) {
    const topics = new Set(
      testimony.claims.filter((claim) => claim.about === "uncovered").map((claim) => claim.topic),
    );
    for (const topic of topics) {
      if (topic) tellers.set(topic, [...(tellers.get(topic) ?? []), testimony]);
    }
  }
  return [...tellers]
    .map(([topic, told]) => ({
      topic,
      testimonies: told.length,
      cities: [...new Set(told.map((testimony) => testimony.city))].sort(),
    }))
    .sort((a, b) => b.testimonies - a.testimonies || a.topic.localeCompare(b.topic));
}

// A leading « + » or « 0 » keeps prices (« 1 500 000 FCFA ») from reading as phone numbers.
const NAMES_SOMEONE = /(^|\s)@\w{2,}|\S+@\S+\.\S+|(\+\d|\b0\d)(?:[ .-]?\d){8,}/;

/** Why the ledger may not be committed as it is; empty when it may. */
export function ledgerProblems(testimonies: Testimony[]): string[] {
  const problems: string[] = [];
  const slugs = new Set(CITIES.map((city) => city.slug));
  const subjects: readonly string[] = [...CRITERION_KEYS, ...OTHER_SUBJECTS];
  const seen = new Set<string>();

  for (const testimony of testimonies) {
    const problem = (what: string) => problems.push(`${testimony.id}: ${what}`);

    if (seen.has(testimony.id)) problem("id used twice");
    seen.add(testimony.id);
    if (!slugs.has(testimony.city)) problem(`unknown city « ${testimony.city} »`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(testimony.received)) {
      problem("received must be a YYYY-MM-DD date");
    }
    if (testimony.url !== null && !/^https?:\/\//.test(testimony.url)) {
      problem("url must be a public http(s) link or null");
    }

    for (const claim of testimony.claims) {
      if (!subjects.includes(claim.about)) problem(`unknown subject « ${claim.about} »`);
      else if (isCriterion(claim.about) && !claim.leans) {
        problem(`a claim about « ${claim.about} » must say how it leans`);
      } else if (claim.about === "uncovered" && !claim.topic) {
        problem("an uncovered claim must name its topic");
      }
    }

    const written = [testimony.context, testimony.witness, ...testimony.claims.map((c) => c.says)];
    if (written.some((text) => text && NAMES_SOMEONE.test(text))) {
      problem("names someone (handle, e-mail or phone number)");
    }
  }
  return problems;
}
