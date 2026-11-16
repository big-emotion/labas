import { DEEP_QUESTIONS, PROFILE_QUESTIONS } from "./deep-questions";
import { QUESTIONS, visibleChoices, type Question } from "./questions";
import { bestMatches, topCities, type Answers } from "./ranking";

const TOP = 3;
const FIVE = 5;

/**
 * The next question: the one whose answers would reshuffle the current top three the most
 * (architecture.md §4.4), so every tap visibly changes something. The life project always comes
 * first; a question whose `when` does not hold is skipped; ties keep the bank's order.
 */
function pickNext(bank: Question[], answers: Answers, asked: string[]): string | undefined {
  const open = bank.filter((q) => !asked.includes(q.id) && (q.when?.(answers) ?? true));
  if (open.length === 0) return undefined;
  if (!asked.includes("project") && open.some((q) => q.id === "project")) return "project";
  // The questions that fit this reader's profile come before the general ones.
  const fitting = open.filter((q) => PROFILE_QUESTIONS.includes(q));
  return mostDecisive(fitting.length ? fitting : open, answers);
}

function mostDecisive(open: Question[], answers: Answers): string | undefined {
  let best: string | undefined;
  let bestSpread = -1;
  for (const question of open) {
    const seen = new Set<string>();
    for (const choice of visibleChoices(question, answers)) {
      if (choice.value === null) continue;
      const value = question.max ? [choice.value] : choice.value;
      const tried = { ...answers, [question.id]: value } as Answers;
      for (const m of bestMatches(tried, TOP)) seen.add(m.city.name);
    }
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

/** The quick-quiz questions this reader will see, in order: those whose condition holds. */
export function freeQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => q.when?.(answers) ?? true);
}

/**
 * The next question of the quick quiz. The project opens; then the chapters come in order and
 * never interleave (operator, 2026-11-16), and inside the current chapter the open
 * question whose answers would bring, on average, the most new cities into the top five comes
 * first, so every tap still moves the map. Ties keep the bank's order.
 */
export function nextFreeQuestion(answers: Answers, asked: string[]): string | undefined {
  // With no answer every city ties and any question looks decisive: open on the project.
  if (!asked.includes("project")) return "project";
  const remaining = freeQuestions(answers).filter((q) => !asked.includes(q.id));
  if (remaining.length === 0) return undefined;
  const chapter = Math.min(...remaining.map((q) => q.chapter ?? 5));
  const open = remaining.filter((q) => (q.chapter ?? 5) === chapter);
  const before = new Set(topCities(answers, FIVE));
  let best: string | undefined;
  let bestMoved = -1;
  for (const question of open) {
    const offered = visibleChoices(question, answers).filter((c) => c.value !== null);
    const moved =
      offered.reduce((sum, c) => {
        const tried = { ...answers, [question.id]: question.max ? [c.value] : c.value } as Answers;
        return sum + topCities(tried, FIVE).filter((name) => !before.has(name)).length;
      }, 0) / Math.max(1, offered.length);
    if (moved > bestMoved) [best, bestMoved] = [question.id, moved];
  }
  return best;
}
