import { DEEP_QUESTIONS } from "./deep-questions";
import { bestMatches, type Answers } from "./ranking";

const TOP = 3;

/**
 * The next question to ask in /approfondir: the one whose answers would reshuffle the current
 * top three the most (architecture.md §4.4), so every tap visibly changes something. The life
 * project always comes first; ties keep the bank's order.
 */
export function nextQuestion(answers: Answers, asked: string[]): string | undefined {
  const open = DEEP_QUESTIONS.filter((q) => !asked.includes(q.id));
  if (open.length === 0) return undefined;
  if (!asked.includes("project")) return "project";

  let best: string | undefined;
  let bestSpread = -1;
  for (const question of open) {
    const seen = new Set<string>();
    for (const choice of question.choices) {
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
