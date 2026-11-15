import { DEEP_QUESTIONS } from "./deep-questions";
import { QUESTIONS, type Question } from "./questions";
import { bestMatches, type Answers } from "./ranking";

const TOP = 3;
/** The free quiz asks at least this many questions, and at most the second. */
export const MIN_ASKED = 8;
export const MAX_ASKED = 12;

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

/**
 * Questions the free quiz always asks first, in this order. They decide where a reader can feel
 * at home (language, family region, how much that matters, appetite for the unknown, faith) and
 * rarely reshuffle the top three on their own, so the adaptive rule alone would skip them.
 */
const CORE: { id: string; when?: (answers: Answers) => boolean }[] = [
  { id: "project" },
  { id: "languages" },
  { id: "origin" },
  {
    id: "countries",
    when: (answers) =>
      (Array.isArray(answers.origin) ? answers.origin : [answers.origin]).some(
        (o) => o && o !== "ameriques",
      ),
  },
  { id: "kin" },
  { id: "adventure", when: (answers) => answers.kin === "much" || answers.kin === "some" },
  { id: "faith", when: (answers) => answers.kin === "much" || answers.kin === "some" },
];

/** The next question of the free quiz, from the bank of 23. */
export function nextFreeQuestion(answers: Answers, asked: string[]): string | undefined {
  const core = CORE.find((q) => !asked.includes(q.id) && (q.when?.(answers) ?? true));
  if (core) return core.id;
  return pickNext(QUESTIONS, answers, asked);
}

/**
 * Whether the free quiz has enough to show a result: after 8 answers, once the top three has
 * stayed the same over the last three answers; at 12 answers in any case. `tops` holds the top
 * three after each answer, oldest first.
 */
export function isSettled(asked: number, tops: string[][]): boolean {
  if (asked >= MAX_ASKED) return true;
  if (asked < MIN_ASKED || tops.length < 3) return false;
  const [a, b, c] = tops.slice(-3).map((top) => top.join("|"));
  return a === b && b === c;
}

/** How full the « ton résultat se précise » gauge is, 0 to 1. */
export function gauge(asked: number, settled: boolean): number {
  if (settled) return 1;
  return Math.min(0.9, (asked / MIN_ASKED) * 0.9);
}
