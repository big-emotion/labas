import { DEEP_QUESTIONS, PROFILE_QUESTIONS } from "./deep-questions";
import { CHAPTER, QUESTIONS, visibleChoices, type Question } from "./questions";
import { bestMatches, TOP_THREE, topCities, type Answers } from "./ranking";

const TOP = TOP_THREE;
const FIVE = 5;
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
/** Asked last, as « now, what will you not compromise on » (beta feedback, 2026-11-16). */
const CLOSING = "priorities";

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
  return QUESTIONS.filter((q) => q.when?.(answers) ?? true);
}

/** On average over a question's answers, how many new cities each top would get. */
function newcomers(question: Question, answers: Answers) {
  const top3 = new Set(topCities(answers, TOP));
  const top5 = new Set(topCities(answers, FIVE));
  const outcomes = tries(question, answers).map((tried) => topCities(tried, FIVE));
  const average = (count: (top: string[]) => number) =>
    outcomes.reduce((sum, top) => sum + count(top), 0) / Math.max(1, outcomes.length);
  return {
    top3: average((top) => top.slice(0, TOP).filter((name) => !top3.has(name)).length),
    top5: average((top) => top.filter((name) => !top5.has(name)).length),
  };
}

/** Every open question that could still change the top three, the most decisive first. */
function decisive(open: Question[], answers: Answers) {
  return open
    .filter((question) => question.id !== CLOSING)
    .map((question, index) => ({ id: question.id, index, ...newcomers(question, answers) }))
    .filter((scored) => scored.top3 > 0)
    .sort((a, b) => b.top3 - a.top3 || b.top5 - a.top5 || a.index - b.index);
}

/** Asked whatever the top three says: who the reader is, and how they live. */
const alwaysAsked = (question: Question) =>
  question.id === "origin" || question.group === CHAPTER.temperament;

/**
 * The next question of the quick quiz, like a guessing game (operator, 2026-11-17 and
 * 2026-11-20): the life project, then a follow-up right after its question, then, whatever its
 * theme, an open question whose answers would bring on average the most new cities into the top
 * three the map names (the top five breaks ties). `choose` picks among the questions as good as
 * the best one: the first by default, at random on the page. A question none of whose answers
 * could change the top three is not asked; once none is left, the quiz ends on its closing
 * question, and the rest waits in « Aller plus loin ».
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
  const open = openIn(QUESTIONS, answers, asked);
  if (open.length === 0 || asked.includes(CLOSING)) return undefined;
  const opener = OPENING.find((id) => open.some((q) => q.id === id));
  if (opener) return opener;
  const follow = followUp(open, asked);
  if (follow) return follow;
  const ranked = decisive(open, answers);
  if (ranked.length) {
    const asGood = ranked.filter((scored) => scored.top3 >= ranked[0].top3 * AS_GOOD);
    return choose(asGood.map((scored) => scored.id));
  }
  const owed = open.find(alwaysAsked)?.id;
  return owed ?? (open.some((q) => q.id === CLOSING) ? CLOSING : undefined);
}

/**
 * How near the quiz is to its answer, for the reader who is given no total (operator,
 * 2026-11-20): it counts the questions that could still change the top three, so the words
 * follow the search itself and not a number of screens.
 */
export type Closeness = "searching" | "closer" | "almost";
export function closenessOf(answers: Answers, asked: string[]): Closeness {
  const left = decisive(openIn(QUESTIONS, answers, asked), answers).length;
  return left >= 4 ? "searching" : left >= 2 ? "closer" : "almost";
}
