import { DEEP_QUESTIONS, PROFILE_QUESTIONS, QUICK_QUESTIONS } from "./deep-questions";
import { CHAPTER, visibleChoices, type Question } from "./questions";
import { bestMatches, resultLength, TOP_THREE, topCities, type Answers } from "./ranking";

const TOP = TOP_THREE;
/**
 * The quick quiz opens on the life project and on nothing else (operator, 2026-11-20): with no
 * answer every city ties, so one question has to start. From the second on the path belongs to
 * the answers, the languages and the family's origin included.
 */
const OPENING = ["project"];
/**
 * Two questions within this share of the best one are as good as each other: the quiz may ask
 * either, so that two readers do not meet the same order (operator, 2026-11-20, like a guessing
 * game one cannot anticipate).
 */
const AS_GOOD = 0.85;
/**
 * Asked just before the closing question, never earlier (operator, 2026-11-20): how far the
 * reader would go from their own. Until then the origin only leans on the list, so the map
 * keeps showing cities the reader did not expect; this answer then settles it under their eyes.
 */
const BEFORE_CLOSING = "reach";
/** Asked last, as « now, what will you not compromise on » (beta feedback, 2026-11-16). */
const CLOSING = "priorities";
const QUICK_BANK = QUICK_QUESTIONS;
/** Long enough to settle a list of ten, short enough to keep a reader on a phone. */
export const MAX_QUESTIONS = 25;

/** The open questions whose condition holds, in the bank's order. */
function openIn(bank: Question[], answers: Answers, asked: string[]): Question[] {
  return bank.filter((q) => !asked.includes(q.id) && (q.when?.(answers) ?? true));
}

/** A follow-up whose question has been answered goes first, so a theme is finished in one go. */
function followUp(open: Question[], asked: string[]): string | undefined {
  return open.find((q) => q.after && asked.includes(q.after))?.id;
}

/** The answers one could give, each as the answers it would make. */
function tries(question: Question, answers: Answers): Answers[] {
  return visibleChoices(question, answers)
    .filter((c) => c.value !== null)
    .map((c) => ({ ...answers, [question.id]: question.max ? [c.value] : c.value }) as Answers);
}

/**
 * The next question: the one whose answers would reshuffle the current top three the most
 * (architecture.md §4.4), so every tap visibly changes something. The life project always comes
 * first; a follow-up comes right after its question; ties keep the bank's order.
 */
function pickNext(bank: Question[], answers: Answers, asked: string[]): string | undefined {
  const open = openIn(bank, answers, asked);
  if (open.length === 0) return undefined;
  if (!asked.includes("project") && open.some((q) => q.id === "project")) return "project";
  const follow = followUp(open, asked);
  if (follow) return follow;
  // The questions that fit this reader's profile come before the general ones.
  const fitting = open.filter((q) => PROFILE_QUESTIONS.includes(q));
  return mostDecisive(fitting.length ? fitting : open, answers);
}

function mostDecisive(open: Question[], answers: Answers): string | undefined {
  let best: string | undefined;
  let bestSpread = -1;
  for (const question of open) {
    const seen = new Set<string>();
    for (const tried of tries(question, answers))
      for (const m of bestMatches(tried, TOP)) seen.add(m.city.name);
    if (seen.size > bestSpread) {
      best = question.id;
      bestSpread = seen.size;
    }
  }
  return best;
}

/** The next question of /approfondir. */
export function nextQuestion(answers: Answers, asked: string[]): string | undefined {
  return pickNext(DEEP_QUESTIONS, answers, asked);
}

/** The quick-quiz questions this reader may be asked: those whose condition holds. */
export function freeQuestions(answers: Answers): Question[] {
  return QUICK_BANK.filter((q) => q.when?.(answers) ?? true);
}

/**
 * On average over a question's answers, how many new cities would enter the list the result
 * shows (three, five or ten: resultLength), and how many the top three.
 */
function newcomers(question: Question, answers: Answers, shown: number) {
  const list = new Set(topCities(answers, shown));
  const top3 = new Set(topCities(answers, TOP));
  const outcomes = tries(question, answers).map((tried) => topCities(tried, shown));
  const average = (count: (top: string[]) => number) =>
    outcomes.reduce((sum, top) => sum + count(top), 0) / Math.max(1, outcomes.length);
  return {
    shown: average((top) => top.filter((name) => !list.has(name)).length),
    top3: average((top) => top.slice(0, TOP).filter((name) => !top3.has(name)).length),
  };
}

/**
 * Every open question that could still change the list shown, the most decisive first. The
 * page asks three times per tap (next question, gauge, « Voir mes villes »): the last result is
 * kept, as trying every answer of every open question takes a phone a few hundred milliseconds.
 */
