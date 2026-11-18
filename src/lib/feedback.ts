/**
 * The feedback tab (components/Feedback.astro, operator 2026-11-18): a private word to the team,
 * unlike the public reviews of /avis. Shared by the form and the server so both agree on the limits.
 */
export const FEEDBACK_KINDS = ["site", "message"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];
export const MESSAGE_MAX = 2000;

export interface FeedbackBody {
  kind: string;
  text: string;
  page: string;
  email?: string;
  website?: string;
}

/**
 * Only what the form asks, plus the page it was written on: never an answer, a result or the
 * journey, whatever else the page holds.
 */
export function feedbackBody(form: FormData, page: string): FeedbackBody {
  const field = (name: string) => String(form.get(name) ?? "").trim();
  const body: FeedbackBody = { kind: field("kind"), text: field("text"), page };
  if (field("email")) body.email = field("email");
  if (field("website")) body.website = field("website");
  return body;
}
