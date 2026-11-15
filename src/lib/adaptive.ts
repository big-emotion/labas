import { DEEP_QUESTIONS } from "./deep-questions";
import { QUESTIONS, type Question } from "./questions";
import { bestMatches, type Answers } from "./ranking";

const TOP = 3;

/**
 * The next question: the one whose answers would reshuffle the current top three the most
 * (architecture.md §4.4), so every tap visibly changes something. The life project always comes
 * first; a question whose `when` does not hold is skipped; ties keep the bank's order.
 */
function pickNext(bank: Question[], answers: Answers, asked: string[]): string | undefined {
  const open = bank.filter((q) => !asked.includes(q.id) && (q.when?.(answers) ?? true));
  if (open.length === 0) return undefined;
  if (!asked.includes("project") && open.some((q) => q.id === "project")) return "project";

  let best: string | undefined;
  let bestSpread = -1;
  for (const question of open) {
    const seen = new Set<string>();
    for (const choice of question.choices) {
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

/** The free-quiz questions this reader will see, in order: those whose condition holds. */
export function freeQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => q.when?.(answers) ?? true);
}

/** The next question of the free quiz: the bank's next one not yet asked. */
export function nextFreeQuestion(answers: Answers, asked: string[]): string | undefined {
  return freeQuestions(answers).find((q) => !asked.includes(q.id))?.id;
}
