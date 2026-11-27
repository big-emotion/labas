import { coreOf, DEEP_QUESTIONS, PROFILE_QUESTIONS } from "./deep-questions";
import { CHAPTER, visibleChoices, type Question } from "./questions";
import { bestMatches, TOP_THREE, type Answers } from "./ranking";

const TOP = TOP_THREE;

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

/**
 * The questions the quick quiz asks this reader, in order: the core of their path
 * (`coreOf`), less those whose condition does not hold. The order never depends on what the
 * answers do to the list (operator, 2026-11-27): a theme is finished before the next one.
 */
export function freeQuestions(answers: Answers): Question[] {
  return coreOf(answers.project).filter((q) => q.when?.(answers) ?? true);
}

/** The next question of the quick quiz: the first of the reader's core not asked yet. */
export function nextFreeQuestion(answers: Answers, asked: string[]): string | undefined {
  return freeQuestions(answers).find((q) => !asked.includes(q.id))?.id;
}

/**
 * How near the quiz is to its end, in words beside « question 7 » (operator, 2026-11-20). One
 * word per theme, not a count of the questions left: the story's questions open only once the
 * origin is given, so a count called the quiz nearly over halfway through.
 */
export type Closeness = "searching" | "closer" | "almost";
export function closenessOf(answers: Answers, asked: string[]): Closeness {
  const theme = freeQuestions(answers).find((q) => !asked.includes(q.id))?.group;
  return theme === CHAPTER.project
    ? "searching"
    : theme === CHAPTER.temperament
      ? "closer"
      : "almost";
}
