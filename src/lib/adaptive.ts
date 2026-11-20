import { DEEP_QUESTIONS, PROFILE_QUESTIONS } from "./deep-questions";
import { CHAPTER, QUESTIONS, visibleChoices, type Question } from "./questions";
import { bestMatches, TOP_THREE, topCities, type Answers } from "./ranking";

const TOP = TOP_THREE;
const FIVE = 5;
/**
 * The quick quiz's openers, always in this order (operator, 2026-11-17): the three answers that
 * weigh most, and the context the rest is read against (« aller vers l'inconnu » means something
 * only once the family's region is known).
 */
const OPENING = ["project", "languages", "origin"];
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

/**
 * The next question of the quick quiz, like a guessing game (operator, 2026-11-17): the three
 * openers, then a follow-up right after its question, then, whatever its theme, the open
 * question whose answers would bring on average the most new cities into the top three the map
 * names (the top five breaks ties). A question none of whose answers could change the top three
 * is not asked; once none is left, the quiz ends on its closing question, and the rest waits in
 * « Aller plus loin ». Ties keep the bank's order.
 *
 * The temperament chapter is the exception (operator, 2026-11-20): it is always asked in full.
 * A reader who names the family's country and says it matters a lot has a top three nothing
 * can change, and the quiz ended without asking how they live; their answers still order the
 * cities below and fill the temperament profile.
 */
export function nextFreeQuestion(answers: Answers, asked: string[]): string | undefined {
  const open = openIn(QUESTIONS, answers, asked);
  if (open.length === 0 || asked.includes(CLOSING)) return undefined;
  const opener = OPENING.find((id) => open.some((q) => q.id === id));
  if (opener) return opener;
  const follow = followUp(open, asked);
  if (follow) return follow;
  let best: string | undefined;
  let bestScore = { top3: 0, top5: -1 };
  for (const question of open) {
    if (question.id === CLOSING) continue;
    const score = newcomers(question, answers);
    if (score.top3 === 0) continue;
    if (
      score.top3 > bestScore.top3 ||
      (score.top3 === bestScore.top3 && score.top5 > bestScore.top5)
    )
      [best, bestScore] = [question.id, score];
  }
  best ??= open.find((q) => q.group === CHAPTER.temperament)?.id;
  return best ?? (open.some((q) => q.id === CLOSING) ? CLOSING : undefined);
}
