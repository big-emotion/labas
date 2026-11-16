import { visibleChoices, type Question } from "./questions";
import type { Answers } from "./ranking";

/**
 * Shows only the choices that fit the answers so far and releases the ones that no longer do, so
 * the screen always matches what is counted (quiz paths, 2026-11-16): a question whose condition
 * fails loses its answer, a hidden choice is never left pressed.
 */
export function syncChoices(bank: Question[], answers: Answers, root: ParentNode): void {
  for (const fieldset of root.querySelectorAll<HTMLElement>(".question")) {
    const question = bank.find((q) => q.id === fieldset.dataset.question);
    if (!question) continue;
    const applies = question.when?.(answers) ?? true;
    const visible = new Set(visibleChoices(question, answers).map((c) => JSON.stringify(c.value)));
    for (const chip of fieldset.querySelectorAll<HTMLElement>(".chip")) {
      chip.hidden = !visible.has(chip.dataset.value as string);
      if (chip.hidden || !applies) chip.setAttribute("aria-pressed", "false");
    }
  }
}
