/**
 * After an answer, where the page goes (operator, 2026-11-26, mockup S1). Each question has its
 * own height, so the browser keeps a scroll position that leaves the map and the new question
 * off screen on the phone. The page comes back to the top of the quiz only when that top has
 * left the screen: a reader who can already see it is not moved.
 */
export function scrollBack(
  quizTop: number,
  reducedMotion: boolean,
): ScrollIntoViewOptions | undefined {
  if (quizTop >= 0) return undefined;
  return { behavior: reducedMotion ? "auto" : "smooth", block: "start" };
}