let lastDecisive: { key: string; ranked: ReturnType<typeof rankDecisive> } | undefined;
function decisive(open: Question[], answers: Answers) {
  const key = JSON.stringify([answers, open.map((q) => q.id)]);
  if (lastDecisive?.key !== key) lastDecisive = { key, ranked: rankDecisive(open, answers) };
  return lastDecisive.ranked;
}
function rankDecisive(open: Question[], answers: Answers) {
  const shown = resultLength(answers);
  return open
    .filter((question) => question.id !== CLOSING && question.id !== BEFORE_CLOSING)
    .map((question, index) => ({ id: question.id, index, ...newcomers(question, answers, shown) }))
    .filter((scored) => scored.shown > 0)
    .sort((a, b) => b.top3 - a.top3 || b.shown - a.shown || a.index - b.index);
}

/**
 * Whether another question fits under MAX_QUESTIONS once the questions owed are counted: the
 * origin, the temperament chapter, how far the reader would go and the closing one.
 */
function hasRoom(open: Question[], asked: string[]): boolean {
  const reachOpen = open.some((q) => q.id === BEFORE_CLOSING);
  const owed =
    open.filter(alwaysAsked).length +
    open.filter((q) => q.id === BEFORE_CLOSING || q.id === CLOSING).length +
    (reachOpen ? AFTER_REACH : 0);
  return asked.length + owed < MAX_QUESTIONS;
}
/** The follow-ups of « Jusqu'où aimeriez-vous aller ? » (the faith, the Sahara): kept room for. */
const AFTER_REACH = QUICK_BANK.filter((q) => q.after === BEFORE_CLOSING).length;

/** Asked whatever the top three says: who the reader is, and how they live. */
const alwaysAsked = (question: Question) =>
  question.id === "origin" || question.group === CHAPTER.temperament;

/**
 * The next question of the quick quiz, like a guessing game (operator, 2026-11-17 and
 * 2026-11-20): the life project, then a follow-up right after its question, then, whatever its
 * theme and from the whole questionnaire bar the filters (2026-11-25), an open question whose
 * answers would bring on average the most new cities into the top three, then into the list the
 * result shows (three, five or ten). `choose` picks among the questions as good as the best one:
 * the first by default, at random on the page. A question none of whose answers could change
 * that list is not asked; once none is left, or MAX_QUESTIONS is near, the quiz ends on its
 * closing question.
 *
 * Two exceptions, always asked before the end: the family's origin, and the whole temperament
 * chapter. A reader who names the family's country and says it matters a lot has a top three
 * nothing can change, and the quiz ended without asking how they live; their answers still
 * order the cities below and fill the temperament profile.
 */
export function nextFreeQuestion(
  answers: Answers,
  asked: string[],
  choose: (asGood: string[]) => string = (asGood) => asGood[0],
): string | undefined {
  const open = openIn(QUICK_BANK, answers, asked);
  if (open.length === 0 || asked.includes(CLOSING)) return undefined;
  const opener = OPENING.find((id) => open.some((q) => q.id === id));
  if (opener) return opener;
  const room = hasRoom(open, asked);
  const closing = asked.includes(BEFORE_CLOSING);
  // The follow-ups of the distance question were kept room for and come first once it is asked;
  // any other follow-up needs room, and none comes after the distance question.
  const afterReach = closing ? open.find((q) => q.after === BEFORE_CLOSING)?.id : undefined;
  if (afterReach) return afterReach;
  const follow = followUp(open, asked);
  if (follow && room && !closing) return follow;
  // Once the reader has said how far they would go, the quiz closes: that answer is the last
  // word on the list, and a question reopened after it would read as doubting it.
  const ranked = closing || !room ? [] : decisive(open, answers);
  if (ranked.length) {
    const best = ranked[0];
    const asGood = ranked.filter(
      (scored) => scored.top3 >= best.top3 * AS_GOOD && scored.shown >= best.shown * AS_GOOD,
    );
    return choose(asGood.map((scored) => scored.id));
  }
  const owed = asked.includes(BEFORE_CLOSING)
    ? undefined
    : (open.find(alwaysAsked) ?? open.find((q) => q.id === BEFORE_CLOSING));
  return owed?.id ?? (open.some((q) => q.id === CLOSING) ? CLOSING : undefined);
}

/**
 * How near the quiz is to its answer, for the reader who is given no total (operator,
 * 2026-11-20): it counts the questions that could still change the top three, so the words
 * follow the search itself and not a number of screens.
 */
export type Closeness = "searching" | "closer" | "almost";
export function closenessOf(answers: Answers, asked: string[]): Closeness {
  const open = openIn(QUICK_BANK, answers, asked);
  const searching = hasRoom(open, asked) && !asked.includes(BEFORE_CLOSING);
  const left = searching ? decisive(open, answers).length : 0;
  return left >= 4 ? "searching" : left >= 2 ? "closer" : "almost";
}

/**
 * Whether the top three can no longer move: no open question could bring a new city into it,
 * and the temperament chapter is done. From then the quiz only orders the cities behind, so the
 * page offers « Voir mes villes maintenant » (operator, 2026-11-25), which stops the quiz where
 * the shorter one used to.
 */
export function topThreeSettled(answers: Answers, asked: string[]): boolean {
  if (asked.length === 0) return false;
  const open = openIn(QUICK_BANK, answers, asked);
  if (open.some(alwaysAsked)) return false;
  return !decisive(open, answers).some((scored) => scored.top3 > 0);
}
