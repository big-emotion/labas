import type { Answers } from "./ranking";

/**
 * Which typical week fits the reader: kept apart from routes.ts so the city page's script can
 * pick the week without loading every city's routes.
 */

/**
 * The way of working a typical week is written for. The quick quiz now asks for the profession
 * and today's life rather than « Et le travail ? », so the weeks keep their keys and the answer
 * is read from those.
 */
export function jobOf(answers: Answers): Answers["job"] {
  if (answers.job) return answers.job;
  if (answers.profession === "tech" || answers.currentCity === "nomad") return "remote";
  if (answers.profession === "trade" || answers.profession === "craft") return "entre";
  if (answers.project === "investir") return "entre";
  if (answers.profession && answers.profession !== "student" && answers.profession !== "retired")
    return "cadre";
  return undefined;
}

/**
 * The index of the week whose answers match the reader's the most; the first week when none
 * matches. A week that contradicts an answer the reader gave (« En couple » for someone « Avec
 * mes enfants ») loses half a point, so ties go to the week that fits without contradiction.
 */
export function bestWeekIndex(weeks: { for: Partial<Answers> }[], given: Answers): number {
  const answers: Answers = { ...given, job: jobOf(given) };
  let best = 0;
  let bestScore = 0;
  weeks.forEach((week, index) => {
    const keys = Object.entries(week.for) as [keyof Answers, unknown][];
    const matches = keys.filter(([key, value]) => answers[key] === value).length;
    const contradictions = keys.filter(
      ([key, value]) => answers[key] !== undefined && answers[key] !== value,
    ).length;
    const score = matches - 0.5 * contradictions;
    if (score > bestScore) [best, bestScore] = [index, score];
  });
  return best;
}
